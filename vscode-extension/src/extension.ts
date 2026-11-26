import * as vscode from 'vscode';
import { SvgBadgeProvider } from './SvgBadgeProvider';
import { LineIndex, SvgOutlineNode, SvgOutlineParser } from './SvgOutlineParser';

/**
 * Selectors for the symbol provider.
 *
 * `.svg` normally gets our own `svg` language id (see `contributes.languages`),
 * but files opened before this extension contributed the association - or
 * workspaces where another extension claims `.svg` - can still be `xml`.
 * Registering the `xml` case only for `**\/*.svg` keeps plain `.xml` files
 * untouched while making the outline reliable either way.
 */
const SVG_SELECTOR: vscode.DocumentSelector = [
  { language: 'svg' },
  { language: 'xml', pattern: '**/*.svg' },
];

/** Contributed as `svgOutline.focusOutline` (see package.json). */
const FOCUS_OUTLINE_COMMAND = 'svgOutline.focusOutline';

/** Turns the offset based outline into the editor's own symbol model. */
export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): vscode.DocumentSymbol[] {
    if (token.isCancellationRequested) {
      return [];
    }
    try {
      const text = document.getText();
      const nodes = SvgOutlineParser.parse(text);
      if (nodes.length === 0) {
        return [];
      }
      return toDocumentSymbols(nodes, new LineIndex(text));
    } catch {
      // A malformed or half typed document may produce no outline at all, but
      // must never surface an error to the user.
      return [];
    }
  }
}

function toDocumentSymbols(nodes: readonly SvgOutlineNode[], index: LineIndex): vscode.DocumentSymbol[] {
  return nodes.map((node) => {
    const range = new vscode.Range(
      toPosition(index, node.start),
      toPosition(index, node.end),
    );
    const selectionRange = new vscode.Range(
      toPosition(index, node.nameStart),
      toPosition(index, node.nameEnd),
    );
    const symbol = new vscode.DocumentSymbol(
      node.label,
      node.id === undefined ? node.tagName : `id="${node.id}"`,
      vscode.SymbolKind.Object,
      range,
      selectionRange,
    );
    if (node.children.length > 0) {
      symbol.children = toDocumentSymbols(node.children, index);
    }
    return symbol;
  });
}

function toPosition(index: LineIndex, offset: number): vscode.Position {
  const point = index.positionAt(offset);
  return new vscode.Position(point.line, point.character);
}

/**
 * Called once, when one of the declared activation events fires
 * (`onLanguage:svg`, `workspaceContains:**\/*.svg`, `onCommand:...`).
 * Everything the extension offers is registered here; the `Disposable`s land in
 * `context.subscriptions` so VSCode can unregister them on deactivate.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(new SvgBadgeProvider()),
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(SVG_SELECTOR, new SvgDocumentSymbolProvider(), {
      label: 'SVG Outline',
    }),
  );
  // Convenience entry point: on some builds the Outline section of the Explorer
  // starts collapsed, so the view is one command (and one keybinding) away.
  context.subscriptions.push(
    vscode.commands.registerCommand(FOCUS_OUTLINE_COMMAND, async () => {
      await vscode.commands.executeCommand('outline.focus');
    }),
  );
}

export function deactivate(): void {
  // Nothing to do: every registration is disposed through `context.subscriptions`.
}
