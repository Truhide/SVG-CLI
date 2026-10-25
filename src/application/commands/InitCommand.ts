import { Document } from '../../domain/Document';
import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';
import { Command } from '../Command';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

/** `init [w] [h]` - replace the current document with an empty canvas. */
export class InitCommand extends Command {
  constructor(
    private readonly session: EditorSession,
    private readonly args: readonly Token[],
  ) {
    super();
  }

  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    if (this.args.length > 2) {
      throw new EditorError('usage: init [w] [h]');
    }
    const width = this.args[0] === undefined ? 800 : Numbers.parse(this.args[0].value);
    const height = this.args[1] === undefined ? 600 : Numbers.parse(this.args[1].value);
    if (width <= 0 || height <= 0) {
      throw new EditorError('canvas size must be positive');
    }
    this.session.replaceDocument(new Document(width, height), null);
    return CommandResult.resetHistory(
      `canvas ${Numbers.format(width)}x${Numbers.format(height)} created`,
    );
  }
}
