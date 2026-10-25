import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { SessionCommand } from './SessionCommand';

/** `redo` - reapplies the last undone command. */
export class RedoCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(0, 'redo');
    return this.session.redo();
  }
}
