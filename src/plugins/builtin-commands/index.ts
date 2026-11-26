import type { Command } from '../../application/Command';
import type { CommandSpec, HelpEntry, HelpGroup } from '../../application/extension/CommandSpec';
import type { Plugin, PluginContext } from '../../application/extension/PluginContext';
import type { EditorSession } from '../../application/EditorSession';
import type { Token } from '../../application/Token';
import { AddToCommand } from './AddToCommand';
import { BackCommand } from './BackCommand';
import { CanvasCommand } from './CanvasCommand';
import { CreateCommand } from './CreateCommand';
import { DeleteCommand } from './DeleteCommand';
import { FrontCommand } from './FrontCommand';
import { GroupCommand } from './GroupCommand';
import { HelpCommand } from './HelpCommand';
import { InitCommand } from './InitCommand';
import { MoveCommand } from './MoveCommand';
import { ReadCommand } from './ReadCommand';
import { RedoCommand } from './RedoCommand';
import { SaveCommand } from './SaveCommand';
import { ScaleCommand } from './ScaleCommand';
import { SetCommand } from './SetCommand';
import { ShowCommand } from './ShowCommand';
import { TreeCommand } from './TreeCommand';
import { UndoCommand } from './UndoCommand';
import { UngroupCommand } from './UngroupCommand';

type Factory = (session: EditorSession, args: readonly Token[]) => Command;

function spec(
  name: string,
  group: HelpGroup,
  lines: string[] | ((shapes: HelpEntry extends never ? never : PluginContext['shapes']) => string[]),
  factory: Factory,
): CommandSpec {
  return {
    name,
    help: {
      group,
      lines: (context) =>
        typeof lines === 'function' ? lines(context.shapes) : [...lines],
    },
    create: factory,
  };
}

const DOCUMENT: readonly CommandSpec[] = [
  spec('init', 'document', ['  init [w] [h]                     new canvas, default 800x600'], (s, a) => new InitCommand(s, a)),
  spec('read', 'document', ['  read <file.svg>                  load a document, assigns missing ids'], (s, a) => new ReadCommand(s, a)),
  spec('save', 'document', ['  save [file.svg]                  save, defaults to the last read path'], (s, a) => new SaveCommand(s, a)),
  spec('canvas', 'document', ['  canvas [w] [h]                   show or change the canvas size'], (s, a) => new CanvasCommand(s, a)),
];

const EDITING: readonly CommandSpec[] = [
  spec('create', 'editing', (shapes) => [
    '  create <type> <id> [params] [in <containerId>]',
    ...shapes.names().map((name) => `    ${shapes.provider(name)?.helpUsage ?? name}`),
  ], (s, a) => new CreateCommand(s, a)),
  spec('delete', 'editing', ['  delete <id>                      delete a shape or a whole container'], (s, a) => new DeleteCommand(s, a)),
  spec('move', 'editing', ['  move <id> <dx> <dy>              relative move, containers move their children'], (s, a) => new MoveCommand(s, a)),
  spec('scale', 'editing', ['  scale <id> <factor>              multiply every geometry attribute'], (s, a) => new ScaleCommand(s, a)),
  spec('set', 'editing', ['  set <id> <attr> <value>          fill | stroke | stroke-width | geometry | text'], (s, a) => new SetCommand(s, a)),
  spec('group', 'editing', ['  group <newGid> <id1> <id2> ...   wrap existing shapes into a new container'], (s, a) => new GroupCommand(s, a)),
  spec('ungroup', 'editing', ['  ungroup <gid>                    move children up to the parent'], (s, a) => new UngroupCommand(s, a)),
  spec('addto', 'editing', ['  addto <gid> <id>                 move an existing shape into a container'], (s, a) => new AddToCommand(s, a)),
  spec('front', 'editing', ['  front <id>                       raise to the top of its siblings'], (s, a) => new FrontCommand(s, a)),
  spec('back', 'editing', ['  back <id>                        lower to the bottom of its siblings'], (s, a) => new BackCommand(s, a)),
];

const INSPECTION: readonly CommandSpec[] = [
  spec('tree', 'inspection', ['  tree [id]                        structure with inline geometry'], (s, a) => new TreeCommand(s, a)),
  spec('show', 'inspection', ['  show <id>                        attribute details'], (s, a) => new ShowCommand(s, a)),
  spec('help', 'inspection', ['  help                             this text'], (s, a) => new HelpCommand(s, a)),
];

const HISTORY: readonly CommandSpec[] = [
  spec('undo', 'history', ['  undo'], (s, a) => new UndoCommand(s, a)),
  spec('redo', 'history', ['  redo'], (s, a) => new RedoCommand(s, a)),
];

/**
 * The Phase 1 command table, packaged as one plugin.
 *
 * The kernel knows none of these classes; it only stores the specs.  Keeping
 * the table out of the kernel is what lets `stats`/`dir` arrive as separate
 * packages, and `help` is generated from whatever is registered.
 */
export class BuiltinCommands implements Plugin {
  readonly name = 'builtin-commands';

  activate(context: PluginContext): void {
    for (const commandSpec of [...DOCUMENT, ...EDITING, ...INSPECTION, ...HISTORY]) {
      context.commands.register(commandSpec);
    }
  }
}

const plugin = new BuiltinCommands();
export default plugin;
