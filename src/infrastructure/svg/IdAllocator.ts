/** Allocates `rect1`, `circle2`, ... for SVG elements that have no id. */
export class IdAllocator {
  private readonly counters = new Map<string, number>();

  next(tag: string, used: ReadonlySet<string>): string {
    let counter = this.counters.get(tag) ?? 0;
    let id = `${tag}${counter}`;
    do {
      counter += 1;
      id = `${tag}${counter}`;
    } while (used.has(id));
    this.counters.set(tag, counter);
    return id;
  }
}
