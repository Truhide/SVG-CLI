import { Command } from '../../src/application/Command';
import { CommandResult } from '../../src/application/CommandResult';
import type { EditorSession } from '../../src/application/EditorSession';
import type { Token } from '../../src/application/Token';
import type { Shape } from '../../src/domain/Shape';

interface Tally {
  readonly types: Map<string, number>;
  leaves: number;
  containers: number;
}

/** `stats` - leaf counts by type, in first-appearance order. */
export class StatsCommand extends Command {
  constructor(
    private readonly session: EditorSession,
    private readonly args: readonly Token[],
  ) {
    super();
  }

  override execute(): CommandResult {
    if (this.args.length > 0) {
      throw new Error('usage: stats');
    }
    const document = this.session.requireDocument();
    const tally: Tally = { types: new Map(), leaves: 0, containers: 0 };
    for (const child of document.root.children) {
      StatsCommand.count(child, tally);
    }
    const parts = [...tally.types.entries()].map(([type, count]) => `${type}: ${count}`);
    const summary = `(total ${tally.leaves}, containers ${tally.containers})`;
    return CommandResult.ok(
      parts.length === 0 ? summary : `${parts.join('  ')}  ${summary}`,
    );
  }

  private static count(shape: Shape, tally: Tally): void {
    if (shape.isContainer) {
      tally.containers += 1;
      for (const child of shape.children) {
        StatsCommand.count(child, tally);
      }
      return;
    }
    tally.leaves += 1;
    tally.types.set(shape.kind, (tally.types.get(shape.kind) ?? 0) + 1);
  }
}
