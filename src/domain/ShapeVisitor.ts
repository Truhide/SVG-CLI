import type { CircleShape } from './CircleShape';
import type { EllipseShape } from './EllipseShape';
import type { GroupShape } from './GroupShape';
import type { LineShape } from './LineShape';
import type { RectShape } from './RectShape';
import type { TextShape } from './TextShape';

/**
 * Double dispatch for operations that need the concrete shape type
 * (rendering to SVG, formatting the tree, ...).
 *
 * This keeps `switch (shape.typeName)` out of the renderers: adding a shape
 * class means adding one method here and letting the compiler point at every
 * renderer that has to handle it.
 */
export interface ShapeVisitor<R> {
  visitRect(shape: RectShape): R;
  visitCircle(shape: CircleShape): R;
  visitEllipse(shape: EllipseShape): R;
  visitLine(shape: LineShape): R;
  visitText(shape: TextShape): R;
  visitGroup(shape: GroupShape): R;
}
