import assert from 'node:assert/strict';
import test from 'node:test';
import { TestEditor } from './support/TestEditor';

test('commands need a document first', () => {
  const editor = new TestEditor();
  assert.deepEqual(editor.run('move r1 1 1'), [
    "error: no document. use 'init' or 'read' first",
  ]);
  assert.deepEqual(editor.run('tree'), ["error: no document. use 'init' or 'read' first"]);
  assert.deepEqual(editor.run('help').length > 0, true);
});

test('id and lookup errors', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('create circle r1 0 0 5'), ['error: id already exists: r1']);
  assert.deepEqual(editor.run('delete r9'), ['error: no such shape: r9']);
  assert.deepEqual(editor.run('tree r9'), ['error: no such shape: r9']);
  assert.deepEqual(editor.run('create rect r2 0 0 10 10 in node9'), [
    'error: no such container: node9',
  ]);
  assert.deepEqual(editor.run('create rect r2 0 0 10 10 in r1'), ['error: not a container: r1']);
  assert.deepEqual(editor.run('create hexagon h1 0 0'), [
    'error: unknown shape type: hexagon (is the plugin loaded?)',
  ]);
  assert.deepEqual(editor.run('create box b1 0 0 10 10 "title"'), [
    'error: unknown shape type: box (is the plugin loaded?)',
  ]);
});

test('group and ungroup errors', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g a', 'create rect leaf 0 0 1 1 in a', 'create g b in a');
  assert.deepEqual(editor.run('group x a leaf'), [
    'error: cannot group a container into its own descendant: a',
  ]);
  assert.deepEqual(editor.run('ungroup a'), ['error: cannot ungroup top-level container: a']);
  assert.deepEqual(editor.run('ungroup leaf'), ['error: not a container: leaf']);
  assert.deepEqual(editor.run('group a2 leaf leaf'), ['error: duplicate shape in group: leaf']);
  assert.deepEqual(editor.run('addto b a'), [
    'error: cannot move a container into its own descendant: a',
  ]);
});

test('numeric validation', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('scale r1 0'), ['error: scale factor must be positive']);
  assert.deepEqual(editor.run('scale r1 -2'), ['error: scale factor must be positive']);
  assert.deepEqual(editor.run('move r1 ten 0'), ['error: invalid number: ten']);
  assert.deepEqual(editor.run('set r1 width abc'), ['error: invalid number: abc']);
  assert.deepEqual(editor.run('set r1 stroke-width -1'), [
    'error: stroke-width must not be negative',
  ]);
  assert.deepEqual(editor.run('init -1'), ['error: canvas size must be positive']);
});

test('attribute whitelist', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('set r1 opacity 0.5'), ['error: unknown attribute: opacity']);
  assert.deepEqual(editor.run('set r1 text hello'), ['error: unknown attribute: text']);
  assert.deepEqual(editor.run('set r1 fill red'), ['rect#r1 updated: fill=red']);
  assert.deepEqual(editor.run('set r1 stroke-width 2'), ['rect#r1 updated: stroke-width=2']);
});

test('usage errors', () => {
  const editor = new TestEditor();
  editor.run('init');
  assert.deepEqual(editor.run('create rect'), ['error: usage: create <type> <id> [params…] [in <containerId>]']);
  assert.deepEqual(editor.run('create rect r1 0 0 10'), [
    'error: usage: create rect <id> <x> <y> <w> <h> [fill]',
  ]);
  assert.deepEqual(editor.run('move r1 1'), ['error: usage: move <id> <dx> <dy>']);
  assert.deepEqual(editor.run('save'), ["error: no file path: use 'save <file.svg>'"]);
  assert.deepEqual(editor.run('nope'), ['error: unknown command: nope']);
  assert.deepEqual(editor.run('set r1 fill "oops'), ['error: unterminated quoted string']);
});

test('read errors use the documented wording', () => {
  const editor = new TestEditor();
  assert.deepEqual(editor.run('read missing.svg'), ['error: cannot read file: missing.svg']);
  editor.files.seed('broken.svg', '<svg><rect></svg>');
  assert.deepEqual(editor.run('read broken.svg'), [
    'error: malformed XML: expected </rect> but found </svg>',
  ]);
  editor.files.seed('not-svg.svg', '<html/>');
  assert.deepEqual(editor.run('read not-svg.svg'), ['error: not an svg document: <html>']);
});
