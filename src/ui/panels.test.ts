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
