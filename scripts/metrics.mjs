#!/usr/bin/env node
/**
 * Generates docs/metrics/ from git history.
 *
 * Every number in docs/metrics is produced by this script - nothing is typed
 * by hand.  Scope: the CLI (src/ and plugins/), split into the three layers
 * the report asks for (kernel / host / plugin).  Tests, docs, config files,
 * dependencies and build output are excluded; the VSCode extension is listed
 * separately and never folded into the CLI delta.
 *
 * Cyclomatic complexity is a file-level approximation: 1 + the number of
 * decision points (`if`, `for`, `while`, `case`, `catch`, `&&`, `||`, `??`).
 * It is good enough to compare two revisions of the same code base; it is not
 * a substitute for a per-function measurement.
 *
 * Usage: node scripts/metrics.mjs [fromRev] [toRev]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const FROM_LABEL = process.argv[2] ?? 'final';
const TO_LABEL = process.argv[3] ?? 'p2';

const LAYERS = [
  { id: 'kernel', title: '内核（src/domain + src/application）', prefixes: ['src/domain/', 'src/application/'] },
  { id: 'host', title: '装配处与适配器（src/host + src/cli + src/infrastructure）', prefixes: ['src/host/', 'src/cli/', 'src/infrastructure/'] },
  { id: 'plugin', title: '插件（src/plugins + plugins）', prefixes: ['src/plugins/', 'plugins/'] },
];

const FROM_REV = revisionOrNull(FROM_LABEL) ?? FROM_LABEL;
const TO_REV = revisionOrNull(TO_LABEL) ?? 'HEAD';

function revisionOrNull(rev) {
  try {
    return git(['rev-parse', '--verify', `${rev}^{commit}`]).trim();
  } catch {
    return null;
  }
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function listFiles(rev) {
  return git(['ls-tree', '-r', '--name-only', rev])
    .split('\n')
    .filter((path) => path !== '');
}

function readAt(rev, path) {
  return git(['show', `${rev}:${path}`]);
}

function isSource(path) {
  return path.endsWith('.ts') && !path.endsWith('.d.ts');
}

function inCliScope(path) {
  return (
    isSource(path) &&
    LAYERS.some((layer) => layer.prefixes.some((prefix) => path.startsWith(prefix)))
  );
}

function layerOf(path) {
  const layer = LAYERS.find((candidate) =>
    candidate.prefixes.some((prefix) => path.startsWith(prefix)),
  );
  return layer === undefined ? 'other' : layer.id;
}

/** Removes comments and string literals so they do not inflate the count. */
function stripNoise(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

function measure(source) {
  const lines = source.split('\n');
  const codeLines = lines.filter((line) => line.trim() !== '').length;
  const clean = stripNoise(source);
  const decisions = [
    /\bif\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g,
  ].reduce((total, pattern) => total + (clean.match(pattern)?.length ?? 0), 0);
  return { totalLines: lines.length - 1, codeLines, complexity: 1 + decisions };
}

function snapshot(rev) {
  const result = new Map();
  for (const path of listFiles(rev)) {
    if (!inCliScope(path)) {
      continue;
    }
    result.set(path, measure(readAt(rev, path)));
  }
  return result;
}

function vscodeFiles(rev) {
  return listFiles(rev).filter((path) => path.startsWith('vscode-extension/src/') && isSource(path));
}

const from = snapshot(FROM_REV);
const to = snapshot(TO_REV);
const paths = [...new Set([...from.keys(), ...to.keys()])].sort();

const rows = paths.map((path) => {
  const before = from.get(path);
  const after = to.get(path);
  return {
    path,
    layer: layerOf(path),
    beforeLines: before?.codeLines ?? 0,
    afterLines: after?.codeLines ?? 0,
    beforeComplexity: before?.complexity ?? 0,
    afterComplexity: after?.complexity ?? 0,
    status: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
  };
});

const totals = new Map(
  LAYERS.map((layer) => [
    layer.id,
    { files: 0, beforeLines: 0, afterLines: 0, beforeComplexity: 0, afterComplexity: 0, added: 0, removed: 0 },
  ]),
);
for (const row of rows) {
  const total = totals.get(row.layer);
  if (total === undefined) {
    continue;
  }
  total.files += 1;
  total.beforeLines += row.beforeLines;
  total.afterLines += row.afterLines;
  total.beforeComplexity += row.beforeComplexity;
  total.afterComplexity += row.afterComplexity;
  if (row.status === 'added') {
    total.added += 1;
  }
  if (row.status === 'removed') {
    total.removed += 1;
  }
}

function delta(before, after) {
  const value = after - before;
  return value >= 0 ? `+${value}` : `${value}`;
}

function fileTable() {
  const lines = [
    `# 文件清单（${FROM_LABEL} → ${TO_LABEL}）`,
    '',
    `由 \`node scripts/metrics.mjs ${FROM_LABEL} ${TO_LABEL}\` 生成。行数=非空代码行；复杂度=1+判定点（近似值）。`,
    '',
    '| 层 | 文件 | 状态 | 行数 ' + FROM_LABEL + ' | 行数 ' + TO_LABEL + ' | 行数增量 | 复杂度 ' + FROM_LABEL + ' | 复杂度 ' + TO_LABEL + ' | 复杂度增量 |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.layer} | \`${row.path}\` | ${row.status} | ${row.beforeLines} | ${row.afterLines} | ${delta(
        row.beforeLines,
        row.afterLines,
      )} | ${row.beforeComplexity} | ${row.afterComplexity} | ${delta(
        row.beforeComplexity,
        row.afterComplexity,
      )} |`,
    );
  }
  return lines.join('\n');
}

function layerTable() {
  const lines = [
    `# 分层汇总（${FROM_LABEL} → ${TO_LABEL}）`,
    '',
    '| 层 | 文件数 | 行数 ' + FROM_LABEL + ' | 行数 ' + TO_LABEL + ' | 行数增量 | 复杂度 ' + FROM_LABEL + ' | 复杂度 ' + TO_LABEL + ' | 复杂度增量 |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const layer of LAYERS) {
    const total = totals.get(layer.id);
    lines.push(
      `| ${layer.title} | ${total.files} | ${total.beforeLines} | ${total.afterLines} | ${delta(
        total.beforeLines,
        total.afterLines,
      )} | ${total.beforeComplexity} | ${total.afterComplexity} | ${delta(
        total.beforeComplexity,
        total.afterComplexity,
      )} |`,
    );
  }
  const sum = [...totals.values()].reduce(
    (acc, total) => ({
      files: acc.files + total.files,
      beforeLines: acc.beforeLines + total.beforeLines,
      afterLines: acc.afterLines + total.afterLines,
      beforeComplexity: acc.beforeComplexity + total.beforeComplexity,
      afterComplexity: acc.afterComplexity + total.afterComplexity,
    }),
    { files: 0, beforeLines: 0, afterLines: 0, beforeComplexity: 0, afterComplexity: 0 },
  );
  lines.push(
    `| 合计 | ${sum.files} | ${sum.beforeLines} | ${sum.afterLines} | ${delta(
      sum.beforeLines,
      sum.afterLines,
    )} | ${sum.beforeComplexity} | ${sum.afterComplexity} | ${delta(
      sum.beforeComplexity,
      sum.afterComplexity,
    )} |`,
  );
  lines.push('');
  lines.push('## 新增/删除文件');
  lines.push('');
  for (const row of rows.filter((candidate) => candidate.status !== 'changed')) {
    lines.push(`- ${row.status === 'added' ? '新增' : '删除'} \`${row.path}\`（${row.layer}）`);
  }
  return lines.join('\n');
}

