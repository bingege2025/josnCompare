import { parse as parseLossless } from 'lossless-json';
import type { JsonValue, ParseResult } from './types';
import { translations, type Locale } from '../i18n';

export const MAX_INPUT_BYTES = 1024 * 1024; // 1 MiB

/**
 * 计算 UTF-8 编码下的字节数
 */
export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * 根据字符偏移索引计算对应的行号与列号（均从 1 开始）
 */
export function getLineAndColumn(text: string, index: number): { line: number; column: number; snippet: string } {
  const safeIdx = Math.max(0, Math.min(index, text.length));
  const lines = text.slice(0, safeIdx).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  // 截取错误所在行的上下文
  const allLines = text.split('\n');
  const errorLine = allLines[line - 1] || '';
  const snippet = errorLine.slice(0, 100);

  return { line, column, snippet };
}

/**
 * 从解析错误异常中提取可能的位置信息
 */
export function extractErrorPosition(errorMsg: string, text: string): { line?: number; column?: number } {
  // 常见错误模式 1: "at position 42"
  const posMatch = errorMsg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const { line, column } = getLineAndColumn(text, pos);
    return { line, column };
  }

  // 常见错误模式 2: "line 3 column 5"
  const lineColMatch = errorMsg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  return {};
}

/**
 * 解析输入的 JSON 字符串，带 1 MiB 大小限制与位置解析
 */
export function parseJson(rawInput: string, locale: Locale = 'zh-CN'): ParseResult {
  const messages = translations[locale].parser;
  const trimmed = rawInput.trim();
  const sizeBytes = getByteLength(rawInput);

  if (!trimmed) {
    return {
      success: false,
      error: messages.empty,
      sizeBytes,
    };
  }

  if (sizeBytes > MAX_INPUT_BYTES) {
    const currentMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    return {
      success: false,
      error: messages.tooLarge(currentMB),
      sizeBytes,
    };
  }

  try {
    // 使用 lossless-json 无损解析，数字被保留为 LosslessNumber
    const parsed = parseLossless(trimmed) as JsonValue;
    return {
      success: true,
      data: parsed,
      sizeBytes,
    };
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const pos = extractErrorPosition(rawMsg, trimmed);

    let friendlyMsg = rawMsg;
    if (pos.line && pos.column) {
      friendlyMsg = messages.syntaxAt(pos.line, pos.column, rawMsg);
    }

    return {
      success: false,
      error: friendlyMsg,
      line: pos.line,
      column: pos.column,
      sizeBytes,
    };
  }
}
