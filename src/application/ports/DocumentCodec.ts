import type { Document } from '../../domain/Document';
import type { DecodedDocument } from './DecodedDocument';

/**
 * Port for the SVG file format.
 *
 * `save`/`read` depend on this abstraction, so a future renderer (PNG) or a
 * different SVG dialect can be plugged in without touching the commands.
 */
export interface DocumentCodec {
  decode(xml: string): DecodedDocument;
  encode(document: Document): string;
}
