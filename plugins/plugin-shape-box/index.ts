import type { Plugin, PluginContext } from '../../src/application/extension/PluginContext';
import { BoxAttributeHandler } from './BoxAttributeHandler';
import { BoxLabelDecorator } from './BoxLabelDecorator';
import { BoxProvider } from './BoxProvider';

/**
 * One package, three contributions: the `box` shape, its attribute semantics
 * and the `(box)` tree label.  The manifest declares exactly these three.
 */
export class ShapeBoxPlugin implements Plugin {
  readonly name = '@svgframe/plugin-shape-box';

  activate(context: PluginContext): void {
    context.shapes.register(new BoxProvider(context.shapes));
    context.attributes.register(new BoxAttributeHandler());
    context.decorators.register(new BoxLabelDecorator());
  }
}

const plugin = new ShapeBoxPlugin();
export default plugin;
