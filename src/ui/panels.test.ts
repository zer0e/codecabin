import { describe, it, expect, vi, afterEach } from 'vitest';
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
  it('先失败再成功：错误区清空、输出为成功结果（M-2 回归锁）', () => {
    const r = setup();
    const input = r.querySelector<HTMLTextAreaElement>('#json-input')!;
    input.value = '{invalid';
    r.querySelector<HTMLButtonElement>('#json-minify')!.click();
    expect(r.querySelector('#json-error')!.textContent).toContain('JSON 解析失败');
    input.value = '{"a":1}';
    r.querySelector<HTMLButtonElement>('#json-format')!.click();
    expect(r.querySelector('#json-error')!.textContent).toBe('');
    expect(r.querySelector<HTMLTextAreaElement>('#json-output')!.value).toContain('"a": 1');
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
  it('Tab 具备完整 ARIA 语义：tablist/tab/aria-controls/tabpanel（M-4）', () => {
    const r = setup();
    expect(r.querySelector('nav.tabs')!.getAttribute('role')).toBe('tablist');
    for (const name of ['json', 'escape', 'base64']) {
      const tab = r.querySelector(`[data-tab="${name}"]`)!;
      expect(tab.getAttribute('role')).toBe('tab');
      expect(tab.getAttribute('aria-controls')).toBe(`panel-${name}`);
      expect(r.querySelector(`#panel-${name}`)!.getAttribute('role')).toBe('tabpanel');
    }
  });
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

describe('一键复制', () => {
  // 桩隔离（M-1）：navigator 经 vi.stubGlobal 打桩、afterEach 统一还原；
  // document.execCommand 非全局属性，记录原值并在 afterEach 恢复，消除用例间桩污染与顺序依赖。
  const originalExecCommand = document.execCommand;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (typeof originalExecCommand === 'function') {
      document.execCommand = originalExecCommand;
    } else {
      delete (document as unknown as Record<string, unknown>).execCommand;
    }
  });

  it('clipboard API 成功：writeText 收到输出内容，按钮反馈后恢复', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'payload';
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('payload');
      expect(btn.textContent).toBe('已复制');
    });
    await vi.waitFor(() => expect(btn.textContent).toBe('复制'), { timeout: 3000 }); // 1500ms 恢复
  });
  it('无 clipboard 时回退 execCommand', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as Record<string, unknown>).execCommand = exec;
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'x';
    r.querySelector<HTMLButtonElement>('#json-copy')!.click();
    await vi.waitFor(() => expect(exec).toHaveBeenCalledWith('copy'));
  });
  it('writeText 失败且回退也失败：可见失败反馈', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const exec = vi.fn().mockReturnValue(false); // 回退返回 false，确保最终失败
    (document as unknown as Record<string, unknown>).execCommand = exec;
    const r = setup();
    r.querySelector<HTMLTextAreaElement>('#json-output')!.value = 'x';
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    await vi.waitFor(() => expect(btn.textContent).toContain('复制失败'));
  });
  it('空输出点复制：不调用剪贴板且给出提示（Review Focus #3）', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const r = setup();
    const btn = r.querySelector<HTMLButtonElement>('#json-copy')!;
    btn.click();
    expect(writeText).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(btn.textContent).toContain('无内容'));
  });
});

describe('错误展示统一', () => {
  it('三面板错误区均存在、class 为 error 且初始为空', () => {
    const r = setup();
    for (const id of ['json', 'escape', 'base64']) {
      const el = r.querySelector<HTMLElement>(`#${id}-error`)!;
      expect(el.classList.contains('error')).toBe(true);
      expect(el.textContent).toBe('');
    }
  });
});
