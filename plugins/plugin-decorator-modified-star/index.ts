import type { Plugin, PluginContext } from '../../src/application/extension/PluginContext';
import { ModifiedStarDecorator } from './ModifiedStarDecorator';

/** Registers the `*` label; the renderer and the kernel stay untouched. */
export class ModifiedStarPlugin implements Plugin {
  readonly name = '@svgframe/plugin-decorator-modified-star';

  activate(context: PluginContext): void {
    context.decorators.register(new ModifiedStarDecorator(context.events));
  }
}

const plugin = new ModifiedStarPlugin();
export default plugin;
