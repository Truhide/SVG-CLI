import type { PluginContext } from '../application/extension/PluginContext';

/**
 * Composition root for the optional plugins ("方式 A").
 *
 * Nothing is wired here yet: this commit only establishes the framework, the
 * four extension points and the built-in plugin packs.  Each later plugin
 * adds one import and one `activate` call.
 */
export function registerOptionalPlugins(_context: PluginContext): void {
  // no optional plugin is wired in this step
}
