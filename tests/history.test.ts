import assert from 'node:assert/strict';
import test from 'node:test';
import { TestEditor } from './support/TestEditor';

function rootIds(editor: TestEditor): string[] {
  return editor.document().root.children.map((shape) => shape.id);
}

function childIds(editor: TestEditor, groupId: string): string[] {
  return editor.document().require(groupId).children.map((shape) => shape.id);
}

test('one edit command is one undo unit, also for group', () => {
  const editor = new TestEditor();
  editor.runAll(
    'init',
    'create rect a 0 0 10 10',
    'create rect b 20 0 10 10',
    'create rect c 40 0 10 10',
  );
  editor.run('group g1 a c');
  assert.deepEqual(rootIds(editor), ['g1', 'b']);
  assert.deepEqual(childIds(editor, 'g1'), ['a', 'c']);

  editor.run('undo');
  assert.deepEqual(rootIds(editor), ['a', 'b', 'c']);
  assert.equal(editor.document().find('g1'), undefined);

  editor.run('redo');
  assert.deepEqual(rootIds(editor), ['g1', 'b']);
  assert.deepEqual(childIds(editor, 'g1'), ['a', 'c']);
});

test('deleting a container removes the subtree and undo restores it', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g g1', 'create rect r1 1 2 3 4 in g1');
  assert.deepEqual(editor.run('delete g1'), ['g#g1 deleted']);
  assert.equal(editor.document().count(), 0);

  assert.deepEqual(editor.run('undo'), ['g#g1 restored into svg']);
  assert.deepEqual(childIds(editor, 'g1'), ['r1']);
  assert.equal(editor.document().count(), 2);
});

test('ungroup undo restores the container in its original position', () => {
  const editor = new TestEditor();
  editor.runAll(
    'init',
    'create g parent',
    'create rect b 0 0 1 1 in parent',
    'create rect c 0 0 1 1 in parent',
    'create rect d 0 0 1 1 in parent',
    'group outer b d',
  );
  assert.deepEqual(childIds(editor, 'parent'), ['outer', 'c']);
  assert.deepEqual(childIds(editor, 'outer'), ['b', 'd']);

  assert.deepEqual(editor.run('ungroup outer'), ['g#outer ungrouped (2 children)']);
  assert.deepEqual(childIds(editor, 'parent'), ['b', 'd', 'c']);

  editor.run('undo');
  assert.deepEqual(childIds(editor, 'parent'), ['outer', 'c']);
  assert.deepEqual(childIds(editor, 'outer'), ['b', 'd']);
});

test('addto can be undone back to the old parent and index', () => {
  const editor = new TestEditor();
  editor.runAll(
    'init',
    'create rect a 0 0 1 1',
    'create rect b 0 0 1 1',
    'create rect c 0 0 1 1',
  );
  editor.run('group g1 a c');
  assert.deepEqual(editor.run('addto g1 b'), ['rect#b moved into g#g1']);
  assert.deepEqual(childIds(editor, 'g1'), ['a', 'c', 'b']);
  assert.deepEqual(rootIds(editor), ['g1']);

  assert.deepEqual(editor.run('undo'), ['rect#b moved back into svg']);
  assert.deepEqual(rootIds(editor), ['g1', 'b']);
});

test('front and back change the sibling order and undo it', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect a 0 0 1 1', 'create rect b 0 0 1 1', 'create rect c 0 0 1 1');
  assert.deepEqual(editor.run('back c'), ['rect#c moved to back']);
  assert.deepEqual(rootIds(editor), ['c', 'a', 'b']);
  assert.deepEqual(editor.run('undo'), ['rect#c moved back']);
  assert.deepEqual(rootIds(editor), ['a', 'b', 'c']);

  assert.deepEqual(editor.run('front a'), ['rect#a moved to front']);
  assert.deepEqual(rootIds(editor), ['b', 'c', 'a']);
});

test('a new edit clears the redo stack', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect a 0 0 1 1');
  editor.run('undo');
  editor.run('create rect b 0 0 1 1');
  assert.deepEqual(editor.run('redo'), ['error: nothing to redo']);
});

test('io commands lock undo until the next edit', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect a 0 0 1 1');
  assert.deepEqual(editor.run('canvas 100 100'), ['canvas 100x100 updated']);
  assert.deepEqual(editor.run('undo'), ['error: undo not allowed after io command']);
  assert.deepEqual(editor.run('redo'), ['error: redo not allowed after io command']);

  editor.run('create rect b 0 0 1 1');
  assert.deepEqual(editor.run('undo'), ['rect#b removed']);
});

test('undo of create removes the shape, redo puts it back', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create g g1', 'create rect a 0 0 1 1 in g1');
  assert.deepEqual(editor.run('undo'), ['rect#a removed']);
  assert.deepEqual(childIds(editor, 'g1'), []);
  assert.deepEqual(editor.run('redo'), ['rect#a created in g#g1']);
  assert.deepEqual(childIds(editor, 'g1'), ['a']);
});

test('undo walks the stack back in order', () => {
  const editor = new TestEditor();
  editor.runAll('init', 'create rect a 0 0 1 1');
  editor.run('move a 10 20');
  editor.run('set a fill red');
  editor.run('scale a 2');
  assert.deepEqual(editor.run('undo'), ['rect#a scaled back by 0.5']);
  assert.deepEqual(editor.run('undo'), ['rect#a updated: fill (removed)']);
  assert.deepEqual(editor.run('undo'), ['rect#a moved back to (0,0)']);
  assert.deepEqual(editor.run('undo'), ['rect#a removed']);
  assert.deepEqual(editor.run('undo'), ['error: nothing to undo']);
});
