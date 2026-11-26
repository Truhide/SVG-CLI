import type { Shape } from '../../domain/Shape';
import type { ShapeSource } from './ShapeSource';

/** One SVG attribute written by a provider: `[name, value]`. */
export type SvgAttribute = readonly [string, string];

/**
 * Extension point 1/4: one drawable shape type.
 *
 * A provider owns everything that is specific to a type: the `create`
 * syntax, the SVG element it maps to, the attributes it is serialised with
 * and the way it is read back.  The kernel only talks to this interface,
 * which is why adding `box` needs no change in commands, document model or
 * the writer.
 *
 * `name` is the registry key (`create <name> …`), `elementTag` is the SVG tag
 * used for `label()` and serialisation.  They differ for `box`, whose
 * element is a `<g>` marked with `data-kind="box"`.
 */
export interface ShapeProvider {
  readonly name: string;
  readonly elementTag: string;
  /** Full usage message, e.g. `create rect <id> <x> <y> <w> <h> [fill]`. */
  readonly createUsage: string;
  /** Short form printed under `create` in `help`, e.g. `rect <x> <y> <w> <h> [fill]`. */
  readonly helpUsage: string;

  create(id: string, params: readonly string[]): Shape;

  importFrom(id: string, source: ShapeSource): Shape;

  /** May this provider read the given element? Later registrations win. */
  accepts(elementTag: string, source: ShapeSource): boolean;

  /** Geometry attributes, in output order; `id` and style are added by the kernel. */
  attributes(shape: Shape): readonly SvgAttribute[];

  /** Text body of the element, or `null` for an empty element. */
  body?(shape: Shape): string | null;

  /**
   * Optional post-import check, called by the reader once the children are
   * attached.  Throwing rejects the whole document; the kernel keeps the
   * previous document untouched.
   */
  verify?(shape: Shape): void;
}

/** Shared default: the element tag is the type name and nothing is validated. */
export abstract class BaseShapeProvider implements ShapeProvider {
  abstract readonly name: string;
  abstract readonly elementTag: string;
  abstract readonly createUsage: string;
  abstract readonly helpUsage: string;

  abstract create(id: string, params: readonly string[]): Shape;

  abstract importFrom(id: string, source: ShapeSource): Shape;

  abstract attributes(shape: Shape): readonly SvgAttribute[];

  accepts(elementTag: string, _source: ShapeSource): boolean {
    return elementTag === this.elementTag;
  }
}
