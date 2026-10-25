import type { ShapeFactory } from '../../application/shapes/ShapeFactory';
import type { DecodedDocument } from '../../application/ports/DecodedDocument';
import { Document } from '../../domain/Document';
import { EditorError } from '../../domain/errors/EditorError';
import { GroupShape } from '../../domain/GroupShape';
import { Numbers } from '../../domain/Numbers';
import type { Shape } from '../../domain/Shape';
import { Transform2D } from '../../domain/Transform2D';
import { XmlParser } from '../xml/XmlParser';
import type { XmlElement } from '../xml/XmlElement';
import { IdAllocator } from './IdAllocator';
import { SvgTransformParser } from './SvgTransformParser';
import { XmlShapeSource } from './XmlShapeSource';

/**
 * SVG -> document.
 *
 * Responsibilities: pick the canvas size, walk the element tree, resolve
 * missing/duplicate ids with warnings, fold group transforms into leaf
 * coordinates, and delegate every type specific detail to the shape
 * providers (the same registry `create` uses).
 */
export class SvgReader {
  constructor(private readonly factory: ShapeFactory) {}

  read(xml: string): DecodedDocument {
    const warnings: string[] = [];
    const root = new XmlParser(xml).parse();
    if (SvgReader.localName(root.name).toLowerCase() !== 'svg') {
      throw new EditorError(`not an svg document: <${SvgReader.localName(root.name)}>`);
    }
    const viewBox = SvgReader.parseViewBox(root.attribute('viewBox'));
    const width = SvgReader.parseLength(root.attribute('width')) ?? viewBox.width ?? 800;
    const height = SvgReader.parseLength(root.attribute('height')) ?? viewBox.height ?? 600;
    const document = new Document(width, height);

    const used = new Set<string>();
    const allocator = new IdAllocator();
    for (const element of root.elements) {
      const shape = this.importElement(element, Transform2D.IDENTITY, warnings, used, allocator);
      if (shape !== null) {
        document.attach(shape, null);
      }
    }
    return { document, warnings };
  }

  private importElement(
    element: XmlElement,
    parentTransform: Transform2D,
    warnings: string[],
    used: Set<string>,
    allocator: IdAllocator,
  ): Shape | null {
    const tag = SvgReader.localName(element.name).toLowerCase();
    if (!this.factory.isKnownType(tag)) {
      warnings.push(`warning: unsupported element <${tag}> skipped`);
      return null;
    }
    const local = SvgTransformParser.parse(element.attribute('transform'), (message) =>
      warnings.push(`warning: ${message}`),
    );
    const effective = parentTransform.compose(local);
    const id = SvgReader.resolveId(element, tag, warnings, used, allocator);
    const shape = this.factory.importFrom(tag, id, new XmlShapeSource(element));

    if (shape instanceof GroupShape) {
      for (const child of element.elements) {
        const imported = this.importElement(child, effective, warnings, used, allocator);
        if (imported !== null) {
          shape.appendChild(imported);
        }
      }
    } else if (!effective.isIdentity) {
      shape.scale(effective.scale);
      shape.move(effective.dx, effective.dy);
    }
    return shape;
  }

  private static resolveId(
    element: XmlElement,
    tag: string,
    warnings: string[],
    used: Set<string>,
    allocator: IdAllocator,
  ): string {
    const raw = element.attribute('id')?.trim();
    if (raw === undefined || raw === '') {
      const id = allocator.next(tag, used);
      used.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      return id;
    }
    if (used.has(raw) || raw === 'svg') {
      const reason = raw === 'svg' ? 'reserved id' : 'duplicate id';
      let candidate = `${raw}-2`;
      let counter = 3;
      while (used.has(candidate)) {
        candidate = `${raw}-${counter}`;
        counter += 1;
      }
      used.add(candidate);
      warnings.push(`warning: ${reason} ${raw} renamed to ${candidate}`);
      return candidate;
    }
    used.add(raw);
    return raw;
  }

  private static localName(name: string): string {
    const separator = name.indexOf(':');
    return separator < 0 ? name : name.slice(separator + 1);
  }

  private static parseLength(raw: string | undefined): number | null {
    if (raw === undefined) {
      return null;
    }
    const text = raw.trim().replace(/px$/i, '');
    if (text === '' || text.endsWith('%')) {
      return null;
    }
    try {
      return Numbers.parse(text);
    } catch {
      return null;
    }
  }

  private static parseViewBox(
    raw: string | undefined,
  ): { width: number | null; height: number | null } {
    if (raw === undefined) {
      return { width: null, height: null };
    }
    const parts = raw
      .split(/[\s,]+/)
      .filter((part) => part !== '')
      .map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
      return { width: null, height: null };
    }
    return { width: parts[2], height: parts[3] };
  }
}
