import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `move <id> <dx> <dy>` - relative translation, containers move their subtree. */
export class MoveCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private dx = 0;
  private dy = 0;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(3, 'move <id> <dx> <dy>');
    const dx = this.numberArg(1, 'move <id> <dx> <dy>');
    const dy = this.numberArg(2, 'move <id> <dx> <dy>');
    const shape = this.document.require(this.stringArg(0, 'move <id> <dx> <dy>'));
    shape.move(dx, dy);
    this.shape = shape;
    this.dx = dx;
    this.dy = dy;
    return CommandResult.ok(shape.moveFeedback('moved', dx, dy));
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    shape.move(-this.dx, -this.dy);
    return CommandResult.ok(shape.moveFeedback('moved back', -this.dx, -this.dy));
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    shape.move(this.dx, this.dy);
    return CommandResult.ok(shape.moveFeedback('moved', this.dx, this.dy));
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: move command was not executed');
    }
    return this.shape;
  }
}
