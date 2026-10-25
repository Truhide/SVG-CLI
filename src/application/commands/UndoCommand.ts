import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { SessionCommand } from './SessionCommand';

/** `undo` - reverts the last editing command. */
export class UndoCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(0, 'undo');
    return this.session.undo();
  }
}
