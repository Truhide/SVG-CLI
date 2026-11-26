import { Command } from '../../application/Command';
import { CommandResult } from '../../application/CommandResult';
import { HelpFormatter } from '../../application/format/HelpFormatter';
import type { EditorSession } from '../../application/EditorSession';
import type { Token } from '../../application/Token';

/**
 * `help` - list every registered command; usable before a document exists.
 *
 * The text is assembled from the command registry, so a plugin that adds a
 * command also adds its own help line without touching this class.
 */
export class HelpCommand extends Command {
  constructor(
    private readonly session: EditorSession,
    _args: readonly Token[],
  ) {
    super();
  }

  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok(
      ...HelpFormatter.format(this.session.commands, this.session.shapes),
    );
  }
}
