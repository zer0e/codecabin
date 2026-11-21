# Design（tweak 精简版）

## 实现说明

1. **设计令牌**：`src/style.css` 顶部 `:root` 定义语义变量（背景/卡片/文字/次要文字/边框/accent/错误底色与文字等），现有硬编码色值全部替换为 `var(--…)`；`@media (prefers-color-scheme: dark)` 内覆盖同名变量为暗色一套（IDE 感深底 + 高对比输入区 + 单一 accent）。不引入手动开关、不写 localStorage。
2. **视觉打磨**（同一文件）：
   - `.panel`/卡片柔和阴影，label/textarea/按钮/错误区间距分层；
   - tab 由深色实心块改下划线指示（保留 `aria-selected` 驱动选择器）；
   - `select` 与 `button` 尺寸统一；`:focus-visible` 统一描边；
   - `.error` 改浅红底告警条（暗色下对应深红底），`word-break: break-all` 换 `overflow-wrap: anywhere`；
   - `.copy` 加 `min-width` 防止反馈文案切换抖动；
   - `@media (max-width: 640px)` 收紧边距/字号。
3. **静态 header**：`panels.ts` 增加静态模板常量（h1「Codecabin」+ 一句本地处理声明），经 `mountTemplate()` 挂载于 tabs 之前。纯静态文案，符合「模板不拼接运行时数据」不变量。

## 硬约束核对

- 不改任何元素 id、`role`/`aria-*`、`hidden` 切换机制 → `panels.test.ts` 等按 id 取元素的测试不受影响
- 运行时数据仍只走 `.value`/`.textContent`
- 无新依赖；对比度目标 WCAG AA（暗色文字/背景目测校验）

## 验证口径

`npm test`（51 用例基线）+ `npm run build` 全过；浏览器冒烟（浅/深两主题下面板切换、错误展示、复制反馈）留待 verify 阶段。
