import { EditorSession } from '../../src/application/EditorSession';
import { ShapeFactory } from '../../src/application/shapes/ShapeFactory';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec';
import { InMemoryFileStore } from './InMemoryFileStore';

/** Session wired with in-memory ports; `run` returns the printed lines. */
export class TestEditor {
  readonly files = new InMemoryFileStore();
  readonly session: EditorSession;

  constructor() {
    const shapes = new ShapeFactory();
    this.session = new EditorSession(new SvgCodec(shapes), this.files, shapes);
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
