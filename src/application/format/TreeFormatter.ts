import type { Document } from '../../domain/Document';
import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import type { TreeDecorator, TreeRow } from '../extension/TreeDecorator';
import { Fingerprint } from './Fingerprint';

interface Row {
  readonly prefix: string;
  readonly shape: Shape;
}

/**
 * Renders the structure tree with inline geometry.
 *
 * Geometry is printed next to every node because the tree is meant to be
 * usable without looking at the canvas (a circle's radius matters as much as
 * its name when you are editing from a terminal).
 *
 * Phase 2 added one hook at the very end of every row: registered
 * {@link TreeDecorator}s may append a label.  With no decorator registered the
 * output is byte for byte the Phase 1 output.
 */
export class TreeFormatter {
  private constructor() {
    // static renderer only
  }

  static formatDocument(
    document: Document,
    decorators: readonly TreeDecorator[] = [],
  ): string[] {
    const width = Numbers.format(document.width);
    const height = Numbers.format(document.height);
    const root: TreeRow = {
      id: 'svg',
      label: 'svg',
      kind: 'svg',
      summary: `(${width}x${height})`,
      isRoot: true,
      isContainer: true,
      fingerprint: Fingerprint.ofRoot(width, height, document.root.children),
    };
    const rows: Row[] = [];
    TreeFormatter.collect(document.root.children, '', rows);
    const header = TreeFormatter.decorate(`svg (${width}x${height})`, root, decorators);
    return [header, ...TreeFormatter.render(rows, decorators)];
  }

  static formatShape(shape: Shape, decorators: readonly TreeDecorator[] = []): string[] {
    const rows: Row[] = [];
    TreeFormatter.collect(shape.children, '', rows);
    const summary = shape.treeSummary();
    const header = summary === '' ? shape.label() : `${shape.label()} ${summary}`;
    const row: TreeRow = {
      id: shape.id,
      label: shape.label(),
      kind: shape.kind,
      summary,
      isRoot: false,
      isContainer: shape.isContainer,
      fingerprint: Fingerprint.of(shape),
    };
    return [
      TreeFormatter.decorate(header, row, decorators),
      ...TreeFormatter.render(rows, decorators),
    ];
  }

  private static collect(children: readonly Shape[], prefix: string, rows: Row[]): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      rows.push({
        prefix: `${prefix}${isLast ? '└── ' : '├── '}`,
        shape: child,
      });
      TreeFormatter.collect(child.children, `${prefix}${isLast ? '    ' : '│   '}`, rows);
    });
  }

  private static render(rows: readonly Row[], decorators: readonly TreeDecorator[]): string[] {
    if (rows.length === 0) {
      return [];
    }
    const labelWidth = Math.max(...rows.map((row) => row.shape.label().length)) + 2;
    return rows.map((row) => {
      const head = `${row.prefix}${row.shape.label().padEnd(labelWidth)}`;
      const summary = row.shape.treeSummary();
      const line = summary === '' ? head.trimEnd() : `${head}${summary}`;
      return TreeFormatter.decorate(line, TreeFormatter.describe(row.shape), decorators);
    });
  }

  private static describe(shape: Shape): TreeRow {
    return {
      id: shape.id,
      label: shape.label(),
      kind: shape.kind,
      summary: shape.treeSummary(),
      isRoot: false,
      isContainer: shape.isContainer,
      fingerprint: Fingerprint.of(shape),
    };
  }

  private static decorate(
    line: string,
    row: TreeRow,
    decorators: readonly TreeDecorator[],
  ): string {
    const labels: string[] = [];
    for (const decorator of decorators) {
      const label = decorator.decorate(row);
      if (label !== null && label !== '') {
        labels.push(label);
      }
    }
    return labels.length === 0 ? line : `${line} ${labels.join(' ')}`;
  }
}
