/**
 * Minimal ambient declarations for the VSCode extension API surface used by
 * this extension. Written by hand on purpose: the lab must build offline, so
 * `@types/vscode` / `npm install` is not an option. Only the members listed
 * here exist for the type checker; the real `vscode` module is injected by the
 * extension host at runtime.
 */
declare module 'vscode' {
  export class Position {
    constructor(line: number, character: number);
    readonly line: number;
    readonly character: number;
  }

  export class Range {
    constructor(start: Position, end: Position);
    readonly start: Position;
    readonly end: Position;
  }

  export class ThemeColor {
    constructor(id: string);
  }

  export enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11,
    Variable = 12,
    Constant = 13,
    String = 14,
    Number = 15,
    Boolean = 16,
    Array = 17,
    Object = 18,
    Key = 19,
    Null = 20,
    EnumMember = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25,
  }

  export enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64,
  }

  export interface FileStat {
    readonly type: FileType;
    readonly ctime: number;
    readonly mtime: number;
    readonly size: number;
  }

  export interface Uri {
    readonly scheme: string;
    readonly path: string;
    readonly fsPath: string;
    toString(): string;
  }

  export interface Disposable {
    dispose(): void;
  }

  export interface CancellationToken {
    readonly isCancellationRequested: boolean;
  }

  export type Thenable<T> = PromiseLike<T>;

  export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;

  export interface FileDecoration {
    badge?: string;
    tooltip?: string;
    color?: ThemeColor;
    propagate?: boolean;
  }

  export interface FileDecorationProvider {
    provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration>;
  }

  export interface DocumentFilter {
    language?: string;
    scheme?: string;
    pattern?: string;
  }

  export type DocumentSelector = string | DocumentFilter | ReadonlyArray<string | DocumentFilter>;

  export class DocumentSymbol {
    constructor(name: string, detail: string, kind: SymbolKind, range: Range, selectionRange: Range);
    name: string;
    detail: string;
    kind: SymbolKind;
    range: Range;
    selectionRange: Range;
    children: DocumentSymbol[];
  }

  export interface TextDocument {
    readonly uri: Uri;
    readonly languageId: string;
    readonly lineCount: number;
    getText(range?: Range): string;
  }

  export interface DocumentSymbolProviderMetadata {
    label?: string;
  }

  export interface DocumentSymbolProvider {
    provideDocumentSymbols(
      document: TextDocument,
      token: CancellationToken,
    ): ProviderResult<DocumentSymbol[]>;
  }

  export interface ExtensionContext {
    readonly subscriptions: { dispose(): void }[];
  }

  export namespace window {
    export function registerFileDecorationProvider(provider: FileDecorationProvider): Disposable;
  }

  export namespace commands {
    export function registerCommand(
      command: string,
      callback: (...args: unknown[]) => unknown,
      thisArg?: unknown,
    ): Disposable;
    export function executeCommand<T = unknown>(command: string, ...rest: unknown[]): Thenable<T>;
  }

  export namespace workspace {
    export namespace fs {
      export function stat(uri: Uri): Thenable<FileStat>;
    }
  }

  export namespace languages {
    export function registerDocumentSymbolProvider(
      selector: DocumentSelector,
      provider: DocumentSymbolProvider,
      metadata?: DocumentSymbolProviderMetadata,
    ): Disposable;
  }
}
