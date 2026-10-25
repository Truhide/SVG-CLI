import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `scale <id> <factor>` - multiplies every geometry attribute by `factor`. */
export class ScaleCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private factor = 1;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(2, 'scale <id> <factor>');
    const factor = this.numberArg(1, 'scale <id> <factor>');
    if (factor <= 0) {
      throw new EditorError('scale factor must be positive');
    }
    const shape = this.document.require(this.stringArg(0, 'scale <id> <factor>'));
    shape.scale(factor);
    this.shape = shape;
    this.factor = factor;
    return CommandResult.ok(`${shape.label()} scaled by ${Numbers.format(factor)}`);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    shape.scale(1 / this.factor);
    return CommandResult.ok(`${shape.label()} scaled back by ${Numbers.format(1 / this.factor)}`);
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    shape.scale(this.factor);
    return CommandResult.ok(`${shape.label()} scaled by ${Numbers.format(this.factor)}`);
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: scale command was not executed');
    }
    return this.shape;
  }
}
