import type { Command } from './Command';
import { AddToCommand } from './commands/AddToCommand';
import { BackCommand } from './commands/BackCommand';
import { CanvasCommand } from './commands/CanvasCommand';
import { CreateCommand } from './commands/CreateCommand';
import { DeleteCommand } from './commands/DeleteCommand';
import { FrontCommand } from './commands/FrontCommand';
import { GroupCommand } from './commands/GroupCommand';
import { HelpCommand } from './commands/HelpCommand';
import { InitCommand } from './commands/InitCommand';
import { MoveCommand } from './commands/MoveCommand';
import { ReadCommand } from './commands/ReadCommand';
import { RedoCommand } from './commands/RedoCommand';
import { SaveCommand } from './commands/SaveCommand';
import { ScaleCommand } from './commands/ScaleCommand';
import { SetCommand } from './commands/SetCommand';
import { ShowCommand } from './commands/ShowCommand';
import { TreeCommand } from './commands/TreeCommand';
import { UndoCommand } from './commands/UndoCommand';
import { UngroupCommand } from './commands/UngroupCommand';
import type { EditorSession } from './EditorSession';
import type { Token } from './Token';

export type CommandFactory = (session: EditorSession, args: readonly Token[]) => Command;

/**
 * Command-name to implementation registry - the other sanctioned name
 * dispatch (the first one is {@link ShapeFactory}).
 *
 * TODO(refactor): replace the fixed `register` calls with a command
 * provider registry so that scripted/agent channels can add commands
 * (e.g. `export png`) without editing the REPL kernel.
 */
export class CommandRegistry {
  private readonly factories = new Map<string, CommandFactory>();

  constructor() {
    this.register('init', (session, args) => new InitCommand(session, args));
    this.register('read', (session, args) => new ReadCommand(session, args));
    this.register('save', (session, args) => new SaveCommand(session, args));
    this.register('canvas', (session, args) => new CanvasCommand(session, args));
    this.register('create', (session, args) => new CreateCommand(session, args));
    this.register('delete', (session, args) => new DeleteCommand(session, args));
    this.register('move', (session, args) => new MoveCommand(session, args));
    this.register('scale', (session, args) => new ScaleCommand(session, args));
    this.register('set', (session, args) => new SetCommand(session, args));
    this.register('group', (session, args) => new GroupCommand(session, args));
    this.register('ungroup', (session, args) => new UngroupCommand(session, args));
    this.register('addto', (session, args) => new AddToCommand(session, args));
    this.register('front', (session, args) => new FrontCommand(session, args));
    this.register('back', (session, args) => new BackCommand(session, args));
    this.register('tree', (session, args) => new TreeCommand(session, args));
    this.register('show', (session, args) => new ShowCommand(session, args));
    this.register('help', (session, args) => new HelpCommand(session, args));
    this.register('undo', (session, args) => new UndoCommand(session, args));
    this.register('redo', (session, args) => new RedoCommand(session, args));
  }

  create(name: string, session: EditorSession, args: readonly Token[]): Command | null {
    const factory = this.factories.get(name);
    return factory === undefined ? null : factory(session, args);
  }

  names(): string[] {
    return [...this.factories.keys()].sort();
  }

  private register(name: string, factory: CommandFactory): void {
    if (this.factories.has(name)) {
      throw new Error(`command already registered: ${name}`);
    }
    this.factories.set(name, factory);
  }
}
