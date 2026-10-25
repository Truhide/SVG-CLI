import { EditorError } from '../../domain/errors/EditorError';
import type { Placement } from '../../domain/Document';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `delete <id>` - removes a shape; for a container, the whole subtree. */
export class DeleteCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private placement: Placement | null = null;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(1, 'delete <id>');
    const shape = this.document.require(this.stringArg(0, 'delete <id>'));
    this.placement = this.document.detach(shape);
    this.shape = shape;
    return CommandResult.ok(`${shape.label()} deleted`);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    const placement = this.requirePlacement();
    this.document.attach(shape, placement.parent, placement.index);
    return CommandResult.ok(`${shape.label()} restored into ${placement.parent.label()}`);
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    this.document.detach(shape);
    return CommandResult.ok(`${shape.label()} deleted`);
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: delete command was not executed');
    }
    return this.shape;
  }

  private requirePlacement(): Placement {
    if (this.placement === null) {
      throw new EditorError('internal: delete command was not executed');
    }
    return this.placement;
  }
}
