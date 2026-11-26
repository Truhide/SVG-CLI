import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { BaseShapeProvider } from '../../application/extension/ShapeProvider';
import type { SvgAttribute } from '../../application/extension/ShapeProvider';
import type { ShapeSource } from '../../application/extension/ShapeSource';
import { Arguments } from './Arguments';
import { RectShape } from './RectShape';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class RectProvider extends BaseShapeProvider {
  readonly name = 'rect';
  readonly elementTag = 'rect';
  readonly createUsage = 'create rect <id> <x> <y> <w> <h> [fill]';
  readonly helpUsage = 'rect <x> <y> <w> <h> [fill]';

  create(id: string, params: readonly string[]): RectShape {
    Arguments.count(params, 4, 5, this.createUsage);
    const shape = new RectShape(
      id,
      Arguments.number(params, 0, this.createUsage),
      Arguments.number(params, 1, this.createUsage),
      Arguments.number(params, 2, this.createUsage),
      Arguments.number(params, 3, this.createUsage),
    );
    if (params.length === 5) {
      shape.setAttribute('fill', params[4]);
    }
    return shape;
  }

  importFrom(id: string, source: ShapeSource): RectShape {
    const shape = new RectShape(
      id,
      SourceNumbers.read(source, 'x', 0),
      SourceNumbers.read(source, 'y', 0),
      SourceNumbers.read(source, 'width', 0),
      SourceNumbers.read(source, 'height', 0),
    );
    StyleImporter.apply(shape, source);
    return shape;
  }

  attributes(shape: Shape): readonly SvgAttribute[] {
    const rect = shape as RectShape;
    return [
      ['x', Numbers.format(rect.x)],
      ['y', Numbers.format(rect.y)],
      ['width', Numbers.format(rect.width)],
      ['height', Numbers.format(rect.height)],
    ];
  }
}
