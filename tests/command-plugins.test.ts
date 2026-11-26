import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import boxPlugin from '../plugins/plugin-shape-box';
import dirPlugin from '../plugins/plugin-command-dir';
import statsPlugin from '../plugins/plugin-command-stats';
import { NodeDirectoryLister } from '../src/infrastructure/fs/NodeDirectoryLister';
import { TestEditor } from './support/TestEditor';

function statsEditor(): TestEditor {
  return new TestEditor({ configure: (context) => statsPlugin.activate(context) });
}

test('stats is an unknown command until its plugin is loaded', () => {
  const plain = new TestEditor();
  assert.deepEqual(plain.run('init'), ['canvas 800x600 created']);
  assert.deepEqual(plain.run('stats'), ['error: unknown command: stats']);
});

test('stats counts leaves per type in first-appearance order', () => {
  const editor = new TestEditor({
    configure: (context) => {
      boxPlugin.activate(context);
      statsPlugin.activate(context);
    },
  });
  editor.runAll(
    'init 800 600',
    'create rect a 0 0 10 10',
    'create g grp',
    'create circle c 1 1 2 in grp',
    'create box b 0 0 10 10 "x" in grp',
  );
  assert.deepEqual(editor.run('stats'), [
    'rect: 2  circle: 1  text: 1  (total 4, containers 2)',
  ]);
  assert.deepEqual(editor.run('stats'), [
    'rect: 2  circle: 1  text: 1  (total 4, containers 2)',
  ]);
});

test('stats on an empty document and after a change', () => {
  const editor = statsEditor();
  editor.run('init');
  assert.deepEqual(editor.run('stats'), ['(total 0, containers 0)']);
  editor.run('create rect r1 0 0 1 1');
  assert.deepEqual(editor.run('stats'), ['rect: 1  (total 1, containers 0)']);
  // stats is not an edit: undo still undoes the create.
  assert.deepEqual(editor.run('undo'), ['rect#r1 removed']);
});

test('dir lists the working directory through the port, dirs first', () => {
  const editor = new TestEditor({
    configure: (context) => dirPlugin.activate(context),
  });
  editor.directories.entries = [
    { name: 'z.txt', kind: 'file' },
    { name: 'plugins', kind: 'dir' },
    { name: '.env', kind: 'file' },
    { name: 'docs', kind: 'dir' },
    { name: 'a.svg', kind: 'file' },
  ];
  assert.deepEqual(editor.run('dir'), [
    '[DIR]  docs',
    '[DIR]  plugins',
    '[FILE]  .env',
    '[FILE]  a.svg',
    '[FILE]  z.txt',
  ]);
  assert.deepEqual(editor.directories.asked, ['/work']);
});

test('dir handles an empty directory and a read failure', () => {
  const editor = new TestEditor({
    configure: (context) => dirPlugin.activate(context),
  });
  assert.deepEqual(editor.run('dir'), ['(empty directory)']);
  editor.directories.failure = '/work';
  assert.deepEqual(editor.run('dir'), ['error: cannot read directory: /work']);
  editor.directories.failure = null;
  assert.deepEqual(editor.run('dir'), ['(empty directory)']);
});

test('dir needs no document and never touches document or history', () => {
  const editor = new TestEditor({
    configure: (context) => dirPlugin.activate(context),
  });
  assert.deepEqual(editor.run('dir'), ['(empty directory)']);
  editor.runAll('init 100 100', 'create rect r1 0 0 5 5');
  assert.equal(editor.run('dir').length, 1);
  assert.deepEqual(editor.run('undo'), ['rect#r1 removed']);
  assert.deepEqual(editor.run('canvas'), ['canvas 100x100']);
});

test('dir sorts stably and does not mutate the listing it received', () => {
  const editor = new TestEditor({
    configure: (context) => dirPlugin.activate(context),
  });
  const entries = [
    { name: 'b', kind: 'file' as const },
    { name: 'a', kind: 'file' as const },
  ];
  editor.directories.entries = entries;
  assert.deepEqual(editor.run('dir'), ['[FILE]  a', '[FILE]  b']);
  assert.deepEqual(entries.map((entry) => entry.name), ['b', 'a']);
});

test('the real filesystem adapter lists a fixed directory', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svgframe-dir-'));
  try {
    mkdirSync(join(directory, 'docs'));
    writeFileSync(join(directory, 'demo.svg'), '<svg/>', 'utf8');
    writeFileSync(join(directory, '.hidden'), '', 'utf8');
    const editor = new TestEditor({
      configure: (context) => dirPlugin.activate(context),
      services: {
        directories: new NodeDirectoryLister(),
        cwd: () => directory,
      },
    });
    assert.deepEqual(editor.run('dir'), [
      '[DIR]  docs',
      '[FILE]  .hidden',
      '[FILE]  demo.svg',
    ]);
    assert.deepEqual(editor.run('dir'), [
      '[DIR]  docs',
      '[FILE]  .hidden',
      '[FILE]  demo.svg',
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('the real adapter reports a missing directory in the command wording', () => {
  const missing = join(tmpdir(), `svgframe-missing-${process.pid}-${Date.now()}`);
  const editor = new TestEditor({
    configure: (context) => dirPlugin.activate(context),
    services: { directories: new NodeDirectoryLister(), cwd: () => missing },
  });
  assert.deepEqual(editor.run('dir'), [`error: cannot read directory: ${missing}`]);
});
