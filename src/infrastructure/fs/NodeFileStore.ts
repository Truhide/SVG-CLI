import { readFileSync, writeFileSync } from 'node:fs';
import type { FileStore } from '../../application/ports/FileStore';
import { EditorError } from '../../domain/errors/EditorError';

/** FileStore backed by the local file system. */
export class NodeFileStore implements FileStore {
  read(path: string): string {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      throw new EditorError(`cannot read file: ${path}`);
    }
  }

  write(path: string, contents: string): void {
    try {
      writeFileSync(path, contents, 'utf8');
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
  }
}
