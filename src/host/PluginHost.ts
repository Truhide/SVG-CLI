import type { PluginContext, PluginServices } from '../application/extension/PluginContext';
import builtinCommands from '../plugins/builtin-commands';
import builtinShapes from '../plugins/builtin-shapes';
import { registerOptionalPlugins } from './assemble';
import { HostContext } from './PluginContextFactory';
import { PluginLoader } from './PluginLoader';

/**
 * Both assembly modes start here.
 *
 * The built-in packs are always activated: with no plugin machinery at all
 * the CLI still offers the Phase 1 commands and the six Phase 1 shapes.
 * Then either the composition root (方式 A) or the config loader (方式 B)
 * adds the optional plugins through the very same registries.
 */
export async function createHost(
  services: PluginServices,
  configPath: string | null,
  report: (line: string) => void,
): Promise<PluginContext> {
  const context = new HostContext(services);
  builtinShapes.activate(context);
  builtinCommands.activate(context);
  if (configPath === null) {
    registerOptionalPlugins(context);
  } else {
    await new PluginLoader(context, report).loadFromFile(configPath);
  }
  return context;
}
