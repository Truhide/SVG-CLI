import { EditorError } from '../../domain/errors/EditorError';
import { GroupShape } from '../../domain/GroupShape';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

interface CreateClause {
  readonly params: readonly Token[];
  readonly containerId: string | null;
}

/**
 * `create <type> <id> [params…] [in <containerId>]`
 *
 * The `in` clause is only recognised when the keyword itself is unquoted,
 * so text content such as `"in"` stays content.
 */
export class CreateCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private container: GroupShape | null = null;
  private createdMessage = '';

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    if (this.args.length < 2) {
      throw new EditorError('usage: create <type> <id> [params…] [in <containerId>]');
    }
    const typeName = this.args[0].value;
    const id = this.args[1].value;
    if (!this.session.shapeFactory.isKnownType(typeName)) {
      throw new EditorError(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    }
    if (this.document.isIdTaken(id)) {
      throw new EditorError(`id already exists: ${id}`);
    }
    const clause = CreateCommand.splitClause(this.args.slice(2));
    const shape = this.session.shapeFactory.create(
      typeName,
      id,
      clause.params.map((token) => token.value),
    );
    const container = this.resolveContainer(clause.containerId);
    this.document.attach(shape, container, container.childCount);
    this.shape = shape;
    this.container = container;
    const where = container === this.document.root ? '' : ` in ${container.label()}`;
    this.createdMessage = `${shape.label()} created${where}`;
    return CommandResult.ok(this.createdMessage);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    this.document.detach(shape);
    return CommandResult.ok(`${shape.label()} removed`);
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    const container = this.container ?? this.document.root;
    this.document.attach(shape, container, container.childCount);
    return CommandResult.ok(this.createdMessage);
  }

  private resolveContainer(containerId: string | null): GroupShape {
    if (containerId === null) {
      return this.document.root;
    }
    const target = this.document.find(containerId);
    if (target === undefined) {
      throw new EditorError(`no such container: ${containerId}`);
    }
    if (!(target instanceof GroupShape)) {
      throw new EditorError(`not a container: ${containerId}`);
    }
    return target;
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: create command was not executed');
    }
    return this.shape;
  }

  private static splitClause(tail: readonly Token[]): CreateClause {
    if (tail.length >= 2) {
      const keyword = tail[tail.length - 2];
      if (keyword.isKeyword('in')) {
        return {
          params: tail.slice(0, tail.length - 2),
          containerId: tail[tail.length - 1].value,
        };
      }
    }
    return { params: tail, containerId: null };
  }
}
