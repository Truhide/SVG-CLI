import { EditorError } from '../../domain/errors/EditorError';
import { GroupShape } from '../../domain/GroupShape';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import { CountLabel } from '../format/CountLabel';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

interface GroupedChild {
  readonly shape: Shape;
  readonly parent: GroupShape;
  readonly index: number;
}

/** `group <newGid> <id1> <id2>…` - one undo unit that wraps existing shapes. */
export class GroupCommand extends EditSessionCommand {
  private group: GroupShape | null = null;
  private parent: GroupShape | null = null;
  private insertionIndex = 0;
  private placements: GroupedChild[] = [];

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    const usage = 'group <newGid> <id1> <id2> …';
    if (this.args.length < 2) {
      throw new EditorError(`usage: ${usage}`);
    }
    const newId = this.stringArg(0, usage);
    const ids = this.args.slice(1).map((token) => token.value);
    if (this.document.isIdTaken(newId)) {
      throw new EditorError(`id already exists: ${newId}`);
    }
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate !== undefined) {
      throw new EditorError(`duplicate shape in group: ${duplicate}`);
    }
    const shapes = ids.map((id) => this.document.require(id));
    this.assertNoAncestorConflict(shapes);

    const parent = this.document.parentOf(shapes[0]);
    const insertionIndex = parent.indexOf(shapes[0]);
    const placements = shapes.map((shape) => {
      const owner = this.document.parentOf(shape);
      return { shape, parent: owner, index: owner.indexOf(shape) };
    });

    for (const shape of shapes) {
      this.document.detach(shape);
    }
    const group = new GroupShape(newId);
    this.document.attach(group, parent, Math.min(insertionIndex, parent.childCount));
    for (const shape of shapes) {
      this.document.attach(shape, group, group.childCount);
    }

    this.group = group;
    this.parent = parent;
    this.insertionIndex = insertionIndex;
    this.placements = placements;
    return CommandResult.ok(`${group.label()} created with ${CountLabel.children(shapes.length)}`);
  }

  override undo(): CommandResult {
    const group = this.requireGroup();
    const children = [...group.children];
    for (const child of children) {
      this.document.detach(child);
    }
    this.document.detach(group);
    const ordered = [...this.placements].sort((left, right) => left.index - right.index);
    for (const child of ordered) {
      this.document.attach(
        child.shape,
        child.parent,
        Math.min(child.index, child.parent.childCount),
      );
    }
    return CommandResult.ok(`${group.label()} dissolved (${CountLabel.children(children.length)} restored)`);
  }

  override redo(): CommandResult {
    const group = this.requireGroup();
    const parent = this.parent ?? this.document.root;
    for (const child of this.placements) {
      this.document.detach(child.shape);
    }
    this.document.attach(group, parent, Math.min(this.insertionIndex, parent.childCount));
    for (const child of this.placements) {
      this.document.attach(child.shape, group, group.childCount);
    }
    return CommandResult.ok(
      `${group.label()} created with ${CountLabel.children(this.placements.length)}`,
    );
  }

  private assertNoAncestorConflict(shapes: readonly Shape[]): void {
    for (const candidate of shapes) {
      if (!candidate.isContainer) {
        continue;
      }
      const descendant = shapes.find(
        (other) => other !== candidate && this.document.isAncestor(candidate, other),
      );
      if (descendant !== undefined) {
        throw new EditorError(
          `cannot group a container into its own descendant: ${candidate.id}`,
        );
      }
    }
  }

  private requireGroup(): GroupShape {
    if (this.group === null) {
      throw new EditorError('internal: group command was not executed');
    }
    return this.group;
  }
}
