import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';

export class TextShape extends Shape {
  readonly typeName = 'text';

  private xValue: number;
  private yValue: number;
  private contentValue: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.xValue = x;
    this.yValue = y;
    this.contentValue = content;
  }

  get x(): number {
    return this.xValue;
  }

  get y(): number {
    return this.yValue;
  }

  get content(): string {
    return this.contentValue;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitText(this);
  }

  override summarizeGeometry(): string {
    return `(${Numbers.format(this.xValue)},${Numbers.format(this.yValue)}) "${this.contentValue}"`;
  }

  override describeGeometry(): string {
    return `x=${Numbers.format(this.xValue)} y=${Numbers.format(this.yValue)}`;
  }

  protected override extraDetailLines(): string[] {
    return [`text="${this.contentValue}"`];
  }

  protected override referencePoint(): { x: number; y: number } {
    return { x: this.xValue, y: this.yValue };
  }

  protected override applyTranslation(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  protected override applyScaling(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
  }

  protected override setOwnAttribute(name: string, value: string): boolean {
    switch (name) {
      case 'x':
        this.xValue = Numbers.parse(value);
        return true;
      case 'y':
        this.yValue = Numbers.parse(value);
        return true;
      case 'text':
        this.contentValue = value;
        return true;
      default:
        return false;
    }
  }

  protected override readOwnAttribute(name: string): string | null {
    switch (name) {
      case 'x':
        return Numbers.format(this.xValue);
      case 'y':
        return Numbers.format(this.yValue);
      case 'text':
        return this.contentValue;
      default:
        return null;
    }
  }
}
