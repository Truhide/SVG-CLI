import { EditorError } from '../../domain/errors/EditorError';
import type { Placement } from '../../domain/Document';
import { GroupShape } from '../../domain/GroupShape';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `addto <gid> <id>` - move an existing shape into a container (last child). */
export class AddToCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private container: GroupShape | null = null;
  private placement: Placement | null = null;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    const usage = 'addto <gid> <id>';
    this.requireArgCount(2, usage);
    const containerId = this.stringArg(0, usage);
    const id = this.stringArg(1, usage);
    const container = this.document.require(containerId);
    if (!(container instanceof GroupShape)) {
      throw new EditorError(`not a container: ${containerId}`);
    }
    const shape = this.document.require(id);
    if (shape === container) {
      throw new EditorError(`cannot move a container into its own descendant: ${id}`);
    }
    if (shape.isContainer && this.document.isAncestor(shape, container)) {
      throw new EditorError(`cannot move a container into its own descendant: ${id}`);
    }
    this.placement = this.document.detach(shape);
    this.document.attach(shape, container, container.childCount);
    this.shape = shape;
    this.container = container;
    return CommandResult.ok(`${shape.label()} moved into ${container.label()}`);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    const placement = this.requirePlacement();
    this.document.detach(shape);
    this.document.attach(shape, placement.parent, placement.index);
    return CommandResult.ok(`${shape.label()} moved back into ${placement.parent.label()}`);
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    const container = this.container ?? this.document.root;
    this.document.detach(shape);
    this.document.attach(shape, container, container.childCount);
    return CommandResult.ok(`${shape.label()} moved into ${container.label()}`);
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: addto command was not executed');
    }
    return this.shape;
  }

  private requirePlacement(): Placement {
    if (this.placement === null) {
      throw new EditorError('internal: addto command was not executed');
    }
    return this.placement;
  }
}
