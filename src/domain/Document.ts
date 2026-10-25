import { EditorError } from './errors/EditorError';
import { GroupShape } from './GroupShape';
import { RootShape } from './RootShape';
import type { Shape } from './Shape';

/** Where a shape lived before it was detached (used to undo moves). */
export interface Placement {
  readonly parent: GroupShape;
  readonly index: number;
}

/**
 * The edited document: canvas size, shape tree and the id index.
 *
 * Structural mutations go through this class only, because every one of them
 * has to keep the id index and the parent links consistent at the same time.
 */
export class Document {
  private readonly rootValue = new RootShape();
  private readonly shapesById = new Map<string, Shape>();
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  get root(): RootShape {
    return this.rootValue;
  }

  get width(): number {
    return this.canvasWidth;
  }

  get height(): number {
    return this.canvasHeight;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  find(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  require(id: string): Shape {
    const shape = this.shapesById.get(id);
    if (shape === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return shape;
  }

  /** `svg` is reserved even though the root is not part of the index. */
  isIdTaken(id: string): boolean {
    return id === this.rootValue.id || this.shapesById.has(id);
  }

  count(): number {
    return this.shapesById.size;
  }

  parentOf(shape: Shape): GroupShape {
    return shape.parent ?? this.rootValue;
  }

  indexOf(shape: Shape): number {
    return this.parentOf(shape).indexOf(shape);
  }

  isAncestor(ancestor: Shape, node: Shape): boolean {
    let current = node.parent;
    while (current !== null) {
      if (current === ancestor) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /** Inserts a shape (with its whole subtree) into the tree and the index. */
  attach(shape: Shape, parent: GroupShape | null, index?: number): void {
    if (this.isIdTaken(shape.id)) {
      throw new EditorError(`id already exists: ${shape.id}`);
    }
    const container = parent ?? this.rootValue;
    this.indexSubtree(shape);
    container.insertChild(shape, index ?? container.childCount);
  }

  /** Removes a shape (with its whole subtree) from tree and index. */
  detach(shape: Shape): Placement {
    const parent = shape.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${shape.id}`);
    }
    const index = parent.removeChild(shape);
    this.unindexSubtree(shape);
    return { parent, index };
  }

  private indexSubtree(shape: Shape): void {
    this.shapesById.set(shape.id, shape);
    for (const child of shape.children) {
      this.indexSubtree(child);
    }
  }

  private unindexSubtree(shape: Shape): void {
    this.shapesById.delete(shape.id);
    for (const child of shape.children) {
      this.unindexSubtree(child);
    }
  }
}
