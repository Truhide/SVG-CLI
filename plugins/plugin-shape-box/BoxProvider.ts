import type { SvgAttribute } from '../../src/application/extension/ShapeProvider';
import { BaseShapeProvider } from '../../src/application/extension/ShapeProvider';
import type { ShapeSource } from '../../src/application/extension/ShapeSource';
import type { ShapeRegistry } from '../../src/application/extension/ShapeRegistry';
import { EditorError } from '../../src/domain/errors/EditorError';
import { Numbers } from '../../src/domain/Numbers';
import type { Shape } from '../../src/domain/Shape';
import { BoxShape } from './BoxShape';

const USAGE = 'create box <id> <x> <y> <w> <h> "label"';
const LABEL_OFFSET_X = 20;
const LABEL_OFFSET_Y = 5;

/**
 * Shape provider for `box`.
 *
 * The parts are created through the kernel registry (`rect`, `text`), so this
 * package depends on the kernel contract only - never on the built-in shapes
 * package, never on a host assembly module.
 */
export class BoxProvider extends BaseShapeProvider {
  readonly name = 'box';
  readonly elementTag = 'g';
  readonly createUsage = USAGE;
  readonly helpUsage = 'box <x> <y> <w> <h> "label"';

  constructor(private readonly registry: ShapeRegistry) {
    super();
  }

  create(id: string, params: readonly string[]): BoxShape {
    if (params.length !== 5) {
      throw new EditorError(`usage: ${USAGE}`);
    }
    const [x, y, width, height] = [0, 1, 2, 3].map((index) => Numbers.parse(params[index]));
    const label = params[4];
    const box = new BoxShape(id);
    box.appendChild(
      this.registry.create('rect', `${id}-rect`, [
        Numbers.format(x),
        Numbers.format(y),
        Numbers.format(width),
        Numbers.format(height),
      ]),
    );
    box.appendChild(
      this.registry.create('text', `${id}-label`, [
        Numbers.format(x + LABEL_OFFSET_X),
        Numbers.format(y + height / 2 + LABEL_OFFSET_Y),
        label,
      ]),
    );
    return box;
  }

  /** A `<g data-kind="box">` belongs to this provider; plain `<g>` does not. */
  override accepts(elementTag: string, source: ShapeSource): boolean {
    return elementTag === 'g' && source.attribute('data-kind') === 'box';
  }

  importFrom(id: string, _source: ShapeSource): BoxShape {
    return new BoxShape(id);
  }

  attributes(_shape: Shape): readonly SvgAttribute[] {
    return [['data-kind', 'box']];
  }

  /**
   * Re-read documents are accepted only if the two parts survived: a box
   * without its rect or label is not a box.  Rejecting beats building an
   * object that later fails inside `set`.
   */
  verify(shape: Shape): void {
    const box = shape as BoxShape;
    if (box.rectPart === null || box.labelPart === null) {
      throw new EditorError(
        `invalid box ${shape.id}: expected <rect> ${shape.id}-rect and <text> ${shape.id}-label`,
      );
    }
    if (box.children.length !== 2) {
      throw new EditorError(`invalid box ${shape.id}: expected 2 parts, found ${box.children.length}`);
    }
  }
}
