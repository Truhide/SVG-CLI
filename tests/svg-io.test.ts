import assert from 'node:assert/strict';
import test from 'node:test';
import { NodeFileStore } from '../src/infrastructure/fs/NodeFileStore';
import { TestEditor } from './support/TestEditor';

const SVG_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

test('a saved document reads back identically', () => {
  const writer = new TestEditor();
  writer.runAll(
    'init 320 240',
    'create rect bg 0 0 320 240 #ffffff',
    'create text title 10 30 "A & B <ok>"',
    'create g g1',
    'create circle c1 50 60 20 red in g1',
    'create line l1 1.5 2.5 30 40 black',
    'create ellipse e1 5 6 7 8',
    'save out.svg',
  );
  const saved = writer.files.contents('out.svg');
  assert.ok(saved !== undefined);

  const reader = new TestEditor();
  reader.files.seed('out.svg', saved);
  assert.deepEqual(reader.run('read out.svg'), ['read out.svg (6 elements)']);
  assert.deepEqual(reader.run('tree'), writer.run('tree'));
  assert.equal(reader.document().find('title')?.treeSummary(), '(10,30) "A & B <ok>"');
});

test('written files use the documented SVG shape', () => {
  const editor = new TestEditor();
  editor.runAll('init 400 200', 'create rect start 30 70 120 60 #4a90d9', 'create g wrap', 'create line edge 0 0 10 10 black in wrap');
  editor.run('save demo.svg');
  assert.equal(
    editor.files.contents('demo.svg'),
    `${SVG_HEADER}
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
  <g id="wrap">
    <line id="edge" x1="0" y1="0" x2="10" y2="10" stroke="black"/>
  </g>
</svg>
`,
  );
});

test('translate and scale transforms are folded into coordinates', () => {
  const editor = new TestEditor();
  editor.files.seed(
    'transformed.svg',
    `<svg width="400" height="200">
  <g id="outer" transform="translate(10,20)">
    <g id="inner" transform="scale(2)">
      <rect id="a" x="5" y="5" width="10" height="10"/>
    </g>
    <circle id="c" cx="3" cy="4" r="1" transform="translate(1,1)"/>
  </g>
</svg>`,
  );
  assert.deepEqual(editor.run('read transformed.svg'), ['read transformed.svg (4 elements)']);
  assert.deepEqual(editor.run('show a'), [
    'rect#a  parent=g#inner',
    '  x=20 y=30 width=20 height=20',
  ]);
  assert.deepEqual(editor.run('show c'), [
    'circle#c  parent=g#outer',
    '  cx=14 cy=25 r=1',
  ]);
});

test('a viewBox provides the canvas size when width/height are missing', () => {
  const editor = new TestEditor();
  editor.files.seed('vb.svg', '<svg viewBox="0 0 300 200"><rect id="r" width="10" height="10"/></svg>');
  assert.deepEqual(editor.run('read vb.svg'), ['read vb.svg (1 elements)']);
  assert.deepEqual(editor.run('canvas'), ['canvas 300x200']);
});

test('missing, duplicate and reserved ids are repaired with warnings', () => {
  const editor = new TestEditor();
  editor.files.seed(
    'ids.svg',
    `<svg width="100" height="100">
  <rect width="1" height="1"/>
  <rect id="c1" width="1" height="1"/>
  <circle id="c1" r="1"/>
  <rect id="rect1" width="1" height="1"/>
  <rect id="svg" width="1" height="1"/>
</svg>`,
  );
  assert.deepEqual(editor.run('read ids.svg'), [
    'warning: assigned id rect1 to unnamed <rect>',
    'warning: duplicate id c1 renamed to c1-2',
    'warning: duplicate id rect1 renamed to rect1-2',
    'warning: reserved id svg renamed to svg-2',
    'read ids.svg (5 elements)',
  ]);
});

test('unsupported elements are skipped with a warning', () => {
  const editor = new TestEditor();
  editor.files.seed(
    'mixed.svg',
    `<svg width="100" height="100">
  <rect id="r" width="1" height="1"/>
  <path id="p" d="M0 0 L10 10"/>
</svg>`,
  );
  assert.deepEqual(editor.run('read mixed.svg'), [
    'warning: unsupported element <path> skipped',
    'read mixed.svg (1 elements)',
  ]);
});

test('presentation attributes, style declarations, namespaces and px units are read', () => {
  const editor = new TestEditor();
  editor.files.seed(
    'styled.svg',
    `<svg:svg xmlns:svg="http://www.w3.org/2000/svg" width="100px" height="100px">
  <svg:circle id="c" cx="10px" cy="20" r="5" style="fill: red; stroke: #000; stroke-width: 2px"/>
</svg:svg>`,
  );
  assert.deepEqual(editor.run('read styled.svg'), ['read styled.svg (1 elements)']);
  assert.deepEqual(editor.run('show c'), [
    'circle#c  parent=svg',
    '  cx=10 cy=20 r=5',
    '  fill=red',
    '  stroke=#000',
    '  stroke-width=2',
  ]);
});

test('malformed input is reported, not partially imported', () => {
  const editor = new TestEditor();
  editor.files.seed('bad.svg', '<svg width="10" height="10"><rect id="r" width="1" height="1"></svg>');
  assert.deepEqual(editor.run('read bad.svg'), [
    'error: malformed XML: expected </rect> but found </svg>',
  ]);
  assert.equal(editor.session.document, null);
});

test('NodeFileStore translates platform failures into CLI errors', () => {
  const store = new NodeFileStore();
  assert.throws(() => store.read('definitely-missing-file.svg'), /cannot read file/);
  assert.throws(
    () => store.write('no-such-directory-xyz/file.svg', 'x'),
    /cannot write file/,
  );
});
