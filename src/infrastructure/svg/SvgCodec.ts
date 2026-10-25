import type { DecodedDocument } from '../../application/ports/DecodedDocument';
import type { DocumentCodec } from '../../application/ports/DocumentCodec';
import type { ShapeFactory } from '../../application/shapes/ShapeFactory';
import type { Document } from '../../domain/Document';
import { SvgReader } from './SvgReader';
import { SvgWriter } from './SvgWriter';

/** Codec port implementation backed by the SVG reader/writer pair. */
export class SvgCodec implements DocumentCodec {
  private readonly reader: SvgReader;
  private readonly writer = new SvgWriter();

  constructor(factory: ShapeFactory) {
    this.reader = new SvgReader(factory);
  }

  decode(xml: string): DecodedDocument {
    return this.reader.read(xml);
  }

  encode(document: Document): string {
    return this.writer.write(document);
  }
}
