import { describe, it, expect } from 'vitest';
import { renderApp } from './panels';

function setup(): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  renderApp(root);
  return root;
}

describe('JSON 面板', () => {
  it('点击格式化输出美化结果并清空错误区', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1,"b":[2,3]}';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toContain('"a": 1');
    expect(r.querySelector('#json-error')!.textContent).toBe('');
  });
  it('缩进切换为 4 后格式化使用 4 空格', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1}';
    r.querySelector<HTMLSelectElement>('#json-indent')!.value = '4';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toBe('{\n    "a": 1\n}');
  });
  it('非法 JSON：错误区可读文案、输出区无伪成功结果', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{invalid';
    r.querySelector<HTMLButtonElement>('#json-minify')!.click();
    expect(r.querySelector('#json-error')!.textContent).toContain('JSON 解析失败');
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toBe('');
    expect(r.querySelector<HTMLTextAreaElement>('#json-input')!.value).toBe('{invalid');
  });
  it('HTML 注入输入仅按纯文本呈现（Review Focus #4）', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '<img src=x onerror=alert(1)>';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelectorAll('img').length).toBe(0);
    expect(r.querySelector('#json-error')!.textContent).toContain('<img');
  });
});

describe('转义面板', () => {
  it('转义输出不含首尾引号', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'hello';
    r.querySelector<HTMLButtonElement>('#escape-escape')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('hello');
  });
  it('含特殊字符文本转义为 \\\" \\\\ \\n 形式', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'a"b\\c\nd';
    r.querySelector<HTMLButtonElement>('#escape-escape')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('a\\"b\\\\c\\nd');
  });
  it('去转义非法输入 \\q：错误可读、不清输入', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#escape-input')!.value = 'a\\qb';
    r.querySelector<HTMLButtonElement>('#escape-unescape')!.click();
    expect(r.querySelector('#escape-error')!.textContent).toContain('去转义失败');
    expect(r.querySelector<HTMLTextAreaElement>('#escape-output')!.value).toBe('');
  });
});

describe('Base64 面板', () => {
  it('标准模式编码中文 emoji', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = '你好\u{1F30D}';
    r.querySelector<HTMLButtonElement>('#base64-encode')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#base64-output')!.value).toBe('5L2g5aW98J+MjQ==');
  });
  it('URL-safe 模式输出无 + / =', () => {
    const r = setup();
    r.querySelector<HTMLSelectElement>('#base64-mode')!.value = 'urlsafe';
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = 'a\uFFFFb';
    r.querySelector<HTMLButtonElement>('#base64-encode')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#base64-output')!.value).toBe('Ye-_v2I');
  });
  it('非法 Base64 解码错误可读且不清输入', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#base64-input')!.value = '!!!not-base64!!!';
    r.querySelector<HTMLButtonElement>('#base64-decode')!.click();
    expect(r.querySelector('#base64-error')!.textContent).toContain('非法 Base64 字符');
    expect(r.querySelector<HTMLTextAreaElement>('#base64-input')!.value).toBe('!!!not-base64!!!');
  });
});

describe('Tab 切换', () => {
  it('默认仅 JSON 面板可见', () => {
    const r = setup();
    expect(r.querySelector('#panel-json')!.hasAttribute('hidden')).toBe(false);
    expect(r.querySelector('#panel-escape')!.hasAttribute('hidden')).toBe(true);
  });
  it('切走再切回，输入内容与模式设置保留', () => {
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-input')!.value = '{"a":1}';
    r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.click();
    r.querySelector<HTMLSelectElement>('#base64-mode')!.value = 'urlsafe';
    r.querySelector<HTMLButtonElement>('[data-tab="json"]')!.click();
    expect(r.querySelector<HTMLTextAreaElement>('#json-input')!.value).toBe('{"a":1}');
    expect(r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.getAttribute('aria-selected')).toBe('false');
    r.querySelector<HTMLButtonElement>('[data-tab="base64"]')!.click();
    expect(r.querySelector<HTMLSelectElement>('#base64-mode')!.value).toBe('urlsafe');
  });
});
