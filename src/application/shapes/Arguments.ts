import { EditorError } from '../../domain/errors/EditorError';
import { Numbers } from '../../domain/Numbers';

/** Positional argument helpers shared by the `create` providers. */
export class Arguments {
  private constructor() {
    // static helpers only
  }

  static count(params: readonly string[], min: number, max: number, usage: string): void {
    if (params.length < min || params.length > max) {
      throw new EditorError(`usage: ${usage}`);
    }
  }

  static number(params: readonly string[], index: number, usage: string): number {
    const raw = params[index];
    if (raw === undefined) {
      throw new EditorError(`usage: ${usage}`);
    }
    return Numbers.parse(raw);
  }
}
