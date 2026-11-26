# 指标（Phase 1 → Phase 2）

本目录的全部数字由 `scripts/metrics.mjs` 从 git 历史生成，不接受手填：

```bash
node scripts/metrics.mjs final p2
```

- 范围：CLI 源码（`src/`、`plugins/`），排除测试、文档、依赖、构建产物与配置文件。
- 分层：内核 = `src/domain` + `src/application`；装配处 = `src/host` + `src/cli` + `src/infrastructure`；插件 = `src/plugins` + `plugins/`。
- 行数 = 非空代码行；复杂度 = 1 + 判定点数量（`if`/`for`/`while`/`case`/`catch`/`&&`/`||`/`??`），先去掉注释与字符串再统计，属于文件级近似。
- VSCode 扩展（`vscode-extension/`）单独统计于 `vscode.md`，不混入 CLI 增量。

文件：

- `files.md`：逐文件清单与增量。
- `layers.md`：按内核 / 装配处 / 插件三类汇总。
- `vscode.md`：VSCode 扩展单独统计。
