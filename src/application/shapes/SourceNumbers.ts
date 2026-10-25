import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';
import type { ShapeSource } from './ShapeSource';

/** Numeric SVG attributes with SVG's per-attribute defaults. */
export class SourceNumbers {
  private constructor() {
    // static helpers only
  }

  static read(source: ShapeSource, name: string, fallback: number): number {
    const raw = source.attribute(name);
    if (raw === undefined || raw.trim() === '') {
      return fallback;
    }
    try {
      return Numbers.parse(raw);
    } catch {
      throw new EditorError(`invalid number in attribute ${name}: ${raw}`);
    }
  }
}
