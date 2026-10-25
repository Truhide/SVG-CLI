import { EditorError } from './errors/EditorError';

/** Parsing and rendering of the decimal numbers used by SVG attributes. */
export class Numbers {
  private static readonly DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

  private constructor() {
    // value object - not instantiable
  }

  static parse(raw: string): number {
    const text = raw.trim();
    if (!Numbers.DECIMAL.test(text)) {
      throw new EditorError(`invalid number: ${raw}`);
    }
    return Number(text);
  }

  /** Renders a number without exponent and without trailing zeros. */
  static format(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }
    if (Number.isInteger(value)) {
      return String(value === 0 ? 0 : value);
    }
    const rounded = Math.round(value * 1e6) / 1e6;
    return String(rounded);
  }
}
