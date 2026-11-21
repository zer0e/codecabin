# Tasks

- [x] 1. `src/style.css`：引入 `:root` CSS 变量令牌并替换全部硬编码色值，追加 `prefers-color-scheme: dark` 暗色主题；完成视觉打磨（阴影/focus-visible/下划线 tab/控件尺寸统一/错误告警条/复制按钮 min-width/≤640px 响应式）。跑 `npm test` 确认无回归。
- [ ] 2. `src/ui/panels.ts`：新增纯静态 header 模板（h1 + 本地处理不上传声明），挂载于 tabs 之前；确认 id/aria/hidden 机制不变。跑 `npm test` 确认无回归。
- [ ] 3. 全量验证：`npm test` + `npm run build` 通过；核对改动文件数 ≤4、无行为契约变化（无需 spec 回写）。
