# SVG CLI 编辑器（Lab1 Phase 1 + Phase 2）

TypeScript + 面向对象的 SVG 编辑器命令行：**Command** 模式做编辑与撤销、**Composite** 模式统一容器与叶子、Phase 2 把内核重构成**四个扩展点 + 插件包**的形态，并附一个 VSCode 扩展（SVG 文件标记与大纲）。

**代码仓库：[https://github.com/Truhide/SVG-CLI](https://github.com/Truhide/SVG-CLI)**（`final` = Phase 1 收尾，`p2` = Phase 2 收尾）

## 快速开始

需要 Node.js 20 以上（开发环境为 Node 24）。

```bash
git clone https://github.com/Truhide/SVG-CLI.git
cd SVG-CLI
npm install
npm run cli                      # 方式 A：组合根装配（内置 + 可选插件）
npm run cli -- --config plugins.config.json   # 方式 B：配置装配
```

启动后是一个 `svg>` 提示符的 REPL：

```text
$ npm run cli
svg-editor 0.1 — type 'help' for commands

svg> init 400 200
canvas 400x200 created
svg> create box n1 120 100 160 60 "开始"
g#n1 created
svg> tree
svg (400x200) *
└── g#n1 (box) *
    ├── rect#n1-rect   x=120 y=100 w=160 h=60 *
    └── text#n1-label  (140,135) "开始" *
svg> stats
rect: 1  text: 1  (total 2, containers 1)
svg> dir
[DIR]  plugins
[FILE]  package.json
```

`save` 的输出是标准 SVG，可以直接用浏览器打开预览。`box`、`stats`、`dir` 与 `*` 标签都来自插件，卸载插件（空配置）后回到 Phase 1 的命令与图形。

## 脚本回放

`#` 开头的整行是注释，所以命令序列可以存成文本回放：

```bash
npm run cli < doc/transcript/cli-2-box.txt
npm run cli -- --config plugins.config.json < doc/transcript/cli-2-box.txt
```

两种装配的输出逐字节相同（`tests/cli-assembly.test.ts`）。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run cli` | 启动 REPL（方式 A） |
| `npm run cli -- --config plugins.config.json` | 按配置装配（方式 B） |
| `npm test` | 运行全部测试（Node 内置 test runner + tsx） |
| `npm run typecheck` | 类型检查（含 `plugins/`） |
| `npm run build` | 编译到 `dist/` |
| `node scripts/metrics.mjs final p2` | 从 git 历史生成 `docs/metrics/` |

## 目录

```text
src/
  domain/          # 内核模型：Shape/GroupShape/Document/StyleAttributes
  application/     # 内核用例：session、注册表、扩展点接口、format、ports
  host/            # 装配处：PluginHost、assemble(A)、PluginLoader(B)、manifest
  infrastructure/  # 适配器：XML/SVG 读写、Node 文件系统与目录
  plugins/         # 既有插件包：builtin-shapes、builtin-commands
  cli/             # 驱动：REPL、输出、入口 main.ts
plugins/           # 新增插件包：box、stats、dir、modified-star
vscode-extension/  # 第一部分：VSCode 扩展（文件标记 + SVG 大纲）
tests/             # node:test 用例与测试替身
doc/               # 设计文档、ADR、transcript、架构图
docs/metrics/      # 由脚本生成的指标
```

## 文档

- Phase 2 设计说明：[`doc/README.md`](doc/README.md)（扩展点清单、两种装配、ADR、指标、过程记录）
- VSCode 扩展：[`doc/vscode-extension.md`](doc/vscode-extension.md)
- 指标：[`docs/metrics/README.md`](docs/metrics/README.md)
