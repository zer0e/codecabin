# Tasks

## 1. 项目骨架

- [x] 1.1 初始化 Vite + 原生 TypeScript 项目（package.json、vite.config.ts、tsconfig.json、index.html、src/main.ts），验证 `npm run dev` 可启动、`npm run build` 成功
- [x] 1.2 接入 Vitest（配置 + 一个冒烟测试），验证 `npm test` 通过

## 2. JSON 格式化/压缩

- [x] 2.1 实现 `src/tools/json.ts` 纯函数（格式化：2/4 缩进可选、默认 2；压缩；非法输入返回错误结果对象），验证单测覆盖：紧凑→美化、缩进切换、美化→压缩、非法 JSON 错误路径
- [x] 2.2 实现 JSON 工具面板 UI（输入区、缩进选择、格式化/压缩按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 3. JSON 字符串转义/去转义

- [x] 3.1 实现 `src/tools/escape.ts` 纯函数（转义/去转义，基于 JSON 字符串字面量语义），验证单测覆盖：特殊字符转义、中文/emoji/换行往返一致、非法转义序列错误路径
- [x] 3.2 实现转义工具面板 UI（转义/去转义按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 4. Base64 编解码

- [x] 4.1 实现 `src/tools/base64.ts` 纯函数（UTF-8 编解码、标准/URL-safe 模式、非法输入错误结果），验证单测覆盖：中文/emoji 编码、往返一致、URL-safe 输出不含 `+`/`/` 且可解码、非法 Base64 错误路径
- [x] 4.2 实现 Base64 工具面板 UI（模式切换、编码/解码按钮、输出区、错误区），验证 dev 服务器下手动操作与 spec 场景一致

## 5. 页面集成与共用交互

- [x] 5.1 实现 Tab 切换骨架（三面板同时挂载、隐藏/显示切换），验证切换后返回输入内容保留
- [x] 5.2 实现一键复制（clipboard API + execCommand 回退）与成功/失败反馈，验证 localhost 下复制内容进入剪贴板且有可见反馈
- [ ] 5.3 统一错误展示样式与页面基础样式（中文文案），验证三个工具非法输入均展示可读错误且页面不崩溃

## 6. 整体验收

- [ ] 6.1 全量验证：`npm test` 全部通过、`npm run build` 成功，逐条对照 specs/json-base64-tools/spec.md 的验收场景在浏览器中确认（含本地处理无网络请求：DevTools Network 面板无转换相关请求）

## Workflow follow-up

- 验证通过后按 Comet 流程处理分支并归档 change（/comet-verify → /comet-archive）。