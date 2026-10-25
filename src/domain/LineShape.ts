import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';

export class LineShape extends Shape {
  readonly typeName = 'line';

  private x1Value: number;
  private y1Value: number;
  private x2Value: number;
  private y2Value: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  get x1(): number {
    return this.x1Value;
  }

  get y1(): number {
    return this.y1Value;
  }

  get x2(): number {
    return this.x2Value;
  }

  get y2(): number {
    return this.y2Value;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitLine(this);
  }

  override summarizeGeometry(): string {
    return `(${Numbers.format(this.x1Value)},${Numbers.format(this.y1Value)}) -> (${Numbers.format(
      this.x2Value,
    )},${Numbers.format(this.y2Value)})`;
  }

  override describeGeometry(): string {
    return `x1=${Numbers.format(this.x1Value)} y1=${Numbers.format(this.y1Value)} x2=${Numbers.format(
      this.x2Value,
    )} y2=${Numbers.format(this.y2Value)}`;
  }

  protected override referencePoint(): { x: number; y: number } {
    return { x: (this.x1Value + this.x2Value) / 2, y: (this.y1Value + this.y2Value) / 2 };
  }

  protected override applyTranslation(dx: number, dy: number): void {
    this.x1Value += dx;
    this.y1Value += dy;
    this.x2Value += dx;
    this.y2Value += dy;
  }

  protected override applyScaling(factor: number): void {
    this.x1Value *= factor;
    this.y1Value *= factor;
    this.x2Value *= factor;
    this.y2Value *= factor;
  }

  protected override setOwnAttribute(name: string, value: string): boolean {
    switch (name) {
      case 'x1':
        this.x1Value = Numbers.parse(value);
        return true;
      case 'y1':
        this.y1Value = Numbers.parse(value);
        return true;
      case 'x2':
        this.x2Value = Numbers.parse(value);
        return true;
      case 'y2':
        this.y2Value = Numbers.parse(value);
        return true;
      default:
        return false;
    }
  }

  protected override readOwnAttribute(name: string): string | null {
    switch (name) {
      case 'x1':
        return Numbers.format(this.x1Value);
      case 'y1':
        return Numbers.format(this.y1Value);
      case 'x2':
        return Numbers.format(this.x2Value);
      case 'y2':
        return Numbers.format(this.y2Value);
      default:
        return null;
    }
  }
}
