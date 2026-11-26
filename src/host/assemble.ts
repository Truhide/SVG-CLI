import type { PluginContext } from '../application/extension/PluginContext';
import modifiedStar from '../../plugins/plugin-decorator-modified-star';

/**
 * Composition root for the optional plugins ("方式 A").
 *
 * Wiring by code: adding a plugin means one import and one `activate` here.
 */
export function registerOptionalPlugins(context: PluginContext): void {
  modifiedStar.activate(context);
}