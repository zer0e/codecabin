---
change: add-codecabin-tools
design-doc: docs/superpowers/specs/2026-11-20-codecabin-tools-design.md
base-ref: d7b4561546acd00a77d5c5f066b7dbe446437c7b
---

# Codecabin 工具页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纯浏览器端的开发者文本转换工具页：JSON 格式化/压缩、JSON 字符串转义/去转义、Base64（UTF-8）编解码，全部转换本地完成、不上传数据。

**Architecture:** 转换逻辑与 UI 解耦——核心为 `src/tools/` 下的纯函数（统一返回判别联合 `ToolResult`），UI 为 TS 模板渲染（模板字符串只承载静态结构，用户数据一律经 `textContent`/属性赋值注入），单向数据流：输入 + 选项 → 纯函数 → 结果对象 → 渲染输出或错误。三面板同时挂载，Tab 切换仅切 `hidden`。

**Tech Stack:** Vite + 原生 TypeScript（无 UI 框架）；测试 Vitest + happy-dom；运行时零第三方依赖。

**Spec:** 技术设计事实源 `docs/superpowers/specs/2026-11-20-codecabin-tools-design.md`；需求事实源（canonical，含全部验收场景）`openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md`。本计划按 spec 论证，执行者须同时阅读两者。

## Global Constraints

- 工作目录：`/root/code/codecabin`（所有相对路径以此为根）。
- 运行时零第三方依赖；devDependencies 仅限 `vite`、`typescript`、`vitest`、`happy-dom`（`package.json` 已存在的 `dependencies.@fission-ai/openspec` 保留、不得移除，它不属于应用运行时）。
- 纯函数不向 UI 抛异常：一律返回 `{ ok: true, value: string } | { ok: false, error: string }`；`error` 为中文可读文案并附原始错误信息。
- 用户输入/输出一律经 `textContent` 或属性赋值注入 DOM，禁止拼接进 `innerHTML`（`innerHTML` 只允许用于静态模板字符串）。
- 任何转换不得触发网络请求。
- 测试文件与源码同目录，命名 `*.test.ts`；UI 测试环境为 happy-dom。
- 本仓库为全新项目，从零起步；每个 Task 末尾 git commit（消息以 conventional 前缀 + 中文描述，末尾附 `Co-Authored-By: Claude Code <noreply@anthropic.com>`）。
- TDD：Task 3–11 严格按「先写失败测试 → 跑到失败 → 最小实现 → 跑到通过 → commit」执行；Task 1–2 为骨架类，以命令可观察结果为验收；Task 12 为纯验证任务。
- 不得修改 `openspec/` 下任何产物；`tasks.md` 勾选由协调者在 build 阶段处理。

## 文件结构

| 文件 | 职责 | 创建/修改于 |
|------|------|-------------|
| `package.json` | scripts + devDependencies | T1, T2 |
| `vite.config.ts` | Vite + Vitest 配置 | T1, T2 |
| `tsconfig.json` | strict TS、DOM 环境 | T1 |
| `index.html` | 空壳，仅 `#app` 挂载点 | T1 |
| `src/main.ts` | 入口：引入样式、`renderApp(#app)` | T1 占位，T11 完善 |
| `src/style.css` | 页面基础样式 + 错误区样式 | T11 |
| `src/sanity.test.ts` | Vitest 冒烟测试 | T2 |
| `src/tools/types.ts` | `ToolResult`、`Base64Mode` 类型 | T3 |
| `src/tools/json.ts` / `json.test.ts` | JSON 格式化/压缩纯函数与单测 | T3 |
| `src/tools/escape.ts` / `escape.test.ts` | 转义/去转义纯函数与单测 | T5 |
| `src/tools/base64.ts` / `base64.test.ts` | Base64 编解码纯函数与单测 | T7 |
| `src/ui/render.ts` | 静态模板渲染 helper | T4 |
| `src/ui/panels.ts` | `renderApp` + 三面板模板与事件绑定 + Tab | T4, T6, T8, T9, T10, T11 |
| `src/ui/clipboard.ts` | 复制（clipboard API + execCommand 回退）与反馈 | T10 |
| `src/ui/panels.test.ts` | UI 行为测试（随任务增长） | T4, T6, T8, T9, T10, T11 |

## 与 tasks.md 的对应

本计划 12 个 Task 与 `openspec/changes/add-codecabin-tools/tasks.md` 的 6 组 12 条任务一一对应（该文件实际为 6 组 12 项，非 11 项）：T1↔1.1，T2↔1.2，T3↔2.1，T4↔2.2，T5↔3.1，T6↔3.2，T7↔4.1，T8↔4.2，T9↔5.1，T10↔5.2，T11↔5.3，T12↔6.1。

## Review Focus

spec 隐含但单列任务未必自然覆盖、最可能伤到使用者的输入面（每条已在归属 Task 的测试步骤中钉死）：

