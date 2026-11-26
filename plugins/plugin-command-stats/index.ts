import type { Plugin, PluginContext } from '../../src/application/extension/PluginContext';
import { StatsCommand } from './StatsCommand';

/** Registers `stats` next to the built-in table; the kernel is untouched. */
export class StatsPlugin implements Plugin {
  readonly name = '@svgframe/plugin-command-stats';

  activate(context: PluginContext): void {
    context.commands.register({
      name: 'stats',
      help: {
        group: 'inspection',
        lines: () => ['  stats                            leaf count per shape type'],
      },
      create: (session, args) => new StatsCommand(session, args),
    });
  }
}

const plugin = new StatsPlugin();
export default plugin;
