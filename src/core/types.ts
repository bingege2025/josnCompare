import type { LosslessNumber } from 'lossless-json';

export type DiffType = 'added' | 'removed' | 'value_changed' | 'type_changed';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | LosslessNumber
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface DiffItem {
  /** RFC 6901 JSON Pointer 路径，例如 "/users/0/id" 或 ""（根节点） */
  pointer: string;
  /** 友好的可读路径展示，例如 "users[0].id" */
  displayPath: string;
  /** 差异类型 */
  type: DiffType;
  /** 左侧原始值（若被删除或修改；若为 added 则为 undefined） */
  oldValue: JsonValue | undefined;
  /** 右侧新值（若为新增或修改；若为 removed 则为 undefined） */
  newValue: JsonValue | undefined;
}

export interface DiffSummary {
  addedCount: number;
  removedCount: number;
  valueChangedCount: number;
  typeChangedCount: number;
  totalCount: number;
}

export interface CompareResult {
  diffs: DiffItem[];
  summary: DiffSummary;
  ignoredCount: number;
}

export interface ParseSuccess {
  success: true;
  data: JsonValue;
  sizeBytes: number;
}

export interface ParseError {
  success: false;
  error: string;
  line?: number;
  column?: number;
  sizeBytes: number;
}

export type ParseResult = ParseSuccess | ParseError;
