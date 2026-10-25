import type { Document } from '../../domain/Document';
import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';

interface TreeRow {
  readonly prefix: string;
  readonly label: string;
  readonly summary: string;
}

/**
 * Renders the structure tree with inline geometry.
 *
 * Geometry is printed next to every node because the tree is meant to be
 * usable without looking at the canvas (a circle's radius matters as much as
 * its name when you are editing from a terminal).
 */
export class TreeFormatter {
  private constructor() {
    // static renderer only
  }

  static formatDocument(document: Document): string[] {
    const rows: TreeRow[] = [];
    TreeFormatter.collectChildren(document.root.children, '', rows);
    const header = `svg (${Numbers.format(document.width)}x${Numbers.format(document.height)})`;
    return [header, ...TreeFormatter.render(rows)];
  }

  static formatShape(shape: Shape): string[] {
    const rows: TreeRow[] = [];
    TreeFormatter.collectChildren(shape.children, '', rows);
    const summary = shape.treeSummary();
    const header = summary === '' ? shape.label() : `${shape.label()} ${summary}`;
    return [header, ...TreeFormatter.render(rows)];
  }

  private static collectChildren(
    children: readonly Shape[],
    prefix: string,
    rows: TreeRow[],
  ): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      rows.push({
        prefix: `${prefix}${isLast ? '└── ' : '├── '}`,
        label: child.label(),
        summary: child.treeSummary(),
      });
      TreeFormatter.collectChildren(
        child.children,
        `${prefix}${isLast ? '    ' : '│   '}`,
        rows,
      );
    });
  }

  private static render(rows: readonly TreeRow[]): string[] {
    if (rows.length === 0) {
      return [];
    }
    const labelWidth = Math.max(...rows.map((row) => row.label.length)) + 2;
    return rows.map((row) => {
      const head = `${row.prefix}${row.label.padEnd(labelWidth)}`;
      return row.summary === '' ? head.trimEnd() : `${head}${row.summary}`;
    });
  }
}
