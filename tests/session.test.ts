import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryFileStore } from './support/InMemoryFileStore';
import { TestEditor } from './support/TestEditor';

test('init creates an empty default canvas', () => {
  const editor = new TestEditor();
  assert.deepEqual(editor.run('init'), ['canvas 800x600 created']);
  assert.deepEqual(editor.run('canvas'), ['canvas 800x600']);
  assert.equal(editor.document().count(), 0);
});

test('the section 6 session works end to end', () => {
  const editor = new TestEditor();
  assert.deepEqual(editor.run('init 800 600'), ['canvas 800x600 created']);
  assert.deepEqual(editor.run('create rect bg 0 0 800 600 #ffffff'), ['rect#bg created']);
  assert.deepEqual(editor.run('create text title 20 40 "My Diagram"'), ['text#title created']);
  assert.deepEqual(editor.run('create circle c1 100 100 20 red'), ['circle#c1 created']);
  assert.deepEqual(editor.run('create rect box 200 80 60 60 #3366ff'), ['rect#box created']);
  assert.deepEqual(editor.run('create rect box 200 80 60 60 #3366ff'), [
    'error: id already exists: box',
  ]);

  assert.deepEqual(editor.run('group markers c1 box'), ['g#markers created with 2 children']);
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff',
    '├── text#title  (20,40) "My Diagram"',
    '└── g#markers',
    '    ├── circle#c1   cx=100 cy=100 r=20 fill=red',
    '    └── rect#box    x=200 y=80 w=60 h=60 fill=#3366ff',
  ]);

  assert.deepEqual(editor.run('move c1 30 0'), ['circle#c1 moved to (130,100)']);
  assert.deepEqual(editor.run('undo'), ['circle#c1 moved back to (100,100)']);
  assert.deepEqual(editor.run('redo'), ['circle#c1 moved to (130,100)']);

  assert.deepEqual(editor.run('set title text "My Diagram v2"'), [
    'text#title updated: text="My Diagram v2"',
  ]);
  assert.deepEqual(editor.run('undo'), ['text#title updated: text="My Diagram"']);

  assert.deepEqual(editor.run('group bad c1 markers'), [
    'error: cannot group a container into its own descendant: markers',
  ]);
  assert.deepEqual(editor.run('delete box'), ['rect#box deleted']);
  assert.deepEqual(editor.run('undo'), ['rect#box restored into g#markers']);

  assert.deepEqual(editor.run('save demo.svg'), ['saved to demo.svg (5 elements)']);
  assert.deepEqual(editor.run('undo'), ['error: undo not allowed after io command']);
  assert.ok(editor.files.has('demo.svg'));
});

test('read assigns ids, reports the element count and warns', () => {
  const editor = new TestEditor();
  const store = editor.files as InMemoryFileStore;
  store.seed(
    'other.svg',
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`,
  );
  assert.deepEqual(editor.run('read other.svg'), [
    'warning: assigned id rect1 to unnamed <rect>',
    'read other.svg (7 elements)',
  ]);
  assert.deepEqual(editor.run('tree'), [
    'svg (400x300)',
    '├── rect#rect1  x=0 y=0 w=400 h=300 fill=#ffffff',
    '├── text#t1     (10,290) "imported"',
    '├── circle#c1   cx=50 cy=50 r=10',
    '├── g#g1',
    '│   ├── rect#r2     x=0 y=0 w=10 h=10',
    '│   └── circle#c2   cx=5 cy=5 r=2',
    '└── ellipse#e1  cx=1 cy=2 rx=3 ry=4',
  ]);
});

test('the 6.1 flowchart is built top down with the in clause', () => {
  const editor = new TestEditor();
  assert.deepEqual(
    editor.runAll(
      'init 800 600',
      'create g flowchart',
      'create g node1 in flowchart',
      'create rect start 120 100 160 60 #4a90d9 in node1',
      'create text start-label 155 135 "开始" in node1',
      'create g node2 in flowchart',
      'create rect process 520 100 160 60 #f5a623 in node2',
      'create text process-label 545 135 "处理数据" in node2',
      'create line arrow1 280 130 520 130 black in flowchart',
    ),
    [
      'canvas 800x600 created',
      'g#flowchart created',
      'g#node1 created in g#flowchart',
      'rect#start created in g#node1',
      'text#start-label created in g#node1',
      'g#node2 created in g#flowchart',
      'rect#process created in g#node2',
      'text#process-label created in g#node2',
      'line#arrow1 created in g#flowchart',
    ],
  );
  const tree = editor.run('tree');
  assert.equal(tree[0], 'svg (800x600)');
  assert.equal(tree[1], '└── g#flowchart');
  assert.ok(tree.some((line) => line.includes('rect#start')));
  assert.ok(tree.some((line) => line.includes('line#arrow1')));

  assert.deepEqual(editor.run('move node2 0 100'), ['g#node2 moved by (0,100)']);
  assert.deepEqual(editor.run('undo'), ['g#node2 moved back by (0,-100)']);
  assert.deepEqual(editor.run('set process-label text "处理数据 v2"'), [
    'text#process-label updated: text="处理数据 v2"',
  ]);
});

test('a quoted "in" stays text content instead of a container clause', () => {
  const editor = new TestEditor();
  editor.run('init');
  assert.deepEqual(editor.run('create text t 1 2 "in"'), ['text#t created']);
  assert.equal(editor.document().require('t').parent, editor.document().root);
});

test('show prints parent and indented attributes', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g markers', 'create circle c1 100 100 20 red in markers');
  assert.deepEqual(editor.run('show c1'), [
    'circle#c1  parent=g#markers',
    '  cx=100 cy=100 r=20',
    '  fill=red',
  ]);
});

test('tree of a subtree only prints that subtree', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g markers', 'create circle c1 1 2 3 in markers');
  assert.deepEqual(editor.run('tree markers'), ['g#markers', '└── circle#c1  cx=1 cy=2 r=3']);
});
