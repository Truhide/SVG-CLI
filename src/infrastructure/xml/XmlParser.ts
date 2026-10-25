import { EditorError } from '../../domain/errors/EditorError';
import { XmlElement } from './XmlElement';
import { XmlEntities } from './XmlEntities';
import type { XmlNode } from './XmlNode';
import { XmlText } from './XmlText';

/**
 * A small, dependency free XML reader covering what SVG files in this lab
 * need: declaration, comments, CDATA, entities, self closing tags and
 * namespaces (prefixes are kept verbatim, the SVG reader strips them).
 */
export class XmlParser {
  private index = 0;
  private readonly source: string;

  constructor(source: string) {
    this.source = source.replace(/^\uFEFF/, '');
  }

  parse(): XmlElement {
    this.skipWhitespace();
    this.skipProlog();
    this.skipWhitespace();
    if (this.index >= this.source.length) {
      throw new EditorError('malformed XML: empty document');
    }
    const element = this.parseElement();
    this.skipWhitespace();
    if (this.index < this.source.length) {
      throw new EditorError('malformed XML: trailing content');
    }
    return element;
  }

  private parseElement(): XmlElement {
    this.expect('<');
    const name = this.readName();
    const attributes = new Map<string, string>();
    let selfClosing = false;
    while (true) {
      this.skipWhitespace();
      if (this.startsWith('/>')) {
        this.index += 2;
        selfClosing = true;
        break;
      }
      if (this.peek() === '>') {
        this.index += 1;
        break;
      }
      if (this.index >= this.source.length) {
        throw new EditorError(`malformed XML: unclosed element <${name}>`);
      }
      const attributeName = this.readName();
      this.skipWhitespace();
      this.expect('=');
      this.skipWhitespace();
      const attributeValue = this.readAttributeValue();
      if (!attributes.has(attributeName)) {
        attributes.set(attributeName, attributeValue);
      }
    }

    const children: XmlNode[] = [];
    if (!selfClosing) {
      while (true) {
        if (this.index >= this.source.length) {
          throw new EditorError(`malformed XML: unclosed element <${name}>`);
        }
        if (this.startsWith('</')) {
          this.index += 2;
          const closing = this.readName();
          this.skipWhitespace();
          this.expect('>');
          if (closing !== name) {
            throw new EditorError(`malformed XML: expected </${name}> but found </${closing}>`);
          }
          break;
        }
        if (this.startsWith('<!--')) {
          this.skipUntil('-->');
          continue;
        }
        if (this.startsWith('<![CDATA[')) {
          const end = this.source.indexOf(']]>', this.index + 9);
          if (end < 0) {
            throw new EditorError('malformed XML: unterminated CDATA section');
          }
          children.push(new XmlText(this.source.slice(this.index + 9, end)));
          this.index = end + 3;
          continue;
        }
        if (this.startsWith('<?')) {
          this.skipUntil('?>');
          continue;
        }
        if (this.peek() === '<') {
          children.push(this.parseElement());
          continue;
        }
        const text = this.readText();
        if (text !== '') {
          children.push(new XmlText(XmlEntities.decode(text)));
        }
      }
    }
    return new XmlElement(name, attributes, children);
  }

  private skipProlog(): void {
    while (true) {
      if (this.startsWith('<?')) {
        this.skipUntil('?>');
      } else if (this.startsWith('<!--')) {
        this.skipUntil('-->');
      } else if (this.startsWith('<!')) {
        this.skipUntil('>');
      } else {
        return;
      }
      this.skipWhitespace();
    }
  }

  private readName(): string {
    const start = this.index;
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (!/[A-Za-z0-9_:.-]/.test(char)) {
        break;
      }
      this.index += 1;
    }
    if (start === this.index) {
      throw new EditorError(`malformed XML: expected a name at offset ${start}`);
    }
    return this.source.slice(start, this.index);
  }

  private readAttributeValue(): string {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") {
      throw new EditorError('malformed XML: attribute value must be quoted');
    }
    this.index += 1;
    const end = this.source.indexOf(quote, this.index);
    if (end < 0) {
      throw new EditorError('malformed XML: unterminated attribute value');
    }
    const raw = this.source.slice(this.index, end);
    this.index = end + 1;
    return XmlEntities.decode(raw);
  }

  private readText(): string {
    const start = this.index;
    const next = this.source.indexOf('<', start);
    this.index = next < 0 ? this.source.length : next;
    return this.source.slice(start, this.index);
  }

  private skipUntil(marker: string): void {
    const end = this.source.indexOf(marker, this.index);
    if (end < 0) {
      throw new EditorError(`malformed XML: missing ${marker}`);
    }
    this.index = end + marker.length;
  }

  private skipWhitespace(): void {
    while (this.index < this.source.length && /\s/.test(this.source[this.index])) {
      this.index += 1;
    }
  }

  private startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  private peek(): string {
    return this.source[this.index] ?? '';
  }

  private expect(char: string): void {
    if (this.peek() !== char) {
      throw new EditorError(`malformed XML: expected '${char}' at offset ${this.index}`);
    }
    this.index += 1;
  }
}
