/** 反馈文案在按钮上停留的时长（ms），之后恢复原文「复制」。 */
const FEEDBACK_DURATION_MS = 1500;

/** 按钮文案反馈：textContent 注入静态文案，1500ms 后恢复「复制」。 */
function showFeedback(button: HTMLButtonElement, message: string): void {
  button.textContent = message;
  setTimeout(() => {
    button.textContent = '复制';
  }, FEEDBACK_DURATION_MS);
}

/**
 * 回退复制：临时 textarea 经 value 赋值承载用户数据（禁止进 innerHTML），
 * select() 后 execCommand('copy')；返回 false 或不可用均视为失败抛错。
 */
function fallbackCopy(text: string): void {
  if (typeof document.execCommand !== 'function') {
    throw new Error('execCommand 不可用');
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  let ok = false;
  try {
    textarea.select();
    ok = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!ok) {
    throw new Error('execCommand copy 返回 false');
  }
}

/**
 * 一键复制：空文本直接提示且不调用剪贴板 API；
 * 否则优先 navigator.clipboard.writeText，不可用或 reject 时回退 execCommand；
 * 成功反馈「已复制」、失败反馈「复制失败：<原因>」，均在 1500ms 后恢复「复制」。
 */
export async function copyText(text: string, button: HTMLButtonElement): Promise<void> {
  if (!text) {
    showFeedback(button, '无内容可复制');
    return;
  }

  try {
    if (!navigator.clipboard) {
      throw new Error('clipboard API 不可用');
    }
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard 不可用或 writeText reject → 回退 execCommand
    try {
      fallbackCopy(text);
    } catch (fallbackError) {
      const reason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      showFeedback(button, `复制失败：${reason}`);
      return;
    }
  }
  showFeedback(button, '已复制');
}
