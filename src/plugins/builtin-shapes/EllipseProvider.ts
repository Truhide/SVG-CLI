import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { BaseShapeProvider } from '../../application/extension/ShapeProvider';
import type { SvgAttribute } from '../../application/extension/ShapeProvider';
import type { ShapeSource } from '../../application/extension/ShapeSource';
import { Arguments } from './Arguments';
import { EllipseShape } from './EllipseShape';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class EllipseProvider extends BaseShapeProvider {
  readonly name = 'ellipse';
  readonly elementTag = 'ellipse';
  readonly createUsage = 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]';
  readonly helpUsage = 'ellipse <cx> <cy> <rx> <ry> [fill]';

  create(id: string, params: readonly string[]): EllipseShape {
    Arguments.count(params, 4, 5, this.createUsage);
    const shape = new EllipseShape(
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

  importFrom(id: string, source: ShapeSource): EllipseShape {
    const shape = new EllipseShape(
      id,
      SourceNumbers.read(source, 'cx', 0),
      SourceNumbers.read(source, 'cy', 0),
      SourceNumbers.read(source, 'rx', 0),
      SourceNumbers.read(source, 'ry', 0),
    );
    StyleImporter.apply(shape, source);
    return shape;
  }

  attributes(shape: Shape): readonly SvgAttribute[] {
    const ellipse = shape as EllipseShape;
    return [
      ['cx', Numbers.format(ellipse.cx)],
      ['cy', Numbers.format(ellipse.cy)],
      ['rx', Numbers.format(ellipse.rx)],
      ['ry', Numbers.format(ellipse.ry)],
    ];
  }
}
