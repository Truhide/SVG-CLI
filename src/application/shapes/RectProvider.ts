import { RectShape } from '../../domain/RectShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class RectProvider implements ShapeProvider {
  readonly typeName = 'rect';
  readonly createUsage = 'create rect <id> <x> <y> <w> <h> [fill]';

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
}
