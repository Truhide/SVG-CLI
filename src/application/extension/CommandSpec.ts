import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import type { Command } from '../Command';
import type { ShapeRegistry } from './ShapeRegistry';

/** Help sections, in the order they are printed. */
export type HelpGroup = 'document' | 'editing' | 'inspection' | 'history';

export interface HelpContext {
  readonly shapes: ShapeRegistry;
}

export interface HelpEntry {
  readonly group: HelpGroup;
  /** Rendered lines, already indented like the rest of `help`. */
  lines(context: HelpContext): string[];
}

/**
 * Extension point 2/4: one command.
 *
 * The spec owns the name, the help text and the factory; the kernel only
 * stores it and hands the session over when the user types the name.  A
 * plugin therefore never edits the built-in command table.
 */
export interface CommandSpec {
  readonly name: string;
  readonly help: HelpEntry;
  create(session: EditorSession, args: readonly Token[]): Command;
}
