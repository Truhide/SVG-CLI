import type { AttributeHandlerRegistry } from './AttributeHandler';
import type { CommandRegistry } from './CommandRegistry';
import type { EditorEvents } from './EditorEvents';
import type { ShapeRegistry } from './ShapeRegistry';
import type { TreeDecoratorRegistry } from './TreeDecorator';
import type { DirectoryLister } from '../ports/DirectoryLister';

/** Host services a plugin may use without owning an adapter itself. */
export interface PluginServices {
  readonly directories: DirectoryLister;
  cwd(): string;
}

/**
 * What a plugin receives when it is activated.
 *
 * Registration goes through the four registries; reading the current
 * document, the file store or the codec is *not* part of this surface, so a
 * plugin cannot re-implement kernel behaviour by accident.
 */
export interface PluginContext {
  readonly shapes: ShapeRegistry;
  readonly commands: CommandRegistry;
  readonly decorators: TreeDecoratorRegistry;
  readonly attributes: AttributeHandlerRegistry;
  readonly events: EditorEvents;
  readonly services: PluginServices;
  readonly options: Readonly<Record<string, unknown>>;
}

/** A plugin is a class instance (or a class) with a stable name and `activate`. */
export interface Plugin {
  readonly name: string;
  activate(context: PluginContext): void;
}
