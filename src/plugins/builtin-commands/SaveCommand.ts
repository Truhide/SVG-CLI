import { EditorError } from '../../domain/errors/EditorError';
import { Command } from '../../application/Command';
import { CommandResult } from '../../application/CommandResult';
import type { EditorSession } from '../../application/EditorSession';
import type { Token } from '../../application/Token';

/** `save [file.svg]` - serialise the document; defaults to the last read path. */
export class SaveCommand extends Command {
  constructor(
    private readonly session: EditorSession,
    private readonly args: readonly Token[],
  ) {
    super();
  }

  override execute(): CommandResult {
    if (this.args.length > 1) {
      throw new EditorError('usage: save [file.svg]');
    }
    const document = this.session.requireDocument();
    const path = this.args[0]?.value ?? this.session.currentPath;
    if (path === null) {
      throw new EditorError("no file path: use 'save <file.svg>'");
    }
    const contents = this.session.codec.encode(document);
    this.session.files.write(path, contents);
    this.session.rememberPath(path);
    this.session.markSaved();
    return CommandResult.lockHistory(`saved to ${path} (${document.count()} elements)`);
  }
}
