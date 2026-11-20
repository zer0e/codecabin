import { describe, it, expect } from 'vitest';
import { escapeText, unescapeText } from './escape';

describe('escapeText', () => {
  it('hello 输出无包裹引号', () => {
    expect(escapeText('hello')).toEqual({ ok: true, value: 'hello' });
  });
  it('引号/反斜杠/真实换行转义', () => {
    expect(escapeText('a"b\\c\nd')).toEqual({ ok: true, value: 'a\\"b\\\\c\\nd' });
  });
  it('字面反斜杠两字符序列不被吞（Review Focus #5）', () => {
    expect(escapeText('a\\nb')).toEqual({ ok: true, value: 'a\\\\nb' });
  });
});

describe('unescapeText', () => {
  it('基本还原', () => {
    expect(unescapeText('a\\"b')).toEqual({ ok: true, value: 'a"b' });
  });
  it('输入带成对首尾双引号的转义字面量可还原', () => {
    expect(unescapeText('"a\\"b"')).toEqual({ ok: true, value: 'a"b' });
  });
  it('真实换行按 \\n 处理不报错', () => {
    expect(unescapeText('第一行\n第二行')).toEqual({ ok: true, value: '第一行\n第二行' });
  });
  it('裸控制字符容忍（U+0009 制表符还原为字符本身）', () => {
    expect(unescapeText('x\ty')).toEqual({ ok: true, value: 'x\ty' });
  });
  it('非法转义 \\q 报错', () => {
    const r = unescapeText('a\\qb');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('去转义失败：')).toBe(true);
  });
  it('奇数个反斜杠紧邻真实换行报错，不静默改写（I-2）', () => {
    const r = unescapeText('a\\\nb'); // a + 孤立反斜杠 + 真实 LF + b
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('去转义失败：')).toBe(true);
  });
  it('偶数个反斜杠紧邻真实换行还原为「反斜杠+换行」（I-2）', () => {
    expect(unescapeText('a\\\\\nb')).toEqual({ ok: true, value: 'a\\\nb' });
  });
});

describe('往返一致性', () => {
  it('中文/emoji/换行/字面反斜杠/控制字符混合文本转义后去转义逐字符一致（Review Focus #5）', () => {
    const corpus = '你好 🌍 换行\n制表\t引号"反斜杠\\ 字面\\n 结束\n\n结尾';
    const e = escapeText(corpus);
    expect(e.ok).toBe(true);
    if (e.ok) expect(unescapeText(e.value)).toEqual({ ok: true, value: corpus });
  });
});
