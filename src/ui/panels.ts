import { decodeBase64, encodeBase64 } from '../tools/base64';
import { escapeText, unescapeText } from '../tools/escape';
import { formatJson, minifyJson } from '../tools/json';
import type { Base64Mode, ToolResult } from '../tools/types';
import { copyText } from './clipboard';
import { mountTemplate } from './render';

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const jsonPanelHtml = `
<section id="panel-json" class="panel" role="tabpanel">
  <h2>JSON 格式化 / 压缩</h2>
  <label for="json-input">输入</label>
  <textarea id="json-input" rows="8" placeholder="在此粘贴 JSON"></textarea>
  <label for="json-indent">缩进</label>
  <select id="json-indent">
    <option value="2" selected>2 空格</option>
    <option value="4">4 空格</option>
  </select>
  <div class="actions">
    <button id="json-format" type="button">格式化</button>
    <button id="json-minify" type="button">压缩</button>
  </div>
  <label for="json-output">输出</label>
  <textarea id="json-output" rows="8" readonly></textarea>
  <button id="json-copy" class="copy" type="button">复制</button>
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

  const copyButton = panel.querySelector<HTMLButtonElement>('#json-copy')!;
  copyButton.addEventListener('click', () => {
    void copyText(output.value, copyButton);
  });
}

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const escapePanelHtml = `
<section id="panel-escape" class="panel" role="tabpanel">
  <h2>JSON 字符串转义 / 去转义</h2>
  <label for="escape-input">输入</label>
  <textarea id="escape-input" rows="8" placeholder="在此粘贴文本"></textarea>
  <div class="actions">
    <button id="escape-escape" type="button">转义</button>
    <button id="escape-unescape" type="button">去转义</button>
  </div>
  <label for="escape-output">输出</label>
  <textarea id="escape-output" rows="8" readonly></textarea>
  <button id="escape-copy" class="copy" type="button">复制</button>
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

  const copyButton = panel.querySelector<HTMLButtonElement>('#escape-copy')!;
  copyButton.addEventListener('click', () => {
    void copyText(output.value, copyButton);
  });
}

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const base64PanelHtml = `
<section id="panel-base64" class="panel" role="tabpanel">
  <h2>Base64 编码 / 解码</h2>
  <label for="base64-input">输入</label>
  <textarea id="base64-input" rows="8" placeholder="在此粘贴文本"></textarea>
  <label for="base64-mode">模式</label>
  <select id="base64-mode">
    <option value="standard" selected>标准</option>
    <option value="urlsafe">URL-safe</option>
  </select>
  <div class="actions">
    <button id="base64-encode" type="button">编码</button>
    <button id="base64-decode" type="button">解码</button>
  </div>
  <label for="base64-output">输出</label>
  <textarea id="base64-output" rows="8" readonly></textarea>
  <button id="base64-copy" class="copy" type="button">复制</button>
  <div id="base64-error" class="error"></div>
</section>
`;

function bindBase64Panel(panel: HTMLElement): void {
  const input = panel.querySelector<HTMLTextAreaElement>('#base64-input')!;
  const mode = panel.querySelector<HTMLSelectElement>('#base64-mode')!;
  const output = panel.querySelector<HTMLTextAreaElement>('#base64-output')!;
  const error = panel.querySelector<HTMLDivElement>('#base64-error')!;

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

  panel.querySelector<HTMLButtonElement>('#base64-encode')!.addEventListener('click', () => {
    apply(encodeBase64(input.value, mode.value as Base64Mode));
  });
  panel.querySelector<HTMLButtonElement>('#base64-decode')!.addEventListener('click', () => {
    apply(decodeBase64(input.value, mode.value as Base64Mode));
  });

  const copyButton = panel.querySelector<HTMLButtonElement>('#base64-copy')!;
  copyButton.addEventListener('click', () => {
    void copyText(output.value, copyButton);
  });
}

// 静态模板：只含固定结构与中文文案，禁止拼接运行时数据。
const tabNavHtml = `
<nav class="tabs" role="tablist" aria-label="工具切换">
  <button class="tab" type="button" role="tab" data-tab="json" aria-controls="panel-json" aria-selected="true">JSON</button>
  <button class="tab" type="button" role="tab" data-tab="escape" aria-controls="panel-escape" aria-selected="false">转义</button>
  <button class="tab" type="button" role="tab" data-tab="base64" aria-controls="panel-base64" aria-selected="false">Base64</button>
</nav>
`;

/** 挂载 Tab nav 与三个面板；面板 DOM 常驻，仅以 hidden 切换可见性（输入天然保留，不做状态序列化）。 */
export function renderApp(root: HTMLElement): void {
  const nav = mountTemplate(tabNavHtml);
  root.append(nav);

  const panel = mountTemplate(jsonPanelHtml);
  bindJsonPanel(panel);
  root.append(panel);

  const escapePanel = mountTemplate(escapePanelHtml);
  bindEscapePanel(escapePanel);
  root.append(escapePanel);

  const base64Panel = mountTemplate(base64PanelHtml);
  bindBase64Panel(base64Panel);
  root.append(base64Panel);

  const panels: Record<string, HTMLElement> = {
    json: panel,
    escape: escapePanel,
    base64: base64Panel,
  };
  const tabs = nav.querySelectorAll<HTMLButtonElement>('.tab');

  const activate = (name: string): void => {
    for (const [key, p] of Object.entries(panels)) {
      if (key === name) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    }
    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.tab!));
  });

  // 默认激活 JSON 面板。
  activate('json');
}
