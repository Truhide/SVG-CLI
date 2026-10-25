import type { FileStore } from '../../src/application/ports/FileStore';
import { EditorError } from '../../src/domain/errors/EditorError';

/** In-memory FileStore so command tests do not touch the disk. */
export class InMemoryFileStore implements FileStore {
  private readonly files = new Map<string, string>();

  seed(path: string, contents: string): void {
    this.files.set(path, contents);
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  contents(path: string): string | undefined {
    return this.files.get(path);
  }

  read(path: string): string {
    const contents = this.files.get(path);
    if (contents === undefined) {
      throw new EditorError(`cannot read file: ${path}`);
    }
    return contents;
  }

  write(path: string, contents: string): void {
    this.files.set(path, contents);
  }
}
