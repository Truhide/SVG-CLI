import { Numbers } from './Numbers';
import { Shape } from './Shape';
import type { ShapeVisitor } from './ShapeVisitor';

export class CircleShape extends Shape {
  readonly typeName = 'circle';

  private cxValue: number;
  private cyValue: number;
  private radiusValue: number;

  constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    this.cxValue = cx;
    this.cyValue = cy;
    this.radiusValue = radius;
  }

  get cx(): number {
    return this.cxValue;
  }

  get cy(): number {
    return this.cyValue;
  }

  get radius(): number {
    return this.radiusValue;
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitCircle(this);
  }

  override summarizeGeometry(): string {
    return `cx=${Numbers.format(this.cxValue)} cy=${Numbers.format(this.cyValue)} r=${Numbers.format(
      this.radiusValue,
    )}`;
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
    this.radiusValue *= factor;
  }

  protected override setOwnAttribute(name: string, value: string): boolean {
    switch (name) {
      case 'cx':
        this.cxValue = Numbers.parse(value);
        return true;
      case 'cy':
        this.cyValue = Numbers.parse(value);
        return true;
      case 'r':
        this.radiusValue = Numbers.parse(value);
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
      case 'r':
        return Numbers.format(this.radiusValue);
      default:
        return null;
    }
  }
}
