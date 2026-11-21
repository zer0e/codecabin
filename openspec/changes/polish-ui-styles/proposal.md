# Proposal

## Why

GitHub issue #1「优化前端整体样式」：当前页面是默认浅灰底的极简表单页风格——色值全部硬编码、无暗色模式、无品牌头部、视觉层次扁平、错误提示弱、复制按钮文案切换引发布局跳动。面向开发者受众，暗色模式与细节打磨是最大缺口。

## What Changes

- `src/style.css` 引入 `:root` CSS 变量设计令牌，并追加 `prefers-color-scheme: dark` 暗色主题（自动跟随系统，**无手动切换开关**）
- 视觉打磨：卡片柔和阴影、`:focus-visible` 描边、tab 改下划线指示、控件尺寸统一、错误区改告警条样式（`overflow-wrap: anywhere`）、复制按钮 `min-width` 防抖动、≤640px 响应式 media query
- `src/ui/panels.ts` 新增**纯静态** header 模板：h1 标题 +「全部转换在浏览器本地完成，不上传任何数据」声明
- 不改变任何工具行为、id/aria/hidden 机制、innerHTML 安全不变量

## Capabilities

**New Capabilities**: 无

**Modified Capabilities**: 无（纯视觉呈现变更，`json-base64-tools` 的行为契约与验收场景均不受影响；`.openspec.yaml` 设 `skip_specs: true`）

## Impact

- 受影响代码：`src/style.css`、`src/ui/panels.ts`（预计 2~3 个文件，含可能的测试微调）
- 无新增依赖、无接口变化、无架构调整
- 用户已确认方向：A（轻量打磨）+ B 暗色（自动跟随，不含手动开关）；C（双栏布局重构）不在本次范围
