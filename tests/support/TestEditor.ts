import { EditorSession } from '../../src/application/EditorSession';
import type { PluginContext, PluginServices } from '../../src/application/extension/PluginContext';
import type { DirectoryEntry, DirectoryLister } from '../../src/application/ports/DirectoryLister';
import { HostContext } from '../../src/host/PluginContextFactory';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec';
import builtinCommands from '../../src/plugins/builtin-commands';
import builtinShapes from '../../src/plugins/builtin-shapes';
import { InMemoryFileStore } from './InMemoryFileStore';

/** Directory test double: fixed listing, optional failure. */
export class FakeDirectoryLister implements DirectoryLister {
  entries: DirectoryEntry[] = [];
  failure: string | null = null;
  readonly asked: string[] = [];

  list(path: string): DirectoryEntry[] {
    this.asked.push(path);
    if (this.failure !== null) {
      throw new Error(`cannot read directory: ${this.failure}`);
    }
    return [...this.entries];
  }
}

export interface TestEditorOptions {
  /** Called after the built-in packs, before the session is created. */
  readonly configure?: (context: PluginContext) => void;
  readonly services?: PluginServices;
}

/**
 * Session wired with in-memory ports and the built-in plugin packs.
 *
 * `configure` is the same extension surface the host uses, so a test can add
 * a plugin exactly the way the composition root would.
 */
export class TestEditor {
  readonly files = new InMemoryFileStore();
  readonly directories = new FakeDirectoryLister();
  readonly context: HostContext;
  readonly session: EditorSession;

  constructor(options: TestEditorOptions = {}) {
    const services =
      options.services ??
      ({
        directories: this.directories,
        cwd: () => '/work',
      } satisfies PluginServices);
    this.context = new HostContext(services);
    builtinShapes.activate(this.context);
    builtinCommands.activate(this.context);
    options.configure?.(this.context);
    this.session = new EditorSession({
      codec: new SvgCodec(this.context.shapes),
      files: this.files,
      shapes: this.context.shapes,
      commands: this.context.commands,
      decorators: this.context.decorators,
      attributes: this.context.attributes,
      events: this.context.events,
    });
  }

  run(line: string): string[] {
    return this.session.execute(line);
  }

  runAll(...lines: string[]): string[] {
    return lines.flatMap((line) => this.run(line));
  }

  document() {
    return this.session.requireDocument();
  }
}
