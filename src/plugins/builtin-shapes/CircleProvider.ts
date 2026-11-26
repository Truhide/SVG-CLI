import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { BaseShapeProvider } from '../../application/extension/ShapeProvider';
import type { SvgAttribute } from '../../application/extension/ShapeProvider';
import type { ShapeSource } from '../../application/extension/ShapeSource';
import { Arguments } from './Arguments';
import { CircleShape } from './CircleShape';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class CircleProvider extends BaseShapeProvider {
  readonly name = 'circle';
  readonly elementTag = 'circle';
  readonly createUsage = 'create circle <id> <cx> <cy> <r> [fill]';
  readonly helpUsage = 'circle <cx> <cy> <r> [fill]';

  create(id: string, params: readonly string[]): CircleShape {
    Arguments.count(params, 3, 4, this.createUsage);
    const shape = new CircleShape(
      id,
      Arguments.number(params, 0, this.createUsage),
      Arguments.number(params, 1, this.createUsage),
      Arguments.number(params, 2, this.createUsage),
    );
    if (params.length === 4) {
      shape.setAttribute('fill', params[3]);
    }
    return shape;
  }

  importFrom(id: string, source: ShapeSource): CircleShape {
    const shape = new CircleShape(
      id,
      SourceNumbers.read(source, 'cx', 0),
      SourceNumbers.read(source, 'cy', 0),
      SourceNumbers.read(source, 'r', 0),
    );
    StyleImporter.apply(shape, source);
    return shape;
  }

  attributes(shape: Shape): readonly SvgAttribute[] {
    const circle = shape as CircleShape;
    return [
      ['cx', Numbers.format(circle.cx)],
      ['cy', Numbers.format(circle.cy)],
      ['r', Numbers.format(circle.radius)],
    ];
  }
}
