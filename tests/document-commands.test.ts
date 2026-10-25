import assert from 'node:assert/strict';
import test from 'node:test';
import { TestEditor } from './support/TestEditor';

test('init and read lock undo like the other document commands', () => {
  const editor = new TestEditor();
  editor.run('init');
  assert.deepEqual(editor.run('undo'), ['error: undo not allowed after io command']);

  editor.run('create rect a 0 0 1 1');
  editor.run('save a.svg');
  assert.deepEqual(editor.run('undo'), ['error: undo not allowed after io command']);

  editor.files.seed('b.svg', '<svg width="10" height="10"/>');
  editor.run('read b.svg');
  assert.deepEqual(editor.run('undo'), ['error: undo not allowed after io command']);
  assert.deepEqual(editor.run('redo'), ['error: redo not allowed after io command']);
});

test('the first edit after a document command unlocks undo', () => {
  const editor = new TestEditor();
  editor.run('init');
  editor.run('create rect a 0 0 1 1');
  assert.deepEqual(editor.run('undo'), ['rect#a removed']);
});
