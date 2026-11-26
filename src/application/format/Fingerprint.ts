import type { Shape } from '../../domain/Shape';

/**
 * Canonical text of a shape subtree.
 *
 * Two subtrees with the same fingerprint are indistinguishable for every
 * consumer that renders through `label()` / `treeSummary()` - which is
 * exactly the "content" a tree decorator needs when it asks "has this row
 * changed since the last save?".  Geometry, style and text content are all
 * part of `treeSummary()`; children are folded in recursively.
 */
export class Fingerprint {
  private constructor() {
    // static helper only
  }

  static of(shape: Shape): string {
    const children = shape.children.map((child) => Fingerprint.of(child)).join(',');
    return `${shape.label()}|${shape.treeSummary()}|[${children}]`;
  }

  static ofRoot(width: string, height: string, children: readonly Shape[]): string {
    const inner = children.map((child) => Fingerprint.of(child)).join(',');
    return `svg|(${width}x${height})|[${inner}]`;
  }
}
