import { EditorSession } from '../application/EditorSession';
import type { PluginContext } from '../application/extension/PluginContext';
import { createPluginServices } from '../host/PluginContextFactory';
import { createHost } from '../host/PluginHost';
import { NodeDirectoryLister } from '../infrastructure/fs/NodeDirectoryLister';
import { NodeFileStore } from '../infrastructure/fs/NodeFileStore';
import { SvgCodec } from '../infrastructure/svg/SvgCodec';
import { CliApp } from './CliApp';
import { ConsoleOutput } from './ConsoleOutput';

/**
 * Process entry point.
 *
 * `--config <file>` switches from the composition root to the plugin config
 * loader; everything else is identical, which is what makes the two assembly
 * modes comparable byte for byte.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const configPath = configIndex < 0 ? null : (args[configIndex + 1] ?? null);
  const output = new ConsoleOutput();
  const services = createPluginServices(new NodeDirectoryLister(), () => process.cwd());
  const context = await createHost(services, configPath, (line) => output.println(line));
  const session = new EditorSession({
    codec: new SvgCodec(context.shapes),
    files: new NodeFileStore(),
    shapes: context.shapes,
    commands: context.commands,
    decorators: context.decorators,
    attributes: context.attributes,
    events: context.events,
  });
  await new CliApp(session, output).run();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

export type { PluginContext };
