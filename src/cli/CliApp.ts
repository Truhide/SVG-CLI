import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { EditorSession } from '../application/EditorSession';
import type { TextOutput } from './TextOutput';

/**
 * The interactive shell.
 *
 * It only reads lines, hands them to the session and prints the returned
 * lines - all editing knowledge lives in `application`.  When stdin is a
 * pipe (script replay) the prompt is suppressed so the output stays clean.
 */
export class CliApp {
  constructor(
    private readonly session: EditorSession,
    private readonly output: TextOutput,
    private readonly input: Readable = process.stdin,
    private readonly outputStream: Writable = process.stdout,
  ) {}

  run(): Promise<void> {
    const interactive = (this.input as { isTTY?: boolean }).isTTY === true;
    this.output.println("svg-editor 0.1 — type 'help' for commands");
    this.output.println('');
    const readline = createInterface({
      input: this.input,
      output: this.outputStream,
      prompt: 'svg> ',
      terminal: interactive,
    });
    if (interactive) {
      readline.prompt();
    }
    readline.on('line', (line: string) => {
      for (const outputLine of this.session.execute(line)) {
        this.output.println(outputLine);
      }
      if (interactive) {
        readline.prompt();
      }
    });
    return new Promise<void>((resolve) => {
      readline.on('close', () => {
        if (interactive) {
          this.output.println('');
        }
        resolve();
      });
    });
  }
}
