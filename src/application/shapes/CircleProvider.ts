import { CircleShape } from '../../domain/CircleShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class CircleProvider implements ShapeProvider {
  readonly typeName = 'circle';
  readonly createUsage = 'create circle <id> <cx> <cy> <r> [fill]';

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
}
