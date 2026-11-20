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

工具 SHALL 将输入文本按 UTF-8 编码为 Base64，中文、emoji 等非 ASCII 字符 MUST 正确编码。

#### Scenario: 中文与 emoji 编码

- **WHEN** 用户输入 `你好🌍` 并点击「编码」
- **THEN** 输出为该文本 UTF-8 字节的标准 Base64 表示

### Requirement: Base64 解码（UTF-8）

工具 SHALL 将 Base64 解码为 UTF-8 文本，与编码构成往返一致；对非法 Base64 输入 SHALL 给出错误提示。

#### Scenario: 编解码往返一致

- **WHEN** 用户对含中文、emoji、换行的文本先编码、再对结果解码
- **THEN** 最终输出与原始文本完全一致

#### Scenario: 非法 Base64 输入

- **WHEN** 用户输入 `!!!not-base64!!!` 并点击「解码」
- **THEN** 页面展示错误提示而非崩溃

#### Scenario: 含空白与换行的输入可解码

- **WHEN** 用户输入含空格、换行的 Base64 文本（如按行折叠的编码结果）并点击「解码」
- **THEN** 空白被忽略，解码结果与去除空白后的标准解码一致

#### Scenario: 缺失 padding 可解码

- **WHEN** 用户输入缺失尾部 `=` padding 的合法 Base64 文本并点击「解码」
- **THEN** 解码成功，结果与带 padding 的同一编码一致

### Requirement: Base64 URL-safe 变体

工具 SHALL 提供标准与 URL-safe 两种 Base64 模式切换；URL-safe 模式的编码输出 MUST NOT 包含 `+`、`/` 与 `=` padding，且其输出在 URL-safe 模式下可正确解码（解码兼容有/无 padding）。

#### Scenario: URL-safe 编码与解码

- **WHEN** 用户切换到 URL-safe 模式，对会产生 `+`/`/` 的文本编码后再解码
- **THEN** 编码输出不含 `+` 与 `/`，解码结果与原始文本一致

#### Scenario: URL-safe 输出无 padding 且可解码

- **WHEN** 用户在 URL-safe 模式对编码结果本应带 `=` padding 的文本（如 `hi`）编码
- **THEN** 输出不含 `=`，且直接解码可还原原始文本

### Requirement: 工具切换与输入保持

页面 SHALL 以 Tab 组织三个工具，切换 Tab 后再切回时，该工具已输入的内容与模式设置 MUST 保留。

#### Scenario: 切换后返回

- **WHEN** 用户在 JSON 工具输入文本后切换到 Base64 工具，再切回 JSON 工具
- **THEN** 之前输入的文本仍在输入区

### Requirement: 输出复制反馈

每个工具 SHALL 提供一键复制按钮，将当前输出写入系统剪贴板，并给出可见的成功反馈。

#### Scenario: 复制成功

- **WHEN** 输出区有内容时用户点击「复制」
- **THEN** 输出内容写入剪贴板，页面展示成功反馈

### Requirement: 本地处理隐私保障

所有转换 MUST 在浏览器本地完成，页面 MUST NOT 为转换功能发起任何网络请求或上传用户输入。

#### Scenario: 转换不产生网络请求

- **WHEN** 用户执行任意工具的任意转换操作
- **THEN** 浏览器不发出与转换相关的网络请求，输入数据不离开本机