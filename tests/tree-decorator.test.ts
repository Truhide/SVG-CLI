import assert from 'node:assert/strict';
import test from 'node:test';
import boxPlugin from '../plugins/plugin-shape-box';
import starPlugin from '../plugins/plugin-decorator-modified-star';
import { TestEditor } from './support/TestEditor';

function starEditor(): TestEditor {
  return new TestEditor({ configure: (context) => starPlugin.activate(context) });
}

test('without a decorator the tree keeps the Phase 1 text', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect r1 0 0 10 10 red');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── rect#r1  x=0 y=0 w=10 h=10 fill=red',
  ]);
});

test('modified-star: edit, save, edit again, undo back to the save point', () => {
  const editor = starEditor();
  editor.run('init');
  assert.deepEqual(editor.run('tree'), ['svg (800x600)']);

  editor.run('create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600) *',
    '└── rect#r1  x=0 y=0 w=10 h=10 *',
  ]);

  editor.run('undo');
  assert.deepEqual(editor.run('tree'), ['svg (800x600)']);

  editor.run('redo');
  editor.run('save star.svg');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── rect#r1  x=0 y=0 w=10 h=10',
  ]);

  assert.deepEqual(editor.run('move r1 5 5'), ['rect#r1 moved to (5,5)']);
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600) *',
    '└── rect#r1  x=5 y=5 w=10 h=10 *',
  ]);

  editor.run('undo');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── rect#r1  x=0 y=0 w=10 h=10',
  ]);
});

test('modified-star: a change marks the ancestors too', () => {
  const editor = starEditor();
  editor.runAll('init', 'create g outer', 'create rect r1 0 0 10 10 in outer', 'save s.svg');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── g#outer',
    '    └── rect#r1  x=0 y=0 w=10 h=10',
  ]);
  editor.run('set r1 fill red');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600) *',
    '└── g#outer *',
    '    └── rect#r1  x=0 y=0 w=10 h=10 fill=red *',
  ]);
});

test('modified-star: a node created after the save is starred at once', () => {
  const editor = starEditor();
  editor.runAll('init', 'save empty.svg', 'create circle c1 1 1 2');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600) *',
    '└── circle#c1  cx=1 cy=1 r=2 *',
  ]);
});

test('two decorators coexist without knowing each other', () => {
  const editor = new TestEditor({
    configure: (context) => {
      boxPlugin.activate(context);
      starPlugin.activate(context);
    },
  });
  editor.runAll('init', 'create box n1 0 0 10 10 "a"', 'save b.svg');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600)',
    '└── g#n1 (box)',
    '    ├── rect#n1-rect   x=0 y=0 w=10 h=10',
    '    └── text#n1-label  (20,10) "a"',
  ]);
  editor.run('set n1 label "b"');
  assert.deepEqual(editor.run('tree'), [
    'svg (800x600) *',
    '└── g#n1 (box) *',
    '    ├── rect#n1-rect   x=0 y=0 w=10 h=10',
    '    └── text#n1-label  (20,10) "b" *',
  ]);
});

test('the decorator keeps its watermark in the instance, not in a module', () => {
  const first = starEditor();
  first.run('init');
  first.run('create rect r1 0 0 10 10');

  const second = starEditor();
  second.run('init');
  assert.deepEqual(second.run('tree'), ['svg (800x600)']);
});

test('a decorator that throws turns the tree into one error line', () => {
  const editor = new TestEditor({
    configure: (context) => {
      context.decorators.register({
        name: 'exploding-decorator',
        decorate: () => {
          throw new Error('decorator blew up');
        },
      });
    },
  });
  editor.runAll('init', 'create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('tree'), ['error: decorator blew up']);
  assert.deepEqual(editor.run('show r1'), [
    'rect#r1  parent=svg',
    '  x=0 y=0 width=10 height=10',
  ]);
});