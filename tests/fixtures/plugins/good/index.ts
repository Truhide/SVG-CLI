import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class HelloCommand extends Command {
  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok('hello from a plugin');
  }
}

const plugin: Plugin = {
  name: '@fixture/plugin-good',
  activate(context: PluginContext): void {
    context.commands.register({
      name: 'hello',
      help: { group: 'inspection', lines: () => ['  hello                            a plugin command'] },
      create: () => new HelloCommand(),
    });
  },
};

export default plugin;
