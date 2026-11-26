import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class SecondHello extends Command {
  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok('second hello');
  }
}

/** Registers a name the `good` fixture already took. */
const plugin: Plugin = {
  name: '@fixture/plugin-duplicate',
  activate(context: PluginContext): void {
    context.commands.register({
      name: 'hello',
      help: { group: 'inspection', lines: () => ['  hello'] },
      create: () => new SecondHello(),
    });
  },
};

export default plugin;
