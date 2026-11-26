import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class KlassCommand extends Command {
  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok('class plugin');
  }
}

/** Default export is the class itself, not an instance. */
export default class ClassPlugin implements Plugin {
  readonly name = '@fixture/plugin-class';

  activate(context: PluginContext): void {
    context.commands.register({
      name: 'klass',
      help: { group: 'inspection', lines: () => ['  klass'] },
      create: () => new KlassCommand(),
    });
  }
}
