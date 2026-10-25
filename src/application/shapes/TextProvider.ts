import { TextShape } from '../../domain/TextShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';

export class TextProvider implements ShapeProvider {
  readonly typeName = 'text';
  readonly createUsage = 'create text <id> <x> <y> "content"';

  create(id: string, params: readonly string[]): TextShape {
    Arguments.count(params, 3, 3, this.createUsage);
    return new TextShape(
      id,
      Arguments.number(params, 0, this.createUsage),
      Arguments.number(params, 1, this.createUsage),
      params[2],
    );
  }

  importFrom(id: string, source: ShapeSource): TextShape {
    const shape = new TextShape(
      id,
      SourceNumbers.read(source, 'x', 0),
      SourceNumbers.read(source, 'y', 0),
      source.text(),
    );
    StyleImporter.apply(shape, source);
    return shape;
  }
}
