# Comet Design Handoff

- Change: add-codecabin-tools
- Phase: design
- Mode: compact
- Context hash: 4a60ebf173f3823842778a0341ae648a8e6ddb413c40436bcf76c9af9529c513

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/add-codecabin-tools/proposal.md

- Source: openspec/changes/add-codecabin-tools/proposal.md
- Lines: 1-33
- SHA256: fd6592515023452b7800c46edbf0e5b2f8b88cfd49cb86b87c2451f64e041120

```md
# Proposal

## Why

日常开发中经常需要在 JSON 可读格式与压缩格式之间切换、把 JSON 转成可嵌入代码/日志的转义字符串、以及对文本做 Base64 编解码。目前仓库（codecabin）没有任何业务代码，这些操作只能依赖零散的在线工具或手写脚本，存在隐私顾虑（数据上传第三方）且体验不统一。需要一个纯浏览器端、本地完成的工具页面，作为 codecabin 的首个功能。

## What Changes

- 从零搭建 Vite + 原生 TypeScript 前端项目（无 UI 框架、无后端）。
- 新增单页工具页面，顶部 Tab 切换三个工具，按钮触发转换：
  - **JSON 格式化/压缩**：美化输出（缩进 2/4 空格可选）与压缩为单行。
  - **JSON 字符串转义/去转义**：文本 ↔ 带 `\"`、`\n` 等转义符的字符串字面量，往返一致。
  - **Base64 编码/解码**：UTF-8 文本（中文/emoji 正确往返），标准与 URL-safe 变体可切换。
- 每个工具提供输入区、输出区、一键复制（带成功反馈）与可读的错误提示；非法输入不导致页面崩溃。
- Tab 切换保留各工具已输入的内容。
- 转换逻辑实现为独立纯函数模块，配套 Vitest 单元测试。
- 不拆分原因：三个工具共享同一页面骨架与交互模式，属同一 capability，可一次性设计、构建、验证，无独立里程碑。

## Capabilities

### New Capabilities

- `json-base64-tools`: 浏览器端文本转换工具页的行为要求——JSON 格式化/压缩、JSON 字符串转义/去转义、Base64（UTF-8，标准/URL-safe）编解码，以及共用的交互约定（Tab 切换、按钮触发、复制反馈、错误提示、输入保持）。

### Modified Capabilities

（无——项目当前没有任何已有 spec。）

## Impact

- **代码**：全新项目骨架（`package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`src/`），无既有代码受影响。
- **依赖**：新增开发依赖 Vite、TypeScript、Vitest；运行时零第三方依赖（转换用原生 API 实现）。
- **数据/隐私**：所有转换在浏览器本地完成，无网络请求、无持久化存储。
- **非目标**：不做文件编解码、URL/HTML 转义、实时自动转换、账号/历史/云同步、部署流水线。```

## openspec/changes/add-codecabin-tools/design.md

- Source: openspec/changes/add-codecabin-tools/design.md
- Lines: 1-44
- SHA256: 1a12c18048475594328f596e1e10e8244fde887100d6f40afa43b31ef5e99f07

