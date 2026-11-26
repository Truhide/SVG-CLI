import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { BaseShapeProvider } from '../../application/extension/ShapeProvider';
import type { SvgAttribute } from '../../application/extension/ShapeProvider';
import type { ShapeSource } from '../../application/extension/ShapeSource';
import { Arguments } from './Arguments';
import { SourceNumbers } from './SourceNumbers';
import { StyleImporter } from './StyleImporter';
import { TextShape } from './TextShape';

export class TextProvider extends BaseShapeProvider {
  readonly name = 'text';
  readonly elementTag = 'text';
  readonly createUsage = 'create text <id> <x> <y> "content"';
  readonly helpUsage = 'text <x> <y> "content"';

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

  attributes(shape: Shape): readonly SvgAttribute[] {
    const text = shape as TextShape;
    return [
      ['x', Numbers.format(text.x)],
      ['y', Numbers.format(text.y)],
    ];
  }

  body(shape: Shape): string {
    return (shape as TextShape).content;
  }
}
