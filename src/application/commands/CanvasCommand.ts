import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { SessionCommand } from './SessionCommand';

/** `canvas [w] [h]` - inspect or change the canvas size. */
export class CanvasCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    const document = this.document;
    if (this.args.length === 0) {
      return CommandResult.ok(
        `canvas ${Numbers.format(document.width)}x${Numbers.format(document.height)}`,
      );
    }
    if (this.args.length !== 2) {
      throw new EditorError('usage: canvas [w] [h]');
    }
    const width = this.numberArg(0, 'canvas [w] [h]');
    const height = this.numberArg(1, 'canvas [w] [h]');
    if (width <= 0 || height <= 0) {
      throw new EditorError('canvas size must be positive');
    }
    document.resize(width, height);
    return CommandResult.lockHistory(
      `canvas ${Numbers.format(width)}x${Numbers.format(height)} updated`,
    );
  }
}
