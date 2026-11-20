import { describe, it, expect } from 'vitest';

describe('测试环境', () => {
  it('happy-dom 提供 document', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
  it('纯 Node 环境提供 btoa/atob/TextEncoder', () => {
    expect(atob(btoa('hi'))).toBe('hi');
    expect(new TextEncoder().encode('你').length).toBe(3);
  });
});
