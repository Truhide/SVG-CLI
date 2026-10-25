import type { Shape } from '../../domain/Shape';
import type { ShapeSource } from './ShapeSource';

/**
 * The extension slot for shape types (the future ShapeProvider plugin API).
 *
 * A provider owns everything that is specific to one type: the `create`
 * syntax, the SVG attributes it is built from, and the default style.  The
 * kernel only talks to this interface, which is why adding `box` later does
 * not require a single change in commands or in the document model.
 */
export interface ShapeProvider {
  readonly typeName: string;
  readonly createUsage: string;
  create(id: string, params: readonly string[]): Shape;
  importFrom(id: string, source: ShapeSource): Shape;
}
