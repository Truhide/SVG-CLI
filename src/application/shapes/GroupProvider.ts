import { GroupShape } from '../../domain/GroupShape';
import { Arguments } from './Arguments';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { StyleImporter } from './StyleImporter';

export class GroupProvider implements ShapeProvider {
  readonly typeName = 'g';
  readonly createUsage = 'create g <id>';

  create(id: string, params: readonly string[]): GroupShape {
    Arguments.count(params, 0, 0, this.createUsage);
    return new GroupShape(id);
  }

  importFrom(id: string, source: ShapeSource): GroupShape {
    const group = new GroupShape(id);
    StyleImporter.apply(group, source);
    return group;
  }
}
