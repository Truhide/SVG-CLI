import { CommandResult } from '../../application/CommandResult';
import { TreeFormatter } from '../../application/format/TreeFormatter';
import type { EditorSession } from '../../application/EditorSession';
import type { Token } from '../../application/Token';
import { SessionCommand } from './SessionCommand';

/**
 * `tree [id]` - structure with inline geometry, optionally a subtree.
 *
 * The decorators come from the session, so a plugin can add row labels
 * without changing this command or the renderer.
 */
export class TreeCommand extends SessionCommand {
  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    const decorators = this.session.decorators.list();
    if (this.args.length === 0) {
      return CommandResult.ok(...TreeFormatter.formatDocument(this.document, decorators));
    }
    this.requireArgCount(1, 'tree [id]');
    const shape = this.document.require(this.stringArg(0, 'tree [id]'));
    return CommandResult.ok(...TreeFormatter.formatShape(shape, decorators));
  }
}
