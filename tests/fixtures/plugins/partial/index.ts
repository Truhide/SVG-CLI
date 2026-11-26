import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class NoopCommand extends Command {
  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok('noop');
  }
}

/**
 * Registers one command successfully, then collides on `hello` (taken by the
 * `good` fixture).  The loader must roll the first registration back.
 */
const plugin: Plugin = {
  name: '@fixture/plugin-partial',
  activate(context: PluginContext): void {
    context.commands.register({
      name: 'partial-one',
      help: { group: 'inspection', lines: () => ['  partial-one'] },
      create: () => new NoopCommand(),
    });
    context.commands.register({
      name: 'hello',
      help: { group: 'inspection', lines: () => ['  hello'] },
      create: () => new NoopCommand(),
    });
  },
};

export default plugin;
