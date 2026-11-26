import assert from 'node:assert/strict';
import test from 'node:test';
import boxPlugin from '../plugins/plugin-shape-box';
import type { AttributeEdit } from '../src/application/extension/AttributeHandler';
import type { Shape } from '../src/domain/Shape';
import { TestEditor } from './support/TestEditor';

function boxEditor(): TestEditor {
  return new TestEditor({ configure: (context) => boxPlugin.activate(context) });
}

test('set fill on a box edits the inner rectangle and is one undo unit', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create box n1 120 100 160 60 "开始"');
  assert.deepEqual(editor.run('set n1 fill #f5a623'), ['g#n1 updated: fill=#f5a623']);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=120 y=100 width=160 height=60',
    '  fill=#f5a623',
  ]);
  assert.deepEqual(editor.run('undo'), ['g#n1 updated: fill (removed)']);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=120 y=100 width=160 height=60',
  ]);
  assert.deepEqual(editor.run('redo'), ['g#n1 updated: fill=#f5a623']);
  assert.ok(editor.run('show n1-rect').includes('  fill=#f5a623'));
});

test('set label on a box edits the inner text and is one undo unit', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create box n1 120 100 160 60 "开始"');
  assert.deepEqual(editor.run('set n1 label "处理数据 v2"'), [
    'g#n1 updated: label="处理数据 v2"',
  ]);
  assert.ok(editor.run('tree').some((line) => line.includes('"处理数据 v2"')));
  assert.deepEqual(editor.run('undo'), ['g#n1 updated: label="开始"']);
  assert.deepEqual(editor.run('redo'), ['g#n1 updated: label="处理数据 v2"']);
});

test('one set is one undo unit even when the handler touches two parts', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create box n1 120 100 160 60 "开始"');
  editor.context.attributes.register({
    name: 'box-both',
    handles: (shape: Shape, attr: string) => shape.kind === 'box' && attr === 'both',
    read: () => null,
    createEdit: (shape: Shape): AttributeEdit => {
      const rect = (shape as unknown as { rectPart: Shape | null }).rectPart;
      const label = (shape as unknown as { labelPart: Shape | null }).labelPart;
      if (rect === null || label === null) {
        throw new Error('missing parts');
      }
      const oldFill = rect.readAttribute('fill');
      const oldText = label.readAttribute('text');
      return {
        apply: () => {
          rect.setAttribute('fill', 'gold');
          label.setAttribute('text', 'both');
        },
        revert: () => {
          if (oldFill === null) {
            rect.removeAttribute('fill');
          } else {
            rect.setAttribute('fill', oldFill);
          }
          label.setAttribute('text', oldText ?? '');
        },
      };
    },
  });

  assert.deepEqual(editor.run('set n1 both x'), ['g#n1 updated: both=x']);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=120 y=100 width=160 height=60',
    '  fill=gold',
  ]);
  assert.ok(editor.run('show n1-label').includes('  text="both"'));
  assert.deepEqual(editor.run('undo'), ['g#n1 updated: both (removed)']);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=120 y=100 width=160 height=60',
  ]);
  assert.ok(editor.run('show n1-label').includes('  text="开始"'));
});

test('attributes without a handler keep the Phase 1 rules', () => {
  const editor = boxEditor();
  editor.runAll('init', 'create box n1 0 0 10 10 "a"');
  assert.deepEqual(editor.run('set n1 opacity 0.5'), ['error: unknown attribute: opacity']);
  assert.deepEqual(editor.run('set n1 stroke red'), ['g#n1 updated: stroke=red']);
});

test('two handlers for the same pair are rejected, not silently merged', () => {
  const editor = boxEditor();
  editor.context.attributes.register({
    name: 'second-fill',
    handles: (shape: Shape, attr: string) => shape.kind === 'box' && attr === 'fill',
    read: () => null,
    createEdit: () => ({ apply: () => undefined, revert: () => undefined }),
  });
  editor.runAll('init', 'create box n1 0 0 10 10 "a"');
  assert.deepEqual(editor.run('set n1 fill red'), [
    'error: ambiguous attribute handler: fill (box-attributes, second-fill)',
  ]);
  assert.deepEqual(editor.run('show n1-rect'), [
    'rect#n1-rect  parent=g#n1',
    '  x=0 y=0 width=10 height=10',
  ]);
});

test('a handler that throws half way leaves document and history untouched', () => {
  const editor = new TestEditor({
    configure: (context) => {
      context.attributes.register({
        name: 'exploding',
        handles: (shape: Shape, attr: string) => shape.kind === 'rect' && attr === 'fill',
        read: () => null,
        createEdit: (shape: Shape): AttributeEdit => ({
          apply: () => {
            shape.setAttribute('fill', 'blue');
            throw new Error('handler blew up');
          },
          revert: () => shape.removeAttribute('fill'),
        }),
      });
    },
  });
  editor.runAll('init', 'create rect r1 0 0 10 10');
  assert.deepEqual(editor.run('set r1 fill red'), ['error: handler blew up']);
  assert.deepEqual(editor.run('show r1'), [
    'rect#r1  parent=svg',
    '  x=0 y=0 width=10 height=10',
  ]);
  // The failed set never entered the history: undo removes the rect instead.
  assert.deepEqual(editor.run('undo'), ['rect#r1 removed']);
});
