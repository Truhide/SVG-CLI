/**
 * The affine subset the editor can represent: uniform scale + translation.
 *
 * SVG files in the wild use `translate()`/`scale()` on `<g>`; the reader
 * folds them into the children's coordinates instead of storing a transform
 * on the group, because the CLI edits absolute geometry (`move`, `scale`).
 */
export class Transform2D {
  static readonly IDENTITY = new Transform2D(1, 0, 0);

  constructor(
    readonly scale: number,
    readonly dx: number,
    readonly dy: number,
  ) {}

  static translation(dx: number, dy: number): Transform2D {
    return new Transform2D(1, dx, dy);
  }

  static scaling(factor: number): Transform2D {
    return new Transform2D(factor, 0, 0);
  }

  /** `this` applied after `inner`, i.e. `this * inner`. */
  compose(inner: Transform2D): Transform2D {
    return new Transform2D(
      this.scale * inner.scale,
      this.dx + this.scale * inner.dx,
      this.dy + this.scale * inner.dy,
    );
  }

  get isIdentity(): boolean {
    return this.scale === 1 && this.dx === 0 && this.dy === 0;
  }
}
