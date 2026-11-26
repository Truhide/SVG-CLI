import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface PluginManifest {
  readonly name: string;
  readonly contributes: Readonly<Record<string, readonly string[]>>;
}

/**
 * Reads the manifest of a plugin module.
 *
 * The manifest is the nearest `package.json` above the entry file; that is
 * how npm-installed plugins and in-repo `plugins/*` packages both work
 * without the loader knowing any name.
 */
export class PluginManifestReader {
  private constructor() {
    // static helper only
  }

  static read(modulePath: string): PluginManifest | null {
    let directory = dirname(modulePath);
    for (;;) {
      const candidate = join(directory, 'package.json');
      if (existsSync(candidate)) {
        return PluginManifestReader.parse(candidate);
      }
      const parent = dirname(directory);
      if (parent === directory) {
        return null;
      }
      directory = parent;
    }
  }

  /** Entry file of a directory module, mirroring Node's convention. */
  static resolveDirectory(path: string): string | null {
    if (!existsSync(path) || !statSync(path).isDirectory()) {
      return null;
    }
    const manifestPath = join(path, 'package.json');
    if (existsSync(manifestPath)) {
      try {
        const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
          main?: unknown;
          source?: unknown;
        };
        for (const field of [parsed.source, parsed.main]) {
          if (typeof field === 'string') {
            const entry = resolve(path, field);
            if (existsSync(entry)) {
              return entry;
            }
          }
        }
      } catch {
        return null;
      }
    }
    for (const fallback of ['index.ts', 'index.js', 'index.mjs']) {
      const entry = join(path, fallback);
      if (existsSync(entry)) {
        return entry;
      }
    }
    return null;
  }

  private static parse(path: string): PluginManifest | null {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as {
        name?: unknown;
        contributes?: unknown;
      };
      const name = typeof parsed.name === 'string' ? parsed.name : path;
      return { name, contributes: PluginManifestReader.normalize(parsed.contributes) };
    } catch {
      return null;
    }
  }

  private static normalize(raw: unknown): Record<string, readonly string[]> {
    const result: Record<string, readonly string[]> = {};
    if (raw === null || typeof raw !== 'object') {
      return result;
    }
    for (const [category, value] of Object.entries(raw as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        result[category] = value.filter((item): item is string => typeof item === 'string');
      }
    }
    return result;
  }
}
