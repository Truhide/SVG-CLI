import { EditorError } from '../../domain/errors/EditorError';
import type { Shape } from '../../domain/Shape';
import { CircleProvider } from './CircleProvider';
import { EllipseProvider } from './EllipseProvider';
import { GroupProvider } from './GroupProvider';
import { LineProvider } from './LineProvider';
import { RectProvider } from './RectProvider';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeSource } from './ShapeSource';
import { TextProvider } from './TextProvider';

/**
 * Type-name to class registry - one of the two sanctioned name dispatches.
 *
 * TODO(refactor): turn the fixed constructor registration into runtime
 * plugin loading (a `ShapeProvider` package registers itself), so that
 * `box` can be added without rebuilding the kernel.  The interface is
 * already shaped for that; only the bootstrap below is hard coded.
 */
export class ShapeFactory {
  private readonly providers = new Map<string, ShapeProvider>();

  constructor() {
    this.register(new RectProvider());
    this.register(new CircleProvider());
    this.register(new EllipseProvider());
    this.register(new LineProvider());
    this.register(new TextProvider());
    this.register(new GroupProvider());
  }

  register(provider: ShapeProvider): void {
    if (this.providers.has(provider.typeName)) {
      throw new Error(`shape type already registered: ${provider.typeName}`);
    }
    this.providers.set(provider.typeName, provider);
  }

  isKnownType(typeName: string): boolean {
    return this.providers.has(typeName);
  }

  typeNames(): string[] {
    return [...this.providers.keys()];
  }

  createUsage(typeName: string): string {
    return this.providers.get(typeName)?.createUsage ?? `create ${typeName} ...`;
  }

  create(typeName: string, id: string, params: readonly string[]): Shape {
    return this.requireProvider(typeName).create(id, params);
  }

  importFrom(typeName: string, id: string, source: ShapeSource): Shape {
    return this.requireProvider(typeName).importFrom(id, source);
  }

  private requireProvider(typeName: string): ShapeProvider {
    const provider = this.providers.get(typeName);
    if (provider === undefined) {
      throw new EditorError(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    }
    return provider;
  }
}
