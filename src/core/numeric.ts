import { isLosslessNumber, type LosslessNumber } from 'lossless-json';

export interface NormalizedDecimal {
  sign: 1 | -1 | 0;
  digits: string; // 去除首尾无意义0的纯数字字符串，若是0则为 "0"
  exponent: bigint; // 最终十进制指数，使得 value = sign * digits * 10^exponent
}

/**
 * 将任意合法数字字符串规范化为标准十进制表示
 */
export function normalizeDecimal(rawStr: string): NormalizedDecimal {
  let str = rawStr.trim();
  if (!str) {
    return { sign: 0, digits: '0', exponent: 0n };
  }

  let sign: 1 | -1 = 1;
  if (str.startsWith('-')) {
    sign = -1;
    str = str.slice(1);
  } else if (str.startsWith('+')) {
    str = str.slice(1);
  }

  // 拆分科学计数法
  let eExp = 0n;
  const eIdx = str.search(/[eE]/);
  if (eIdx !== -1) {
    const ePart = str.slice(eIdx + 1);
    str = str.slice(0, eIdx);
    eExp = BigInt(ePart);
  }

  // 拆分整数与小数部分
  const dotIdx = str.indexOf('.');
  let intPart = str;
  let fracPart = '';
  if (dotIdx !== -1) {
    intPart = str.slice(0, dotIdx);
    fracPart = str.slice(dotIdx + 1);
  }

  // 合并数字序列，初始小数位数带来的负指数
  const fracLen = BigInt(fracPart.length);
  let combined = intPart + fracPart;

  // 去除前导 0
  combined = combined.replace(/^0+/, '');

  // 如果全为0或为空，则数值为 0
  if (!combined) {
    return { sign: 0, digits: '0', exponent: 0n };
  }

  // 计算初始指数：eExp - fracLen
  let exp = eExp - fracLen;

  // 去除尾随 0 并增加指数
  const trailingZeros = combined.length - combined.replace(/0+$/, '').length;
  if (trailingZeros > 0) {
    combined = combined.slice(0, combined.length - trailingZeros);
    exp += BigInt(trailingZeros);
  }

  return {
    sign,
    digits: combined,
    exponent: exp,
  };
}

/**
 * 提取 LosslessNumber / number / bigint 的字符串表达
 */
export function getNumericString(val: unknown): string | null {
  if (isLosslessNumber(val)) {
    return (val as LosslessNumber).value;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return null;
    return String(val);
  }
  if (typeof val === 'bigint') {
    return val.toString();
  }
  return null;
}

/**
 * 判断两个数值是否在数学上严格相等（支持高精度大数、科学计数法、1 vs 1.0）
 */
export function areNumbersEqual(a: unknown, b: unknown): boolean {
  const strA = getNumericString(a);
  const strB = getNumericString(b);

  if (strA === null || strB === null) {
    return false;
  }

  // 快速路径：字面完全一致
  if (strA === strB) {
    return true;
  }

  try {
    const decA = normalizeDecimal(strA);
    const decB = normalizeDecimal(strB);

    if (decA.sign !== decB.sign) {
      return false;
    }
    if (decA.sign === 0) {
      return true; // 均为 0
    }
    return decA.digits === decB.digits && decA.exponent === decB.exponent;
  } catch {
    return false;
  }
}

/**
 * 将可能包含 LosslessNumber 的值安全转换为可读展示的字符串或原生值
 */
export function formatNumericValue(val: unknown): string {
  if (isLosslessNumber(val)) {
    return (val as LosslessNumber).value;
  }
  if (typeof val === 'bigint') {
    return val.toString();
  }
  return String(val);
}
