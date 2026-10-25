import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `set <id> <attr> <value>` - whitelisted attribute update. */
export class SetCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private attribute = '';
  private value = '';
  private previous: string | null = null;

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
    const previous = shape.readAttribute(attribute);
    shape.setAttribute(attribute, value);
    this.shape = shape;
    this.attribute = attribute;
    this.value = value;
    this.previous = previous;
    return CommandResult.ok(
      `${shape.label()} updated: ${SetCommand.describe(attribute, value)}`,
    );
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
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
    shape.setAttribute(this.attribute, this.value);
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

  private static describe(attribute: string, value: string | null): string {
    if (value === null) {
      return `${attribute} (removed)`;
    }
    return attribute === 'text' ? `${attribute}="${value}"` : `${attribute}=${value}`;
  }
}
