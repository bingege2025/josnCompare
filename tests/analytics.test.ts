import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackEvent,
  getUsageStats,
  resetUsageStats,
} from '../src/services/analytics';

describe('插件埋点与使用频次统计 (analytics)', () => {
  beforeEach(async () => {
    await resetUsageStats();
  });

  it('应当正确记录打开插件事件并累加打开次数', async () => {
    let stats = await getUsageStats();
    expect(stats.totalOpens).toBe(0);

    stats = await trackEvent('extension_open');
    expect(stats.totalOpens).toBe(1);
    expect(stats.eventCounts['extension_open']).toBe(1);

    stats = await trackEvent('extension_open');
    expect(stats.totalOpens).toBe(2);
  });

  it('应当正确记录比对执行并累加今日与累计比对频次', async () => {
    let stats = await trackEvent('compare_execute', { diffCount: 5 });
    expect(stats.totalCompares).toBe(1);
    expect(stats.todayCompares).toBe(1);
    expect(stats.recentLogs.length).toBe(1);
    expect(stats.recentLogs[0].meta?.diffCount).toBe(5);

    stats = await trackEvent('compare_execute', { diffCount: 0 });
    expect(stats.totalCompares).toBe(2);
    expect(stats.todayCompares).toBe(2);
  });

  it('应当记录其它各项功能的使用频次，但不保存字段路径元数据', async () => {
    await trackEvent('mock_loaded');
    await trackEvent('ignore_path');
    await trackEvent('format_both');
    await trackEvent('copy_path');

    const stats = await getUsageStats();
    expect(stats.eventCounts['mock_loaded']).toBe(1);
    expect(stats.eventCounts['ignore_path']).toBe(1);
    expect(stats.eventCounts['format_both']).toBe(1);
    expect(stats.eventCounts['copy_path']).toBe(1);
    expect(stats.recentLogs.length).toBe(4);
    expect(stats.recentLogs.find((log) => log.event === 'ignore_path')?.meta).toBeUndefined();
  });

  it('统计数据保持纯本地，不暴露远程上报配置', async () => {
    await trackEvent('compare_execute', { diffCount: 3 });
    const stats = await getUsageStats();
    expect('remoteEndpoint' in stats).toBe(false);

    await resetUsageStats();
    const resetStats = await getUsageStats();
    expect(resetStats.totalCompares).toBe(0);
    expect('remoteEndpoint' in resetStats).toBe(false);
  });
});
