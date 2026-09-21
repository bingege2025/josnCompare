import { describe, it, expect } from 'vitest';
import { areNumbersEqual, normalizeDecimal } from '../src/core/numeric';
import { parse as parseLossless } from 'lossless-json';

describe('高精度数值比较 (numeric)', () => {
  it('应当正确判断相同数字的不同合法表示相等 (例如 1 和 1.0, 100 和 1e2)', () => {
    const num1 = parseLossless('1');
    const num1_0 = parseLossless('1.0');
    const num1_00 = parseLossless('1.00');
    expect(areNumbersEqual(num1, num1_0)).toBe(true);
    expect(areNumbersEqual(num1_0, num1_00)).toBe(true);

    const num100 = parseLossless('100');
    const num1e2 = parseLossless('1e2');
    const num1_0e2 = parseLossless('1.0e2');
    expect(areNumbersEqual(num100, num1e2)).toBe(true);
    expect(areNumbersEqual(num100, num1_0e2)).toBe(true);

    const zero = parseLossless('0');
    const zeroDotZero = parseLossless('0.00');
    const minusZero = parseLossless('-0');
    expect(areNumbersEqual(zero, zeroDotZero)).toBe(true);
    expect(areNumbersEqual(zero, minusZero)).toBe(true);
  });

  it('应当正确保留并比较超过 JS 安全精度的超长整数 ID', () => {
    // Number.MAX_SAFE_INTEGER 是 9007199254740991
    const longId1 = parseLossless('90071992547409929999999999999991');
    const longId1_copy = parseLossless('90071992547409929999999999999991');
    const longId2 = parseLossless('90071992547409929999999999999992');

    expect(areNumbersEqual(longId1, longId1_copy)).toBe(true);
    expect(areNumbersEqual(longId1, longId2)).toBe(false);

    // 带 .0 的长整数也应相等
    const longId1_dotZero = parseLossless('90071992547409929999999999999991.0');
    expect(areNumbersEqual(longId1, longId1_dotZero)).toBe(true);
  });

  it('规范化小数指数应正确识别负数与正数', () => {
    const decA = normalizeDecimal('-123.45');
    expect(decA.sign).toBe(-1);
    expect(decA.digits).toBe('12345');
    expect(decA.exponent).toBe(-2n);

    const numNeg = parseLossless('-123.45');
    const numPos = parseLossless('123.45');
    expect(areNumbersEqual(numNeg, numPos)).toBe(false);
  });
});
