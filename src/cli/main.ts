import { EditorSession } from '../application/EditorSession';
import { ShapeFactory } from '../application/shapes/ShapeFactory';
import { NodeFileStore } from '../infrastructure/fs/NodeFileStore';
import { SvgCodec } from '../infrastructure/svg/SvgCodec';
import { CliApp } from './CliApp';
import { ConsoleOutput } from './ConsoleOutput';

const shapes = new ShapeFactory();
const session = new EditorSession(new SvgCodec(shapes), new NodeFileStore(), shapes);

new CliApp(session, new ConsoleOutput()).run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