```md
# Design

> 本文档为 open 阶段的高层设计；深度设计（Design Doc 与方案论证）将在 Comet design 阶段通过 brainstorming 产出。

## Context

仓库为空（见 proposal.md — Why），无既有架构约束。已确认的技术形态：Vite + 原生 TypeScript，无 UI 框架、无后端。三个工具共享同一交互模式：输入 → 按钮触发 → 输出/错误 → 复制。

## Goals / Non-Goals

**Goals:**

- 转换逻辑与 UI 解耦：核心转换为纯函数，可独立单测。
- 数据流单向清晰：`输入文本 + 选项 → 纯函数 → { ok, output } | { ok: false, error } → 渲染输出或错误`。
- 零运行时第三方依赖，全部用浏览器原生 API。

**Non-Goals:**

- 不做组件化框架抽象、路由、状态管理库。
- 不做大输入（数十 MB 级）的性能优化（Worker/流式处理）。
- 不做国际化与主题切换。

## Decisions

1. **项目结构**：`src/tools/`（`json.ts`、`escape.ts`、`base64.ts` 纯函数模块）+ `src/ui/`（Tab 与面板渲染）+ `src/main.ts` 入口；Vitest 测试与源码同目录（`*.test.ts`）。
   - 备选：单文件堆叠全部逻辑——否决，无法对转换逻辑做独立单测。
2. **Base64 UTF-8 实现**：`TextEncoder`/`TextDecoder` + `btoa`/`atob`（binary string 桥接）；URL-safe 通过字符替换（`+`→`-`、`/`→`_`）与解码前还原实现。
   - 备选：手写 Base64 位运算——否决，原生 API 足够且更不易出错。
3. **转义语义**：基于 JSON 字符串字面量语义——转义等价于 `JSON.stringify(text)` 去掉首尾引号；去转义等价于对加引号后的输入做 `JSON.parse`，天然获得非法转义的错误报告。
   - 备选：正则逐字符替换——否决，控制字符/Unicode 边界易漏。
4. **Tab 输入保持**：三个面板同时挂载，用隐藏/显示切换而非销毁重建，输入状态自然保留。
   - 备选：切换时序列化/恢复状态——否决，复杂度不必要。
5. **错误处理**：纯函数返回结果对象（不抛异常穿透到 UI），UI 在每个面板内渲染独立错误区；错误不清空已有输出以外的输入内容。
6. **复制**：优先 `navigator.clipboard.writeText`，失败时回退 `document.execCommand('copy')`，两种路径都给出可见反馈。

## Risks / Trade-offs

- [剪贴板 API 需要安全上下文（https/localhost），file:// 或 http 下可能不可用] → execCommand 回退 + 失败时明确提示，验收场景在 localhost 开发服务器下验证。
- [同步转换在超大输入时阻塞主线程] → 明确非目标；工具页典型输入为 KB~MB 级，可接受。
- [`JSON.parse` 去转义对含真实换行的输入会报错] → 属合法错误路径，错误提示需说明输入应为单行转义字面量；design 阶段确认交互细节。
- [Vite/Vitest 版本演进] → 锁定当前稳定主版本，lockfile 入库。

## Open Questions

（无阻塞性未决项；缩进默认值、UI 文案等已在澄清中确认。）```

## openspec/changes/add-codecabin-tools/tasks.md

- Source: openspec/changes/add-codecabin-tools/tasks.md
- Lines: 1-34
- SHA256: 232747348f4f6c4b66f0e7953543a644525fde5ef1413e6c9477a5ac8554c551

```md
# Tasks

## 1. 项目骨架

- [ ] 1.1 初始化 Vite + 原生 TypeScript 项目（package.json、vite.config.ts、tsconfig.json、index.html、src/main.ts），验证 `npm run dev` 可启动、`npm run build` 成功
- [ ] 1.2 接入 Vitest（配置 + 一个冒烟测试），验证 `npm test` 通过

## 2. JSON 格式化/压缩

- [ ] 2.1 实现 `src/tools/json.ts` 纯函数（格式化：2/4 缩进可选、默认 2；压缩；非法输入返回错误结果对象），验证单测覆盖：紧凑→美化、缩进切换、美化→压缩、非法 JSON 错误路径
- [ ] 2.2 实现 JSON 工具面板 UI（输入区、缩进选择、格式化/压缩按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 3. JSON 字符串转义/去转义

- [ ] 3.1 实现 `src/tools/escape.ts` 纯函数（转义/去转义，基于 JSON 字符串字面量语义），验证单测覆盖：特殊字符转义、中文/emoji/换行往返一致、非法转义序列错误路径
- [ ] 3.2 实现转义工具面板 UI（转义/去转义按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 4. Base64 编解码

- [ ] 4.1 实现 `src/tools/base64.ts` 纯函数（UTF-8 编解码、标准/URL-safe 模式、非法输入错误结果），验证单测覆盖：中文/emoji 编码、往返一致、URL-safe 输出不含 `+`/`/` 且可解码、非法 Base64 错误路径
- [ ] 4.2 实现 Base64 工具面板 UI（模式切换、编码/解码按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 5. 页面集成与共用交互

- [ ] 5.1 实现 Tab 切换骨架（三面板同时挂载、隐藏/显示切换），验证切换后返回输入内容保留
- [ ] 5.2 实现一键复制（clipboard API + execCommand 回退）与成功/失败反馈，验证 localhost 下复制内容进入剪贴板且有可见反馈
- [ ] 5.3 统一错误展示样式与页面基础样式（中文文案），验证三个工具非法输入均展示可读错误且页面不崩溃

## 6. 整体验收

- [ ] 6.1 全量验证：`npm test` 全部通过、`npm run build` 成功，逐条对照 specs/json-base64-tools/spec.md 的验收场景在浏览器中确认（含本地处理无网络请求：DevTools Network 面板无转换相关请求）

## Workflow follow-up

- 验证通过后按 Comet 流程处理分支并归档 change（/comet-verify → /comet-archive）。```

## openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md

- Source: openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md
- Lines: 1-150
- SHA256: b9e7e25936fadadcdfd330bc82ddcf272b02538ed3454ce97d2ee4162a62d5c8

[TRUNCATED]

```md
# Spec Delta

## Purpose

提供纯浏览器端的开发者文本转换工具页：JSON 格式化/压缩、JSON 字符串转义/去转义、Base64（UTF-8）编解码，所有转换本地完成，不上传任何数据。

## ADDED Requirements

### Requirement: JSON 格式化

工具 SHALL 将合法 JSON 文本美化为带缩进的多行输出，缩进宽度可在 2 空格与 4 空格之间选择，默认 2 空格。

#### Scenario: 压缩 JSON 美化

- **WHEN** 用户输入紧凑 JSON（如 `{"a":1,"b":[2,3]}`）并点击「格式化」
- **THEN** 输出区展示按当前缩进设置美化的多行 JSON，语义与输入一致

#### Scenario: 切换缩进宽度

- **WHEN** 用户将缩进从 2 空格切换为 4 空格后再次格式化
- **THEN** 输出使用 4 空格缩进

### Requirement: JSON 压缩

工具 SHALL 将合法 JSON 文本压缩为不含多余空白的单行输出。

#### Scenario: 美化 JSON 压缩

- **WHEN** 用户输入多行带缩进的合法 JSON 并点击「压缩」
- **THEN** 输出为单行紧凑 JSON，语义与输入一致

### Requirement: JSON 非法输入错误提示

当输入不是合法 JSON 时，工具 SHALL 展示可读的错误提示（包含解析错误信息），MUST NOT 崩溃或静默输出错误结果。

#### Scenario: 非法 JSON 格式化

- **WHEN** 用户输入 `{invalid` 并点击「格式化」或「压缩」
- **THEN** 页面展示错误提示，输出区不产生看似成功的结果，页面其余功能可继续使用

### Requirement: JSON 字符串转义

工具 SHALL 将输入文本转换为 JSON 字符串字面量形式的转义文本（引号、反斜杠、换行等控制字符被转义），输出 MUST NOT 包含包裹的首尾双引号，以便直接嵌入代码。

#### Scenario: 含特殊字符文本转义

- **WHEN** 用户输入含双引号、反斜杠和换行的文本并点击「转义」
- **THEN** 输出中这些字符以 `\"`、`\\`、`\n` 等转义形式呈现

#### Scenario: 转义输出不含首尾引号

- **WHEN** 用户输入 `hello` 并点击「转义」
- **THEN** 输出为 `hello` 本身（无包裹双引号），而非 `"hello"`

### Requirement: JSON 字符串去转义

工具 SHALL 将转义后的字符串字面量还原为原始文本；对无法还原的非法转义输入 SHALL 给出错误提示。

#### Scenario: 转义往返一致

- **WHEN** 用户对任意文本先转义、再对结果去转义
- **THEN** 最终输出与原始文本完全一致（含中文、emoji、换行）

#### Scenario: 非法转义输入

- **WHEN** 用户输入含非法转义序列的文本（如 `\q`）并点击「去转义」
- **THEN** 页面展示错误提示而非崩溃

#### Scenario: 含首尾引号的输入可还原

- **WHEN** 用户输入带包裹双引号的转义字面量（如 `"a\"b"`）并点击「去转义」
- **THEN** 输出为还原后的原始文本 `a"b`

#### Scenario: 真实换行视为转义换行

- **WHEN** 用户输入的转义文本中含真实换行符（如从日志粘贴的多行内容）并点击「去转义」
- **THEN** 真实换行按 `\n` 处理，输出为含换行的还原文本而非报错

### Requirement: Base64 编码（UTF-8）

```

Full source: openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md

