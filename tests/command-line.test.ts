import assert from 'node:assert/strict';
import test from 'node:test';
import { CommandLine } from '../src/application/CommandLine';
import { TestEditor } from './support/TestEditor';

test('tokens keep quoted values together and remember quoting', () => {
  const line = CommandLine.parse('create text title 20 40 "My Diagram" in g1');
  assert.equal(line.name, 'create');
  assert.deepEqual(
    line.args.map((token) => token.value),
    ['text', 'title', '20', '40', 'My Diagram', 'in', 'g1'],
  );
  assert.equal(line.args[4].quoted, true);
  assert.equal(line.args[5].isKeyword('in'), true);
});

test('backslash escapes a quote inside a quoted value', () => {
  const line = CommandLine.parse('create text t 0 0 "say \\"hi\\""');
  assert.equal(line.args[4].value, 'say "hi"');
});

test('an unterminated quote is rejected', () => {
  assert.throws(() => CommandLine.parse('create text t 0 0 "oops'), /unterminated quoted string/);
});

test('command names are case insensitive', () => {
  const editor = new TestEditor();
  editor.run('INIT');
  assert.deepEqual(editor.run('CANVAS'), ['canvas 800x600']);
});

test('comments and blank lines produce no output', () => {
  const editor = new TestEditor();
  assert.deepEqual(editor.run('# just a comment'), []);
  assert.deepEqual(editor.run('   '), []);
  assert.deepEqual(editor.run('\t# indented comment'), []);
});

test('backslashes in quoted Windows paths are preserved', () => {
  const line = CommandLine.parse('save "C:\\temp\\demo.svg"');
  assert.equal(line.args[0].value, 'C:\\temp\\demo.svg');
});

test('a colour token is not mistaken for a comment', () => {
  const editor = new TestEditor();
  editor.run('init');
  assert.deepEqual(editor.run('create rect r 0 0 10 10 #4a90d9'), ['rect#r created']);
  assert.deepEqual(editor.run('show r'), ['rect#r  parent=svg', '  x=0 y=0 width=10 height=10', '  fill=#4a90d9']);
});
