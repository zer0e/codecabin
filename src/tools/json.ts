import type { ToolResult } from './types';

function parseOrError(input: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e) {
    return { ok: false, error: 'JSON 解析失败：' + (e as Error).message };
  }
}

export function formatJson(input: string, indent: 2 | 4 = 2): ToolResult {
  const parsed = parseOrError(input);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value, null, indent) };
}

export function minifyJson(input: string): ToolResult {
  const parsed = parseOrError(input);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value) };
}