1. **组合宽容输入**：Base64 解码同时遇到空白/换行 + 缺失 padding + URL-safe 字符时，应正常解码而非报错（宽容规则叠加不应互相破坏）。→ Task 7。
2. **顶层标量 JSON**：`123`、`"str"` 这类合法 JSON（非对象/数组顶层）格式化与压缩应正常返回，不得误报非法。→ Task 3。
3. **空输出时点复制**：输出区为空时点「复制」应给出「无内容可复制」类反馈且不调用剪贴板 API、不抛异常。→ Task 10。
4. **HTML/脚本注入面**：粘贴含 `<img src=x onerror=...>` 的输入后，输出区与错误区只呈现纯文本，DOM 中不出现被解析的标签元素。→ Task 4（纪律适用于全部面板）。
5. **字面反斜杠序列**：输入同时含真实换行与字面 `\n` 两字符时，转义→去转义往返必须逐字符一致，字面反斜杠不得被宽容预处理吃掉。→ Task 5。

---

## 第 1 组：项目骨架

### Task 1: 初始化 Vite + 原生 TypeScript 项目（对应 tasks.md 1.1）

**Files:**
- Modify: `package.json`（保留现有 `dependencies`，新增 scripts 与 devDependencies）
- Create: `vite.config.ts`、`tsconfig.json`、`index.html`、`src/main.ts`

**Interfaces:**
- Consumes: 无
- Produces: 可 `npm run dev` / `npm run build` 的骨架；`index.html` 内含 `<div id="app"></div>` 与 `<script type="module" src="/src/main.ts">`；后续所有 Task 在此之上开发。

- [ ] **Step 1: 更新 `package.json`**

保留现有 `dependencies` 字段不动，新增：

```json
{
  "name": "codecabin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": { "@fission-ai/openspec": "^2.1.0" },
  "devDependencies": { "vite": "^7", "typescript": "^5" }
}
```

然后 `npm install`。

- [ ] **Step 2: 创建 `tsconfig.json`**

要点（实现者可自行补充无害项）：`"strict": true`、`"target": "ES2022"`、`"module": "ESNext"`、`"moduleResolution": "bundler"`、`"lib": ["ES2022", "DOM"]`、`"skipLibCheck": true`、`"noEmit": true`、`"include": ["src"]`。

- [ ] **Step 3: 创建 `vite.config.ts`（本任务不含 test 块，Task 2 再加）**

内容为空 `defineConfig({})` 级别即可（Vite 默认行为够用）。

- [ ] **Step 4: 创建 `index.html` 与 `src/main.ts` 占位**

`index.html`：`<!doctype html><html lang="zh-CN">` + `<head><meta charset="utf-8"><title>Codecabin · 本地文本转换</title></head>` + `<body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>`。

`src/main.ts`：`document.querySelector('#app')!.textContent = 'Codecabin'`（占位，Task 4 起替换为 `renderApp` 调用；中文静态文案，无用户数据）。

- [ ] **Step 5: 验证构建与 dev 服务器**

Run: `npm run build` → Expected: 退出码 0，产出 `dist/`。
Run: `npm run dev &` 后 `curl -s http://localhost:5173/ | grep 'id="app"'` → Expected: 命中该行；随后 kill dev server。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "chore: 初始化 Vite + 原生 TypeScript 项目骨架"
```

### Task 2: 接入 Vitest + happy-dom（对应 tasks.md 1.2）

**Files:**
- Modify: `package.json`、`vite.config.ts`
- Create: `src/sanity.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `vite.config.ts`
- Produces: `npm test` 命令 = `vitest run`；全局测试环境 `happy-dom`；后续 UI 测试直接 `import { describe, it, expect, vi } from 'vitest'`（不依赖 globals）。

- [ ] **Step 1: 安装 devDependencies 并加 script**

`npm i -D vitest happy-dom`；`package.json` scripts 增加 `"test": "vitest run"`。

- [ ] **Step 2: 写冒烟测试 `src/sanity.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('测试环境', () => {
  it('happy-dom 提供 document', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
  it('纯 Node 环境提供 btoa/atob/TextEncoder', () => {
    expect(atob(btoa('hi'))).toBe('hi');
    expect(new TextEncoder().encode('你').length).toBe(3);
  });
});
```

- [ ] **Step 3: 在 `vite.config.ts` 加 Vitest 配置**

文件头加 `/// <reference types="vitest/config" />`，`defineConfig` 增加：

```ts
test: {
  environment: 'happy-dom',
  include: ['src/**/*.test.ts'],
}
```

- [ ] **Step 4: 运行验证**

