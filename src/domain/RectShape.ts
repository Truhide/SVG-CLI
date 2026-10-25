import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';

export class RectShape extends Shape {
  readonly typeName = 'rect';

  private xValue: number;
  private yValue: number;
  private widthValue: number;
  private heightValue: number;

  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    this.xValue = x;
    this.yValue = y;
    this.widthValue = width;
    this.heightValue = height;
  }

  get x(): number {
    return this.xValue;
  }

  get y(): number {
    return this.yValue;
  }

  get width(): number {
    return this.widthValue;
  }

  get height(): number {
    return this.heightValue;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitRect(this);
  }

  override summarizeGeometry(): string {
    return `x=${Numbers.format(this.xValue)} y=${Numbers.format(this.yValue)} w=${Numbers.format(
      this.widthValue,
    )} h=${Numbers.format(this.heightValue)}`;
  }

  override describeGeometry(): string {
    return `x=${Numbers.format(this.xValue)} y=${Numbers.format(this.yValue)} width=${Numbers.format(
      this.widthValue,
    )} height=${Numbers.format(this.heightValue)}`;
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
    this.widthValue *= factor;
    this.heightValue *= factor;
  }

  protected override setOwnAttribute(name: string, value: string): boolean {
    switch (name) {
      case 'x':
        this.xValue = Numbers.parse(value);
        return true;
      case 'y':
        this.yValue = Numbers.parse(value);
        return true;
      case 'width':
        this.widthValue = Numbers.parse(value);
        return true;
      case 'height':
        this.heightValue = Numbers.parse(value);
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
      case 'width':
        return Numbers.format(this.widthValue);
      case 'height':
        return Numbers.format(this.heightValue);
      default:
        return null;
    }
  }
}
