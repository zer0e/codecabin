---
comet_change: add-codecabin-tools
role: technical-design
canonical_spec: openspec
---

# Codecabin 工具页深度设计

- Change: add-codecabin-tools
- Date: 2026-11-20
- 需求事实源：`openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md`（本文不重复需求，只记技术设计）

## 意图与背景

为开发者提供纯浏览器端的 JSON 格式化/压缩、JSON 字符串转义/去转义、Base64（UTF-8）编解码工具页，所有转换本地完成、不上传数据。仓库从零起步，这是 codecabin 的首个功能。动机与范围详见 proposal.md。

## 目标 / 非目标 / 反目标

**目标**
- 转换逻辑与 UI 解耦：核心为纯函数，可独立单测
- 单向数据流：输入 + 选项 → 纯函数 → 结果对象 → 渲染输出或错误
- 零运行时第三方依赖；粘贴场景友好（宽容边界）

**非目标**
- 文件编解码、URL/HTML 转义、实时自动转换、账号/历史/云同步、部署流水线
- 大输入（数十 MB 级）性能优化（Worker/流式）、国际化、主题切换

**反目标（即使技术可行也算失败）**
- 任何转换触发网络请求或上传用户输入
- 用户数据经 innerHTML 拼接注入（XSS 面）
- 非法输入导致页面崩溃或静默输出错误结果

## 约束

- Vite + 原生 TypeScript，无 UI 框架（open 阶段用户确认）
- 运行时零第三方依赖；dev 依赖限 Vite/TypeScript/Vitest/happy-dom
- 剪贴板验收在 localhost 开发服务器（安全上下文）下进行

## 方案选型（Approaches）

### UI 层实现（用户选定 B）

| 方案 | 内容 | 取舍 | 结论 |
|------|------|------|------|
| A 静态 HTML + TS 绑定 | index.html 写死面板结构，TS 只绑定事件 | 最简，但结构分散两处 | 未选 |
| **B TS 模板渲染** | DOM 由 TS 模板字符串生成，小型 render helper | 结构集中一处；需自制少量渲染抽象 | **用户选定** |
| C lit-html | 成熟模板库 | 引入运行时依赖，违反零依赖目标 | 排除 |

### 其余技术基线（open design.md 已定，brainstorming 确认沿用）

- Base64：TextEncoder/TextDecoder + btoa/atob 桥接，而非手写位运算
- 转义：JSON 字符串字面量语义（stringify/parse），而非正则逐字符替换
- Tab 输入保持：三面板同时挂载、hidden 切换，而非状态序列化/恢复

## 模块设计

```
index.html（空壳，仅挂载点）
  └── src/main.ts（入口：渲染面板、绑定 Tab）
        ├── src/ui/render.ts     渲染 helper
        ├── src/ui/panels.ts     三面板模板 + 事件绑定
        ├── src/ui/clipboard.ts  复制与反馈
        └── src/tools/           纯函数（无 DOM 依赖）
              ├── json.ts
              ├── escape.ts
              └── base64.ts
```

### 纯函数契约

统一返回判别联合：`{ ok: true, value: string } | { ok: false, error: string }`。不向 UI 抛异常；error 为中文可读文案，附原始错误信息（如 JSON.parse 的 message）。

- `json.ts`：`formatJson(input, indent: 2|4)`、`minifyJson(input)`。实现：`JSON.parse` 后 `JSON.stringify(value, null, indent)` / `JSON.stringify(value)`。
- `escape.ts`：
  - `escapeText(input)`：`JSON.stringify(input).slice(1, -1)`（输出**不含**首尾引号）。
  - `unescapeText(input)`：宽容预处理后 `JSON.parse('"' + processed + '"')`。预处理顺序：① 若首尾为成对双引号则去除；② 真实换行 `\r\n`/`\r`/`\n` → `\n` 转义序列；③ 其余裸控制字符（U+0000–U+001F）→ `\uXXXX`；④ 交给 JSON.parse 报告非法转义（如 `\q`）。
- `base64.ts`：`encodeBase64(input, mode: 'standard'|'urlsafe')`、`decodeBase64(input, mode)`。
  - 编码：TextEncoder → 字节 → binary string → btoa；urlsafe 模式替换 `+`→`-`、`/`→`_` 并去除 `=` padding。
  - 解码：① 去除全部空白字符；② urlsafe 模式还原 `-`→`+`、`_`→`/`；③ 按模 4 补齐 `=`；④ 字符集校验后 atob → 字节 → `new TextDecoder('utf-8', { fatal: true })` 捕获非法 UTF-8。

### UI 层

- `render.ts`：模板字符串只承载**静态结构**（面板骨架、按钮、标签）；用户输入/输出一律经 `textContent` 或属性赋值注入，禁止拼接进 innerHTML。
- `panels.ts`：每面板含输入 textarea、操作按钮（JSON：格式化/压缩 + 缩进选择；转义：转义/去转义；Base64：编码/解码 + 模式切换）、输出区（只读）、错误区、复制按钮。三面板同时挂载，Tab 切换仅切换 `hidden`，输入与模式设置自然保留。Tab 使用 button + aria-selected 语义。
- `clipboard.ts`：优先 `navigator.clipboard.writeText`；不可用/失败时回退临时 textarea + `document.execCommand('copy')`；成功/失败均给出可见反馈（按钮文案短暂变化），失败提示说明原因。
- 错误展示：面板内独立错误区，转换失败时渲染 error 文案；不清空用户输入；成功时清除旧错误。

## 边界语义（宽容策略，用户确认）

- 转义输出不含首尾引号；去转义兼容含/不含引号输入
- 去转义将真实换行视为 `\n`
- Base64 解码容忍空白/换行、缺失 padding
- URL-safe 编码去除 padding，解码兼容有/无 padding
- 真正非法输入（`\q`、非法 Base64 字符、非法 UTF-8 字节）报错
- 往返一致性在全部宽容规则下保持

对应验收场景已回写 delta spec（Spec Patch，见 brainstorm-summary.md）。

## 测试策略

1. **纯函数单测**（Vitest，与源码同目录 `*.test.ts`）：每个工具的正常路径、全部宽容边界、非法输入错误路径、往返一致性（含中文/emoji/换行/控制字符）。
2. **UI 行为测试**（happy-dom + Vitest）：Tab 切换后输入保留、按钮触发渲染输出、错误区渲染与清除、复制回退路径与反馈。happy-dom 无真实剪贴板，clipboard API 路径以 mock 验证调用，真实写入留浏览器冒烟。
3. **真实浏览器冒烟**（build 阶段末 + verify 阶段）：localhost 下剪贴板实际写入；DevTools Network 面板确认转换操作零网络请求；逐条对照 delta spec 场景。

## 风险与取舍

- [剪贴板 API 需安全上下文] → execCommand 回退 + 失败明确提示；验收在 localhost
- [大输入同步阻塞] → 非目标，接受（典型 KB~MB 级）
- [宽容边界放宽接受面] → 全部规则以单测锁定，防止实现漂移
- [TS 模板渲染 XSS 面] → 静态模板 + textContent 注入纪律，UI 测试覆盖用户数据渲染
- [happy-dom 与真实浏览器差异] → 关键路径（剪贴板、Network）保留真实浏览器冒烟

## 留给实现者的空间

- 具体 CSS 样式与布局细节（保持简洁中文界面即可）
- render helper 的具体 API 形态
- 错误文案的具体措辞（须中文、可读、含原始错误信息）
- 测试用例的具体组织与命名