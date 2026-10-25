import type { Document } from '../../domain/Document';
import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';
import { Command } from '../Command';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

/**
 * Base of every REPL command: keeps the session, the tokens and the small
 * argument helpers next to each other, so individual commands stay short.
 */
export abstract class SessionCommand extends Command {
  protected constructor(
    protected readonly session: EditorSession,
    protected readonly args: readonly Token[],
  ) {
    super();
  }

  /** The session has already rejected commands that need a missing document. */
  protected get document(): Document {
    return this.session.requireDocument();
  }

  protected requireArgCount(count: number, usage: string): void {
    if (this.args.length !== count) {
      throw new EditorError(`usage: ${usage}`);
    }
  }

  protected numberArg(index: number, usage: string): number {
    const token = this.args[index];
    if (token === undefined) {
      throw new EditorError(`usage: ${usage}`);
    }
    return Numbers.parse(token.value);
  }

  protected stringArg(index: number, usage: string): string {
    const token = this.args[index];
    if (token === undefined) {
      throw new EditorError(`usage: ${usage}`);
    }
    return token.value;
  }
}
