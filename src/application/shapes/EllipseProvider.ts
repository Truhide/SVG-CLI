import { EllipseShape } from '../../domain/EllipseShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class EllipseProvider implements ShapeProvider {
  readonly typeName = 'ellipse';
  readonly createUsage = 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]';

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
}
