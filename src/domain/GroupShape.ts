import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';
import type { MoveVerb } from './Shape';

/**
 * Composite node: a `<g>` container.
 *
 * `move`/`scale`/`delete` behave exactly like on a leaf because the
 * container implements them by delegating to its children - commands never
 * need to know whether the target is a group or a rect.
 */
export class GroupShape extends Shape {
  readonly typeName: string = 'g';

  private readonly childShapes: Shape[] = [];

  constructor(id: string, children: readonly Shape[] = []) {
    super(id);
    for (const child of children) {
      this.appendChild(child);
    }
  }

  override get isContainer(): boolean {
    return true;
  }

  override get children(): readonly Shape[] {
    return this.childShapes;
  }

  get childCount(): number {
    return this.childShapes.length;
  }

  indexOf(shape: Shape): number {
    return this.childShapes.indexOf(shape);
  }

  appendChild(shape: Shape): void {
    this.insertChild(shape, this.childShapes.length);
  }

  insertChild(shape: Shape, index: number): void {
    const target = Math.max(0, Math.min(index, this.childShapes.length));
    shape.attachTo(this);
    this.childShapes.splice(target, 0, shape);
  }

  /** @returns the index the child had before removal, or -1. */
  removeChild(shape: Shape): number {
    const index = this.childShapes.indexOf(shape);
    if (index < 0) {
      return -1;
    }
    this.childShapes.splice(index, 1);
    shape.attachTo(null);
    return index;
  }

  override moveFeedback(verb: MoveVerb, dx: number, dy: number): string {
    return `${this.label()} ${verb} by (${Numbers.format(dx)},${Numbers.format(dy)})`;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitGroup(this);
  }

  override summarizeGeometry(): string {
    return '';
  }

  override describeGeometry(): string {
    return `children=${this.childCount}`;
  }

  protected override referencePoint(): { x: number; y: number } {
    return { x: 0, y: 0 };
  }

  protected override applyTranslation(dx: number, dy: number): void {
    for (const child of this.childShapes) {
      child.move(dx, dy);
    }
  }

  protected override applyScaling(factor: number): void {
    for (const child of this.childShapes) {
      child.scale(factor);
    }
  }

  protected override setOwnAttribute(_name: string, _value: string): boolean {
    return false;
  }

  protected override readOwnAttribute(_name: string): string | null {
    return null;
  }
}
