# AGENTS.md

This file provides guidance to AI coding agents (Claude Code and others) when working with code in this repository.

## 项目概述

Codecabin 是一个**纯浏览器端**的开发者文本转换工具页（JSON 格式化/压缩、JSON 字符串转义/去转义、Base64 UTF-8 编解码）。所有转换本地完成，不上传任何数据。无框架、无后端、无路由：Vanilla TypeScript + Vite 单页应用，界面文案全部为中文。

## 常用命令

```bash
npm run dev        # Vite 开发服务器
npm run build      # tsc --noEmit 类型检查 + vite build（无独立 lint 命令）
npm run preview    # 预览构建产物
npm test           # vitest run（全部测试）
```

运行单个测试文件 / 单个用例：

```bash
npx vitest run src/tools/base64.test.ts
npx vitest run src/tools/escape.test.ts -t "用例名"
```

测试环境为 happy-dom（配置在 `vite.config.ts`），只收集 `src/**/*.test.ts`，测试与源码同目录放置。

## 架构

两层严格分离，数据单向流动：

```
index.html (#app) → src/main.ts → src/ui/panels.ts renderApp()
                                      │
                      src/ui/render.ts mountTemplate()  ← 静态模板字符串
                      src/ui/clipboard.ts copyText()    ← 复制 + 按钮反馈
                                      │ 调用
                      src/tools/{json,escape,base64}.ts ← 纯函数，返回 ToolResult
```

- **`src/tools/`（纯逻辑层）**：所有转换函数返回 `ToolResult = { ok: true; value: string } | { ok: false; error: string }`（定义在 `src/tools/types.ts`）。**约定：工具函数不抛异常**，一切失败（非法 JSON、非法 Base64 字符、非法 UTF-8、非法转义）都收敛为 `{ ok: false, error }`，错误文案为中文且包含原始错误信息。
- **`src/ui/panels.ts`（DOM 层）**：每个工具面板 = 一个静态 HTML 模板常量 + 一个 `bindXxxPanel()` 绑定函数。`renderApp()` 挂载 tab 导航与三个面板并默认激活 JSON 面板。三个面板的 `apply(result)` 遵循同一行为约定：**ok → 写输出并清空错误区；error → 清空输出并展示错误文案；任何分支都不清空用户输入**。
- **面板切换**：面板 DOM 常驻，仅用 `hidden` 属性切换可见性（输入天然保留，不做状态序列化）；tab 带 `role="tablist"/tab"/tabpanel"` 与 `aria-selected`/`aria-controls`。

### 安全不变量（修改 UI 时必须保持）

- 模板字符串**只承载静态结构与固定文案，禁止拼接任何运行时数据**（用户输入/输出）。`mountTemplate()` 经 `<template>.innerHTML` 解析的只能是这些静态模板。
- 运行时数据只经 `.value`（textarea）或 `.textContent`（错误区、按钮反馈）注入，**永远不进 innerHTML**。clipboard 回退路径同样用临时 textarea 的 `.value` 承载数据。

### 复制行为（`src/ui/clipboard.ts`）

空文本直接提示「无内容可复制」且不调用剪贴板 API；否则优先 `navigator.clipboard.writeText`，不可用或 reject 时回退 `execCommand('copy')`；成功/失败文案在按钮上停留 1500ms 后恢复「复制」。

## 工具行为契约（spec 驱动，改动前必读）

行为的权威来源是 `openspec/specs/json-base64-tools/spec.md`（SHALL/MUST NOT + WHEN/THEN 场景）。以下是实现中容易被"顺手修掉"的**有意设计**：

- **Base64**（`src/tools/base64.ts`）：解码先去除全部空白；URL-safe 模式编码去 padding、解码兼容有/无 padding；字符集与长度 mod 4 校验（余 1 报错）；`TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` —— **ignoreBOM 保留开头 U+FEFF 是刻意行为**，保证 `decode(encode(x)) === x` 逐字符往返一致；非法 UTF-8 字节报错而非替换字符。
- **去转义**（`src/tools/escape.ts`）：宽容规则——首尾成对双引号可去除；真实 CR/LF/CRLF 转为字面 `\n`；其余裸控制字符转 `\uXXXX`；最后包引号交 `JSON.parse`。**真实换行前的反斜杠游程为奇数时报错**（孤立反斜杠吸收换行属非法转义），偶数游程保持成对转义行为。转义输出不含包裹引号（`JSON.stringify(input).slice(1, -1)`）。
- **JSON 已知限制（用户已确认接受，不是 bug）**：`JSON.parse → JSON.stringify` 基线下，超出 Number 安全范围的数字丢失精度（如 snowflake 长 ID），溢出数字（`1e999`）变为 `null`。无损数字需要更换 lossless 解析架构，超出当前范围；如要做，另开 OpenSpec change。

