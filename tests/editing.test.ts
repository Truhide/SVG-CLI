import assert from 'node:assert/strict';
import test from 'node:test';
import { TestEditor } from './support/TestEditor';

test('scale multiplies every geometry attribute of a leaf', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect r 10 20 30 40');
  assert.deepEqual(editor.run('scale r 2'), ['rect#r scaled by 2']);
  assert.deepEqual(editor.run('show r'), [
    'rect#r  parent=svg',
    '  x=20 y=40 width=60 height=80',
  ]);
  assert.deepEqual(editor.run('undo'), ['rect#r scaled back by 0.5']);
  assert.deepEqual(editor.run('show r'), [
    'rect#r  parent=svg',
    '  x=10 y=20 width=30 height=40',
  ]);
});

test('scale on a container recurses into every child', () => {
  const editor = new TestEditor();
  editor.runAll(
    'init',
    'create g g1',
    'create circle c 10 10 5 in g1',
    'create text t 4 6 "x" in g1',
  );
  assert.deepEqual(editor.run('scale g1 2'), ['g#g1 scaled by 2']);
  assert.deepEqual(editor.run('show c'), [
    'circle#c  parent=g#g1',
    '  cx=20 cy=20 r=10',
  ]);
  assert.deepEqual(editor.run('show t'), ['text#t  parent=g#g1', '  x=8 y=12', '  text="x"']);
});

test('move on a container moves every descendant', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g g1', 'create g g2 in g1', 'create rect r 0 0 5 5 in g2');
  assert.deepEqual(editor.run('move g1 10 20'), ['g#g1 moved by (10,20)']);
  assert.deepEqual(editor.run('show r'), ['rect#r  parent=g#g2', '  x=10 y=20 width=5 height=5']);
});

test('grouping a single shape still reports a grammatical child count', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect a 0 0 1 1');
  assert.deepEqual(editor.run('group solo a'), ['g#solo created with 1 child']);
});

test('grouping shapes from different parents keeps their order', () => {
  const editor = new TestEditor();
  editor.runAll(
    'init',
    'create g p1',
    'create rect a 0 0 1 1 in p1',
    'create rect b 0 0 1 1',
    'create g p2',
    'create rect c 0 0 1 1 in p2',
  );
  const result = editor.run('group merged a b c');
  assert.equal(result.length, 1);
  assert.deepEqual(editor.run('tree merged'), [
    'g#merged',
    '├── rect#a  x=0 y=0 w=1 h=1',
    '├── rect#b  x=0 y=0 w=1 h=1',
    '└── rect#c  x=0 y=0 w=1 h=1',
  ]);
});