Run: `npm test` → Expected: 2 个测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/sanity.test.ts
git commit -m "test: 接入 Vitest + happy-dom 冒烟测试"
```

## 第 2 组：JSON 格式化/压缩

### Task 3: `src/tools/json.ts` 纯函数（对应 tasks.md 2.1）

**Files:**
- Create: `src/tools/types.ts`、`src/tools/json.ts`、`src/tools/json.test.ts`

**Interfaces:**
- Consumes: 无
- Produces（后续 Task 依赖的精确签名）:
  - `types.ts`：`export type ToolResult = { ok: true; value: string } | { ok: false; error: string };`、`export type Base64Mode = 'standard' | 'urlsafe';`
  - `json.ts`：`export function formatJson(input: string, indent?: 2 | 4): ToolResult`（默认 `indent = 2`）；`export function minifyJson(input: string): ToolResult`
  - 错误文案前缀固定为 `JSON 解析失败：`，其后附 `JSON.parse` 原始 message。

- [ ] **Step 1: 创建 `src/tools/types.ts`**（内容即上方 Interfaces 所示）

- [ ] **Step 2: 写失败测试 `src/tools/json.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson } from './json';

const compact = '{"a":1,"b":[2,3]}';
const pretty2 = '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}';
const pretty4 = '{\n    "a": 1,\n    "b": [\n        2,\n        3\n    ]\n}';

describe('formatJson', () => {
  it('紧凑 JSON 默认按 2 空格美化', () => {
    expect(formatJson(compact)).toEqual({ ok: true, value: pretty2 });
  });
  it('indent=4 时使用 4 空格', () => {
    expect(formatJson(compact, 4)).toEqual({ ok: true, value: pretty4 });
  });
  it('顶层标量 123 正常返回（Review Focus #2）', () => {
    expect(formatJson('123')).toEqual({ ok: true, value: '123' });
  });
  it('非法 JSON 返回错误结果并附原始信息', () => {
    const r = formatJson('{invalid');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('JSON 解析失败：')).toBe(true);
  });
});

