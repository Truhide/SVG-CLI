import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import type { ShapeVisitor } from '../../domain/ShapeVisitor';
import type { CircleShape } from '../../domain/CircleShape';
import type { EllipseShape } from '../../domain/EllipseShape';
import type { GroupShape } from '../../domain/GroupShape';
import type { LineShape } from '../../domain/LineShape';
import type { RectShape } from '../../domain/RectShape';
import type { TextShape } from '../../domain/TextShape';
import { XmlEntities } from '../xml/XmlEntities';

type Attribute = readonly [string, string];

/** Visitor that appends SVG lines for one shape (and its subtree). */
export class SvgNodeEmitter implements ShapeVisitor<void> {
  constructor(
    private readonly lines: string[],
    private readonly depth: number,
  ) {}

  visitRect(shape: RectShape): void {
    this.empty('rect', shape, [
      ['x', Numbers.format(shape.x)],
      ['y', Numbers.format(shape.y)],
      ['width', Numbers.format(shape.width)],
      ['height', Numbers.format(shape.height)],
    ]);
  }

  visitCircle(shape: CircleShape): void {
    this.empty('circle', shape, [
      ['cx', Numbers.format(shape.cx)],
      ['cy', Numbers.format(shape.cy)],
      ['r', Numbers.format(shape.radius)],
    ]);
  }

  visitEllipse(shape: EllipseShape): void {
    this.empty('ellipse', shape, [
      ['cx', Numbers.format(shape.cx)],
      ['cy', Numbers.format(shape.cy)],
      ['rx', Numbers.format(shape.rx)],
      ['ry', Numbers.format(shape.ry)],
    ]);
  }

  visitLine(shape: LineShape): void {
    this.empty('line', shape, [
      ['x1', Numbers.format(shape.x1)],
      ['y1', Numbers.format(shape.y1)],
      ['x2', Numbers.format(shape.x2)],
      ['y2', Numbers.format(shape.y2)],
    ]);
  }

  visitText(shape: TextShape): void {
    const attributes = this.attributes(shape, [
      ['x', Numbers.format(shape.x)],
      ['y', Numbers.format(shape.y)],
    ]);
    this.lines.push(
      `${this.indent()}<text ${attributes}>${XmlEntities.encode(shape.content)}</text>`,
    );
  }

  visitGroup(shape: GroupShape): void {
    const attributes = this.attributes(shape, []);
    if (shape.childCount === 0) {
      this.lines.push(`${this.indent()}<g ${attributes}/>`);
      return;
    }
    this.lines.push(`${this.indent()}<g ${attributes}>`);
    const inner = new SvgNodeEmitter(this.lines, this.depth + 1);
    for (const child of shape.children) {
      child.accept(inner);
    }
    this.lines.push(`${this.indent()}</g>`);
  }

  private empty(name: string, shape: Shape, geometry: readonly Attribute[]): void {
    this.lines.push(`${this.indent()}<${name} ${this.attributes(shape, geometry)}/>`);
  }

  private attributes(shape: Shape, geometry: readonly Attribute[]): string {
    const all: Attribute[] = [['id', shape.id], ...geometry, ...shape.styleEntries()];
    return all
      .map(([name, value]) => `${name}="${XmlEntities.encode(value)}"`)
      .join(' ');
  }

  private indent(): string {
    return '  '.repeat(this.depth);
  }
}
