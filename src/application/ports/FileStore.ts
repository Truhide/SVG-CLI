/**
 * Port for text file access.
 *
 * Implementations translate platform errors into `cannot read file: <path>`
 * / `cannot write file: <path>`, which keeps command code free of errno
 * handling and lets tests use an in-memory store.
 */
export interface FileStore {
  read(path: string): string;
  write(path: string, contents: string): void;
}
