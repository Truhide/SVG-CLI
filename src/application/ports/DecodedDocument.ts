import type { Document } from '../../domain/Document';

/** Result of decoding an SVG file: the document plus non fatal warnings. */
export interface DecodedDocument {
  readonly document: Document;
  readonly warnings: string[];
}
