import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import type { Plugin, PluginContext } from '../application/extension/PluginContext';
import { ConfiguredContext } from './PluginContextFactory';
import { PluginManifestReader } from './PluginManifest';
import type { PluginManifest } from './PluginManifest';

export interface PluginConfigEntry {
  readonly module: string;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly enabled?: boolean;
}

type Category = 'shapes' | 'commands' | 'decorators' | 'attributes';

interface Registration {
  readonly category: Category;
  readonly name: string;
}

const CATEGORIES: readonly Category[] = ['shapes', 'commands', 'decorators', 'attributes'];

/**
 * Configuration-driven plugin loading - "方式 B".
 *
 * The loader is host code, not kernel code, and it contains no import of any
 * concrete plugin: a module is named by a string in `plugins.config.json`,
 * resolved with Node's own rules and activated through the same registries
 * the composition root uses.
 *
 * Every failure is reported as one `error: …` line and loading continues, so
 * a broken plugin never prevents the CLI from starting.
 */
export class PluginLoader {
  constructor(
    private readonly context: PluginContext,
    private readonly report: (line: string) => void,
  ) {}

  async loadFromFile(configPath: string): Promise<void> {
    const entries = PluginLoader.readConfig(configPath);
    if (entries === null) {
      this.report('error: invalid plugin config');
      return;
    }
    const configDirectory = dirname(resolve(configPath));
    for (const entry of entries) {
      if (entry.enabled === false) {
        continue;
      }
      await this.loadOne(entry, configDirectory);
    }
  }

  async loadOne(entry: PluginConfigEntry, configDirectory: string): Promise<void> {
    const modulePath = PluginLoader.resolveModule(entry.module, configDirectory);
    if (modulePath === null) {
      this.report(`error: plugin not found: ${entry.module}`);
      return;
    }
    const manifest = PluginManifestReader.read(modulePath);

    let namespace: { default?: unknown };
    try {
      namespace = (await import(pathToFileURL(modulePath).href)) as { default?: unknown };
    } catch (error) {
      this.report(
        `error: plugin failed to activate: ${manifest?.name ?? entry.module} (${PluginLoader.reason(error)})`,
      );
      return;
    }

    const exported = namespace.default;
    if (exported === undefined) {
      this.report(`error: plugin has no default export: ${entry.module}`);
      return;
    }
    const plugin = PluginLoader.instantiate(exported);
    if (plugin === null) {
      this.report(`error: plugin has no default export: ${entry.module}`);
      return;
    }
    const name = plugin.name !== '' ? plugin.name : (manifest?.name ?? entry.module);

    const recorded: Registration[] = [];
    const unsubscribe = this.record(recorded);
    try {
      plugin.activate(
        new ConfiguredContext(this.context, entry.options ?? {}),
      );
    } catch (error) {
      unsubscribe();
      this.rollback(recorded);
      const reason = PluginLoader.reason(error);
      this.report(
        reason.startsWith('duplicate registration: ')
          ? `error: ${reason}`
          : `error: plugin failed to activate: ${name} (${reason})`,
      );
      return;
    }
    unsubscribe();

    const mismatch = PluginLoader.compareManifest(manifest, recorded);
    if (mismatch !== null) {
      this.rollback(recorded);
      this.report(`error: plugin manifest mismatch: ${name} (${mismatch})`);
    }
  }

  /** Records successful registrations so a failure can be undone exactly. */
  private record(sink: Registration[]): () => void {
    const subscriptions = [
      this.context.shapes.onRegister((name) => sink.push({ category: 'shapes', name })),
      this.context.commands.onRegister((name) => sink.push({ category: 'commands', name })),
      this.context.decorators.onRegister((name) =>
        sink.push({ category: 'decorators', name }),
      ),
      this.context.attributes.onRegister((name) =>
        sink.push({ category: 'attributes', name }),
      ),
    ];
    return () => {
      for (const unsubscribe of subscriptions) {
        unsubscribe();
      }
    };
  }

  private rollback(recorded: readonly Registration[]): void {
    for (const registration of [...recorded].reverse()) {
      switch (registration.category) {
        case 'shapes':
          this.context.shapes.remove(registration.name);
          break;
        case 'commands':
          this.context.commands.remove(registration.name);
          break;
        case 'decorators':
          this.context.decorators.remove(registration.name);
          break;
        case 'attributes':
          this.context.attributes.remove(registration.name);
          break;
      }
    }
  }

  private static instantiate(exported: unknown): Plugin | null {
    if (typeof exported === 'function') {
      const candidate = new (exported as new () => Plugin)();
      return typeof candidate?.activate === 'function' ? candidate : null;
    }
    if (exported !== null && typeof exported === 'object') {
      const candidate = exported as Plugin;
      return typeof candidate.activate === 'function' ? candidate : null;
    }
    return null;
  }

  private static readConfig(path: string): PluginConfigEntry[] | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      return null;
    }
    if (parsed === null || typeof parsed !== 'object') {
      return null;
    }
    const plugins = (parsed as { plugins?: unknown }).plugins;
    if (!Array.isArray(plugins)) {
      return null;
    }
    const entries: PluginConfigEntry[] = [];
    for (const raw of plugins) {
      if (raw === null || typeof raw !== 'object') {
        return null;
      }
      const entry = raw as { module?: unknown; options?: unknown; enabled?: unknown };
      if (typeof entry.module !== 'string' || entry.module === '') {
        return null;
      }
      if (entry.enabled !== undefined && typeof entry.enabled !== 'boolean') {
        return null;
      }
      if (entry.options !== undefined && (entry.options === null || typeof entry.options !== 'object')) {
        return null;
      }
      entries.push({
        module: entry.module,
        enabled: entry.enabled as boolean | undefined,
        options: entry.options as Readonly<Record<string, unknown>> | undefined,
      });
    }
    return entries;
  }

  private static resolveModule(specifier: string, configDirectory: string): string | null {
    const looksLikePath =
      specifier.startsWith('./') || specifier.startsWith('../') || isAbsolute(specifier);
    if (!looksLikePath) {
      try {
        return createRequire(resolve(configDirectory, 'plugins.config.json')).resolve(specifier);
      } catch {
        return null;
      }
    }
    const absolute = isAbsolute(specifier) ? specifier : resolve(configDirectory, specifier);
    const directoryEntry = PluginManifestReader.resolveDirectory(absolute);
    if (directoryEntry !== null) {
      return directoryEntry;
    }
    if (existsSync(absolute) && statSync(absolute).isFile()) {
      return absolute;
    }
    return null;
  }

  private static compareManifest(
    manifest: PluginManifest | null,
    recorded: readonly Registration[],
  ): string | null {
    const declared: Record<string, string[]> = {};
    for (const category of CATEGORIES) {
      declared[category] = [...(manifest?.contributes[category] ?? [])].sort();
    }
    const registered: Record<string, string[]> = {};
    for (const category of CATEGORIES) {
      registered[category] = recorded
        .filter((entry) => entry.category === category)
        .map((entry) => entry.name)
        .sort();
    }
    const differences: string[] = [];
    for (const category of CATEGORIES) {
      const left = declared[category].join(',');
      const right = registered[category].join(',');
      if (left !== right) {
        differences.push(`${category}: declared=[${left}] registered=[${right}]`);
      }
    }
    if (differences.length === 0) {
      return null;
    }
    return differences.join('; ');
  }

  private static reason(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
