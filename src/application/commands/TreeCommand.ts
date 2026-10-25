import { CommandResult } from '../CommandResult';
import { TreeFormatter } from '../format/TreeFormatter';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { SessionCommand } from './SessionCommand';

/** `tree [id]` - structure with inline geometry, optionally a subtree. */
export class TreeCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    if (this.args.length === 0) {
      return CommandResult.ok(...TreeFormatter.formatDocument(this.document));
    }
    this.requireArgCount(1, 'tree [id]');
    const shape = this.document.require(this.stringArg(0, 'tree [id]'));
    return CommandResult.ok(...TreeFormatter.formatShape(shape));
  }
}
