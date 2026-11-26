/** Kind of a directory entry, as reported by `dir`. */
export type DirectoryEntryKind = 'dir' | 'file' | 'link';

export interface DirectoryEntry {
  readonly name: string;
  readonly kind: DirectoryEntryKind;
  /** Link target for `kind: 'link'`; never followed. */
  readonly target?: string;
}

/**
 * Port for "list one directory" - the target of the `dir` adapter.
 *
 * The command depends on this interface only, so its tests use a test
 * double, while the CLI wires the Node implementation (`NodeDirectoryLister`).
 * Implementations translate platform errors into `cannot read directory:
 * <path>`.
 */
export interface DirectoryLister {
  list(path: string): DirectoryEntry[];
}
