import type { Plugin, PluginContext } from '../../src/application/extension/PluginContext';
import { DirCommand } from './DirCommand';

/**
 * Registers `dir` and nothing else.
 *
 * The directory access it uses is the host-provided `ctx.services`, i.e. the
 * same port (and the same adapter) in both assembly modes.
 */
export class DirPlugin implements Plugin {
  readonly name = '@svgframe/plugin-command-dir';

  activate(context: PluginContext): void {
    const services = context.services;
    context.commands.register({
      name: 'dir',
      help: {
        group: 'inspection',
        lines: () => ['  dir                              list the working directory'],
      },
      create: (_session, args) => new DirCommand(services.directories, services.cwd, args),
    });
  }
}

const plugin = new DirPlugin();
export default plugin;
