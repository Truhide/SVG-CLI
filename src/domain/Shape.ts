import { EditorError } from './errors/EditorError';
import { Numbers } from './Numbers';
import { StyleAttributes } from './StyleAttributes';
import type { ShapeVisitor } from './ShapeVisitor';
import type { GroupShape } from './GroupShape';

export type MoveVerb = 'moved' | 'moved back';

/**
 * Base class of every drawable element.
 *
 * The class hierarchy is the shape model: each subclass owns its geometry as
 * private fields and knows how to translate, scale, validate and describe
 * itself.  There is deliberately no `switch (type)` anywhere - operations
 * that need the concrete type go through {@link ShapeVisitor}, while
 * container semantics are expressed by overriding `children`/`move` in
 * {@link GroupShape} (Composite).
 */
export abstract class Shape {
  private readonly shapeId: string;
  private owningParent: GroupShape | null = null;
  private readonly styleValues = new StyleAttributes();

  protected constructor(id: string) {
    this.shapeId = id;
  }

  abstract readonly typeName: string;

  get id(): string {
    return this.shapeId;
  }

  get parent(): GroupShape | null {
    return this.owningParent;
  }

  /** @internal Parent links are maintained by Document and GroupShape only. */
  attachTo(parent: GroupShape | null): void {
    this.owningParent = parent;
  }

  get isContainer(): boolean {
    return false;
  }

  /** Composite accessor: leaves have no children, containers override. */
  get children(): readonly Shape[] {
    return [];
  }

  label(): string {
    return `${this.typeName}#${this.id}`;
  }

  styleValue(name: string): string | null {
    return this.styleValues.get(name);
  }

  styleEntries(): ReadonlyArray<readonly [string, string]> {
    return this.styleValues.entries();
  }

  move(dx: number, dy: number): void {
    this.applyTranslation(dx, dy);
  }

  scale(factor: number): void {
    this.applyScaling(factor);
  }

  setAttribute(name: string, value: string): void {
    if (StyleAttributes.isStyleName(name)) {
      this.styleValues.set(name, value);
      return;
    }
    if (!this.setOwnAttribute(name, value)) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
  }

  removeAttribute(name: string): void {
    if (StyleAttributes.isStyleName(name)) {
      this.styleValues.unset(name);
      return;
    }
    throw new EditorError(`cannot remove attribute: ${name}`);
  }

  readAttribute(name: string): string | null {
    if (StyleAttributes.isStyleName(name)) {
      return this.styleValues.get(name);
    }
    const value = this.readOwnAttribute(name);
    if (value === null) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
    return value;
  }

  /** Inline geometry + style used by `tree`. */
  treeSummary(): string {
    const geometry = this.summarizeGeometry();
    const style = this.styleValues.describe();
    return [geometry, style].filter((part) => part.length > 0).join(' ');
  }

  /** Attribute lines used by `show`. */
  detailLines(): string[] {
    return [this.describeGeometry(), ...this.extraDetailLines(), ...this.styleValues.detailLines()].filter(
      (line) => line.length > 0,
    );
  }

  /** Polymorphic feedback for `move`/`undo`, e.g. `rect#r1 moved to (10,20)`. */
  moveFeedback(verb: MoveVerb, _dx: number, _dy: number): string {
    const point = this.referencePoint();
    return `${this.label()} ${verb} to (${Numbers.format(point.x)},${Numbers.format(point.y)})`;
  }

  abstract accept<R>(visitor: ShapeVisitor<R>): R;

  /** Compact geometry for the tree, e.g. `x=0 y=0 w=10 h=20`. */
  abstract summarizeGeometry(): string;

  /** Full attribute names for `show`, e.g. `x=0 y=0 width=10 height=20`. */
  abstract describeGeometry(): string;

  protected extraDetailLines(): string[] {
    return [];
  }

  protected abstract referencePoint(): { x: number; y: number };

  protected abstract applyTranslation(dx: number, dy: number): void;

  protected abstract applyScaling(factor: number): void;

  /** @returns true when the attribute belongs to this shape. */
  protected abstract setOwnAttribute(name: string, value: string): boolean;

  protected abstract readOwnAttribute(name: string): string | null;
}
