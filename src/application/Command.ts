import { EditorError } from '../domain/errors/EditorError';
import { CommandResult } from './CommandResult';

/**
 * Command pattern root: a user request captured as an object.
 *
 * `undoable` is what the session uses to decide whether the command becomes
 * an undo unit; editing commands set it to true and implement the inverse
 * operation (see {@link EditSessionCommand}).
 */
export abstract class Command {
  /** False only for `init`/`read`, which bootstrap the document. */
  get requiresDocument(): boolean {
    return true;
  }

  get undoable(): boolean {
    return false;
  }

  abstract execute(): CommandResult;

  undo(): CommandResult {
    throw new EditorError('internal: command cannot be undone');
  }

  redo(): CommandResult {
    throw new EditorError('internal: command cannot be redone');
  }
}
