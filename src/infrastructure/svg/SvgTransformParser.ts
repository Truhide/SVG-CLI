import { Numbers } from '../../domain/Numbers';
import { Transform2D } from '../../domain/Transform2D';

/**
 * Reads `transform="translate(...) scale(...)"`.
 *
 * Only uniform scale + translation is representable by the model; anything
 * else (rotate, skew, non-uniform scale, general matrix) is reported through
 * the warning callback and ignored instead of silently producing wrong
 * coordinates.
 */
export class SvgTransformParser {
  private constructor() {
    // static helper only
  }

  static parse(text: string | undefined, warn: (message: string) => void): Transform2D {
    if (text === undefined || text.trim() === '') {
      return Transform2D.IDENTITY;
    }
    const pattern = /([A-Za-z]+)\s*\(([^)]*)\)/g;
    let result = Transform2D.IDENTITY;
    let match = pattern.exec(text);
    if (match === null) {
      warn(`unsupported transform '${text.trim()}' ignored`);
      return result;
    }
    while (match !== null) {
      const name = match[1].toLowerCase();
      const values = match[2]
        .split(/[\s,]+/)
        .filter((value) => value !== '')
        .map((value) => Numbers.parse(value));
      result = result.compose(SvgTransformParser.parseFunction(name, values, warn));
      match = pattern.exec(text);
    }
    return result;
  }

  private static parseFunction(
    name: string,
    values: readonly number[],
    warn: (message: string) => void,
  ): Transform2D {
    switch (name) {
      case 'translate': {
        const tx = values[0] ?? 0;
        const ty = values[1] ?? 0;
        return Transform2D.translation(tx, ty);
      }
      case 'scale': {
        const sx = values[0];
        if (sx === undefined) {
          warn("transform 'scale' without arguments ignored");
          return Transform2D.IDENTITY;
        }
        const sy = values[1] ?? sx;
        if (sx !== sy) {
          warn(`non-uniform scale(${sx},${sy}) is not supported, using scale(${sx})`);
        }
        return Transform2D.scaling(sx);
      }
      case 'matrix': {
        const [a, b, c, d, e, f] = values;
        if (a === undefined || b === undefined || c === undefined || d === undefined) {
          warn("transform 'matrix' without enough arguments ignored");
          return Transform2D.IDENTITY;
        }
        if (b !== 0 || c !== 0 || a !== d) {
          warn(`unsupported matrix(${values.join(',')}) ignored`);
          return Transform2D.IDENTITY;
        }
        return Transform2D.translation(e ?? 0, f ?? 0).compose(Transform2D.scaling(a));
      }
      default:
        warn(`unsupported transform '${name}(...)' ignored`);
        return Transform2D.IDENTITY;
    }
  }
}
