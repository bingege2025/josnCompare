import { translations, type Locale } from '../i18n';

/**
 * RFC 6901 JSON Pointer 编解码与路径工具
 */

export function escapePointerToken(token: string | number): string {
  return String(token).replace(/~/g, '~0').replace(/\//g, '~1');
}

export function unescapePointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * 将路径 token 数组编码为 RFC 6901 JSON Pointer
 * 例如: ['users', 0, 'name'] => "/users/0/name"
 * 空数组 => "" (根节点)
 */
export function encodePointer(tokens: (string | number)[]): string {
  if (tokens.length === 0) return '';
  return '/' + tokens.map(escapePointerToken).join('/');
}

/**
 * 将 RFC 6901 JSON Pointer 解码为 token 数组
 * 例如: "/users/0/name" => ['users', '0', 'name']
 * "" => []
 */
export function decodePointer(pointer: string, locale: Locale = 'zh-CN'): string[] {
  if (!pointer || pointer === '') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(translations[locale].jsonPointer.illegal(pointer));
  }
  return pointer.slice(1).split('/').map(unescapePointerToken);
}

/**
 * 生成对开发者友好的 JavaScript / 对象导航风格的展示路径
 * 例如: ['users', 0, 'a.b', 'c/d'] => 'users[0]["a.b"]["c/d"]'
 * 根节点 => '(根节点)'
 */
export function toDisplayPath(tokens: (string | number)[], locale: Locale = 'zh-CN'): string {
  if (tokens.length === 0) return translations[locale].jsonPointer.rootNode;

  let path = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token === 'number' || /^\d+$/.test(String(token))) {
      path += `[${token}]`;
    } else {
      const str = String(token);
      // 如果是合法的 JS 标识符且不是首个 token，可以使用 .key
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)) {
        if (i === 0) {
          path += str;
        } else {
          path += `.${str}`;
        }
      } else {
        path += `[${JSON.stringify(str)}]`;
      }
    }
  }
  return path;
}

/**
 * 判断 childPointer 是否等于 parentPointer 或属于 parentPointer 的子路径
 */
export function isSubPointer(childPointer: string, parentPointer: string): boolean {
  if (parentPointer === '') return true; // 根节点是所有节点的父节点
  if (childPointer === parentPointer) return true;
  return childPointer.startsWith(parentPointer + '/');
}

/**
 * 判断指定 pointer 是否命中了已忽略的路径规则集合（包括任一父路径被忽略）
 */
export function isPathIgnored(targetPointer: string, ignoredPointers: Set<string> | Iterable<string>): boolean {
  for (const parent of ignoredPointers) {
    if (isSubPointer(targetPointer, parent)) {
      return true;
    }
  }
  return false;
}
