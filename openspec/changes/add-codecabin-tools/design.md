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

（无阻塞性未决项；缩进默认值、UI 文案等已在澄清中确认。）