describe('minifyJson', () => {
  it('多行美化 JSON 压缩为单行', () => {
    expect(minifyJson(pretty2)).toEqual({ ok: true, value: compact });
  });
  it('非法 JSON 返回错误结果', () => {
    expect(minifyJson('{invalid').ok).toBe(false);
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run src/tools/json.test.ts` → Expected: FAIL（模块不存在）。

- [ ] **Step 4: 实现 `src/tools/json.ts`**

实现即设计契约：`JSON.parse` 后 `JSON.stringify(value, null, indent)` / `JSON.stringify(value)`，try/catch 包 `JSON.parse`，catch 返回 `{ ok: false, error: 'JSON 解析失败：' + (e as Error).message }`。不向调用方抛异常。

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run src/tools/json.test.ts` → Expected: PASS（6 tests）。

- [ ] **Step 6: Commit**

```bash
git add src/tools/types.ts src/tools/json.ts src/tools/json.test.ts
git commit -m "feat: JSON 格式化/压缩纯函数与单测"
```

### Task 4: JSON 工具面板 UI（对应 tasks.md 2.2）

**Files:**
- Create: `src/ui/render.ts`、`src/ui/panels.ts`、`src/ui/panels.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: Task 3 的 `formatJson`、`minifyJson`
- Produces（UI 契约，后续 Task 4/6/8/9/10/11 与全部 UI 测试依赖）:
  - `render.ts`：`export function mountTemplate(html: string): HTMLElement`——将**静态**模板字符串经 `<template>` 解析并返回第一个元素子节点；html 中禁止出现任何运行时数据。
  - `panels.ts`：`export function renderApp(root: HTMLElement): void`——挂载当前已完成的面板（本 Task 后为 JSON 面板）。
  - DOM id 约定：面板根 `#panel-json`；输入 `#json-input`（textarea）、缩进选择 `#json-indent`（select，option value `"2"`/`"4"`，默认 2）、按钮 `#json-format` / `#json-minify`、输出 `#json-output`（只读 textarea）、错误区 `#json-error`（div，class `error`）。
  - 行为约定（三面板统一）：点击动作按钮 → 读 `input.value` → 调纯函数 → ok：`output.value = result.value` 且 `error.textContent = ''`；error：`output.value = ''` 且 `error.textContent = result.error`；任何分支都不清空用户输入。

- [ ] **Step 1: 写失败测试 `src/ui/panels.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { renderApp } from './panels';

function setup(): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  renderApp(root);
  return root;
}

describe('JSON 面板', () => {
  it('点击格式化输出美化结果并清空错误区', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1,"b":[2,3]}';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toContain('"a": 1');
    expect(r.querySelector('#json-error')!.textContent).toBe('');
  });
  it('缩进切换为 4 后格式化使用 4 空格', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1}';
    r.querySelector<HTMLSelectElement>('#json-indent')!.value = '4';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toBe('{\n    "a": 1\n}');
  });
  it('非法 JSON：错误区可读文案、输出区无伪成功结果', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{invalid';
    r.querySelector<HTMLButtonElement>('#json-minify')!.click();
    expect(r.querySelector('#json-error')!.textContent).toContain('JSON 解析失败');
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toBe('');
    expect(r.querySelector<HTMLTextAreaElement>('#json-input')!.value).toBe('{invalid');
  });
  it('HTML 注入输入仅按纯文本呈现（Review Focus #4）', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '<img src=x onerror=alert(1)>';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelectorAll('img').length).toBe(0);
    expect(r.querySelector('#json-error')!.textContent).toContain('<img');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/ui/panels.test.ts` → Expected: FAIL（`panels.ts` 不存在）。

- [ ] **Step 3: 实现 `render.ts` 与 `panels.ts`（JSON 面板）并接线 `main.ts`**

`render.ts` 按 Interfaces 实现（`<template>.innerHTML = html` 取 `content.firstElementChild`，仅承载静态结构）。`panels.ts`：JSON 面板模板（标题、textarea、select、按钮、输出、错误区，全部静态 id/class），事件绑定按行为约定；`#json-output` 设 `readonly`；静态文案用中文（「格式化」「压缩」「缩进」等）。`main.ts` 改为 `renderApp(document.querySelector('#app')!)`。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run src/ui/panels.test.ts` → Expected: PASS（4 tests）；`npm test` 全绿。

- [ ] **Step 5: dev 服务器手动验证**

Run: `npm run dev`，浏览器执行 spec 场景「压缩 JSON 美化」「切换缩进宽度」「非法 JSON 格式化」→ Expected: 与场景逐条一致。

- [ ] **Step 6: Commit**

```bash
git add src/ui/render.ts src/ui/panels.ts src/ui/panels.test.ts src/main.ts
git commit -m "feat: JSON 工具面板 UI"
```

## 第 3 组：JSON 字符串转义/去转义

### Task 5: `src/tools/escape.ts` 纯函数（对应 tasks.md 3.1）

**Files:**
- Create: `src/tools/escape.ts`、`src/tools/escape.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `ToolResult`
- Produces: `export function escapeText(input: string): ToolResult`、`export function unescapeText(input: string): ToolResult`；去转义错误文案前缀固定 `去转义失败：`。

- [ ] **Step 1: 写失败测试 `src/tools/escape.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { escapeText, unescapeText } from './escape';

describe('escapeText', () => {
  it('hello 输出无包裹引号', () => {
    expect(escapeText('hello')).toEqual({ ok: true, value: 'hello' });
  });
  it('引号/反斜杠/真实换行转义', () => {
    expect(escapeText('a"b\\c\nd')).toEqual({ ok: true, value: 'a\\"b\\\\c\\nd' });
  });
  it('字面反斜杠两字符序列不被吞（Review Focus #5）', () => {
    expect(escapeText('a\\nb')).toEqual({ ok: true, value: 'a\\\\nb' });
  });
});

describe('unescapeText', () => {
  it('基本还原', () => {
    expect(unescapeText('a\\"b')).toEqual({ ok: true, value: 'a"b' });
  });
  it('输入带成对首尾双引号的转义字面量可还原', () => {
    expect(unescapeText('"a\\"b"')).toEqual({ ok: true, value: 'a"b' });
  });
  it('真实换行按 \\n 处理不报错', () => {
    expect(unescapeText('第一行\n第二行')).toEqual({ ok: true, value: '第一行\n第二行' });
  });
  it('裸控制字符容忍（U+0009 制表符还原为字符本身）', () => {
    expect(unescapeText('x\ty')).toEqual({ ok: true, value: 'x\ty' });
  });
  it('非法转义 \\q 报错', () => {
    const r = unescapeText('a\\qb');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('去转义失败：')).toBe(true);
  });
});

describe('往返一致性', () => {
  it('中文/emoji/换行/字面反斜杠/控制字符混合文本转义后去转义逐字符一致（Review Focus #5）', () => {
    const corpus = '你好 🌍 换行\n制表\t引号"反斜杠\\ 字面\\n 结束\n\n结尾';
    const e = escapeText(corpus);
    expect(e.ok).toBe(true);
    if (e.ok) expect(unescapeText(e.value)).toEqual({ ok: true, value: corpus });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/tools/escape.test.ts` → Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/tools/escape.ts`**

`escapeText`：`{ ok: true, value: JSON.stringify(input).slice(1, -1) }`。`unescapeText` 按设计契约的宽容预处理顺序实现：① 首尾成对双引号则去除；② 真实 `\r\n`/`\r`/`\n` → 两字符 `\` + `n`；③ 其余裸控制字符 U+0000–U+001F → `\uXXXX` 转义；④ `JSON.parse('"' + processed + '"')`，try/catch 返回 `{ ok: false, error: '去转义失败：' + message }`。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run src/tools/escape.test.ts` → Expected: PASS（9 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/tools/escape.ts src/tools/escape.test.ts
git commit -m "feat: JSON 字符串转义/去转义纯函数与单测"
```

### Task 6: 转义工具面板 UI（对应 tasks.md 3.2）

**Files:**
- Modify: `src/ui/panels.ts`
- Test: `src/ui/panels.test.ts`（追加）

**Interfaces:**
- Consumes: Task 5 的 `escapeText`、`unescapeText`；Task 4 的行为约定与 `mountTemplate`
- Produces: DOM id 约定——面板根 `#panel-escape`；输入 `#escape-input`、按钮 `#escape-escape`（转义）/ `#escape-unescape`（去转义）、输出 `#escape-output`、错误区 `#escape-error`（class `error`）；`renderApp` 现挂载 JSON + 转义两个面板。

- [ ] **Step 1: 在 `src/ui/panels.test.ts` 追加失败测试**

```ts
describe('转义面板', () => {
  it('转义输出不含首尾引号', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'hello';
    r.querySelector<HTMLButtonElement>('#escape-escape')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('hello');
  });
  it('含特殊字符文本转义为 \\\" \\\\ \\n 形式', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'a"b\\c\nd';
    r.querySelector<HTMLButtonElement>('#escape-escape')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('a\\"b\\\\c\\nd');
  });
  it('去转义非法输入 \\q：错误可读、不清输入', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'a\\qb';
    r.querySelector<HTMLButtonElement>('#escape-unescape')!.click();
    expect(r.querySelector('#escape-error')!.textContent).toContain('去转义失败');
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/ui/panels.test.ts` → Expected: 新增 3 用例 FAIL（选择器为 null）。

- [ ] **Step 3: 在 `panels.ts` 增加转义面板**

复用 JSON 面板的结构模式：模板静态、事件绑定走行为约定、按钮调 `escapeText`/`unescapeText`、`renderApp` 追加挂载。静态文案「转义」「去转义」。

- [ ] **Step 4: 运行确认通过**

Run: `npm test` → Expected: 全部 PASS。

- [ ] **Step 5: dev 服务器手动验证**

对照 spec 场景「含特殊字符文本转义」「转义输出不含首尾引号」「转义往返一致」「非法转义输入」「含首尾引号的输入可还原」「真实换行视为转义换行」逐条操作确认。

- [ ] **Step 6: Commit**

```bash
git add src/ui/panels.ts src/ui/panels.test.ts
git commit -m "feat: 转义工具面板 UI"
```

## 第 4 组：Base64 编解码

### Task 7: `src/tools/base64.ts` 纯函数（对应 tasks.md 4.1）

**Files:**
- Create: `src/tools/base64.ts`、`src/tools/base64.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `ToolResult`、`Base64Mode`
- Produces: `export function encodeBase64(input: string, mode: Base64Mode): ToolResult`、`export function decodeBase64(input: string, mode: Base64Mode): ToolResult`；解码错误文案前缀固定：字符集非法 `非法 Base64 字符`、UTF-8 非法 `解码结果不是合法的 UTF-8 文本`（其后附原始 message）。

- [ ] **Step 1: 写失败测试 `src/tools/base64.test.ts`**（以下期望值均已实测核验，不得改动）

```ts
import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from './base64';

const emojiText = '你好\u{1F30D}';          // 你好🌍
const slashText = 'a\uFFFFb';               // a + U+FFFF + b，标准编码同时含 + 与 /

describe('encodeBase64', () => {
  it('中文与 emoji 标准编码（UTF-8）', () => {
    expect(encodeBase64(emojiText, 'standard')).toEqual({ ok: true, value: '5L2g5aW98J+MjQ==' });
  });
  it('URL-safe 输出不含 + / 且去 padding', () => {
    expect(encodeBase64(slashText, 'urlsafe')).toEqual({ ok: true, value: 'Ye-_v2I' });
    expect(encodeBase64(slashText, 'standard')).toEqual({ ok: true, value: 'Ye+/v2I=' });
  });
  it('URL-safe 对本应带 padding 的文本（hi）输出无 =', () => {
    expect(encodeBase64('hi', 'urlsafe')).toEqual({ ok: true, value: 'aGk' });
  });
});

describe('decodeBase64', () => {
  it('容忍空白与换行', () => {
    expect(decodeBase64('aG k=\n', 'standard')).toEqual({ ok: true, value: 'hi' });
  });
  it('缺失 padding 可解码', () => {
    expect(decodeBase64('aGk', 'standard')).toEqual({ ok: true, value: 'hi' });
  });
  it('URL-safe 兼容有/无 padding', () => {
    expect(decodeBase64('Ye-_v2I', 'urlsafe')).toEqual({ ok: true, value: slashText });
    expect(decodeBase64('Ye-_v2I=', 'urlsafe')).toEqual({ ok: true, value: slashText });
  });
  it('非法字符报错不抛异常', () => {
    const r = decodeBase64('!!!not-base64!!!', 'standard');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('非法 Base64 字符')).toBe(true);
  });
  it('非法 UTF-8 字节序列报错', () => {
    const r = decodeBase64('/+8=', 'standard'); // 字节 FF EF，非合法 UTF-8
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('解码结果不是合法的 UTF-8 文本')).toBe(true);
  });
  it('空白+缺 padding+URL-safe 字符组合输入仍可解码（Review Focus #1）', () => {
    expect(decodeBase64('Ye-_ \nv2 I', 'urlsafe')).toEqual({ ok: true, value: slashText });
  });
});

describe('往返一致性', () => {
  it('两种模式下对中文/emoji/换行混合文本 encode→decode 逐字符一致', () => {
    const corpus = '你好 🌍\n换行\t制表 "引号" \\反斜杠+';
    for (const mode of ['standard', 'urlsafe'] as const) {
      const e = encodeBase64(corpus, mode);
      expect(e.ok).toBe(true);
      if (e.ok) expect(decodeBase64(e.value, mode)).toEqual({ ok: true, value: corpus });
    }
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/tools/base64.test.ts` → Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/tools/base64.ts`**

严格按设计契约：编码 `TextEncoder → 字节 → binary string → btoa`，urlsafe 再 `+`→`-`、`/`→`_` 并去 `=`；解码 ① 去除全部空白（`\s`）② urlsafe 还原 `-`→`+`、`_`→`/` ③ 字符集校验（清洗后须匹配 `/^[A-Za-z0-9+/]*={0,2}$/` 且长度 mod 4 合法，先按模 4 补 `=`）④ `atob` → 字节 → `new TextDecoder('utf-8', { fatal: true })` 于 try/catch 中捕获非法 UTF-8。各失败点返回对应前缀的 `ToolResult` 错误。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run src/tools/base64.test.ts` → Expected: PASS（10 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/tools/base64.ts src/tools/base64.test.ts
git commit -m "feat: Base64 UTF-8 编解码纯函数与单测"
```

### Task 8: Base64 工具面板 UI（对应 tasks.md 4.2）

**Files:**
- Modify: `src/ui/panels.ts`
- Test: `src/ui/panels.test.ts`（追加）

**Interfaces:**
- Consumes: Task 7 的 `encodeBase64`、`decodeBase64`
- Produces: DOM id 约定——面板根 `#panel-base64`；输入 `#base64-input`、模式选择 `#base64-mode`（select，value `"standard"`/`"urlsafe"`，默认 standard）、按钮 `#base64-encode` / `#base64-decode`、输出 `#base64-output`、错误区 `#base64-error`；`renderApp` 现挂载全部三个面板。

- [ ] **Step 1: 追加失败测试**

```ts
describe('Base64 面板', () => {
  it('标准模式编码中文 emoji', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = '你好\u{1F30D}';
    r.querySelector<HTMLButtonElement>('#base64-encode')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#base64-output')!.value).toBe('5L2g5aW98J+MjQ==');
  });
  it('URL-safe 模式输出无 + / =', () => {
    const r = setup();
    r.querySelector<HTMLSelectElement>('#base64-mode')!.value = 'urlsafe';
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = 'a\uFFFFb';
    r.querySelector<HTMLButtonElement>('#base64-encode')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#base64-output')!.value).toBe('Ye-_v2I');
  });
  it('非法 Base64 解码错误可读且不清输入', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = '!!!not-base64!!!';
    r.querySelector<HTMLButtonElement>('#base64-decode')!.click();
    expect(r.querySelector('#base64-error')!.textContent).toContain('非法 Base64 字符');
    expect(r.querySelector<HTMLTextAreaElement>('#base64-input')!.value).toBe('!!!not-base64!!!');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/ui/panels.test.ts` → Expected: 新增 3 用例 FAIL。

- [ ] **Step 3: 在 `panels.ts` 增加 Base64 面板**

复用既有面板结构模式；编码/解码按钮读取 `#base64-mode` 当前值作为 `mode` 实参；静态文案「编码」「解码」「标准」「URL-safe」。

- [ ] **Step 4: 运行确认通过**

Run: `npm test` → Expected: 全部 PASS。

- [ ] **Step 5: dev 服务器手动验证**

对照 spec 场景「中文与 emoji 编码」「编解码往返一致」「非法 Base64 输入」「含空白与换行的输入可解码」「缺失 padding 可解码」「URL-safe 编码与解码」「URL-safe 输出无 padding 且可解码」逐条确认。

- [ ] **Step 6: Commit**

```bash
git add src/ui/panels.ts src/ui/panels.test.ts
git commit -m "feat: Base64 工具面板 UI"
```

## 第 5 组：页面集成与共用交互

### Task 9: Tab 切换骨架（对应 tasks.md 5.1）

**Files:**
- Modify: `src/ui/panels.ts`
- Test: `src/ui/panels.test.ts`（追加）

**Interfaces:**
- Consumes: `renderApp` 现挂载的三个面板根（`#panel-json`、`#panel-escape`、`#panel-base64`）
- Produces: Tab 契约——`renderApp` 顶部渲染 nav，含三个 `<button class="tab" data-tab="json|escape|base64" aria-selected>`；默认激活 json；切换时未激活面板根加 `hidden` 属性、激活面板移除，并同步 `aria-selected`；面板 DOM 永不销毁（三面板同时挂载，仅 hidden 切换）。

- [ ] **Step 1: 追加失败测试**

```ts
describe('Tab 切换', () => {
  it('默认仅 JSON 面板可见', () => {
    const r = setup();
    expect(r.querySelector('#panel-json')!.hasAttribute('hidden')).toBe(false);
    expect(r.querySelector('#panel-escape')!.hasAttribute('hidden')).toBe(true);
  });
  it('切走再切回，输入内容与模式设置保留', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1}';
    r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.click();
    r.querySelector<HTMLSelectElement>('#base64-mode')!.value = 'urlsafe';
    r.querySelector<HTMLButtonElement>('[data-tab="json"]')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-input')!.value).toBe('{"a":1}');
    expect(r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.getAttribute('aria-selected')).toBe('false');
    r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.click();
    expect(r.querySelector<HTMLSelectElement>('#base64-mode')!.value).toBe('urlsafe');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/ui/panels.test.ts` → Expected: 新增 2 用例 FAIL（无 `[data-tab]`）。

- [ ] **Step 3: 在 `panels.ts` 实现 Tab**

`renderApp` 依次 append：tab nav（静态模板）→ 三面板根 → 绑定点击切 `hidden` 与 `aria-selected`。不引入状态序列化——保留即因为同一 DOM 节点始终挂载。

- [ ] **Step 4: 运行确认通过**

Run: `npm test` → Expected: 全部 PASS。

- [ ] **Step 5: dev 服务器手动验证**

对照 spec 场景「切换后返回」确认输入保留。

- [ ] **Step 6: Commit**

```bash
git add src/ui/panels.ts src/ui/panels.test.ts
git commit -m "feat: Tab 切换骨架（面板常驻、hidden 切换）"
```

### Task 10: 一键复制与反馈（对应 tasks.md 5.2）

**Files:**
- Create: `src/ui/clipboard.ts`
- Modify: `src/ui/panels.ts`（三面板模板各加复制按钮并接线）
- Test: `src/ui/panels.test.ts`（追加）

**Interfaces:**
- Consumes: 三面板的 `#*-output` 与面板根
- Produces: `clipboard.ts`：`export function copyText(text: string, button: HTMLButtonElement): Promise<void>`——空文本直接反馈「无内容可复制」；否则优先 `navigator.clipboard.writeText`，不可用或 reject 时回退临时 textarea + `document.execCommand('copy')`；成功反馈「已复制」、失败反馈「复制失败：<原因>」，均在 1500ms 后恢复按钮原文「复制」。DOM id 新增：`#json-copy`、`#escape-copy`、`#base64-copy`（`<button class="copy">复制</button>`，位于各输出区旁）。

- [ ] **Step 1: 追加失败测试**（置于 `src/ui/panels.test.ts`，顶部 import 补充 `vi`；使用真实计时器 + `vi.waitFor`，不要开 fake timers——恢复计时 1500ms 与 waitFor 的自动推进会互相竞争）

```ts
describe('一键复制', () => {
  it('clipboard API 成功：writeText 收到输出内容，按钮反馈后恢复', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'payload';
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('payload');
      expect(btn.textContent).toBe('已复制');
    });
    await vi.waitFor(() => expect(btn.textContent).toBe('复制'), { timeout: 3000 }); // 1500ms 恢复
  });
  it('无 clipboard 时回退 execCommand', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as Record<string, unknown>).execCommand = exec;
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'x';
    r.querySelector<HTMLButtonElement>('#json-copy')!.click();
    await vi.waitFor(() => expect(exec).toHaveBeenCalledWith('copy'));
  });
  it('writeText 失败且回退也失败：可见失败反馈', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true,
    });
    const exec = vi.fn().mockReturnValue(false); // 覆盖上一用例遗留的 true 桩，确保最终失败
    (document as unknown as Record<string, unknown>).execCommand = exec;
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'x';
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    await vi.waitFor(() => expect(btn.textContent).toContain('复制失败'));
  });
  it('空输出点复制：不调用剪贴板且给出提示（Review Focus #3）', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const r = setup();
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    expect(writeText).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(btn.textContent).toContain('无内容'));
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/ui/panels.test.ts -t '一键复制'` → Expected: FAIL（无 `#json-copy`）。

- [ ] **Step 3: 实现 `clipboard.ts` 并在三面板接线**

回退实现：创建临时 textarea 设 `value = text`、选中、`document.execCommand('copy')`、移除；execCommand 返回 false 视为失败。反馈恢复用 `setTimeout(…, 1500)`。

- [ ] **Step 4: 运行确认通过**

Run: `npm test` → Expected: 全部 PASS。

- [ ] **Step 5: localhost 浏览器验证**

`npm run dev`（localhost 即安全上下文）：有输出时点复制 → 系统剪贴板实际收到内容、按钮出现「已复制」；在 DevTools 将 `navigator.clipboard` 置为 undefined 复现回退路径 → 「已复制」或明确「复制失败」反馈。对照 spec 场景「复制成功」。

- [ ] **Step 6: Commit**

```bash
git add src/ui/clipboard.ts src/ui/panels.ts src/ui/panels.test.ts
git commit -m "feat: 一键复制（clipboard API + execCommand 回退）与反馈"
```

### Task 11: 统一错误展示样式与页面基础样式（对应 tasks.md 5.3）

**Files:**
- Create: `src/style.css`
- Modify: `src/main.ts`（`import './style.css'`）、`src/ui/panels.ts`（补全布局/文案 class）
- Test: `src/ui/panels.test.ts`（追加）

**Interfaces:**
- Consumes: 三面板既有 `#*-error`（class `error`）
- Produces: 全站样式契约——`main.css` 中 `.error` 为红色可读文案样式（非空才可见，如 `:empty { display: none }`）；页面基础样式：中文字体栈、面板宽度、textarea 等宽字体、Tab 激活态。无新增 JS 接口。

- [ ] **Step 1: 追加失败测试**

```ts
describe('错误展示统一', () => {
  it('三面板错误区均存在、class 为 error 且初始为空', () => {
    const r = setup();
    for (const id of ['json', 'escape', 'base64']) {
      const el = r.querySelector<HTMLElement>(`#${id}-error`)!;
      expect(el.classList.contains('error')).toBe(true);
      expect(el.textContent).toBe('');
    }
  });
});
```

- [ ] **Step 2: 运行——若 Task 4/6/8 已落实 class 则此测试直接 PASS**

Run: `npx vitest run src/ui/panels.test.ts -t '错误展示统一'` → Expected: PASS（该用例是纪律回归检查；若 FAIL 修 panels 使其 PASS）。

- [ ] **Step 3: 创建 `src/style.css` 并在 `main.ts` 引入**

`body` 中文 sans-serif 字体栈 + 居中布局；`textarea` 等宽字体、合理尺寸；`nav .tab[aria-selected="true"]` 激活样式；`.error:empty { display: none }`、`.error` 红色（如 `#c0392b`）；`[hidden] { display: none !important }`（防 CSS 覆盖 hidden）。样式细节允许按设计「留给实现者的空间」微调，但上述规则必须存在。

- [ ] **Step 4: 验证构建与三工具非法输入行为**

Run: `npm run build && npm test` → Expected: 均成功。
Run: `npm run dev`，三个工具分别输入非法内容（`{invalid`、`a\qb`、`!!!not-base64!!!`）点击动作 → Expected: 各自错误区展示可读中文错误，页面不崩溃，其余功能（Tab、其他面板）可继续用。

- [ ] **Step 5: Commit**

```bash
git add src/style.css src/main.ts src/ui/panels.ts src/ui/panels.test.ts
git commit -m "style: 统一错误展示与页面基础样式"
```

## 第 6 组：整体验收

### Task 12: 全量验证（对应 tasks.md 6.1）

**Files:**
- 无新增/修改（若验证暴露缺陷，回到对应 Task 的测试循环修复后再收尾）

**Interfaces:**
- Consumes: Task 1–11 全部产物
- Produces: 验收结论（供协调者进入 verify 阶段）

- [ ] **Step 1: 全量测试**

Run: `npm test` → Expected: 全部 PASS（tools 单测 + UI 行为测试 + 冒烟）。

- [ ] **Step 2: 生产构建**

Run: `npm run build` → Expected: 退出码 0。

- [ ] **Step 3: 浏览器逐场景验收**

Run: `npm run dev`，对照 `openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md` 全部 11 个 Scenario 逐条在浏览器中执行确认（复制场景在 localhost 安全上下文验证真实剪贴板写入）。

- [ ] **Step 4: 无网络请求确认**

在 DevTools Network 面板（Disable cache 保持关闭、仅观察）执行三个工具的任意转换操作组合 → Expected: 无与转换内容相关的网络请求（除 Vite HMR/静态资源加载本身外无 XHR/fetch），输入数据不出现在任何出站请求中。

- [ ] **Step 5: 反目标抽查**

确认代码中用户数据未经 `innerHTML` 拼接（`grep -rn "innerHTML" src/` 仅命中 `render.ts` 的静态模板一处）；非法输入均走错误分支不崩溃。

- [ ] **Step 6: 收尾提交（如有样式/文案微调）**

```bash
git status  # 应为 clean；如有修复，按对应 Task 的 commit 规范提交
```
