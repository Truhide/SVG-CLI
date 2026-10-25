/** Minimal output port so the REPL can be driven by a test double. */
export interface TextOutput {
  println(line: string): void;
}
