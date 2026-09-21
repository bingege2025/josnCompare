import { describe, it, expect } from 'vitest';
import {
  encodePointer,
  decodePointer,
  toDisplayPath,
  isSubPointer,
  isPathIgnored,
} from '../src/core/jsonPointer';

describe('JSON Pointer 工具 (RFC 6901)', () => {
  it('应当正确编码包含点号、斜杠、波浪号的字段路径', () => {
    const tokens = ['users', 0, 'a/b', 'm~n', 'normal'];
    const pointer = encodePointer(tokens);
    expect(pointer).toBe('/users/0/a~1b/m~0n/normal');

    const decoded = decodePointer(pointer);
    expect(decoded).toEqual(['users', '0', 'a/b', 'm~n', 'normal']);
  });

  it('根节点应该编码为空字符串 ""', () => {
    expect(encodePointer([])).toBe('');
    expect(decodePointer('')).toEqual([]);
  });

  it('toDisplayPath 应输出直观的开发者路径', () => {
    expect(toDisplayPath([])).toBe('(根节点)');
    expect(toDisplayPath(['user', 'name'])).toBe('user.name');
    expect(toDisplayPath(['users', 0, 'id'])).toBe('users[0].id');
    expect(toDisplayPath(['users', 0, 'a.b'])).toBe('users[0]["a.b"]');
    expect(toDisplayPath(['config', 'a/b'])).toBe('config["a/b"]');
  });

  it('isSubPointer 应准确判定父子路径关系，且不误判相似命名前缀', () => {
    expect(isSubPointer('/user/id', '/user')).toBe(true);
    expect(isSubPointer('/user', '/user')).toBe(true);
    // 关键：/users 不是 /user 的子路径！
    expect(isSubPointer('/users', '/user')).toBe(false);
    expect(isSubPointer('/users/0', '/user')).toBe(false);
    // 根节点是所有节点的父节点
    expect(isSubPointer('/any/path', '')).toBe(true);
  });

  it('isPathIgnored 应当支持父路径忽略时级联忽略全部子路径', () => {
    const ignored = new Set(['/data/metadata', '/configs']);
    expect(isPathIgnored('/data/metadata', ignored)).toBe(true);
    expect(isPathIgnored('/data/metadata/created_at', ignored)).toBe(true);
    expect(isPathIgnored('/data/metadata/tags/0', ignored)).toBe(true);

    // 未被忽略的路径
    expect(isPathIgnored('/data/user', ignored)).toBe(false);
    expect(isPathIgnored('/configs_extra', ignored)).toBe(false);
  });
});
