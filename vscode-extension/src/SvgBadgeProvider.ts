import * as vscode from 'vscode';

/** `[]` – the marker the lab asks for, an empty pair of square brackets. */
export const SVG_BADGE = '[]';
export const SVG_TOOLTIP = 'SVG file';
/** Colors that exist in every theme, so the badge stays readable. */
export const SVG_BADGE_COLOR = 'charts.purple';

/**
 * True for paths whose last segment ends in `.svg` (case insensitive).
 * The URI *path* is used instead of `fsPath` so the rule also holds for
 * remote schemes; the caller still decides whether the URI is a file.
 */
export function isSvgPath(uriPath: string): boolean {
  return uriPath.toLowerCase().endsWith('.svg');
}

/**
 * `FileDecorationProvider` is VSCode's *lookup* hook: the host asks "what
 * decoration does this URI have?" and renders the answer on top of its own
 * Explorer row. Nothing wraps the row view, nothing delegates to a previous
 * decorator - the returned `FileDecoration` is a value object (DTO) that the
 * workbench merges with decorations from other providers by priority.
 */
export class SvgBadgeProvider implements vscode.FileDecorationProvider {
  provideFileDecoration(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.FileDecoration> {
    // Only real files on disk; virtual documents (git diffs, output panes)
    // get no badge.
    if (uri.scheme !== 'file') {
      return undefined;
    }
    if (!isSvgPath(uri.path)) {
      return undefined;
    }
    return this.decorateFile(uri, token);
  }

  private async decorateFile(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): Promise<vscode.FileDecoration | undefined> {
    try {
      // Directories named `*.svg` must stay undecorated, so the file kind is
      // confirmed instead of guessed from the name alone.
      const stat = await vscode.workspace.fs.stat(uri);
      if ((stat.type & vscode.FileType.Directory) !== 0) {
        return undefined;
      }
    } catch {
      // Deleted, unreadable or not-yet-existing file: no badge.
      return undefined;
    }
    if (token.isCancellationRequested) {
      return undefined;
    }
    return {
      badge: SVG_BADGE,
      tooltip: SVG_TOOLTIP,
      color: new vscode.ThemeColor(SVG_BADGE_COLOR),
    };
  }
}
