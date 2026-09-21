import { isLosslessNumber } from 'lossless-json';
import { areNumbersEqual } from './numeric';
import { encodePointer, toDisplayPath, isPathIgnored } from './jsonPointer';
import type { JsonValue, DiffItem, CompareResult, DiffSummary } from './types';
import type { Locale } from '../i18n';

type NodeCategory =
  | 'missing'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'object';

function getNodeCategory(val: unknown): NodeCategory {
  if (val === undefined) return 'missing';
  if (val === null) return 'null';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number' || typeof val === 'bigint' || isLosslessNumber(val)) {
    return 'number';
  }
  if (typeof val === 'string') return 'string';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'object') return 'object';
  return 'missing';
}

/**
 * 递归比对两个节点并将产生的差异填入 diffs 列表中
 */
function compareNodes(
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  tokens: (string | number)[],
  pointer: string,
  ignoredSet: Set<string>,
  diffs: DiffItem[],
  locale: Locale
): void {
  // 如果当前路径已被忽略，直接跳过
  if (isPathIgnored(pointer, ignoredSet)) {
    return;
  }

  const catLeft = getNodeCategory(left);
  const catRight = getNodeCategory(right);

  // 1. 字段新增
  if (catLeft === 'missing' && catRight !== 'missing') {
    diffs.push({
      pointer,
      displayPath: toDisplayPath(tokens, locale),
      type: 'added',
      oldValue: undefined,
      newValue: right,
    });
    return;
  }

  // 2. 字段删除
  if (catLeft !== 'missing' && catRight === 'missing') {
    diffs.push({
      pointer,
      displayPath: toDisplayPath(tokens, locale),
      type: 'removed',
      oldValue: left,
      newValue: undefined,
    });
    return;
  }

  // 3. 类型改变（例如 null 变 object，number 变 string，array 变 object 等）
  if (catLeft !== catRight) {
    diffs.push({
      pointer,
      displayPath: toDisplayPath(tokens, locale),
      type: 'type_changed',
      oldValue: left,
      newValue: right,
    });
    return;
  }

  // 4. 类型相同时的分支比较
  switch (catLeft) {
    case 'null':
      // 两边都是 null，完全相等
      return;

    case 'boolean':
    case 'string':
      if (left !== right) {
        diffs.push({
          pointer,
          displayPath: toDisplayPath(tokens, locale),
          type: 'value_changed',
          oldValue: left,
          newValue: right,
        });
      }
      return;

    case 'number':
      if (!areNumbersEqual(left, right)) {
        diffs.push({
          pointer,
          displayPath: toDisplayPath(tokens, locale),
          type: 'value_changed',
          oldValue: left,
          newValue: right,
        });
      }
      return;

    case 'array': {
      const arrLeft = left as JsonValue[];
      const arrRight = right as JsonValue[];
      const maxLen = Math.max(arrLeft.length, arrRight.length);

      for (let i = 0; i < maxLen; i++) {
        const itemLeft = i < arrLeft.length ? arrLeft[i] : undefined;
        const itemRight = i < arrRight.length ? arrRight[i] : undefined;
        const nextTokens = [...tokens, i];
        const nextPointer = encodePointer(nextTokens);

        compareNodes(itemLeft, itemRight, nextTokens, nextPointer, ignoredSet, diffs, locale);
      }
      return;
    }

    case 'object': {
      // 安全地遍历对象本身的属性（防御原型污染）
      const objLeft = left as Record<string, JsonValue>;
      const objRight = right as Record<string, JsonValue>;

      const keysLeft = Object.keys(objLeft);
      const keysRight = Object.keys(objRight);
      const allKeysSet = new Set<string>();

      for (const k of keysLeft) {
        if (Object.prototype.hasOwnProperty.call(objLeft, k)) {
          allKeysSet.add(k);
        }
      }
      for (const k of keysRight) {
        if (Object.prototype.hasOwnProperty.call(objRight, k)) {
          allKeysSet.add(k);
        }
      }

      // 稳定字典序遍历键名，保证差异顺序确定性
      const sortedKeys = Array.from(allKeysSet).sort();

      for (const key of sortedKeys) {
        const hasLeft = Object.prototype.hasOwnProperty.call(objLeft, key);
        const hasRight = Object.prototype.hasOwnProperty.call(objRight, key);

        const valLeft = hasLeft ? objLeft[key] : undefined;
        const valRight = hasRight ? objRight[key] : undefined;

        const nextTokens = [...tokens, key];
        const nextPointer = encodePointer(nextTokens);

        compareNodes(valLeft, valRight, nextTokens, nextPointer, ignoredSet, diffs, locale);
      }
      return;
    }

    default:
      return;
  }
}

/**
 * 核心结构化比较纯函数
 *
 * @param leftParsed 左侧（原始）解析后的 JSON 结构
 * @param rightParsed 右侧（新版）解析后的 JSON 结构
 * @param ignoredPaths 忽略的 JSON Pointer 路径列表或集合
 * @returns 差异列表与统计数据
 */
export function compareJson(
  leftParsed: JsonValue,
  rightParsed: JsonValue,
  ignoredPaths?: Iterable<string>,
  locale: Locale = 'zh-CN'
): CompareResult {
  const ignoredSet = new Set<string>(ignoredPaths || []);
  const diffs: DiffItem[] = [];

  const rootPointer = '';
  const rootTokens: (string | number)[] = [];

  compareNodes(leftParsed, rightParsed, rootTokens, rootPointer, ignoredSet, diffs, locale);

  let addedCount = 0;
  let removedCount = 0;
  let valueChangedCount = 0;
  let typeChangedCount = 0;

  for (const item of diffs) {
    switch (item.type) {
      case 'added':
        addedCount++;
        break;
      case 'removed':
        removedCount++;
        break;
      case 'value_changed':
        valueChangedCount++;
        break;
      case 'type_changed':
        typeChangedCount++;
        break;
    }
  }

  const summary: DiffSummary = {
    addedCount,
    removedCount,
    valueChangedCount,
    typeChangedCount,
    totalCount: diffs.length,
  };

  return {
    diffs,
    summary,
    ignoredCount: ignoredSet.size,
  };
}
