/**
 * A tolerant, dependency free SVG outline scanner for the VSCode extension.
 *
 * The Phase 1 `XmlParser` builds a strict, complete XML tree and throws on the
 * first defect, because the CLI must never save a broken document. An outline
 * provider has the opposite requirements: it runs on every keystroke on text
 * that is *incomplete by definition* (the user is typing), it must keep the
 * source offsets of every element so the editor can jump to it, and it must
 * never throw. So this module is a separate scanner that reuses only the
 * *ideas* of Phase 1 (name character set, entity decoding, `tag#id` label) but
 * not its classes.
 *
 * Guarantees:
 *  - never throws, for any input string;
 *  - always terminates (every branch advances the index);
 *  - returns whatever prefix could be understood, which may be an empty array.
 */

/** One element of the outline tree, expressed in plain source offsets. */
export interface SvgOutlineNode {
  /** Element name exactly as written, namespace prefix included. */
  readonly tagName: string;
  /** Non empty `id` attribute value, entity decoded. */
  readonly id: string | undefined;
  /** Display label: `tagName` or `tagName#id`. */
  readonly label: string;
  /** Offset of the `<` that opens the element. */
  readonly start: number;
  /** Offset of the first character of the tag name. */
  readonly nameStart: number;
  /** Offset just past the last character of the tag name. */
  readonly nameEnd: number;
  /** Offset just past the element: after `/>`, after `</name>`, or EOF when unclosed. */
  readonly end: number;
  readonly children: SvgOutlineNode[];
}

const NAME_CHAR = /[A-Za-z0-9_:.\-\u00B7\u00C0-\uFFFF]/;

function isNameChar(char: string | undefined): boolean {
  return char !== undefined && char.length > 0 && NAME_CHAR.test(char);
}

function isSpace(char: string | undefined): boolean {
  return char !== undefined && (char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '\f');
}

/** `标签名` or `标签名#id` – the same naming rule Phase 1 uses for `tree`/`show`. */
export function svgOutlineLabel(tagName: string, id?: string): string {
  return id !== undefined && id.length > 0 ? `${tagName}#${id}` : tagName;
}

/**
 * Offset to line/character conversion, VSCode's own coordinate system
 * (0 based line, 0 based UTF-16 column, `\r\n` counts as one break).
 */
export class LineIndex {
  private readonly lineStarts: number[] = [0];
  private readonly length: number;

  constructor(text: string) {
    this.length = text.length;
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      if (code === 13) {
        if (text.charCodeAt(index + 1) === 10) {
          index += 1;
        }
        this.lineStarts.push(index + 1);
      } else if (code === 10) {
        this.lineStarts.push(index + 1);
      }
    }
  }

  positionAt(offset: number): { line: number; character: number } {
    const clamped = Math.max(0, Math.min(offset, this.length));
    let low = 0;
    let high = this.lineStarts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (this.lineStarts[mid] <= clamped) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return { line: low, character: clamped - this.lineStarts[low] };
  }
}

/** Mutable frame used while scanning; converted to `SvgOutlineNode` at the end. */
interface Frame {
  tagName: string;
  id: string | undefined;
  start: number;
  nameStart: number;
  nameEnd: number;
  end: number;
  children: Frame[];
}

export class SvgOutlineParser {
  private index = 0;
  private readonly roots: Frame[] = [];
  private readonly stack: Frame[] = [];

  private constructor(private readonly text: string) {}

  /** @returns every top level element found, in document order. Never throws. */
  static parse(text: string): SvgOutlineNode[] {
    try {
      const parser = new SvgOutlineParser(text.replace(/^\uFEFF/, ''));
      return freeze(parser.scan());
    } catch {
      // Defensive: a bug must degrade to "no outline", never to a crash.
      return [];
    }
  }

  private scan(): Frame[] {
    const text = this.text;
    while (this.index < text.length) {
      const next = text.indexOf('<', this.index);
      if (next < 0) {
        this.index = text.length;
        break;
      }
      this.index = next;
      if (text.startsWith('<!--', this.index)) {
        this.index = skipTo(text, this.index + 4, '-->');
        continue;
      }
      if (text.startsWith('<![CDATA[', this.index)) {
        this.index = skipTo(text, this.index + 9, ']]>');
        continue;
      }
      if (text.startsWith('<?', this.index)) {
        // XML declaration / processing instruction: not an element.
        this.index = skipTo(text, this.index + 2, '?>');
        continue;
      }
      if (text.startsWith('<!', this.index)) {
        // DOCTYPE, possibly with an internal subset containing `>`.
        this.index = this.skipDeclaration(this.index + 2);
        continue;
      }
      if (text.startsWith('</', this.index)) {
        this.closeTag();
        continue;
      }
      this.openTag();
    }
    // Anything still open is simply "runs to the end of the document".
    for (const frame of this.stack) {
      frame.end = text.length;
    }
    this.stack.length = 0;
    return this.roots;
  }

