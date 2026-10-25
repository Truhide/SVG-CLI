import { EditorError } from '../../domain/errors/EditorError';
import { Command } from '../Command';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

/** `read <file.svg>` - load a document, assigning ids where they are missing. */
export class ReadCommand extends Command {
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
    if (this.args.length !== 1) {
      throw new EditorError('usage: read <file.svg>');
    }
    const path = this.args[0].value;
    const xml = this.session.files.read(path);
    const decoded = this.session.codec.decode(xml);
    this.session.replaceDocument(decoded.document, path);
    return CommandResult.resetHistory(
      ...decoded.warnings,
      `read ${path} (${decoded.document.count()} elements)`,
    );
  }
}
