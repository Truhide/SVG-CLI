import { Command } from '../../../../src/application/Command';
import { CommandResult } from '../../../../src/application/CommandResult';
import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

class OptionsCommand extends Command {
  constructor(private readonly tag: string) {
    super();
  }

  override get requiresDocument(): boolean {
    return false;
  }

  override execute(): CommandResult {
    return CommandResult.ok(`options: ${this.tag}`);
  }
}

/** Reads `ctx.options`, which must be this entry's own object. */
const plugin: Plugin = {
  name: '@fixture/plugin-options',
  activate(context: PluginContext): void {
    const tag = typeof context.options.tag === 'string' ? context.options.tag : '(none)';
    context.commands.register({
      name: 'opts',
      help: { group: 'inspection', lines: () => [`  opts                             tag=${tag}`] },
      create: () => new OptionsCommand(tag),
    });
  },
};

export default plugin;
