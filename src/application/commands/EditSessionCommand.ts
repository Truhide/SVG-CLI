import type { CommandResult } from '../CommandResult';
import { SessionCommand } from './SessionCommand';

/**
 * An editing command: exactly one undo unit.
 *
 * The inverse is computed by the command itself (not by a document
 * snapshot), because the inverse knows the domain meaning of the operation
 * and can therefore report it ("restored into g#markers") instead of
 * silently swapping a saved copy.
 */
export abstract class EditSessionCommand extends SessionCommand {
  override get undoable(): boolean {
    return true;
  }

  abstract override undo(): CommandResult;

  abstract override redo(): CommandResult;
}
