/**
 * One token of a REPL line.
 *
 * `quoted` matters: only an unquoted `in` introduces the optional container
 * clause of `create`, so `create text t 1 2 "in"` keeps the literal content
 * `in` instead of swallowing the next token as a container id.
 */
export class Token {
  constructor(
    readonly value: string,
    readonly quoted = false,
  ) {}

  isKeyword(word: string): boolean {
    return !this.quoted && this.value === word;
  }
}
