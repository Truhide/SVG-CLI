import type { Document } from '../../domain/Document';

/**
 * The only event the kernel publishes: "the document on screen is now the
 * saved one".  It fires after `save`, and after `init` / `read` because a
 * freshly loaded document starts clean.
 *
 * Decorators use it to capture their watermark; they keep the state in their
 * own instance fields.
 */
export class EditorEvents {
  private readonly savedListeners: Array<(document: Document) => void> = [];

  onSaved(listener: (document: Document) => void): void {
    this.savedListeners.push(listener);
  }

  emitSaved(document: Document): void {
    for (const listener of this.savedListeners) {
      listener(document);
    }
  }
}
