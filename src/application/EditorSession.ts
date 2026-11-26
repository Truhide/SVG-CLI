import type { Document } from '../domain/Document';
import { EditorError } from '../domain/errors/EditorError';
import type { Command } from './Command';
import { CommandHistory } from './CommandHistory';
import { CommandLine } from './CommandLine';
import type { CommandResult } from './CommandResult';
import type { AttributeHandlerRegistry } from './extension/AttributeHandler';
import type { CommandRegistry } from './extension/CommandRegistry';
import type { EditorEvents } from './extension/EditorEvents';
import type { ShapeRegistry } from './extension/ShapeRegistry';
import type { TreeDecoratorRegistry } from './extension/TreeDecorator';
import type { DocumentCodec } from './ports/DocumentCodec';
import type { FileStore } from './ports/FileStore';

/**
 * Everything the session needs from the surrounding application.
 *
 * Grouped in one object so the four extension points travel together and the
 * session constructor does not grow a parameter per plugin stage.
 */
export interface SessionEnvironment {
  readonly codec: DocumentCodec;
  readonly files: FileStore;
  readonly shapes: ShapeRegistry;
  readonly commands: CommandRegistry;
  readonly decorators: TreeDecoratorRegistry;
  readonly attributes: AttributeHandlerRegistry;
  readonly events: EditorEvents;
}

/**
 * Use-case facade of the editor.
 *
 * It owns the current document, the undo history and the ports; the REPL
 * is only one possible driver of it (a script or an agent channel would call
 * `execute` with the same strings).  Commands are executed through a
 * registry and never print, so the whole session is testable without IO.
 */
export class EditorSession {
  private documentValue: Document | null = null;
  private pathValue: string | null = null;
  private readonly historyValue = new CommandHistory();

  constructor(private readonly env: SessionEnvironment) {}

  get codec(): DocumentCodec {
    return this.env.codec;
  }

  get files(): FileStore {
    return this.env.files;
  }

  get shapes(): ShapeRegistry {
    return this.env.shapes;
  }

  get commands(): CommandRegistry {
    return this.env.commands;
  }

  get decorators(): TreeDecoratorRegistry {
    return this.env.decorators;
  }

  get attributes(): AttributeHandlerRegistry {
    return this.env.attributes;
  }

  get document(): Document | null {
    return this.documentValue;
  }

  get currentPath(): string | null {
    return this.pathValue;
  }

  get history(): CommandHistory {
    return this.historyValue;
  }

  requireDocument(): Document {
    if (this.documentValue === null) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.documentValue;
  }

  replaceDocument(document: Document, path: string | null): void {
    this.documentValue = document;
    this.pathValue = path;
    this.markSaved();
  }

  /** Announces "the document on screen is now the saved one" to decorators. */
  markSaved(): void {
    if (this.documentValue !== null) {
      this.env.events.emitSaved(this.documentValue);
    }
  }

  rememberPath(path: string): void {
    this.pathValue = path;
  }

  /** Runs one REPL line; returns the lines to print (never throws). */
  execute(line: string): string[] {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return [];
    }
    try {
      const commandLine = CommandLine.parse(trimmed);
      const command = this.env.commands.create(commandLine.name, this, commandLine.args);
      if (command === null) {
        throw new EditorError(`unknown command: ${commandLine.name}`);
      }
      if (command.requiresDocument && this.documentValue === null) {
        throw new EditorError("no document. use 'init' or 'read' first");
      }
      const result = command.execute();
      this.applyEffect(command, result);
      return result.lines;
    } catch (error) {
      return [`error: ${EditorSession.describeError(error)}`];
    }
  }

  undo(): CommandResult {
    const command = this.historyValue.peekUndo();
    if (command === null) {
      throw new EditorError('nothing to undo');
    }
    const result = command.undo();
    this.historyValue.commitUndo();
    return result;
  }

  redo(): CommandResult {
    const command = this.historyValue.peekRedo();
    if (command === null) {
      throw new EditorError('nothing to redo');
    }
    const result = command.redo();
    this.historyValue.commitRedo();
    return result;
  }

  commandNames(): string[] {
    return this.env.commands.names();
  }

  private applyEffect(command: Command, result: CommandResult): void {
    if (result.effect === 'reset-history') {
      this.historyValue.reset();
    } else if (result.effect === 'lock-history') {
      this.historyValue.lock();
    }
    if (command.undoable) {
      this.historyValue.push(command);
    }
  }

  private static describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
