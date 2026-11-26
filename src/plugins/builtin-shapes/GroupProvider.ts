import type { Shape } from '../../domain/Shape';
import { GroupShape } from '../../domain/GroupShape';
import { BaseShapeProvider } from '../../application/extension/ShapeProvider';
import type { SvgAttribute } from '../../application/extension/ShapeProvider';
import type { ShapeSource } from '../../application/extension/ShapeSource';
import { Arguments } from './Arguments';
import { StyleImporter } from './StyleImporter';

export class GroupProvider extends BaseShapeProvider {
  readonly name = 'g';
  readonly elementTag = 'g';
  readonly createUsage = 'create g <id>';
  readonly helpUsage = 'g';

  create(id: string, params: readonly string[]): GroupShape {
    Arguments.count(params, 0, 0, this.createUsage);
    return new GroupShape(id);
  }

  importFrom(id: string, source: ShapeSource): GroupShape {
    const group = new GroupShape(id);
    StyleImporter.apply(group, source);
    return group;
  }

  attributes(_shape: Shape): readonly SvgAttribute[] {
    return [];
  }
}
