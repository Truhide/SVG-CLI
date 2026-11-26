import { EditorError } from '../../domain/errors/EditorError';
import type { Command } from '../Command';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import type { CommandSpec } from './CommandSpec';

/**
 * Command-name to spec registry.
 *
 * The kernel version is deliberately empty: the 19 built-in commands are
 * registered by `src/plugins/builtin-commands`, `stats` and `dir` by their
 * own packages.  Nothing here depends on a concrete command.
 */
export class CommandRegistry {
  private readonly specs = new Map<string, CommandSpec>();
  private readonly listeners: Array<(name: string) => void> = [];

  register(spec: CommandSpec): void {
    if (this.specs.has(spec.name)) {
      throw new EditorError(`duplicate registration: commands/${spec.name}`);
    }
    this.specs.set(spec.name, spec);
    for (const listener of this.listeners) {
      listener(spec.name);
    }
  }

  /** Rollback hook used by the plugin loader; not part of the plugin API. */
  remove(name: string): void {
    this.specs.delete(name);
  }

  onRegister(listener: (name: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  create(name: string, session: EditorSession, args: readonly Token[]): Command | null {
    const spec = this.specs.get(name);
    return spec === undefined ? null : spec.create(session, args);
  }

  names(): string[] {
    return [...this.specs.keys()].sort();
  }

  /** Registration order, which is also the order used by `help`. */
  entries(): CommandSpec[] {
    return [...this.specs.values()];
  }
}
