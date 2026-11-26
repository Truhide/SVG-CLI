import type { PluginContext } from '../application/extension/PluginContext';
import type { PluginServices } from '../application/extension/PluginContext';
import boxShape from '../../plugins/plugin-shape-box';
import dirCommand from '../../plugins/plugin-command-dir';
import modifiedStar from '../../plugins/plugin-decorator-modified-star';
import statsCommand from '../../plugins/plugin-command-stats';

/**
 * Composition root, "方式 A" - wiring by code.
 *
 * Adding an optional plugin means one import and one `activate` call here.
 * The list is deliberately explicit: this is the file a reviewer diffs to see
 * what the application actually loads.
 */
export function registerOptionalPlugins(context: PluginContext): void {
  boxShape.activate(context);
  statsCommand.activate(context);
  dirCommand.activate(context);
  modifiedStar.activate(context);
}

export type { PluginServices };
