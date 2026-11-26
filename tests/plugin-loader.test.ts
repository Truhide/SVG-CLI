import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { HostContext } from '../src/host/PluginContextFactory';
import { PluginLoader } from '../src/host/PluginLoader';
import { FakeDirectoryLister } from './support/TestEditor';

const FIXTURES = join(__dirname, 'fixtures', 'plugins');

function fixture(name: string): string {
  return join(FIXTURES, name);
}

interface Entry {
  readonly module: string;
  readonly options?: unknown;
  readonly enabled?: boolean;
}

interface Harness {
  readonly context: HostContext;
  readonly lines: string[];
  readonly loader: PluginLoader;
}

function harness(): Harness {
  const context = new HostContext({
    directories: new FakeDirectoryLister(),
    cwd: () => '/work',
  });
  const lines: string[] = [];
  return { context, lines, loader: new PluginLoader(context, (line) => lines.push(line)) };
}

/**
 * Writes a config file into its own temporary directory and loads it.
 *
 * `build` receives that directory, so relative module paths are expressed
 * relative to the config file - exactly the rule the loader implements.
 */
async function withConfig(
  build: (configDirectory: string) => readonly Entry[],
  body: (configPath: string, configDirectory: string) => Promise<void>,
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'svgframe-config-'));
  const configPath = join(directory, 'plugins.config.json');
  writeFileSync(configPath, JSON.stringify({ plugins: build(directory) }), 'utf8');
  try {
    await body(configPath, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('a valid plugin is loaded through the same registries as the host', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [
      { module: relative(directory, fixture('good')) },
      { module: relative(directory, fixture('class-plugin')) },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, []);
  assert.ok(context.commands.names().includes('hello'));
  assert.ok(context.commands.names().includes('klass'));
});

test('a module that cannot be resolved is reported and skipped', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    () => [{ module: './does-not-exist' }],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, ['error: plugin not found: ./does-not-exist']);
  assert.deepEqual(context.commands.names(), []);
});

test('a module without a default export is reported', async () => {
  const { lines, loader } = harness();
  let specifier = '';
  await withConfig(
    (directory) => {
      specifier = relative(directory, fixture('no-default'));
      return [{ module: specifier }];
    },
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, [`error: plugin has no default export: ${specifier}`]);
});

test('a manifest that lies about its contributions is rejected', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [{ module: relative(directory, fixture('mismatch')) }],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.equal(lines.length, 1);
  assert.match(
    lines[0],
    /^error: plugin manifest mismatch: @fixture\/plugin-mismatch \(commands: declared=\[foo\] registered=\[bar\]\)$/,
  );
  assert.ok(!context.commands.names().includes('bar'));
});

test('an activate that throws reports the plugin name and the reason', async () => {
  const { lines, loader } = harness();
  await withConfig(
    (directory) => [{ module: relative(directory, fixture('throws')) }],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, [
    'error: plugin failed to activate: @fixture/plugin-throws (boom)',
  ]);
});

test('a broken dependency is a load failure, not "not found"', async () => {
  const { lines, loader } = harness();
  await withConfig(
    (directory) => [{ module: relative(directory, fixture('broken-dependency')) }],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.equal(lines.length, 1);
  assert.match(
    lines[0],
    /^error: plugin failed to activate: @fixture\/plugin-broken-dependency \(/,
  );
  assert.ok(!lines[0].includes('plugin not found'));
});

test('a duplicate registration is refused and nothing of that plugin stays', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [
      { module: relative(directory, fixture('good')) },
      { module: relative(directory, fixture('duplicate')) },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, ['error: duplicate registration: commands/hello']);
  assert.deepEqual(context.commands.names(), ['hello']);
});

test('a failed plugin is rolled back to its own registrations only', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [
      { module: relative(directory, fixture('good')) },
      { module: relative(directory, fixture('partial')) },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, ['error: duplicate registration: commands/hello']);
  assert.deepEqual(context.commands.names(), ['hello']);
});

test('an invalid config falls back to the built-in capabilities', async () => {
  const { lines, loader } = harness();
  const directory = mkdtempSync(join(tmpdir(), 'svgframe-config-bad-'));
  try {
    const configPath = join(directory, 'plugins.config.json');
    writeFileSync(configPath, '{ this is not json', 'utf8');
    await loader.loadFromFile(configPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.deepEqual(lines, ['error: invalid plugin config']);
});

test('a disabled entry is skipped entirely', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [{ module: relative(directory, fixture('throws')), enabled: false }],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, []);
  assert.deepEqual(context.commands.names(), []);
});

test('options reach the plugin that declared them', async () => {
  const { context, loader } = harness();
  await withConfig(
    (directory) => [
      {
        module: relative(directory, fixture('options')),
        options: { tag: 'tagA' },
      },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  const spec = context.commands.entries().find((entry) => entry.name === 'opts');
  assert.deepEqual(spec?.help.lines({ shapes: context.shapes }), [
    '  opts                             tag=tagA',
  ]);
});

test('loading continues after a failing entry', async () => {
  const { context, lines, loader } = harness();
  await withConfig(
    (directory) => [
      { module: './nothing-here' },
      { module: relative(directory, fixture('good')) },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.deepEqual(lines, ['error: plugin not found: ./nothing-here']);
  assert.ok(context.commands.names().includes('hello'));
});

test('the config directory is the base of a relative module path', async () => {
  const { context, loader } = harness();
  await withConfig(
    (directory) => [
      {
        module: relative(directory, fixture('good')).replace(/\\/g, '/'),
      },
    ],
    (configPath) => loader.loadFromFile(configPath),
  );
  assert.ok(context.commands.names().includes('hello'));
  assert.equal(dirname(fixture('good')).endsWith('plugins'), true);
});
