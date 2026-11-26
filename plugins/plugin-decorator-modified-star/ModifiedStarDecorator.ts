import type { TreeDecorator, TreeRow } from '../../src/application/extension/TreeDecorator';
import type { EditorEvents } from '../../src/application/extension/EditorEvents';
import { Fingerprint } from '../../src/application/format/Fingerprint';
import type { Document } from '../../src/domain/Document';
import { Numbers } from '../../src/domain/Numbers';

/**
 * Marks every row whose content differs from the last saved state with `*`.
 *
 * Semantics chosen (and argued in the ADR): "content differs from the last
 * save", not "an edit command ran".  Consequences:
 * - `undo` back to the save point removes the star again;
 * - a change inside a container marks the ancestors too, because the row
 *   fingerprint covers the whole subtree;
 * - a node created after the save is starred immediately.
 *
 * The watermark lives in this instance's field - no module-level state - so
 * two independent instances (or a re-activated plugin) never share it.
 */
export class ModifiedStarDecorator implements TreeDecorator {
  readonly name = 'modified-star';
  private saved = new Map<string, string>();

  constructor(events: EditorEvents) {
    events.onSaved((document) => this.capture(document));
  }

  decorate(row: TreeRow): string | null {
    return this.saved.get(row.id) === row.fingerprint ? null : '*';
  }

  private capture(document: Document): void {
    this.saved = new Map<string, string>();
    this.saved.set(
      'svg',
      Fingerprint.ofRoot(
        Numbers.format(document.width),
        Numbers.format(document.height),
        document.root.children,
      ),
    );
    for (const child of document.root.children) {
      this.indexShape(child);
    }
  }

  private indexShape(shape: import('../../src/domain/Shape').Shape): void {
    this.saved.set(shape.id, Fingerprint.of(shape));
    for (const child of shape.children) {
      this.indexShape(child);
    }
  }
}
