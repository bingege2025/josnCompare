import { describe, it, expect } from 'vitest';
import { parseJson } from '../src/core/parser';
import { compareJson } from '../src/core/comparator';
import { type ParseSuccess } from '../src/core/types';

function parseOrThrow(jsonStr: string) {
  const res = parseJson(jsonStr);
  if (!res.success) {
    throw new Error(`Parse failed: ${res.error}`);
  }
  return (res as ParseSuccess).data;
}

describe('JSON 结构化比对器 (comparator)', () => {
  it('1. 对象键顺序不同，不算差异', () => {
    const left = parseOrThrow('{"a": 1, "b": 2, "c": {"x": "foo", "y": "bar"}}');
    const right = parseOrThrow('{"b": 2, "c": {"y": "bar", "x": "foo"}, "a": 1}');

    const result = compareJson(left, right);
    expect(result.diffs.length).toBe(0);
    expect(result.summary.totalCount).toBe(0);
  });

  it('2. 嵌套字段增删改及类型变化', () => {
    const left = parseOrThrow(JSON.stringify({
      user: {
        id: 1001,
        name: 'Alice',
        address: { city: 'Beijing', zip: '100000' },
        active: true,
      },
    }));

    const right = parseOrThrow(JSON.stringify({
      user: {
        id: 1001,
        name: 'Bob', // value_changed
        address: { city: 'Shanghai' }, // zip: removed
        active: 'true', // type_changed (boolean -> string)
        role: 'admin', // added
      },
    }));

    const result = compareJson(left, right);
    expect(result.summary.valueChangedCount).toBe(2);
    expect(result.summary.removedCount).toBe(1);
    expect(result.summary.typeChangedCount).toBe(1);
    expect(result.summary.addedCount).toBe(1);
    expect(result.summary.totalCount).toBe(5);

    const nameDiff = result.diffs.find((d) => d.pointer === '/user/name');
    expect(nameDiff).toBeDefined();
    expect(nameDiff?.type).toBe('value_changed');

    const zipDiff = result.diffs.find((d) => d.pointer === '/user/address/zip');
    expect(zipDiff).toBeDefined();
    expect(zipDiff?.type).toBe('removed');

    const activeDiff = result.diffs.find((d) => d.pointer === '/user/active');
    expect(activeDiff).toBeDefined();
    expect(activeDiff?.type).toBe('type_changed');

    const roleDiff = result.diffs.find((d) => d.pointer === '/user/role');
    expect(roleDiff).toBeDefined();
    expect(roleDiff?.type).toBe('added');
  });

  it('3. 数组按索引比较：换序与长度变化', () => {
    const left = parseOrThrow('[10, 20, 30]');
    const right = parseOrThrow('[20, 10, 30, 40]');

    const result = compareJson(left, right);
    // index 0: 10 vs 20 -> value_changed
    // index 1: 20 vs 10 -> value_changed
    // index 2: 30 vs 30 -> equal
    // index 3: missing vs 40 -> added
    expect(result.summary.valueChangedCount).toBe(2);
    expect(result.summary.addedCount).toBe(1);
    expect(result.summary.totalCount).toBe(3);

    const diff0 = result.diffs.find((d) => d.pointer === '/0');
    expect(diff0?.type).toBe('value_changed');

    const diff3 = result.diffs.find((d) => d.pointer === '/3');
    expect(diff3?.type).toBe('added');
  });

  it('4. 明确区分字段不存在、null、空字符串、0 和 false', () => {
    const left = parseOrThrow(JSON.stringify({
      fieldMissingInRight: null,
      valNull: null,
      valZero: 0,
      valEmptyStr: '',
      valFalse: false,
    }));

    const right = parseOrThrow(JSON.stringify({
      valNull: '', // null vs "" -> type_changed
      valZero: false, // 0 vs false -> type_changed
      valEmptyStr: 0, // "" vs 0 -> type_changed
      valFalse: 'false', // false vs "false" -> type_changed
      fieldMissingInLeft: null, // added
    }));

    const result = compareJson(left, right);

    // fieldMissingInRight is removed
    const removedDiff = result.diffs.find((d) => d.pointer === '/fieldMissingInRight');
    expect(removedDiff?.type).toBe('removed');

    // fieldMissingInLeft is added
    const addedDiff = result.diffs.find((d) => d.pointer === '/fieldMissingInLeft');
    expect(addedDiff?.type).toBe('added');

    // valNull: null -> string
    const nullDiff = result.diffs.find((d) => d.pointer === '/valNull');
    expect(nullDiff?.type).toBe('type_changed');

    // valZero: number -> boolean
    const zeroDiff = result.diffs.find((d) => d.pointer === '/valZero');
    expect(zeroDiff?.type).toBe('type_changed');

    // valEmptyStr: string -> number
    const emptyDiff = result.diffs.find((d) => d.pointer === '/valEmptyStr');
    expect(emptyDiff?.type).toBe('type_changed');
  });

  it('5. 数字 1 与字符串 "1" 不相等，且记为类型变化', () => {
    const left = parseOrThrow('{"val": 1}');
    const right = parseOrThrow('{"val": "1"}');

    const result = compareJson(left, right);
    expect(result.diffs.length).toBe(1);
    expect(result.diffs[0].type).toBe('type_changed');
  });

  it('6. 相同数字的不同合法表示（1 和 1.0, 100 和 1e2）视为相等', () => {
    const left = parseOrThrow('{"intVal": 1, "expVal": 100, "floatVal": 0.50}');
    const right = parseOrThrow('{"intVal": 1.0, "expVal": 1e2, "floatVal": 0.5}');

    const result = compareJson(left, right);
    expect(result.diffs.length).toBe(0);
  });

  it('7. 避免 JavaScript 数字精度损失造成误判（超长整数 ID）', () => {
    // 超过 Number.MAX_SAFE_INTEGER (9007199254740991)
    const left = parseOrThrow('{"orderId": 90071992547409929999999999999991}');
    const rightDiff = parseOrThrow('{"orderId": 90071992547409929999999999999992}');
    const rightSame = parseOrThrow('{"orderId": 90071992547409929999999999999991}');

    const diffResult = compareJson(left, rightDiff);
    expect(diffResult.diffs.length).toBe(1);
    expect(diffResult.diffs[0].type).toBe('value_changed');

    const sameResult = compareJson(left, rightSame);
    expect(sameResult.diffs.length).toBe(0);
  });

  it('8. 特殊字段名和路径转义（含点号、斜杠、波浪号）', () => {
    const left = parseOrThrow(JSON.stringify({
      'user/name': 'old',
      'user~meta': 'val1',
      'a.b.c': 'dotOld',
    }));

    const right = parseOrThrow(JSON.stringify({
      'user/name': 'new',
      'user~meta': 'val2',
      'a.b.c': 'dotNew',
    }));

    const result = compareJson(left, right);
    expect(result.diffs.length).toBe(3);

    const slashDiff = result.diffs.find((d) => d.pointer === '/user~1name');
    expect(slashDiff).toBeDefined();
    expect(slashDiff?.displayPath).toBe('["user/name"]');

    const tildeDiff = result.diffs.find((d) => d.pointer === '/user~0meta');
    expect(tildeDiff).toBeDefined();

    // 针对特殊路径进行忽略
    const ignoredResult = compareJson(left, right, ['/user~1name']);
    expect(ignoredResult.diffs.length).toBe(2);
    expect(ignoredResult.diffs.find((d) => d.pointer === '/user~1name')).toBeUndefined();
  });

  it('9. 忽略父路径时，其全部子项都不参与比较，恢复后重新出现', () => {
    const left = parseOrThrow(JSON.stringify({
      logInfo: {
        timestamp: 1600000000,
        requestId: 'req-111',
        trace: { spanId: 'span-1' },
      },
      businessData: { status: 'SUCCESS' },
    }));

    const right = parseOrThrow(JSON.stringify({
      logInfo: {
        timestamp: 1600000005,
        requestId: 'req-222',
        trace: { spanId: 'span-2' },
      },
      businessData: { status: 'FAILED' },
    }));

    // 不忽略时，共 4 处差异（timestamp, requestId, spanId, status）
    const allResult = compareJson(left, right);
    expect(allResult.diffs.length).toBe(4);

    // 忽略整个父级 /logInfo
    const ignoredParentResult = compareJson(left, right, ['/logInfo']);
    expect(ignoredParentResult.diffs.length).toBe(1);
    expect(ignoredParentResult.diffs[0].pointer).toBe('/businessData/status');

    // 恢复父路径（传空数组）
    const restoredResult = compareJson(left, right, []);
    expect(restoredResult.diffs.length).toBe(4);
  });

  it('10. 整体新增、删除、类型改变时，记为一条父级差异，不再重复统计子项', () => {
    // 场景 A: 整体新增一个多字段的复杂对象
    const leftObj = parseOrThrow('{}');
    const rightObj = parseOrThrow(JSON.stringify({
      newUser: {
        id: 1,
        name: 'test',
        profile: { avatar: 'a.png', bio: 'developer' },
        tags: ['admin', 'vip', 'staff'],
      },
    }));

    const addResult = compareJson(leftObj, rightObj);
    expect(addResult.diffs.length).toBe(1);
    expect(addResult.diffs[0].pointer).toBe('/newUser');
    expect(addResult.diffs[0].type).toBe('added');

    // 场景 B: 整体删除一个大数组
    const leftArr = parseOrThrow(JSON.stringify({ items: [1, 2, 3, 4, 5, 6, 7, 8] }));
    const rightArr = parseOrThrow('{}');

    const rmResult = compareJson(leftArr, rightArr);
    expect(rmResult.diffs.length).toBe(1);
    expect(rmResult.diffs[0].pointer).toBe('/items');
    expect(rmResult.diffs[0].type).toBe('removed');

    // 场景 C: 对象类型改变为字符串
    const leftType = parseOrThrow(JSON.stringify({ data: { a: 1, b: 2, c: [3, 4] } }));
    const rightType = parseOrThrow(JSON.stringify({ data: 'plain string' }));

    const typeResult = compareJson(leftType, rightType);
    expect(typeResult.diffs.length).toBe(1);
    expect(typeResult.diffs[0].pointer).toBe('/data');
    expect(typeResult.diffs[0].type).toBe('type_changed');
  });
});
