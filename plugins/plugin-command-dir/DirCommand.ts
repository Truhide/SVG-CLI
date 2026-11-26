import { Command } from '../../src/application/Command';
import { CommandResult } from '../../src/application/CommandResult';
import type { DirectoryEntry, DirectoryLister } from '../../src/application/ports/DirectoryLister';
import type { Token } from '../../src/application/Token';

/** Directories first, then the rest, each group by name ascending. */
function order(left: DirectoryEntry, right: DirectoryEntry): number {
  const leftRank = left.kind === 'dir' ? 0 : 1;
  const rightRank = right.kind === 'dir' ? 0 : 1;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  if (left.name < right.name) {
    return -1;
  }
  return left.name > right.name ? 1 : 0;
}

function line(entry: DirectoryEntry): string {
  if (entry.kind === 'dir') {
    return `[DIR]  ${entry.name}`;
  }
  if (entry.kind === 'link') {
    return `[LINK]  ${entry.name}${entry.target === undefined ? '' : ` -> ${entry.target}`}`;
  }
  return `[FILE]  ${entry.name}`;
}

/**
 * `dir` - the direct children of the process working directory.
 *
 * The command talks to the {@link DirectoryLister} port only, which is the
 * adapter pattern in one line: swapping the Node adapter for a test double
 * changes nothing here.
 */
export class DirCommand extends Command {
  constructor(
    private readonly lister: DirectoryLister,
    private readonly cwd: () => string,
    private readonly args: readonly Token[],
  ) {
    super();
  }

  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    if (this.args.length > 0) {
      throw new Error('usage: dir');
    }
    const path = this.cwd();
    const entries = this.lister.list(path);
    if (entries.length === 0) {
      return CommandResult.ok('(empty directory)');
    }
    return CommandResult.ok(...[...entries].sort(order).map(line));
  }
}
