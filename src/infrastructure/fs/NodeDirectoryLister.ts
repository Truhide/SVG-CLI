import { lstatSync, readdirSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { DirectoryEntry, DirectoryLister } from '../../application/ports/DirectoryLister';
import { EditorError } from '../../domain/errors/EditorError';

/**
 * DirectoryLister adapter for Node.
 *
 * It is the only place that knows `fs`; it reports symbolic links as links
 * (with their target text) instead of following them, and converts platform
 * failures into the CLI error the `dir` command contract requires.
 */
export class NodeDirectoryLister implements DirectoryLister {
  list(path: string): DirectoryEntry[] {
    let names: string[];
    try {
      names = readdirSync(path);
    } catch {
      throw new EditorError(`cannot read directory: ${path}`);
    }
    return names.map((name) => NodeDirectoryLister.describe(path, name));
  }

  private static describe(path: string, name: string): DirectoryEntry {
    const full = join(path, name);
    try {
      const stats = lstatSync(full);
      if (stats.isSymbolicLink()) {
        return { name, kind: 'link', target: NodeDirectoryLister.readTarget(full) };
      }
      return { name, kind: stats.isDirectory() ? 'dir' : 'file' };
    } catch {
      return { name, kind: 'file' };
    }
  }

  private static readTarget(path: string): string {
    try {
      return readlinkSync(path);
    } catch {
      return '';
    }
  }
}
