import { describe, it, expect } from 'vitest';
import { parseJson, MAX_INPUT_BYTES } from '../src/core/parser';

describe('JSON 解析与校验 (parser)', () => {
  it('应当支持所有合法的 JSON 根类型', () => {
    // 对象
    const resObj = parseJson('{"name": "test"}');
    expect(resObj.success).toBe(true);

    // 数组
    const resArr = parseJson('[1, 2, "3"]');
    expect(resArr.success).toBe(true);

    // 字符串
    const resStr = parseJson('"hello world"');
    expect(resStr.success).toBe(true);

    // 数字
    const resNum = parseJson('12345.67');
    expect(resNum.success).toBe(true);

    // 布尔值
    const resBool = parseJson('true');
    expect(resBool.success).toBe(true);

    // null
    const resNull = parseJson('null');
    expect(resNull.success).toBe(true);
  });

  it('空输入应该给出明确错误提示', () => {
    const res = parseJson('   ');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('输入内容为空');
    }
  });

  it('超过 1 MiB 限制应当明确报错', () => {
    // 构造超过 1 MiB 的字符串
    const largeStr = '"' + 'a'.repeat(MAX_INPUT_BYTES + 10) + '"';
    const res = parseJson(largeStr);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('超过了 1 MiB 限制');
    }
  });

  it('语法错误时应当尽量指示位置', () => {
    const invalidJson = '{\n  "name": "alice",\n  "age": \n}';
    const res = parseJson(invalidJson);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/语法错误|position|line/i);
    }
  });

  it('应当支持英文解析错误提示', () => {
    const emptyRes = parseJson('   ', 'en');
    expect(emptyRes.success).toBe(false);
    if (!emptyRes.success) {
      expect(emptyRes.error).toContain('Input is empty');
    }

    const invalidRes = parseJson('{"name": }', 'en');
    expect(invalidRes.success).toBe(false);
    if (!invalidRes.success) {
      expect(invalidRes.error).toMatch(/Syntax error|position|line/i);
    }
  });
});
