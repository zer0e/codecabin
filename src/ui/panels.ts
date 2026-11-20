import { escapeText, unescapeText } from '../tools/escape';
import { formatJson, minifyJson } from '../tools/json';
import type { ToolResult } from '../tools/types';
import { mountTemplate } from './render';

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const jsonPanelHtml = `
<section id="panel-json" class="panel">
  <h2>JSON 格式化 / 压缩</h2>
  <label for="json-input">输入</label>
  <textarea id="json-input" rows="8" placeholder="在此粘贴 JSON"></textarea>
  <label for="json-indent">缩进</label>
  <select id="json-indent">
    <option value="2" selected>2 空格</option>
    <option value="4">4 空格</option>
  </select>
  <button id="json-format" type="button">格式化</button>
  <button id="json-minify" type="button">压缩</button>
  <label for="json-output">输出</label>
  <textarea id="json-output" rows="8" readonly></textarea>
  <div id="json-error" class="error"></div>
</section>
`;

function bindJsonPanel(panel: HTMLElement): void {
  const input = panel.querySelector<HTMLTextAreaElement>('#json-input')!;
  const indent = panel.querySelector<HTMLSelectElement>('#json-indent')!;
  const output = panel.querySelector<HTMLTextAreaElement>('#json-output')!;
  const error = panel.querySelector<HTMLDivElement>('#json-error')!;

  // 行为约定：ok → 输出结果并清空错误区；error → 清空输出并展示文案；任何分支不清用户输入。
  const apply = (result: ToolResult): void => {
    if (result.ok) {
      output.value = result.value;
      error.textContent = '';
    } else {
      output.value = '';
      error.textContent = result.error;
    }
  };

  panel.querySelector<HTMLButtonElement>('#json-format')!.addEventListener('click', () => {
    apply(formatJson(input.value, indent.value === '4' ? 4 : 2));
  });
  panel.querySelector<HTMLButtonElement>('#json-minify')!.addEventListener('click', () => {
    apply(minifyJson(input.value));
  });
}

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const escapePanelHtml = `
<section id="panel-escape" class="panel">
  <h2>JSON 字符串转义 / 去转义</h2>
  <label for="escape-input">输入</label>
  <textarea id="escape-input" rows="8" placeholder="在此粘贴文本"></textarea>
  <button id="escape-escape" type="button">转义</button>
  <button id="escape-unescape" type="button">去转义</button>
  <label for="escape-output">输出</label>
  <textarea id="escape-output" rows="8" readonly></textarea>
  <div id="escape-error" class="error"></div>
</section>
`;

function bindEscapePanel(panel: HTMLElement): void {
  const input = panel.querySelector<HTMLTextAreaElement>('#escape-input')!;
  const output = panel.querySelector<HTMLTextAreaElement>('#escape-output')!;
  const error = panel.querySelector<HTMLDivElement>('#escape-error')!;

  // 行为约定：ok → 输出结果并清空错误区；error → 清空输出并展示文案；任何分支不清用户输入。
  const apply = (result: ToolResult): void => {
    if (result.ok) {
      output.value = result.value;
      error.textContent = '';
    } else {
      output.value = '';
      error.textContent = result.error;
    }
  };

  panel.querySelector<HTMLButtonElement>('#escape-escape')!.addEventListener('click', () => {
    apply(escapeText(input.value));
  });
  panel.querySelector<HTMLButtonElement>('#escape-unescape')!.addEventListener('click', () => {
    apply(unescapeText(input.value));
  });
}

/** 挂载当前已完成的面板（本 Task 后为 JSON + 转义两个面板）。 */
export function renderApp(root: HTMLElement): void {
  const panel = mountTemplate(jsonPanelHtml);
  bindJsonPanel(panel);
  root.append(panel);

  const escapePanel = mountTemplate(escapePanelHtml);
  bindEscapePanel(escapePanel);
  root.append(escapePanel);
}
