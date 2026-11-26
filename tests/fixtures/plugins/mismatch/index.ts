import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class BarCommand extends Command {
  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok('bar');
  }
}

/** Declares `foo`, registers `bar` - the loader must reject it. */
const plugin: Plugin = {
  name: '@fixture/plugin-mismatch',
  activate(context: PluginContext): void {
    context.commands.register({
      name: 'bar',
      help: { group: 'inspection', lines: () => ['  bar'] },
      create: () => new BarCommand(),
    });
  },
};

export default plugin;
