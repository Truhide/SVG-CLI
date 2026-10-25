/**
 * Read-only view of one SVG element, as seen by a shape provider.
 *
 * The interface is neutral on purpose: `application` must not depend on the
 * XML parser (`infrastructure`), it only needs attribute values and text.
 */
export interface ShapeSource {
  attribute(name: string): string | undefined;
  text(): string;
}
