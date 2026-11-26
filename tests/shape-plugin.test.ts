import assert from 'node:assert/strict';
import test from 'node:test';
import boxPlugin from '../plugins/plugin-shape-box';
import { TestEditor } from './support/TestEditor';

function boxEditor(): TestEditor {
  return new TestEditor({ configure: (context) => boxPlugin.activate(context) });
}

test('box is unknown until its plugin is registered', () => {
  const plain = new TestEditor();
  assert.deepEqual(plain.run('init'), ['canvas 800x600 created']);
  assert.deepEqual(plain.run('create box n1 0 0 10 10 "x"'), [
    'error: unknown shape type: box (is the plugin loaded?)',
  ]);
});

test('help lists the box usage only when the plugin is loaded', () => {
  const plain = new TestEditor();
  assert.ok(!plain.run('help').some((line) => line.includes('box <x>')));
  const editor = boxEditor();
  assert.ok(editor.run('help').some((line) => line.trim() === 'box <x> <y> <w> <h> "label"'));
});

test('box creates a rectangle and a label with derived ids', () => {
  const editor = boxEditor();
  assert.deepEqual(
    editor.runAll('init', 'create box n1 120 100 160 60 "开始"'),
    ['canvas 800x600 created', 'g#n1 created'],
  );
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── g#n1 (box)',
    '    ├── rect#n1-rect   x=120 y=100 w=160 h=60',
    '    └── text#n1-label  (140,135) "开始"',
  ]);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=120 y=100 width=160 height=60',
  ]);
});

test('box is a container: in clause, nesting and whole-box move', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create g outer', 'create box n1 10 20 100 40 "a" in outer');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── g#outer',
    '    └── g#n1 (box)',
    '        ├── rect#n1-rect   x=10 y=20 w=100 h=40',
    '        └── text#n1-label  (30,45) "a"',
  ]);
  assert.deepEqual(editor.run('move n1 5 5'), ['g#n1 moved by (5,5)']);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=15 y=25 width=100 height=40',
  ]);
  assert.deepEqual(editor.run('undo'), ['g#n1 moved back by (-5,-5)']);
});

test('ungroup refuses a box, delete refuses to remove a part', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create g outer', 'create box n1 0 0 10 10 "a" in outer');
  assert.deepEqual(editor.run('ungroup n1'), [
    'error: cannot ungroup a composite shape: n1',
  ]);
  assert.deepEqual(editor.run('delete n1-rect'), [
    'error: cannot remove a part of g#n1: n1-rect',
  ]);
  assert.deepEqual(editor.run('addto outer n1-label'), [
    'error: cannot remove a part of g#n1: n1-label',
  ]);
  assert.deepEqual(editor.run('delete n1'), ['g#n1 deleted']);
});

test('a partially conflicting id rejects the whole box', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create rect n1-rect 0 0 1 1');
  assert.deepEqual(editor.run('create box n1 0 0 10 10 "a"'), [
    'error: id already exists: n1-rect',
  ]);
  assert.equal(editor.document().count(), 1);
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── rect#n1-rect  x=0 y=0 w=1 h=1',
  ]);
});

test('box serialises as <g data-kind="box"> and reads back as a box', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create box n1 120 100 160 60 "开始"', 'save box.svg');
  const svg = editor.files.contents('box.svg');
  assert.equal(
    svg,
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">',
      '  <g id="n1" data-kind="box">',
      '    <rect id="n1-rect" x="120" y="100" width="160" height="60"/>',
      '    <text id="n1-label" x="140" y="135">开始</text>',
      '  </g>',
      '</svg>',
      '',
    ].join('\n'),
  );

  const reader = boxEditor();
  reader.files.seed('box.svg', svg ?? '');
  assert.deepEqual(reader.run('read box.svg'), ['read box.svg (3 elements)']);
  assert.deepEqual(reader.run('tree'), [
    'svg (800x600)',
    '└── g#n1 (box)',
    '    ├── rect#n1-rect   x=120 y=100 w=160 h=60',
    '    └── text#n1-label  (140,135) "开始"',
  ]);
});

test('without the plugin the same file degrades to a plain group', () => {
  const writer = boxEditor();
  writer.runAll('init', 'create box n1 120 100 160 60 "开始"', 'save box.svg');
  const plain = new TestEditor();
  plain.files.seed('box.svg', writer.files.contents('box.svg') ?? '');
  assert.deepEqual(plain.run('read box.svg'), ['read box.svg (3 elements)']);
  assert.deepEqual(plain.run('tree'), [
    'svg (800x600)',
    '└── g#n1',
    '    ├── rect#n1-rect   x=120 y=100 w=160 h=60',
    '    └── text#n1-label  (140,135) "开始"',
  ]);
});

test('a box missing a part is rejected as a whole document', () => {
  const editor = boxEditor();
  const broken = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">',
    '  <g id="n1" data-kind="box">',
    '    <rect id="n1-rect" x="0" y="0" width="10" height="10"/>',
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
  editor.files.seed('broken.svg', broken);
  editor.runAll('init 640 480', 'create rect keep 0 0 5 5');
  assert.deepEqual(editor.run('read broken.svg'), [
    'error: invalid box n1: expected <rect> n1-rect and <text> n1-label',
  ]);
  assert.deepEqual(editor.run('tree'), [
    'svg (640x480)',
    '└── rect#keep  x=0 y=0 w=5 h=5',
  ]);
});

test('a provider that throws while creating reports the failure', () => {
  const editor = new TestEditor({
    configure: (context) => {
      context.shapes.register({
        name: 'boom',
        elementTag: 'circle',
        createUsage: 'create boom <id>',
        helpUsage: 'boom',
        accepts: () => false,
        attributes: () => [],
        create: () => {
          throw new Error('provider blew up');
        },
        importFrom: () => {
          throw new Error('provider blew up');
        },
      });
    },
  });
  editor.run('init');
  assert.deepEqual(editor.run('create boom x1'), ['error: provider blew up']);
  assert.equal(editor.document().count(), 0);
});