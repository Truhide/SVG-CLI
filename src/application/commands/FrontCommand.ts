import { EditorError } from '../../domain/errors/EditorError';
import type { GroupShape } from '../../domain/GroupShape';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `front <id>` - raise to the end of its sibling list (top of the z-order). */
export class FrontCommand extends EditSessionCommand {
  private shape: Shape | null = null;
  private parent: GroupShape | null = null;
  private previousIndex = 0;

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    const usage = 'front <id>';
    this.requireArgCount(1, usage);
    const shape = this.document.require(this.stringArg(0, usage));
    const parent = this.document.parentOf(shape);
    this.previousIndex = parent.indexOf(shape);
    this.document.detach(shape);
    this.document.attach(shape, parent, parent.childCount);
    this.shape = shape;
    this.parent = parent;
    return CommandResult.ok(`${shape.label()} moved to front`);
  }

  override undo(): CommandResult {
    const shape = this.requireShape();
    const parent = this.requireParent();
    this.document.detach(shape);
    this.document.attach(shape, parent, this.previousIndex);
    return CommandResult.ok(`${shape.label()} moved back`);
  }

  override redo(): CommandResult {
    const shape = this.requireShape();
    const parent = this.requireParent();
    this.document.detach(shape);
    this.document.attach(shape, parent, parent.childCount);
    return CommandResult.ok(`${shape.label()} moved to front`);
  }

  private requireShape(): Shape {
    if (this.shape === null) {
      throw new EditorError('internal: front command was not executed');
    }
    return this.shape;
  }

  private requireParent(): GroupShape {
    if (this.parent === null) {
      throw new EditorError('internal: front command was not executed');
    }
    return this.parent;
  }
}
