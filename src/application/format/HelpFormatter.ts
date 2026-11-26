import type { CommandRegistry } from '../extension/CommandRegistry';
import type { HelpGroup } from '../extension/CommandSpec';
import type { ShapeRegistry } from '../extension/ShapeRegistry';

const GROUP_TITLES: ReadonlyArray<readonly [HelpGroup, string]> = [
  ['document', 'document (undo/redo is disabled after these commands)'],
  ['editing', 'editing (one command = one undo unit)'],
  ['inspection', 'inspection'],
  ['history', 'history'],
];

/**
 * The `help` text, assembled from the command registry.
 *
 * Phase 1 kept a fixed string array; the moment a plugin owns a command that
 * string would have to change, which is exactly what the refactor avoids.
 * Each spec contributes its own lines (and `create` contributes one line per
 * registered shape), so the built-in-only output stays identical.
 */
export class HelpFormatter {
  private constructor() {
    // static renderer only
  }

  static format(commands: CommandRegistry, shapes: ShapeRegistry): string[] {
    const lines: string[] = [
      'svg-editor 0.1 - commands',
      '',
      "lines starting with '#' are comments; use double quotes for values with spaces",
      '',
    ];
    const context = { shapes };
    for (const [group, title] of GROUP_TITLES) {
      const entries = commands.entries().filter((spec) => spec.help.group === group);
      if (entries.length === 0) {
        continue;
      }
      lines.push(title);
      for (const spec of entries) {
        lines.push(...spec.help.lines(context));
      }
      lines.push('');
    }
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  }
}
