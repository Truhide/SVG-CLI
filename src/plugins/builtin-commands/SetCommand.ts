import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../../application/CommandResult';
import type { AttributeEdit, AttributeHandler } from '../../application/extension/AttributeHandler';
import type { EditorSession } from '../../application/EditorSession';
import type { Token } from '../../application/Token';
import { EditSessionCommand } from './EditSessionCommand';

/**
 * `set <id> <attr> <value>` - attribute update.
 *
 * Order of resolution (see the ADR on the attribute contract):
 * 1. a registered `AttributeHandler` that claims the (shape, attribute) pair;
 * 2. otherwise the Phase 1 whitelist (`fill`, `stroke`, geometry, `text`).
 *
 * A handler path is exactly one undo unit: the handler returns a single
 * reversible edit, the command applies it and keeps it for `undo`/`redo`.  If
 * the edit throws half way, the command reverts it and rethrows, so neither
 * the document nor the history changes.
 */
export class SetCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private attribute = '';
  private value = '';
  private previous: string | null = null;
  private edit: AttributeEdit | null = null;
  private handler: AttributeHandler | null = null;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    if (this.args.length < 3) {
      throw new EditorError('usage: set <id> <attr> <value>');
    }
    const id = this.stringArg(0, 'set <id> <attr> <value>');
    const attribute = this.stringArg(1, 'set <id> <attr> <value>');
    const value = this.args
      .slice(2)
      .map((token) => token.value)
      .join(' ');
    const shape = this.document.require(id);

    const handlers = this.session.attributes.matching(shape, attribute);
    if (handlers.length > 1) {
      const names = handlers.map((handler) => handler.name).join(', ');
      throw new EditorError(`ambiguous attribute handler: ${attribute} (${names})`);
    }
    if (handlers.length === 1) {
      const edit = handlers[0].createEdit(shape, attribute, value);
      try {
        edit.apply();
      } catch (error) {
        SetCommand.revertQuietly(edit);
        throw error;
      }
      this.shape = shape;
      this.attribute = attribute;
      this.value = value;
      this.edit = edit;
      this.handler = handlers[0];
      return CommandResult.ok(
        `${shape.label()} updated: ${SetCommand.describe(attribute, value)}`,
      );
    }

    const previous = shape.readAttribute(attribute);
    shape.setAttribute(attribute, value);
    this.shape = shape;
    this.attribute = attribute;
    this.value = value;
    this.previous = previous;
    return CommandResult.ok(`${shape.label()} updated: ${SetCommand.describe(attribute, value)}`);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    if (this.edit !== null) {
      this.edit.revert();
      const restored = this.handler?.read(shape, this.attribute) ?? null;
      return CommandResult.ok(
        `${shape.label()} updated: ${SetCommand.describe(this.attribute, restored)}`,
      );
    }
    if (this.previous === null) {
      shape.removeAttribute(this.attribute);
    } else {
      shape.setAttribute(this.attribute, this.previous);
    }
    return CommandResult.ok(
      `${shape.label()} updated: ${SetCommand.describe(this.attribute, this.previous)}`,
    );
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    if (this.edit !== null) {
      this.edit.apply();
    } else {
      shape.setAttribute(this.attribute, this.value);
    }
    return CommandResult.ok(
      `${shape.label()} updated: ${SetCommand.describe(this.attribute, this.value)}`,
    );
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: set command was not executed');
    }
    return this.shape;
  }

  private static revertQuietly(edit: AttributeEdit): void {
    try {
      edit.revert();
    } catch {
      // The original failure is the one worth reporting; a rollback that
      // throws would otherwise hide it.
    }
  }

  private static describe(attribute: string, value: string | null): string {
    if (value === null) {
      return `${attribute} (removed)`;
    }
    return attribute === 'text' || attribute === 'label'
      ? `${attribute}="${value}"`
      : `${attribute}=${value}`;
  }
}
