import { EditorError } from '../../domain/errors/EditorError';
import { GroupShape } from '../../domain/GroupShape';
import type { Shape } from '../../domain/Shape';
import { CommandResult } from '../CommandResult';
import { CountLabel } from '../format/CountLabel';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';
import { EditSessionCommand } from './EditSessionCommand';

/** `ungroup <gid>` - children take the group's place in its parent. */
export class UngroupCommand extends EditSessionCommand {
  private group: GroupShape | null = null;
  private parent: GroupShape | null = null;
  private index = 0;
  private children: Shape[] = [];

  constructor(session: EditorSession, args: readonly Token[]) {
    super(session, args);
  }

  override execute(): CommandResult {
    this.requireArgCount(1, 'ungroup <gid>');
    const id = this.stringArg(0, 'ungroup <gid>');
    const group = this.document.require(id);
    if (!(group instanceof GroupShape)) {
      throw new EditorError(`not a container: ${id}`);
    }
    const parent = group.parent;
    if (parent === null) {
      throw new EditorError(`cannot ungroup top-level container: ${id}`);
    }
    if (parent === this.document.root) {
      throw new EditorError(`cannot ungroup top-level container: ${id}`);
    }
    const index = parent.indexOf(group);
    const children = [...group.children];
    children.forEach((child, offset) => {
      this.document.detach(child);
      this.document.attach(child, parent, index + offset);
    });
    this.document.detach(group);

    this.group = group;
    this.parent = parent;
    this.index = index;
    this.children = children;
    return CommandResult.ok(`${group.label()} ungrouped (${CountLabel.children(children.length)})`);
  }

  override undo(): CommandResult {
    const group = this.requireGroup();
    const parent = this.parent ?? this.document.root;
    for (const child of this.children) {
      this.document.detach(child);
    }
    this.document.attach(group, parent, this.index);
    for (const child of this.children) {
      this.document.attach(child, group, group.childCount);
    }
    return CommandResult.ok(`${group.label()} regrouped (${CountLabel.children(this.children.length)})`);
  }

  override redo(): CommandResult {
    const group = this.requireGroup();
    const parent = this.parent ?? this.document.root;
    const children = [...group.children];
    children.forEach((child, offset) => {
      this.document.detach(child);
      this.document.attach(child, parent, this.index + offset);
    });
    this.document.detach(group);
    return CommandResult.ok(`${group.label()} ungrouped (${CountLabel.children(children.length)})`);
  }

  private requireGroup(): GroupShape {
    if (this.group === null) {
      throw new EditorError('internal: ungroup command was not executed');
    }
    return this.group;
  }
}
