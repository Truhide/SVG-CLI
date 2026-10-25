/** The text behind `help`; kept as data so the REPL stays declarative. */
export class HelpText {
  private static readonly COMMANDS: readonly string[] = [
    'svg-editor 0.1 - commands',
    '',
    "lines starting with '#' are comments; use double quotes for values with spaces",
    '',
    'document (undo/redo is disabled after these commands)',
    '  init [w] [h]                     new canvas, default 800x600',
    '  read <file.svg>                  load a document, assigns missing ids',
    '  save [file.svg]                  save, defaults to the last read path',
    '  canvas [w] [h]                   show or change the canvas size',
    '',
    'editing (one command = one undo unit)',
    '  create <type> <id> [params] [in <containerId>]',
    '    rect <x> <y> <w> <h> [fill]',
    '    circle <cx> <cy> <r> [fill]',
    '    ellipse <cx> <cy> <rx> <ry> [fill]',
    '    line <x1> <y1> <x2> <y2> [stroke]',
    '    text <x> <y> "content"',
    '    g',
    '  delete <id>                      delete a shape or a whole container',
    '  move <id> <dx> <dy>              relative move, containers move their children',
    '  scale <id> <factor>              multiply every geometry attribute',
    '  set <id> <attr> <value>          fill | stroke | stroke-width | geometry | text',
    '  group <newGid> <id1> <id2> ...   wrap existing shapes into a new container',
    '  ungroup <gid>                    move children up to the parent',
    '  addto <gid> <id>                 move an existing shape into a container',
    '  front <id>                       raise to the top of its siblings',
    '  back <id>                        lower to the bottom of its siblings',
    '',
    'inspection',
    '  tree [id]                        structure with inline geometry',
    '  show <id>                        attribute details',
    '  help                             this text',
    '',
    'history',
    '  undo',
    '  redo',
  ];

  private constructor() {
    // static data only
  }

  static lines(): string[] {
    return [...HelpText.COMMANDS];
  }
}
