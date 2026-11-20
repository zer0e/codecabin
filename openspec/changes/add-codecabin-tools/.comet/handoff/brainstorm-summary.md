# Brainstorm Summary

- Change: add-codecabin-tools
- Date: 2026-11-20
- 状态: 设计方案已获用户确认（2026-11-20），待创建 Design Doc

## 确认的技术方案

- 形态：Vite + 原生 TypeScript，无 UI 框架、无后端、零运行时第三方依赖（open 阶段已确认）
- **UI 层：方案 B — TS 模板渲染**（用户在 A 静态 HTML / B TS 模板 / C lit-html 中选定 B）
  - DOM 由 TS 模板字符串生成，小型 render helper 管理面板，结构集中一处
  - 安全边界：模板只承载静态结构；用户数据一律经 textContent/属性赋值注入，不拼接 innerHTML
  - 三面板同时挂载，Tab 切换仅切换 hidden，输入状态自然保留
- 模块结构：
  - `src/tools/json.ts`：JSON.parse + JSON.stringify（缩进 2/4 可选，默认 2；压缩）
  - `src/tools/escape.ts`：转义 = JSON.stringify(text) 去首尾引号；去转义先做宽容预处理（可选首尾引号、真实换行→\n、裸控制字符转义）再 JSON.parse
  - `src/tools/base64.ts`：TextEncoder/TextDecoder + btoa/atob；URL-safe 字符替换（+→-、/→_）；解码先去除空白、还原字符、补齐 padding；TextDecoder fatal:true 捕获非法 UTF-8
  - `src/ui/render.ts`（渲染 helper）、`src/ui/panels.ts`（三面板模板与事件）、`src/ui/clipboard.ts`（clipboard API → execCommand 回退，双路径可见反馈）、`src/main.ts`（入口）
- 纯函数统一返回结果对象 `{ ok:true, value:string } | { ok:false, error:string }`，不向 UI 抛异常；错误文案中文、含原始错误信息
- **边界语义：宽容策略**（用户确认）：
  - 转义输出不含首尾双引号；去转义兼容含/不含引号输入
  - 去转义将真实换行视为 \n
  - Base64 解码容忍空白/换行、缺失 = padding
  - URL-safe 编码去除 padding，解码兼容有/无 padding
  - 真正非法输入（\q、非法 Base64 字符、非法 UTF-8 字节）仍报错；往返一致性不受影响

## 关键取舍与风险

- 宽容边界略放宽接受面 → 换取粘贴场景可用性；全部规则以单测锁定
- 剪贴板 API 需安全上下文（https/localhost）→ execCommand 回退 + 失败明确提示
- 大输入同步转换阻塞主线程 → 非目标，接受（典型输入 KB~MB 级）
- happy-dom 无真实剪贴板 → UI 测试只验证回退路径与反馈；真实剪贴板留浏览器冒烟
- TS 模板渲染的 XSS 面 → 静态模板 + textContent 注入纪律，UI 测试覆盖

## 测试策略

- Vitest 纯函数单测：全部转换 + 宽容边界 + 非法输入错误路径（与源码同目录 *.test.ts）
- happy-dom（dev 依赖）+ Vitest UI 行为测试：Tab 切换保留、错误渲染、按钮触发、复制回退路径
- 真实浏览器最终冒烟：剪贴板实际写入、DevTools Network 面板无转换相关请求
- 排除 Playwright e2e（过重）

## Spec Patch

回写 `openspec/changes/add-codecabin-tools/specs/json-base64-tools/spec.md`（仅补场景/澄清歧义，不改结构）：

1. 「JSON 字符串转义」requirement：澄清输出不含首尾引号，补对应场景
2. 「JSON 字符串去转义」requirement：补「含首尾引号输入可还原」「真实换行视为 \n」两个场景
3. 「Base64 解码（UTF-8）」requirement：补「含空白/换行输入可解码」「缺失 padding 可解码」两个场景
4. 「Base64 URL-safe 变体」requirement：澄清编码去除 padding，补「输出无 padding 且可解码」场景