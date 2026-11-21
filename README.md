# Codecabin

纯浏览器端的开发者文本转换工具页。**所有转换均在本地完成，不上传任何数据。**

无框架、无后端、无路由：Vanilla TypeScript + Vite 单页应用，界面文案全部为中文。

## 功能

| 工具 | 说明 |
|------|------|
| JSON 格式化 / 压缩 | 基于 `JSON.parse → JSON.stringify`，支持自定义缩进 |
| JSON 字符串转义 / 去转义 | 转义输出不含包裹引号；去转义采用宽容规则（成对引号可去除、真实换行转 `\n`、裸控制字符转 `\uXXXX`） |
| Base64 编解码（UTF-8） | 解码自动去除空白；支持 URL-safe 模式（编码去 padding、解码兼容有/无 padding）；非法 UTF-8 字节报错而非静默替换 |

其他特性：

- 一键复制输出（Clipboard API 优先，自动回退 `execCommand`）
- 面板切换不丢失输入（DOM 常驻，仅切换可见性）
- 完整的键盘可访问性（`role="tablist"` / `aria-selected` / `aria-controls`）
- 错误提示为中文且包含原始错误信息；任何情况下不清空用户输入

## 快速开始

```bash
npm install
npm run dev        # Vite 开发服务器
npm run build      # tsc --noEmit 类型检查 + vite build
npm run preview    # 预览构建产物
npm test           # vitest 全部测试（happy-dom 环境）
```

运行单个测试文件 / 单个用例：

```bash
npx vitest run src/tools/base64.test.ts
npx vitest run src/tools/escape.test.ts -t "用例名"
```

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

- **`src/tools/`（纯逻辑层）**：所有转换函数返回 `ToolResult = { ok: true; value: string } | { ok: false; error: string }`，约定不抛异常，一切失败收敛为错误结果。
- **`src/ui/`（DOM 层）**：每个工具面板 = 静态 HTML 模板 + 绑定函数。安全不变量：模板只承载静态结构，运行时数据只经 `.value` / `.textContent` 注入，永远不进 `innerHTML`。

## 已知限制

- JSON 工具基于 `JSON.parse → JSON.stringify` 基线：超出 Number 安全范围的数字（如 snowflake 长 ID）会丢失精度，溢出数字（`1e999`）变为 `null`。无损数字需要 lossless 解析架构，超出当前范围。
- Base64 解码使用 `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`，开头 U+FEFF 会被刻意保留，以保证 `decode(encode(x)) === x` 逐字符往返一致。

## 开发流程

本仓库采用 spec 驱动开发（OpenSpec + Comet 五阶段流程）：

- `openspec/specs/` — 行为契约的权威来源（SHALL / MUST NOT + WHEN / THEN 场景）
- `openspec/changes/` — 变更生命周期产物（proposal / design / tasks / delta spec）
- `docs/superpowers/` — Design Doc、实现计划与验证报告
- `.claude/rules/comet-phase-guard.md` — 阶段流程约束

行为变更不直接改代码，先走 OpenSpec change；详见 [AGENTS.md](AGENTS.md)。

## License

暂未指定。
