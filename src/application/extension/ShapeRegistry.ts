import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';
import type { ShapeProvider, SvgAttribute } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';

/**
 * Type-name to provider registry - the shape half of the plugin surface.
 *
 * The kernel owns the map but never imports a provider: the built-in six are
 * registered by `src/plugins/builtin-shapes` during assembly, exactly like a
 * third-party package would.
 */
export class ShapeRegistry {
  private readonly providers = new Map<string, ShapeProvider>();
  private readonly listeners: Array<(name: string) => void> = [];

  register(provider: ShapeProvider): void {
    if (this.providers.has(provider.name)) {
      throw new EditorError(`duplicate registration: shapes/${provider.name}`);
    }
    this.providers.set(provider.name, provider);
    for (const listener of this.listeners) {
      listener(provider.name);
    }
  }

  /** Rollback hook used by the plugin loader; not part of the plugin API. */
  remove(name: string): void {
    this.providers.delete(name);
  }

  onRegister(listener: (name: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  names(): string[] {
    return [...this.providers.keys()];
  }

  isKnownType(name: string): boolean {
    return this.providers.has(name);
  }

  provider(name: string): ShapeProvider | undefined {
    return this.providers.get(name);
  }

  /** Provider of a `create` type; the message names the plugin, not the caller. */
  providerForKind(kind: string): ShapeProvider {
    const provider = this.providers.get(kind);
    if (provider === undefined) {
      throw new EditorError(`unknown shape type: ${kind} (is the plugin loaded?)`);
    }
    return provider;
  }

  /**
   * Element dispatch for `read`: providers are offered the element in reverse
   * registration order, so a later plugin (`box`) can claim a tag the built-in
   * `g` provider also accepts.  `null` means "no provider knows this element".
   */
  providerForElement(elementTag: string, source: ShapeSource): ShapeProvider | null {
    const ordered = [...this.providers.values()].reverse();
    for (const provider of ordered) {
      if (provider.accepts(elementTag, source)) {
        return provider;
      }
    }
    return null;
  }

  createUsage(name: string): string {
    return this.providers.get(name)?.createUsage ?? `create ${name} <id> …`;
  }

  create(name: string, id: string, params: readonly string[]): Shape {
    return this.providerForKind(name).create(id, params);
  }

  importFrom(name: string, id: string, source: ShapeSource): Shape {
    return this.providerForKind(name).importFrom(id, source);
  }

  attributesFor(shape: Shape): readonly SvgAttribute[] {
    return this.providerForKind(shape.kind).attributes(shape);
  }

  bodyFor(shape: Shape): string | null {
    return this.providerForKind(shape.kind).body?.(shape) ?? null;
  }
}
