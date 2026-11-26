import type { PluginContext } from '../application/extension/PluginContext';
import type { DirectoryLister } from '../application/ports/DirectoryLister';
import { AttributeHandlerRegistry } from '../application/extension/AttributeHandler';
import { CommandRegistry } from '../application/extension/CommandRegistry';
import { EditorEvents } from '../application/extension/EditorEvents';
import { ShapeRegistry } from '../application/extension/ShapeRegistry';
import { TreeDecoratorRegistry } from '../application/extension/TreeDecorator';
import type { PluginServices } from '../application/extension/PluginContext';

/** Real context handed to the first plugin; every later view delegates to it. */
export class HostContext implements PluginContext {
  readonly shapes = new ShapeRegistry();
  readonly commands = new CommandRegistry();
  readonly decorators = new TreeDecoratorRegistry();
  readonly attributes = new AttributeHandlerRegistry();
  readonly events = new EditorEvents();
  readonly options: Readonly<Record<string, unknown>> = {};

  constructor(readonly services: PluginServices) {}
}

/**
 * A per-plugin view: same registries, different `options`.
 *
 * The loader wraps the host context so `ctx.options` belongs to exactly one
 * manifest entry, while registration still lands in the shared registries.
 */
export class ConfiguredContext implements PluginContext {
  constructor(
    private readonly base: PluginContext,
    readonly options: Readonly<Record<string, unknown>>,
  ) {}

  get shapes(): ShapeRegistry {
    return this.base.shapes;
  }

  get commands(): CommandRegistry {
    return this.base.commands;
  }

  get decorators(): TreeDecoratorRegistry {
    return this.base.decorators;
  }

  get attributes(): AttributeHandlerRegistry {
    return this.base.attributes;
  }

  get events(): EditorEvents {
    return this.base.events;
  }

  get services(): PluginServices {
    return this.base.services;
  }
}

/** Host services used by plugins that need the outside world. */
export function createPluginServices(
  directories: DirectoryLister,
  cwd: () => string,
): PluginServices {
  return { directories, cwd };
}
