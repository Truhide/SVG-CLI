import type { Shape } from '../../domain/Shape';

/**
 * `show` output: header with the parent, then one indented line per
 * attribute.  The parent is part of the header because "where does this
 * shape live" is the first thing you need when editing by id.
 */
export class ShowFormatter {
  private constructor() {
    // static renderer only
  }

  static format(shape: Shape): string[] {
    const parent = shape.parent?.label() ?? 'svg';
    const lines = [`${shape.label()}  parent=${parent}`];
    for (const detail of shape.detailLines()) {
      lines.push(`  ${detail}`);
    }
    return lines;
  }
}
