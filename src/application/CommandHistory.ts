import { EditorError } from '../domain/errors/EditorError';
import type { Command } from './Command';

/**
 * Undo/redo stacks of editing commands.
 *
 * Policy lives here, not in the commands: one edit command is one unit, a
 * new edit clears the redo stack, and any document/IO command locks undo
 * until the next edit.
 */
export class CommandHistory {
  private readonly done: Command[] = [];
  private readonly undone: Command[] = [];
  private locked = false;

  push(command: Command): void {
    this.done.push(command);
    this.undone.length = 0;
    this.locked = false;
  }

  lock(): void {
    this.locked = true;
  }

  /**
   * Clears both stacks and locks undo: `init`/`read` are document commands,
   * so a following `undo` must answer "not allowed after io command" rather
   * than "nothing to undo".
   */
  reset(): void {
    this.done.length = 0;
    this.undone.length = 0;
    this.locked = true;
  }

  get canUndo(): boolean {
    return !this.locked && this.done.length > 0;
  }

  get canRedo(): boolean {
    return !this.locked && this.undone.length > 0;
  }

  peekUndo(): Command | null {
    this.assertUnlocked('undo');
    return this.done[this.done.length - 1] ?? null;
  }

  commitUndo(): void {
    const command = this.done.pop();
    if (command !== undefined) {
      this.undone.push(command);
    }
  }

  peekRedo(): Command | null {
    this.assertUnlocked('redo');
    return this.undone[this.undone.length - 1] ?? null;
  }

  commitRedo(): void {
    const command = this.undone.pop();
    if (command !== undefined) {
      this.done.push(command);
    }
  }

  private assertUnlocked(action: 'undo' | 'redo'): void {
    if (this.locked) {
      throw new EditorError(`${action} not allowed after io command`);
    }
  }
}
