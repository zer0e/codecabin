import type { Base64Mode, ToolResult } from './types';

export function encodeBase64(input: string, mode: Base64Mode): ToolResult {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let value = btoa(binary);
  if (mode === 'urlsafe') {
    value = value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return { ok: true, value };
}

export function decodeBase64(input: string, mode: Base64Mode): ToolResult {
  // ① 去除全部空白（含换行、制表符）
  let cleaned = input.replace(/\s/g, '');
  // ② URL-safe 还原 - → +、_ → /
  if (mode === 'urlsafe') {
    cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  }
  // ③ 字符集校验：仅允许 Base64 字符与最多两个结尾填充
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { ok: false, error: '非法 Base64 字符：输入包含字符集以外的字符' };
  }
  // ③' 长度 mod 4 校验，并先按模 4 补 =
  const bare = cleaned.replace(/=+$/, '');
  if (bare.length % 4 === 1) {
    return { ok: false, error: '非法 Base64 字符：有效长度不合法（mod 4 余 1）' };
  }
  const padded = bare + '='.repeat((4 - (bare.length % 4)) % 4);
  // ④ atob → 字节 → 严格 UTF-8 解码，失败均返回 ToolResult 错误，不抛异常
  let binary: string;
  try {
    binary = atob(padded);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: '非法 Base64 字符：' + message };
  }
  try {
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    // ignoreBOM: true 保留开头 U+FEFF，保证 decode(encode(x)) === x 往返一致
    const value = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    return { ok: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: '解码结果不是合法的 UTF-8 文本：' + message };
  }
}
