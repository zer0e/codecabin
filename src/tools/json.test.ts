import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson } from './json';

const compact = '{"a":1,"b":[2,3]}';
const pretty2 = '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}';
const pretty4 = '{\n    "a": 1,\n    "b": [\n        2,\n        3\n    ]\n}';

describe('formatJson', () => {
  it('紧凑 JSON 默认按 2 空格美化', () => {
    expect(formatJson(compact)).toEqual({ ok: true, value: pretty2 });
  });
  it('indent=4 时使用 4 空格', () => {
    expect(formatJson(compact, 4)).toEqual({ ok: true, value: pretty4 });
  });
  it('顶层标量 123 正常返回（Review Focus #2）', () => {
    expect(formatJson('123')).toEqual({ ok: true, value: '123' });
  });
  it('非法 JSON 返回错误结果并附原始信息', () => {
    const r = formatJson('{invalid');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.startsWith('JSON 解析失败：')).toBe(true);
  });
});

describe('minifyJson', () => {
  it('多行美化 JSON 压缩为单行', () => {
    expect(minifyJson(pretty2)).toEqual({ ok: true, value: compact });
  });
  it('非法 JSON 返回错误结果', () => {
    expect(minifyJson('{invalid').ok).toBe(false);
  });
});
