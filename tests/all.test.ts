/**
 * Explicit test entry point.
 *
 * `npm test` passes this single file to the Node test runner instead of a
 * glob, because glob expansion in `node --test` differs between Node
 * versions. Importing a test module registers its `test(...)` calls.
 */
import './attribute-handler.test';
import './cli-assembly.test';
import './command-line.test';
import './command-plugins.test';
import './document-commands.test';
import './editing.test';
import './errors.test';
import './history.test';
import './plugin-loader.test';
import './session.test';
import './shape-plugin.test';
import './svg-io.test';
import './tree-decorator.test';
