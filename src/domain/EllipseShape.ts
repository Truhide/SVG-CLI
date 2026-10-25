import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';

export class EllipseShape extends Shape {
  readonly typeName = 'ellipse';

  private cxValue: number;
  private cyValue: number;
  private rxValue: number;
  private ryValue: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id);
    this.cxValue = cx;
    this.cyValue = cy;
    this.rxValue = rx;
    this.ryValue = ry;
  }

  get cx(): number {
    return this.cxValue;
  }

  get cy(): number {
    return this.cyValue;
  }

  get rx(): number {
    return this.rxValue;
  }

  get ry(): number {
    return this.ryValue;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitEllipse(this);
  }

  override summarizeGeometry(): string {
    return `cx=${Numbers.format(this.cxValue)} cy=${Numbers.format(this.cyValue)} rx=${Numbers.format(
      this.rxValue,
    )} ry=${Numbers.format(this.ryValue)}`;
  }

  override describeGeometry(): string {
    return this.summarizeGeometry();
  }

  protected override referencePoint(): { x: number; y: number } {
    return { x: this.cxValue, y: this.cyValue };
  }

  protected override applyTranslation(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  protected override applyScaling(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.rxValue *= factor;
    this.ryValue *= factor;
  }

  protected override setOwnAttribute(name: string, value: string): boolean {
    switch (name) {
      case 'cx':
        this.cxValue = Numbers.parse(value);
        return true;
      case 'cy':
        this.cyValue = Numbers.parse(value);
        return true;
      case 'rx':
        this.rxValue = Numbers.parse(value);
        return true;
      case 'ry':
        this.ryValue = Numbers.parse(value);
        return true;
      default:
        return false;
    }
  }

  protected override readOwnAttribute(name: string): string | null {
    switch (name) {
      case 'cx':
        return Numbers.format(this.cxValue);
      case 'cy':
        return Numbers.format(this.cyValue);
      case 'rx':
        return Numbers.format(this.rxValue);
      case 'ry':
        return Numbers.format(this.ryValue);
      default:
        return null;
    }
  }
}
