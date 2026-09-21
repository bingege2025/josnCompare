/**
 * 插件埋点与使用频次统计服务
 * 支持：
 * 1. 本地免依赖安全持久化（优先 chrome.storage.local，回退 localStorage）
 * 2. 统计今日比对次数、累计比对次数、功能模块使用频次、操作日志
 */

export type AnalyticsEventType =
  | 'extension_open'
  | 'compare_execute'
  | 'mock_loaded'
  | 'format_both'
  | 'format_single'
  | 'swap_sides'
  | 'clear_all'
  | 'ignore_path'
  | 'restore_path'
  | 'clear_ignored'
  | 'copy_value'
  | 'copy_path';

export interface EventLogItem {
  id: string;
  event: AnalyticsEventType;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface UsageStats {
  totalOpens: number;
  totalCompares: number;
  todayCompares: number;
  todayDate: string; // YYYY-MM-DD
  lastUsedAt: number;
  eventCounts: Record<AnalyticsEventType | string, number>;
  recentLogs: EventLogItem[];
}

const STORAGE_KEY = 'json_compare_usage_stats';

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDefaultStats(): UsageStats {
  return {
    totalOpens: 0,
    totalCompares: 0,
    todayCompares: 0,
    todayDate: getTodayStr(),
    lastUsedAt: Date.now(),
    eventCounts: {},
    recentLogs: [],
  };
}

let inMemoryStore: UsageStats | null = null;

/**
 * 通用底层存储适配器
 */
const storageAdapter = {
  async get(): Promise<UsageStats> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const res = await chrome.storage.local.get(STORAGE_KEY);
        if (res && res[STORAGE_KEY]) {
          return { ...getDefaultStats(), ...res[STORAGE_KEY] };
        }
      } else if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return { ...getDefaultStats(), ...JSON.parse(raw) };
        }
      } else if (inMemoryStore) {
        return { ...getDefaultStats(), ...inMemoryStore };
      }
    } catch (e) {
      console.warn('读取埋点统计数据失败:', e);
    }
    return getDefaultStats();
  },

  async set(stats: UsageStats): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: stats });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      } else {
        inMemoryStore = JSON.parse(JSON.stringify(stats));
      }
    } catch (e) {
      console.warn('写入埋点统计数据失败:', e);
    }
  },

  async remove(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(STORAGE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      inMemoryStore = null;
    } catch (e) {
      console.warn('清除埋点统计数据失败:', e);
    }
  },
};

/**
 * 记录埋点事件并更新使用频次统计
 */
export async function trackEvent(
  event: AnalyticsEventType,
  meta?: Record<string, unknown>
): Promise<UsageStats> {
  const stats = await storageAdapter.get();
  const today = getTodayStr();

  // 跨自然日重置今日计数
  if (stats.todayDate !== today) {
    stats.todayDate = today;
    stats.todayCompares = 0;
  }

  stats.lastUsedAt = Date.now();

  // 累加事件计数
  stats.eventCounts[event] = (stats.eventCounts[event] || 0) + 1;

  if (event === 'extension_open') {
    stats.totalOpens = (stats.totalOpens || 0) + 1;
  } else if (event === 'compare_execute') {
    stats.totalCompares = (stats.totalCompares || 0) + 1;
    stats.todayCompares = (stats.todayCompares || 0) + 1;
  }

  // 追加操作日志（保留最近 50 条）
  const logItem: EventLogItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    timestamp: Date.now(),
    meta,
  };
  stats.recentLogs = [logItem, ...(stats.recentLogs || [])].slice(0, 50);

  // 异步存储更新
  await storageAdapter.set(stats);

  return stats;
}

/**
 * 获取当前使用统计数据
 */
export async function getUsageStats(): Promise<UsageStats> {
  const stats = await storageAdapter.get();
  const today = getTodayStr();
  if (stats.todayDate !== today) {
    stats.todayDate = today;
    stats.todayCompares = 0;
    await storageAdapter.set(stats);
  }
  return stats;
}

/**
 * 清空所有统计数据
 */
export async function resetUsageStats(): Promise<UsageStats> {
  await storageAdapter.remove();
  return getDefaultStats();
}
