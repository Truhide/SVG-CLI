import { LineShape } from '../../domain/LineShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class LineProvider implements ShapeProvider {
  readonly typeName = 'line';
  readonly createUsage = 'create line <id> <x1> <y1> <x2> <y2> [stroke]';

  create(id: string, params: readonly string[]): LineShape {
    Arguments.count(params, 4, 5, this.createUsage);
    const shape = new LineShape(
      id,
      Arguments.number(params, 0, this.createUsage),
      Arguments.number(params, 1, this.createUsage),
      Arguments.number(params, 2, this.createUsage),
      Arguments.number(params, 3, this.createUsage),
    );
    if (params.length === 5) {
      shape.setAttribute('stroke', params[4]);
    }
    return shape;
  }

  importFrom(id: string, source: ShapeSource): LineShape {
    const shape = new LineShape(
      id,
      SourceNumbers.read(source, 'x1', 0),
      SourceNumbers.read(source, 'y1', 0),
      SourceNumbers.read(source, 'x2', 0),
      SourceNumbers.read(source, 'y2', 0),
    );
    StyleImporter.apply(shape, source);
    return shape;
  }
}
