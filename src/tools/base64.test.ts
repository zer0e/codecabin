import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from './base64';

const emojiText = '你好\u{1F30D}';          // 你好🌍
const slashText = 'a\uFFFFb';               // a + U+FFFF + b，标准编码同时含 + 与 /

describe('encodeBase64', () => {
  it('中文与 emoji 标准编码（UTF-8）', () => {
    expect(encodeBase64(emojiText, 'standard')).toEqual({ ok: true, value: '5L2g5aW98J+MjQ==' });
  });
  it('URL-safe 输出不含 + / 且去 padding', () => {
    expect(encodeBase64(slashText, 'urlsafe')).toEqual({ ok: true, value: 'Ye-_v2I' });
    expect(encodeBase64(slashText, 'standard')).toEqual({ ok: true, value: 'Ye+/v2I=' });
  });
  it('URL-safe 对本应带 padding 的文本（hi）输出无 =', () => {
    expect(encodeBase64('hi', 'urlsafe')).toEqual({ ok: true, value: 'aGk' });
  });
});

describe('decodeBase64', () => {
  it('容忍空白与换行', () => {
    expect(decodeBase64('aG k=\n', 'standard')).toEqual({ ok: true, value: 'hi' });
  });
  it('缺失 padding 可解码', () => {
    expect(decodeBase64('aGk', 'standard')).toEqual({ ok: true, value: 'hi' });
  });
  it('URL-safe 兼容有/无 padding', () => {
    expect(decodeBase64('Ye-_v2I', 'urlsafe')).toEqual({ ok: true, value: slashText });
    expect(decodeBase64('Ye-_v2I=', 'urlsafe')).toEqual({ ok: true, value: slashText });
  });
  it('非法字符报错不抛异常', () => {
    const r = decodeBase64('!!!not-base64!!!', 'standard');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('非法 Base64 字符')).toBe(true);
  });
  it('非法 UTF-8 字节序列报错', () => {
    const r = decodeBase64('/+8=', 'standard'); // 字节 FF EF，非合法 UTF-8
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('解码结果不是合法的 UTF-8 文本')).toBe(true);
  });
  it('空白+缺 padding+URL-safe 字符组合输入仍可解码（Review Focus #1）', () => {
    expect(decodeBase64('Ye-_ \nv2 I', 'urlsafe')).toEqual({ ok: true, value: slashText });
  });
});

describe('往返一致性', () => {
  it('两种模式下对中文/emoji/换行混合文本 encode→decode 逐字符一致', () => {
    const corpus = '你好 🌍\n换行\t制表 "引号" \\反斜杠+';
    for (const mode of ['standard', 'urlsafe'] as const) {
      const e = encodeBase64(corpus, mode);
      expect(e.ok).toBe(true);
      if (e.ok) expect(decodeBase64(e.value, mode)).toEqual({ ok: true, value: corpus });
    }
  });
});
