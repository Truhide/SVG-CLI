import type { XmlNode } from './XmlNode';
import { XmlText } from './XmlText';

/** One element of the tiny XML tree used for SVG import/export. */
export class XmlElement {
  constructor(
    readonly name: string,
    private readonly attributes: ReadonlyMap<string, string>,
    readonly children: readonly XmlNode[],
  ) {}

  attribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  get elements(): XmlElement[] {
    return this.children.filter((child): child is XmlElement => child instanceof XmlElement);
  }

  /** Concatenated text of this element and its descendants. */
  text(): string {
    const parts: string[] = [];
    for (const child of this.children) {
      parts.push(child instanceof XmlText ? child.value : child.text());
    }
    return parts.join('');
  }
}
