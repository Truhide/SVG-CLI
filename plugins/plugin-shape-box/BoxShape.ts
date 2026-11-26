import { EditorError } from '../../src/domain/errors/EditorError';
import { GroupShape } from '../../src/domain/GroupShape';
import type { Shape } from '../../src/domain/Shape';

/**
 * A `box`: one rectangle plus one label, kept together as a container.
 *
 * It presents itself as a `<g>` (`typeName` inherited) but registers under
 * the plugin key `box` (`kind`), which is how `create box` and the `(box)`
 * tree label find it without the kernel knowing the word `box`.
 */
export class BoxShape extends GroupShape {
  override get kind(): string {
    return 'box';
  }

  /** Dissolving a box would leave two orphan parts behind. */
  override get canUngroup(): boolean {
    return false;
  }

  get rectPart(): Shape | null {
    return this.children.find((child) => child.id === `${this.id}-rect`) ?? null;
  }

  get labelPart(): Shape | null {
    return this.children.find((child) => child.id === `${this.id}-label`) ?? null;
  }

  /** `delete`, `addto`, `group` and `ungroup` all pass through here. */
  override beforeRemoveChild(child: Shape): void {
    if (child === this.rectPart || child === this.labelPart) {
      throw new EditorError(`cannot remove a part of ${this.label()}: ${child.id}`);
    }
  }
}
