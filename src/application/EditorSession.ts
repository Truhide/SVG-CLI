import type { Document } from '../domain/Document';
import { EditorError } from '../domain/errors/EditorError';
import type { Command } from './Command';
import { CommandHistory } from './CommandHistory';
import { CommandLine } from './CommandLine';
import { CommandRegistry } from './CommandRegistry';
import type { CommandResult } from './CommandResult';
import type { DocumentCodec } from './ports/DocumentCodec';
import type { FileStore } from './ports/FileStore';
import type { ShapeFactory } from './shapes/ShapeFactory';

/**
 * Use-case facade of the editor.
 *
 * It owns the current document, the undo history and the two ports; the REPL
 * is only one possible driver of it (a script or an agent channel would call
 * `execute` with the same strings).  Commands are executed through a
 * registry and never print, so the whole session is testable without IO.
 */
export class EditorSession {
  private documentValue: Document | null = null;
  private pathValue: string | null = null;
  private readonly historyValue = new CommandHistory();
  private readonly registryValue = new CommandRegistry();

  constructor(
    readonly codec: DocumentCodec,
    readonly files: FileStore,
    readonly shapeFactory: ShapeFactory,
  ) {}

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
      const command = this.registryValue.create(commandLine.name, this, commandLine.args);
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
    return this.registryValue.names();
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
