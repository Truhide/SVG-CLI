import { EditorError } from './errors/EditorError';
import { Numbers } from './Numbers';

/**
 * The presentation attributes every shape shares.
 *
 * Kept as an encapsulated value object (not a public bag of fields) because
 * the same three attributes are read by serialisation, by `show` and by
 * `set`, and each of them needs the `stroke-width` validation rule.
 */
export class StyleAttributes {
  private static readonly ORDER = ['fill', 'stroke', 'stroke-width'] as const;

  private readonly values = new Map<string, string>();

  static isStyleName(name: string): boolean {
    return (StyleAttributes.ORDER as readonly string[]).includes(name);
  }

  static names(): readonly string[] {
    return StyleAttributes.ORDER;
  }

  set(name: string, value: string): void {
    if (!StyleAttributes.isStyleName(name)) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
    if (name === 'stroke-width') {
      const width = Numbers.parse(value);
      if (width < 0) {
        throw new EditorError('stroke-width must not be negative');
      }
      this.values.set(name, Numbers.format(width));
      return;
    }
    this.values.set(name, value);
  }

  unset(name: string): void {
    this.values.delete(name);
  }

  get(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  entries(): ReadonlyArray<readonly [string, string]> {
    const entries: Array<readonly [string, string]> = [];
    for (const name of StyleAttributes.ORDER) {
      const value = this.values.get(name);
      if (value !== undefined) {
        entries.push([name, value]);
      }
    }
    return entries;
  }

  /** `fill=red stroke=black`, or the empty string when nothing is set. */
  describe(): string {
    return this.entries()
      .map(([name, value]) => `${name}=${value}`)
      .join(' ');
  }

  /** One line per attribute, used by `show`. */
  detailLines(): string[] {
    return this.entries().map(([name, value]) => `${name}=${value}`);
  }
}
