import type { TreeDecorator, TreeRow } from '../../src/application/extension/TreeDecorator';

/** Appends `(box)` to the row of a box container; knows nothing else. */
export class BoxLabelDecorator implements TreeDecorator {
  readonly name = 'box-type-label';

  decorate(row: TreeRow): string | null {
    return row.kind === 'box' ? '(box)' : null;
  }
}
