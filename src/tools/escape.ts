import type { ToolResult } from './types';

export function escapeText(input: string): ToolResult {
  return { ok: true, value: JSON.stringify(input).slice(1, -1) };
}

export function unescapeText(input: string): ToolResult {
  try {
    let processed = input;
    // ① 首尾成对双引号则去除
    if (processed.length >= 2 && processed.startsWith('"') && processed.endsWith('"')) {
      processed = processed.slice(1, -1);
    }
    // ② 真实 CR/LF（含 CRLF）→ 两字符「反斜杠+n」；只处理真实控制字符，不碰字面反斜杠序列。
    // 携带换行前的反斜杠游程：奇数游程意味着孤立反斜杠「吸收」换行（非法转义），报错而非静默改写；
    // 偶数游程是成对转义反斜杠，保持原行为（反斜杠对 + 换行转义）。
    processed = processed.replace(/(\\*)(\r\n|\r|\n)/g, (_m, slashes: string) => {
      if (slashes.length % 2 === 1) {
        throw new Error('孤立反斜杠后跟真实换行，不是合法转义');
      }
      return slashes + '\\n';
    });
    // ③ 其余裸控制字符（码点小于 0x20）→ 反斜杠 uXXXX 形式转义
    let escaped = '';
    for (const ch of processed) {
      const code = ch.charCodeAt(0);
      escaped +=
        code < 0x20
          ? String.fromCharCode(92) + 'u' + code.toString(16).padStart(4, '0')
          : ch;
    }
    processed = escaped;
    // ④ 包上双引号后交给 JSON.parse 完成去转义
    const value = JSON.parse('"' + processed + '"');
    return { ok: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: '去转义失败：' + message };
  }
}
