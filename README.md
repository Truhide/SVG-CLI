# SVG CLI 编辑器

Lab1 Phase 1 的实现：TypeScript + 面向对象，用 **Command** 模式做编辑与撤销、用 **Composite** 模式统一容器与叶子，实现一个以 `id` 寻址的 SVG 编辑器命令行。

**代码仓库：[https://github.com/Truhide/SVG-CLI](https://github.com/Truhide/SVG-CLI)**

## 快速开始

需要 Node.js 20 以上（开发环境为 Node 24）。

```bash
git clone https://github.com/Truhide/SVG-CLI.git
cd SVG-CLI
npm install
npm run cli
```

启动后是一个 `svg>` 提示符的 REPL：

```text
$ npm run cli
svg-editor 0.1 — type 'help' for commands

svg> init 400 200
canvas 400x200 created
svg> create g flow
g#flow created
svg> create rect start 30 70 120 60 #4a90d9 in flow
rect#start created in g#flow
svg> create line edge 150 100 250 100 black in flow
line#edge created in g#flow
svg> save demo.svg
saved to demo.svg (3 elements)
```

`save` 的输出是标准 SVG，可以直接用浏览器打开预览。

## 脚本回放

`#` 开头的整行是注释，所以命令序列可以存成文本回放：

```bash
npm run cli < examples/demo-commands.txt      # bash / zsh
Get-Content examples/demo-commands.txt | npm run cli   # PowerShell
```

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run cli` | 启动 REPL |
| `npm test` | 运行全部测试（Node 内置 test runner + tsx） |
| `npm run typecheck` | 只做类型检查 |
| `npm run build` | 编译到 `dist/` |

## 目录

```text
src/
  domain/          # 图形模型：Shape 类层次、GroupShape、Document、Transform2D
  application/     # 用例：Command/历史/会话、图形与命令注册表、端口、文本呈现
  infrastructure/  # 适配器：XML 解析、SVG 读写、Node 文件系统
  cli/             # 驱动：REPL、输出、组合根 main.ts
tests/             # node:test 用例与测试替身
examples/          # 可回放的命令脚本与示例 SVG
doc/               # 架构方案、过程记录、一致性自查、质量保证（作业文档）
```

## 文档

设计说明、设计模式落地、依赖规则、变化点假设、过程记录与自查见 [`doc/README.md`](doc/README.md)。
