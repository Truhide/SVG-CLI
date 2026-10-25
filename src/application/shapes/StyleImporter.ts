import type { Shape } from '../../domain/Shape';
import { StyleAttributes } from '../../domain/StyleAttributes';
import type { ShapeSource } from './ShapeSource';

/**
 * Reads `fill` / `stroke` / `stroke-width` from presentation attributes and
 * from the `style="..."` form used by most real world SVG files.
 */
export class StyleImporter {
  private constructor() {
    // static helper only
  }

  static apply(shape: Shape, source: ShapeSource): void {
    for (const name of StyleAttributes.names()) {
      const value = source.attribute(name);
      if (value !== undefined && value.trim() !== '') {
        shape.setAttribute(name, value.trim());
      }
    }
    const style = source.attribute('style');
    if (style === undefined) {
      return;
    }
    for (const declaration of style.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) {
        continue;
      }
      const name = declaration.slice(0, separator).trim();
      const raw = declaration.slice(separator + 1).trim();
      const value = name === 'stroke-width' ? raw.replace(/px$/i, '') : raw;
      if (StyleAttributes.isStyleName(name) && value !== '') {
        shape.setAttribute(name, value);
      }
    }
  }
}
