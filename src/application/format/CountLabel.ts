/** Small display helper: `1 child` / `2 children`. */
export class CountLabel {
  private constructor() {
    // static helper only
  }

  static children(count: number): string {
    return `${count} ${count === 1 ? 'child' : 'children'}`;
  }
}
