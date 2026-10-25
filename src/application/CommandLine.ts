import { EditorError } from '../domain/errors/EditorError';
import { Token } from './Token';

/**
 * A tokenised REPL line: command name plus its tokens.
 *
 * The grammar is deliberately small - whitespace separated tokens, double
 * quotes for values with spaces, no inline comments (a `#` only starts a
 * comment when it is the first character of the line, otherwise `#4a90d9`
 * would be impossible to type).
 */
export class CommandLine {
  private constructor(
    readonly name: string,
    readonly args: readonly Token[],
  ) {}

  static parse(line: string): CommandLine {
    const tokens = CommandLine.tokenize(line);
    const name = tokens[0];
    if (name === undefined) {
      throw new EditorError('empty command');
    }
    return new CommandLine(name.value.toLowerCase(), tokens.slice(1));
  }

  static tokenize(line: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;
    while (index < line.length) {
      const char = line[index];
      if (char === ' ' || char === '\t') {
        index += 1;
        continue;
      }
      if (char === '"') {
        index += 1;
        let value = '';
        let closed = false;
        while (index < line.length) {
          const current = line[index];
          if (current === '\\' && index + 1 < line.length) {
            value += line[index + 1];
            index += 2;
            continue;
          }
          if (current === '"') {
            closed = true;
            index += 1;
            break;
          }
          value += current;
          index += 1;
        }
        if (!closed) {
          throw new EditorError('unterminated quoted string');
        }
        tokens.push(new Token(value, true));
        continue;
      }
      let value = '';
      while (index < line.length && line[index] !== ' ' && line[index] !== '\t') {
        value += line[index];
        index += 1;
      }
      tokens.push(new Token(value, false));
    }
    return tokens;
  }
}
