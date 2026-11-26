import type { Plugin, PluginContext } from '../../application/extension/PluginContext';
import { CircleProvider } from './CircleProvider';
import { EllipseProvider } from './EllipseProvider';
import { GroupProvider } from './GroupProvider';
import { LineProvider } from './LineProvider';
import { RectProvider } from './RectProvider';
import { TextProvider } from './TextProvider';

/**
 * The six Phase 1 shape types, packaged as one plugin.
 *
 * Registration order is significant: it is the order used by `help` and the
 * fallback order used when reading SVG elements (later registrations win).
 */
export class BuiltinShapes implements Plugin {
  readonly name = 'builtin-shapes';

  activate(context: PluginContext): void {
    context.shapes.register(new RectProvider());
    context.shapes.register(new CircleProvider());
    context.shapes.register(new EllipseProvider());
    context.shapes.register(new LineProvider());
    context.shapes.register(new TextProvider());
    context.shapes.register(new GroupProvider());
  }
}

const plugin = new BuiltinShapes();
export default plugin;