  private openTag(): void {
    const text = this.text;
    const start = this.index;
    let cursor = start + 1;
    const nameStart = cursor;
    while (cursor < text.length && isNameChar(text[cursor])) {
      cursor += 1;
    }
    if (cursor === nameStart) {
      // `<` that does not open an element (`< 5`, lone `<`): treat as text.
      this.index = start + 1;
      return;
    }
    const tagName = text.slice(nameStart, cursor);
    const nameEnd = cursor;
    let id: string | undefined;
    let selfClosing = false;
    let closed = false;

    while (cursor < text.length) {
      const char = text[cursor];
      if (char === '>') {
        cursor += 1;
        closed = true;
        break;
      }
      if (char === '/' && text[cursor + 1] === '>') {
        cursor += 2;
        selfClosing = true;
        closed = true;
        break;
      }
      if (isSpace(char)) {
        cursor += 1;
        continue;
      }
      const attributeNameStart = cursor;
      while (cursor < text.length && isNameChar(text[cursor])) {
        cursor += 1;
      }
      if (cursor === attributeNameStart) {
        // Stray character inside a tag (a quote or `=`): skip one, keep going.
        cursor += 1;
        continue;
      }
      const attributeName = text.slice(attributeNameStart, cursor);
      let lookahead = cursor;
      while (lookahead < text.length && isSpace(text[lookahead])) {
        lookahead += 1;
      }
      if (text[lookahead] !== '=') {
        // Attribute without a value; legal in HTML, harmless here.
        cursor = lookahead;
        continue;
      }
      lookahead += 1;
      while (lookahead < text.length && isSpace(text[lookahead])) {
        lookahead += 1;
      }
      const quote = text[lookahead];
      if (quote === '"' || quote === "'") {
        const closingQuote = text.indexOf(quote, lookahead + 1);
        if (closingQuote < 0) {
          // Unterminated quoted value: keep what we have and stop at EOF.
          if (attributeName === 'id' && id === undefined) {
            id = text.slice(lookahead + 1);
          }
          cursor = text.length;
          break;
        }
        if (attributeName === 'id' && id === undefined) {
          id = text.slice(lookahead + 1, closingQuote);
        }
        cursor = closingQuote + 1;
        continue;
      }
      // Unquoted value: tolerated on purpose, stops at space, `>` or `/>`.
      let end = lookahead;
      while (end < text.length) {
        const valueChar = text[end];
        if (isSpace(valueChar) || valueChar === '>' || (valueChar === '/' && text[end + 1] === '>')) {
          break;
        }
        end += 1;
      }
      if (attributeName === 'id' && id === undefined) {
        id = text.slice(lookahead, end);
      }
      cursor = end;
    }

    const normalizedId = id !== undefined && id.length > 0 ? decodeEntities(id) : undefined;
    const frame: Frame = {
      tagName,
      id: normalizedId,
      start,
      nameStart,
      nameEnd,
      end: closed ? cursor : text.length,
      children: [],
    };
    const parent = this.stack[this.stack.length - 1];
    if (parent === undefined) {
      this.roots.push(frame);
    } else {
      parent.children.push(frame);
    }
    if (!selfClosing) {
      this.stack.push(frame);
    }
    this.index = cursor > start ? cursor : start + 1;
  }

  private closeTag(): void {
    const text = this.text;
    const start = this.index;
    let cursor = start + 2;
    const nameStart = cursor;
    while (cursor < text.length && isNameChar(text[cursor])) {
      cursor += 1;
    }
    const tagName = text.slice(nameStart, cursor);
    const gt = text.indexOf('>', cursor);
    if (tagName.length === 0) {
      this.index = gt < 0 ? text.length : gt + 1;
      return;
    }
    if (gt < 0) {
      // `</name` at EOF: nothing to close, we are done.
      this.index = text.length;
      return;
    }
    const after = gt + 1;
    let match = -1;
    for (let depth = this.stack.length - 1; depth >= 0; depth -= 1) {
      if (this.stack[depth].tagName === tagName) {
        match = depth;
        break;
      }
    }
    if (match < 0) {
      // Stray end tag: ignore it but keep scanning.
      this.index = after;
      return;
    }
    // Elements opened inside but not closed here end where the parent closes.
    for (let depth = this.stack.length - 1; depth > match; depth -= 1) {
      this.stack[depth].end = start;
    }
    const frame = this.stack[match];
    frame.end = after;
    this.stack.length = match;
    this.index = after;
  }

  private skipDeclaration(from: number): number {
    const text = this.text;
    let depth = 0;
    let cursor = from;
    while (cursor < text.length) {
      const char = text[cursor];
      if (char === '[') {
        depth += 1;
      } else if (char === ']') {
        depth -= 1;
      } else if (char === '>' && depth <= 0) {
        return cursor + 1;
      }
      cursor += 1;
    }
    return text.length;
  }
}

function skipTo(text: string, from: number, marker: string): number {
  const end = text.indexOf(marker, from);
  return end < 0 ? text.length : end + marker.length;
}

/**
 * Same idea as Phase 1 `XmlEntities.decode`, trimmed to the attributes the
 * outline shows (`id`). Unknown entities are kept verbatim.
 */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    const named = NAMED_ENTITIES.get(body);
    return named ?? whole;
  });
}

const NAMED_ENTITIES: ReadonlyMap<string, string> = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
]);

function freeze(frames: readonly Frame[]): SvgOutlineNode[] {
  return frames.map((frame) => ({
    tagName: frame.tagName,
    id: frame.id,
    label: svgOutlineLabel(frame.tagName, frame.id),
    start: frame.start,
    nameStart: frame.nameStart,
    nameEnd: frame.nameEnd,
    end: frame.end,
    children: freeze(frame.children),
  }));
}
