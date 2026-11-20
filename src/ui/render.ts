/**
 * 将静态模板字符串经 <template> 解析，返回第一个元素子节点。
 * html 只允许承载静态结构，禁止拼接任何运行时数据（用户输入/输出）。
 */
export function mountTemplate(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  const element = template.content.firstElementChild;
  if (!element) {
    throw new Error('模板必须包含至少一个元素');
  }
  return element as HTMLElement;
}