function vscodeTable() {
  const files = [...new Set([...vscodeFiles(FROM_REV), ...vscodeFiles(TO_REV)])].sort();
  const lines = [
    '# VSCode 扩展（单独统计，不计入 CLI 增量）',
    '',
    `由 \`node scripts/metrics.mjs ${FROM_LABEL} ${TO_LABEL}\` 生成。`,
    '',
    '| 文件 | 行数 | 复杂度（近似） |',
    '|---|---|---|',
  ];
  for (const path of files) {
    const source = readAt(TO_REV, path);
    const measurement = measure(source);
    lines.push(`| \`${path}\` | ${measurement.codeLines} | ${measurement.complexity} |`);
  }
  if (files.length === 0) {
    lines.push('| （本修订没有 VSCode 扩展源码） | 0 | 0 |');
  }
  return lines.join('\n');
}

function readme() {
  return [
    '# 指标（Phase 1 → Phase 2）',
    '',
    '本目录的全部数字由 `scripts/metrics.mjs` 从 git 历史生成，不接受手填：',
    '',
    '```bash',
    `node scripts/metrics.mjs ${FROM_LABEL} ${TO_LABEL}`,
    '```',
    '',
    '- 范围：CLI 源码（`src/`、`plugins/`），排除测试、文档、依赖、构建产物与配置文件。',
    '- 分层：内核 = `src/domain` + `src/application`；装配处 = `src/host` + `src/cli` + `src/infrastructure`；插件 = `src/plugins` + `plugins/`。',
    '- 行数 = 非空代码行；复杂度 = 1 + 判定点数量（`if`/`for`/`while`/`case`/`catch`/`&&`/`||`/`??`），先去掉注释与字符串再统计，属于文件级近似。',
    '- VSCode 扩展（`vscode-extension/`）单独统计于 `vscode.md`，不混入 CLI 增量。',
    '',
    '文件：',
    '',
    '- `files.md`：逐文件清单与增量。',
    '- `layers.md`：按内核 / 装配处 / 插件三类汇总。',
    '- `vscode.md`：VSCode 扩展单独统计。',
  ].join('\n');
}

const outDir = join(ROOT, 'docs', 'metrics');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'README.md'), `${readme()}\n`, 'utf8');
writeFileSync(join(outDir, 'files.md'), `${fileTable()}\n`, 'utf8');
writeFileSync(join(outDir, 'layers.md'), `${layerTable()}\n`, 'utf8');
writeFileSync(join(outDir, 'vscode.md'), `${vscodeTable()}\n`, 'utf8');

const summary = LAYERS.map((layer) => {
  const total = totals.get(layer.id);
  return `${layer.id}: ${total.files} files, ${total.afterLines} lines, complexity ${total.afterComplexity}`;
});
console.log(`metrics written to ${relative(process.cwd(), outDir)}${sep}`);
console.log(summary.join('\n'));
