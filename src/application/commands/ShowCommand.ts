import { CommandResult } from '../CommandResult';
import { ShowFormatter } from '../format/ShowFormatter';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { SessionCommand } from './SessionCommand';

/** `show <id>` - attribute details of one shape. */
export class ShowCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(1, 'show <id>');
    const shape = this.document.require(this.stringArg(0, 'show <id>'));
    return CommandResult.ok(...ShowFormatter.format(shape));
  }
}