## 开发流程（OpenSpec + Comet）

本仓库采用 spec 驱动开发，**行为变更不是直接改代码**：

- `openspec/specs/` 是主 spec；`openspec/changes/`（含 `archive/`）是变更生命周期产物（proposal / design / tasks / delta spec）。
- `.claude/rules/comet-phase-guard.md` 定义了五阶段流程（open → design → build → verify → archive）与硬性约束：阶段状态存于 change 的 `.comet.yaml`，阶段推进只能经 `comet-guard`/`comet-state` 脚本，多个决策点必须等用户确认。有活跃 change 时严格遵守该规则。
- 小改动走 `/comet-tweak`，bug 修复走 `/comet-hotfix`，新功能走 `/comet`。实现完成后 spec 场景需回写（参考已归档的 `2026-11-20-add-codecabin-tools`）。
- `docs/superpowers/` 存放 Design Doc、实现计划与验证报告，是设计决策（含边界场景与已知限制）的详细记录。
- **落地一律经 PR**：Comet 的实现与生命周期产物在特性分支上提交并随 PR 合并；verify 阶段「分支处理」决策点默认选择「推送并创建 PR」。详见下节。

## Issue / PR 交付规范

**禁止直接 push main。** 所有变更（含文档、CI 配置）走以下流水线：

```
issue（打标）→ 特性分支 → PR → bot 审查 → 迭代修复 → 合并 PR → 关闭 issue
```

### Issue

- 需求 / bug 以 issue 为起点，打类型标签（`bug` / `enhancement` / `ui` / `documentation` 等）；issue 是交付验收的锚点。
- **PR 合并后**才关闭 issue，附交付摘要评论（提交区间、验证证据、已知限制）。

### 分支与 PR

- 分支命名：`feat/<主题>`、`fix/<主题>`、`chore/<主题>`、`docs/<主题>`。
- PR 标题遵循提交规范；正文含目的、改动点、验证证据、关联 issue（`Closes #N`）。

### Bot 审查（PR-Agent）

- `.github/workflows/pr-agent.yml`：PR opened / synchronize 自动 describe + review + improve，审查意见为中文；每次推送修复自动重审，形成「审查 → 修复 → 再审」闭环。
- 运行时镜像按官方 SECURITY.md 以 **digest 钉定**（当前 v0.50.0）；升级须重新解析并验证 digest，且经用户确认。
- 配置经仓库 Settings → Secrets and variables → Actions 注入，不入库：Secret `OPENAI_KEY`；Variables `OPENAI_API_BASE`（端点）、`PR_REVIEW_MODEL`（模型 ID，协议前缀可省略，按端点 URL 自适应 openai/ 或 anthropic/）、`PR_REVIEW_MAX_TOKENS`（可选，默认 32000）。
- fork PR 无 secrets，经 job 级门禁跳过而非失败。
- **意见处置**：逐条技术评估、对照代码库事实验证，不盲从也不无视；采纳项修复后推送触发重审；**拒绝项必须在 PR 评论附实证说明**（参考 `.claude/skills/receiving-code-review`）。

### 合并

- 前置条件：无未处置的 CRITICAL / IMPORTANT 审查意见、Actions 检查绿、Cloudflare 预览部署成功。
- 默认 squash merge（需保留逐条提交历史时改用 merge commit）；合并后关闭关联 issue。

### 提交规范

- 格式 `<type>: <中文简述>`，type ∈ `feat` / `fix` / `docs` / `ci` / `chore` / `tweak`（Comet 任务提交按对应 skill 约定）。
- 每个 task 验收后立即提交，不得积攒（Comet build 规则）。
- AI 辅助提交末尾附 `Co-Authored-By: Claude Code <noreply@anthropic.com>`。

## 代码检索

仓库已建 CodeGraph 索引（`.codegraph/`）：理解或定位代码时优先用 `codegraph_explore`（MCP）或 `codegraph explore "<符号/问题>"`（shell），一次调用返回相关符号源码与调用路径，再考虑 grep/Read。
