import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(__dirname, '..');
const MAIN = join(ROOT, 'src', 'cli', 'main.ts');
const TSX = pathToFileURL(join(ROOT, 'node_modules', 'tsx', 'dist', 'loader.mjs')).href;
const TRANSCRIPTS = join(ROOT, 'doc', 'transcript');

interface RunOptions {
  readonly cwd: string;
  readonly args?: readonly string[];
  readonly input: string;
}

function runCli(options: RunOptions): string {
  return execFileSync(
    process.execPath,
    ['--import', TSX, MAIN, ...(options.args ?? [])],
    { cwd: options.cwd, input: options.input, encoding: 'utf8' },
  );
}

function transcript(name: string): string {
  return readFileSync(join(TRANSCRIPTS, name), 'utf8');
}

/** Working directory with fixed content, so `dir` is comparable. */
function fixedWorkspace(): string {
  const directory = mkdtempSync(join(tmpdir(), 'svgframe-workspace-'));
  mkdirSync(join(directory, 'build'));
  mkdirSync(join(directory, 'keep'));
  writeFileSync(join(directory, 'notes.txt'), 'fixed\n', 'utf8');
  return directory;
}

test('both assembly modes print the same bytes for the same sessions', () => {
  const workspace = fixedWorkspace();
  try {
    const configPath = join(ROOT, 'plugins.config.json');
    for (const name of ['cli-1-base.txt', 'cli-2-box.txt', 'cli-3-plugins.txt']) {
      const input = transcript(name);
      const byCode = runCli({ cwd: workspace, input });
      const byConfig = runCli({
        cwd: workspace,
        args: ['--config', configPath],
        input,
      });
      assert.equal(byConfig, byCode, `${name} differs between assembly modes`);
    }
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('the plugin-free assembly still reproduces the Phase 1 session byte for byte', () => {
  const expected = readFileSync(
    join(TRANSCRIPTS, 'expected', 'cli-1-base.final.txt'),
    'utf8',
  );
  const actual = runCli({
    cwd: ROOT,
    args: ['--config', join(ROOT, 'plugins.base.json')],
    input: transcript('cli-1-base.txt'),
  });
  assert.equal(actual, expected);
});

test('the plugin session shows stats, dir, box attributes and the two labels', () => {
  const workspace = fixedWorkspace();
  try {
    const output = runCli({
      cwd: workspace,
      args: ['--config', join(ROOT, 'plugins.config.json')],
      input: transcript('cli-3-plugins.txt'),
    });
    const lines = output.split(/\r?\n/);
    assert.ok(lines.includes('rect: 1  (total 1, containers 0)'));
    assert.deepEqual(
      lines.filter((line) => line.startsWith('[DIR]') || line.startsWith('[FILE]')),
      ['[DIR]  build', '[DIR]  keep', '[FILE]  notes.txt'],
    );
    assert.ok(lines.some((line) => line.includes('(box)')));
    assert.ok(lines.some((line) => line.includes('g#n1 updated: label="新标签"')));
    assert.ok(
      lines.some((line) => line.includes('error: cannot remove a part of g#n1: n1-rect')),
    );
    assert.ok(lines.some((line) => line.includes('error: cannot ungroup a composite shape: n1')));
    assert.ok(lines.some((line) => line.includes('error: unknown attribute: opacity')));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
