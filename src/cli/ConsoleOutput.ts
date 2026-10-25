import type { TextOutput } from './TextOutput';

/** Production output: one line per write on stdout. */
export class ConsoleOutput implements TextOutput {
  println(line: string): void {
    process.stdout.write(`${line}\n`);
  }
}
