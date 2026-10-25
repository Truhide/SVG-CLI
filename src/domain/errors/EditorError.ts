/**
 * An expected, user facing failure.
 *
 * Commands and the document model throw this for anything the user can fix
 * (bad id, bad number, missing file, ...).  The CLI turns the message into a
 * line prefixed with `error: ` and keeps the document untouched, so every
 * throw has to happen *before* the first mutation of a command.
 */
export class EditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorError';
  }
}
