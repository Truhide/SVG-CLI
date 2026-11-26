import { EditorError } from '../../domain/errors/EditorError';

/** One rendered row of the structure tree, as seen by a decorator. */
export interface TreeRow {
  readonly id: string;
  /** `rect#r1` / `svg` / `g#n1`. */
  readonly label: string;
  /** Registry key of the shape (`rect`, `g`, `box`, …). */
  readonly kind: string;
  /** Inline geometry + style, may be empty for containers. */
  readonly summary: string;
  readonly isRoot: boolean;
  readonly isContainer: boolean;
  /**
   * Fingerprint of this row's whole subtree.  Two renders of unchanged
   * content produce the same string, so a decorator can implement
   * "unsaved changes" without touching the document.
   */
  readonly fingerprint: string;
}

/**
 * Extension point 3/4: a label appended to a tree row.
 *
 * Decorators are pure queries: they receive the row, return a suffix (or
 * `null`) and never mutate the document.  Adding one changes neither the
 * renderer nor the kernel.
 */
export interface TreeDecorator {
  readonly name: string;
  decorate(row: TreeRow): string | null;
}

export class TreeDecoratorRegistry {
  private readonly decorators = new Map<string, TreeDecorator>();
  private readonly listeners: Array<(name: string) => void> = [];

  register(decorator: TreeDecorator): void {
    if (this.decorators.has(decorator.name)) {
      throw new EditorError(`duplicate registration: decorators/${decorator.name}`);
    }
    this.decorators.set(decorator.name, decorator);
    for (const listener of this.listeners) {
      listener(decorator.name);
    }
  }

  remove(name: string): void {
    this.decorators.delete(name);
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

  names(): string[] {
    return [...this.decorators.keys()];
  }

  /** Registration order decides the concatenation order of the labels. */
  list(): TreeDecorator[] {
    return [...this.decorators.values()];
  }
}
