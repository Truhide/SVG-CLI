import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';

/**
 * One reversible change of an attribute.
 *
 * `apply` and `revert` must be symmetric: whatever `apply` changed,
 * `revert` restores exactly.  A composite edit that touches several
 * sub-shapes therefore still counts as one unit for `undo`/`redo`.
 */
export interface AttributeEdit {
  apply(): void;
  revert(): void;
}

/**
 * Extension point 4/4: domain semantics of `set <id> <attr> <value>`.
 *
 * A handler answers "do I own this (shape, attribute) pair?" and produces a
 * reversible edit.  The kernel `set` never learns `box`-specific rules: no
 * branch for `label`, no widening of the attribute whitelist.
 */
export interface AttributeHandler {
  readonly name: string;

  /** Must not modify the document. */
  handles(shape: Shape, attr: string): boolean;

  /** Current value of the attribute as the handler sees it, or 
ull. */
  read(shape: Shape, attr: string): string | null;

  /** Build (but do not apply) the edit; may throw to reject the value. */
  createEdit(shape: Shape, attr: string, value: string): AttributeEdit;
}

export class AttributeHandlerRegistry {
  private readonly handlers = new Map<string, AttributeHandler>();
  private readonly listeners: Array<(name: string) => void> = [];

  register(handler: AttributeHandler): void {
    if (this.handlers.has(handler.name)) {
      throw new EditorError(`duplicate registration: attributes/${handler.name}`);
    }
    this.handlers.set(handler.name, handler);
    for (const listener of this.listeners) {
      listener(handler.name);
    }
  }

  remove(name: string): void {
    this.handlers.delete(name);
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
    return [...this.handlers.keys()];
  }

  /** Every handler that claims the pair, in registration order. */
  matching(shape: Shape, attr: string): AttributeHandler[] {
    return [...this.handlers.values()].filter((handler) => handler.handles(shape, attr));
  }
}
