# SVG Outline & Badge —— VSCode 扩展（Lab1 Phase 2）

一个小而完整的 VSCode 扩展，用来演示两件事：

- **A.1 文件标记**：Explorer 里 `.svg` 文件右侧显示 `[]` 徽标（只改界面，不动文件名、不动文件内容，非 SVG 文件与目录不加标记）。
- **A.2 SVG 大纲**：打开 `.svg` 文本文件时，VSCode 原生 **Outline**（大纲）里展示元素嵌套层级，节点显示 `标签名` 或 `标签名#id`，点击节点定位到标签名所在位置，编辑内容后自动刷新，XML 不完整时最多清空大纲、绝不抛异常。

设计与取舍分析见 [`../doc/vscode-extension.md`](../doc/vscode-extension.md)。

## 目录结构

```
vscode-extension/
├─ package.json                 # 扩展清单：main / engines / activationEvents / contributes
├─ tsconfig.json                # 编译到 out/，types/ 下自带最小 vscode.d.ts
├─ types/vscode.d.ts            # 手写的最小 vscode 模块声明（离线，不用 @types/vscode）
├─ src/extension.ts             # activate(): 注册装饰提供者 + 符号提供者 + 聚焦大纲命令
├─ src/SvgBadgeProvider.ts      # FileDecorationProvider：*.svg → { badge: '[]' }
├─ src/SvgOutlineParser.ts      # 容错 XML 扫描器（纯函数、无 vscode 依赖、绝不抛错）
├─ tests/outline.test.ts        # node:test 单测（11 条）
├─ tests/tsconfig.json          # 只做类型检查
├─ examples/example.svg         # 大纲示例（g#flowchart / rect#start / text / g#inner）
├─ examples/outline-demo.svg    # 更复杂：注释、CDATA、属性里含 `>`、defs/gradient
├─ scripts/capture-screenshots.ps1  # 抓窗口截图并转 jpg
└─ .vscode/{launch.json,tasks.json} # F5 调试配置
```

## 编译

本机没有联网安装依赖，编译用仓库内已有的 TypeScript 5.9.3：

```powershell
# 在 vscode-extension/ 目录下
node ../node_modules/typescript/bin/tsc -p tsconfig.json

# 或在仓库根目录
node node_modules/typescript/bin/tsc -p vscode-extension/tsconfig.json
```

产物在 `vscode-extension/out/`：`extension.js`、`SvgBadgeProvider.js`、`SvgOutlineParser.js`（含 sourcemap）。
`tsc` 零错误即成功；`out/extension.js` 就是 `package.json` 里 `main` 指向的入口。

## 启动

### 方式 1：F5 调试（推荐）

1. 在 VSCode 里打开 **`vscode-extension` 这个目录本身**（`文件 → 打开文件夹`）。
2. 按 `F5`（或 `运行 → 启动调试`）。`.vscode/tasks.json` 会先跑 `tsc: build`，然后 `.vscode/launch.json` 以 `--extensionDevelopmentPath=${workspaceFolder}` 打开 `examples/` 作为演示工作区。
3. 弹出的新窗口标题带 `[扩展开发宿主] / [Extension Development Host]`，说明扩展已加载。

### 方式 2：命令行启动扩展开发宿主

```powershell
$ext = "D:\DSHworkspace\05_其他项目\lab1-svg-editor\vscode-extension"
$ws  = "$ext\.verify\workspace"          # 任选一个含 .svg 的工作区目录

& "C:\Users\sxx3a\AppData\Microsoft VS Code\bin\code.cmd" `
    --extensionDevelopmentPath="$ext" --new-window "$ws" "$ws\example.svg"
```

### 方式 3：安装成普通扩展

```powershell
# a) 打包成 vsix（需要 vsce，联网环境）后安装
code --install-extension vscode-svg-outline-0.1.0.vsix

# b) 完全离线：把整个目录拷到扩展目录，VSCode 会按 package.json 识别
Copy-Item -Recurse $ext "$env:USERPROFILE\.vscode\extensions\lab1.vscode-svg-outline-0.1.0"
# 重启 VSCode 生效
```

> 安装版与 F5 版行为一致；改完代码后安装版需要重新拷贝并重载窗口。

## 示例 SVG

`examples/example.svg`（大纲层级正好对应实验要求）：

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <g id="flowchart">
    <rect id="start" x="20" y="20" width="120" height="60" fill="#4a90d9"/>
    <text x="40" y="60">开始</text>
    <g id="inner">
      <circle id="dot" cx="200" cy="50" r="10"/>
    </g>
  </g>
</svg>
```

大纲应为：

```
svg
└─ g#flowchart
   ├─ rect#start
   ├─ text              ← 无 id，只显示标签名
   └─ g#inner
      └─ circle#dot
```

`examples/outline-demo.svg` 覆盖更多边界：XML 声明、注释、`<![CDATA[ ]]>`、属性值里含 `>`（`data-note="x > y"`）、`defs/linearGradient`、自闭合标签。

