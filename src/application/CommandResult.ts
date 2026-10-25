/** What a command asks the session to do with the undo history. */
export type SessionEffect = 'none' | 'reset-history' | 'lock-history';

/**
 * Output of one command plus its effect on the session.
 *
 * Commands never print and never touch the history directly: they describe
 * what happened (`lines`) and what should happen to the undo policy
 * (`effect`), which keeps them testable and channel independent.
 */
export class CommandResult {
  private constructor(
    readonly lines: string[],
    readonly effect: SessionEffect,
  ) {}

  static ok(...lines: string[]): CommandResult {
    return new CommandResult(lines, 'none');
  }

  static resetHistory(...lines: string[]): CommandResult {
    return new CommandResult(lines, 'reset-history');
  }

  static lockHistory(...lines: string[]): CommandResult {
    return new CommandResult(lines, 'lock-history');
  }
}
