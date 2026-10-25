import type { ShapeSource } from '../../application/shapes/ShapeSource';
import type { XmlElement } from '../xml/XmlElement';

/** Adapts the XML tree to the neutral source interface of shape providers. */
export class XmlShapeSource implements ShapeSource {
  private static readonly LENGTHS = new Set([
    'x',
    'y',
    'width',
    'height',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'x1',
    'y1',
    'x2',
    'y2',
    'stroke-width',
  ]);

  constructor(private readonly element: XmlElement) {}

  attribute(name: string): string | undefined {
    const value = this.element.attribute(name);
    if (value === undefined) {
      return undefined;
    }
    const trimmed = value.trim();
    return XmlShapeSource.LENGTHS.has(name) ? trimmed.replace(/px$/i, '') : trimmed;
  }

  text(): string {
    return this.element.text().trim();
  }
}
