import type { Plugin, PluginContext } from '../../../../src/application/extension/PluginContext';

const plugin: Plugin = {
  name: '@fixture/plugin-throws',
  activate(_context: PluginContext): void {
    throw new Error('boom');
  },
};

export default plugin;
