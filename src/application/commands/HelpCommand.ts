import { Command } from '../Command';
import { CommandResult } from '../CommandResult';
import { HelpText } from '../HelpText';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

/** `help` - list every command; usable before a document exists. */
export class HelpCommand extends Command {
  constructor(
    _session: EditorSession,
    _args: readonly Token[],
  ) {
    super();
  }

  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok(...HelpText.lines());
  }
}