## 操作步骤

### A.1 文件标记

1. 用上面任一方式启动扩展开发宿主，打开含 `.svg` 的文件夹。
2. Explorer 中 `.svg` 文件右侧出现 `[]`；鼠标悬停显示 `SVG file`，颜色为 `charts.purple`。
3. `notes.txt`、`.vscode`、`images` 等非 SVG 文件与目录没有标记；文件名与文件内容都不被修改。

> 激活时机：`workspaceContains:**/*.svg`（工作区里有 SVG 就会激活）或 `onLanguage:svg`（第一次打开 SVG 文档）。若工作区里没有 `.svg` 且没打开过 SVG，扩展不会激活，自然也没有徽标。

### A.2 SVG 大纲

1. 打开 `example.svg`（若它被内置的媒体预览接管，见「已知限制」第一条，先切回文本编辑器）。
2. 左下方 **Outline**（大纲）出现层级树，节点显示 `svg`、`g#flowchart`、`rect#start`、`text`、`g#inner`、`circle#dot`。
3. 点击 `rect#start`：光标跳到第 3 行的 `rect` 上（`selectionRange` = 标签名区间），整行高亮，面包屑同步变成 `example.svg > {} svg > {} g#flowchart > {} rect#start`。
4. 直接编辑文本（增删元素、改 `id`、改嵌套）：大纲随输入自动重建，无需保存。
5. 把文档改坏（例如删掉 `</g>`）：大纲退化为已解析的部分或清空，不弹错误、不崩溃；补全后恢复。

若 Outline 面板被折叠或隐藏：`Ctrl+Alt+O`（本扩展命令 `SVG: 聚焦 SVG 大纲`），或在命令面板执行 `Explorer: Focus on Outline View`。

### 单元测试

```powershell
# 在仓库根目录（tsx 已在仓库 node_modules 中）
node --import tsx --test vscode-extension/tests/outline.test.ts
```

覆盖：嵌套分组、无 id 元素、`标签名#id` 命名、编辑后重新解析、不完整 XML 不抛错、属性里含 `>` 或引号、注释/CDATA/DOCTYPE、病态输入不崩溃、区间与父子包含关系。

## 截图脚本

`scripts/capture-screenshots.ps1` 把扩展开发宿主窗口截图并转成 jpg（本仓库两张图就是它拍的）：

```powershell
# 列出可截图窗口标题
powershell -File scripts/capture-screenshots.ps1 -ListWindows

# 拍 Explorer 徽标图
powershell -File scripts/capture-screenshots.ps1 `
    -TitlePattern 'Extension Development Host' `
    -OutFile ..\docs\images\vscode-svg-badge.jpg

# 拍大纲图（先手动点选 rect#start，再执行）
powershell -File scripts/capture-screenshots.ps1 `
    -TitlePattern 'Extension Development Host' `
    -OutFile ..\docs\images\vscode-svg-outline.jpg
```

要点：脚本会先 `SetProcessDPIAware()`，否则在高 DPI 下 `PrintWindow` 只渲染窗口左上 2/3（Outline 会被裁掉）；先试 `PrintWindow(PW_RENDERFULLCONTENT)`，拿到空白再退回 `CopyFromScreen`；两者都空白会报错而不是写出一张黑图。

## 已知限制

1. **`.svg` 的编辑器归属**：本机 VSCode 1.144 默认把 `*.svg` 关联到内置媒体预览（渲染成图片）。要看文本 + 大纲，需把工作区设置成
   `"workbench.editorAssociations": { "*.svg": "default" }`，或用「重新打开方式 → 文本编辑器」。
2. **语言 id 覆盖**：内置 `xml` 扩展已经声明了 `.svg`，本扩展又声明了 `svg` 语言 id。好处是能稳定用 `{ language: 'svg' }` 选择器；代价是 `.svg` 不再走 `text.xml` 语法高亮（变成纯文本）。为兜底，符号提供者同时注册了 `{ language: 'xml', pattern: '**/*.svg' }`，两种归属都能出大纲；若更看重高亮，可把 `contributes.languages` 整段删掉（大纲仍然工作）。
3. **装饰的判定成本**：为区分「目录名恰好叫 `x.svg`」，`provideFileDecoration` 对每个候选 URI 调一次 `workspace.fs.stat`（异步、不缓存）。大目录首次渲染会有若干次 stat 调用；本实验规模无感。
4. **只处理 `file:` scheme**：虚拟文档（git diff、output 面板）不打徽标。
5. **大纲是只读视图**：不写回文件、不做增量解析（每次按键全量扫描，KB 级文档足够快），也不解释 XML 语义（命名空间前缀原样保留、`<use>` 引用不展开）。
6. **容错策略是「尽量给」**：未闭合元素延伸到文末，错配的结束标签就近隐式闭合，多余结束标签被忽略；无元素输入返回空数组（大纲清空）。
7. **截图依赖交互式桌面会话**：无桌面 / 黑屏环境下脚本会明确报错，不会伪造图片。
