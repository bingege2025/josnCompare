import { isLosslessNumber, stringify as stringifyLossless } from 'lossless-json';
import type { JsonValue } from './types';
import { translations, type Locale } from '../i18n';

/**
 * 将含有 LosslessNumber 的 JsonValue 序列化为规范 JSON 字符串
 */
export function formatJsonValue(val: JsonValue | undefined, pretty = true, locale: Locale = 'zh-CN'): string {
  if (val === undefined) {
    return translations[locale].value.missing;
  }
  if (val === null) {
    return 'null';
  }
  if (isLosslessNumber(val)) {
    return val.value;
  }
  if (typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val);
  }

  try {
    return stringifyLossless(val, null, pretty ? 2 : undefined) ?? '';
  } catch {
    return String(val);
  }
}

/**
 * 获取值的简短类型标签
 */
export function getValueTypeLabel(val: JsonValue | undefined, locale: Locale = 'zh-CN'): string {
  const labels = translations[locale].value;
  if (val === undefined) return labels.missingType;
  if (val === null) return 'null';
  if (isLosslessNumber(val) || typeof val === 'number' || typeof val === 'bigint') return labels.number;
  if (typeof val === 'string') return labels.string;
  if (typeof val === 'boolean') return labels.boolean;
  if (Array.isArray(val)) return labels.array(val.length);
  if (typeof val === 'object') return labels.object;
  return typeof val;
}
