import type { ShapeRegistry } from '../../application/extension/ShapeRegistry';
import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { XmlEntities } from '../xml/XmlEntities';

type Attribute = readonly [string, string];

/**
 * Serialises one shape and its subtree.
 *
 * Since Phase 2 the kernel does not know any concrete shape class: the
 * geometry attributes come from the provider registered for `shape.kind`
 * (extension point 1), the tag from `shape.typeName`, the style from the
 * domain object.  Adding `box` therefore adds no line here.
 */
export class SvgNodeEmitter {
  constructor(
    private readonly lines: string[],
    private readonly depth: number,
    private readonly registry: ShapeRegistry,
  ) {}

  emit(shape: Shape): void {
    const provider = this.registry.providerForKind(shape.kind);
    const attributes: Attribute[] = [
      ['id', shape.id],
      ...provider.attributes(shape),
      ...shape.styleEntries(),
    ];
    const rendered = this.render(attributes);
    const tag = shape.typeName;
    if (shape.isContainer) {
      const children = shape.children;
      if (children.length === 0) {
        this.lines.push(`${this.indent()}<${tag} ${rendered}/>`);
        return;
      }
      this.lines.push(`${this.indent()}<${tag} ${rendered}>`);
      const inner = new SvgNodeEmitter(this.lines, this.depth + 1, this.registry);
      for (const child of children) {
        inner.emit(child);
      }
      this.lines.push(`${this.indent()}</${tag}>`);
      return;
    }
    const body = provider.body?.(shape) ?? null;
    if (body === null) {
      this.lines.push(`${this.indent()}<${tag} ${rendered}/>`);
      return;
    }
    this.lines.push(
      `${this.indent()}<${tag} ${rendered}>${XmlEntities.encode(body)}</${tag}>`,
    );
  }

  private render(attributes: readonly Attribute[]): string {
    return attributes
      .map(([name, value]) => `${name}="${XmlEntities.encode(value)}"`)
      .join(' ');
  }

  private indent(): string {
    return '  '.repeat(this.depth);
  }
}

/** Kept next to the emitter so the geometry formatting stays in one place. */
export const NUMBER_FORMAT = (value: number): string => Numbers.format(value);
