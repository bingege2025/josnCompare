import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackEvent,
  getUsageStats,
  resetUsageStats,
} from '../src/services/analytics';
import {
  buildGoogleAnalyticsPayload,
  isGoogleAnalyticsConfigured,
  sendGoogleAnalyticsEvent,
} from '../src/services/googleAnalytics';

describe('插件埋点与使用频次统计 (analytics)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
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

  it('未配置 Google Analytics 时不执行远程上报', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await sendGoogleAnalyticsEvent('compare_execute', { diffCount: 3 }, { enabled: false });
    expect(fetchSpy).not.toHaveBeenCalled();

    await trackEvent('compare_execute', { diffCount: 3 });
    const stats = await getUsageStats();
    expect('remoteEndpoint' in stats).toBe(false);

    await resetUsageStats();
    const resetStats = await getUsageStats();
    expect(resetStats.totalCompares).toBe(0);
    expect('remoteEndpoint' in resetStats).toBe(false);
  });

  it('应当记录关键产品行为埋点', async () => {
    await trackEvent('language_changed', { locale: 'en' });
    await trackEvent('stats_opened');
    await trackEvent('compare_failed', { leftInvalid: true, rightInvalid: false });
    await trackEvent('filter_changed', { filter: 'added' });
    await trackEvent('page_size_changed', { pageSize: 50 });
    await trackEvent('ignored_drawer_toggled', { open: true });

    const stats = await getUsageStats();
    expect(stats.eventCounts['language_changed']).toBe(1);
    expect(stats.eventCounts['stats_opened']).toBe(1);
    expect(stats.eventCounts['compare_failed']).toBe(1);
    expect(stats.eventCounts['filter_changed']).toBe(1);
    expect(stats.eventCounts['page_size_changed']).toBe(1);
    expect(stats.eventCounts['ignored_drawer_toggled']).toBe(1);
    expect(stats.totalCompares).toBe(0);
  });

  it('Google Analytics 只上报安全汇总字段，不包含 JSON 内容、路径或差异值', async () => {
    expect(isGoogleAnalyticsConfigured({
      enabled: true,
      measurementId: 'G-TEST12345',
      apiSecret: 'secret',
    })).toBe(true);

    const payload = await buildGoogleAnalyticsPayload('compare_execute', {
      diffCount: 4,
      addedCount: 1,
      removedCount: 1,
      valueChangedCount: 2,
      locale: 'en',
      path: '/user/password',
      pointer: '/secret/token',
      oldValue: '123456',
      newValue: 'abcdef',
      jsonContent: '{"password":"123456"}',
      error: 'Unexpected token near secret',
    });

    const serialized = JSON.stringify(payload);
    expect(payload.events[0].params.diff_count).toBe(4);
    expect(payload.events[0].params.added_count).toBe(1);
    expect(payload.events[0].params.removed_count).toBe(1);
    expect(payload.events[0].params.value_changed_count).toBe(2);
    expect(payload.events[0].params.locale).toBe('en');
    expect(serialized).not.toContain('/user/password');
    expect(serialized).not.toContain('/secret/token');
    expect(serialized).not.toContain('123456');
    expect(serialized).not.toContain('abcdef');
    expect(serialized).not.toContain('Unexpected token');
  });

  it('配置 Google Analytics 后按 Measurement Protocol 发送事件', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await sendGoogleAnalyticsEvent(
      'language_changed',
      { locale: 'de' },
      {
        enabled: true,
        measurementId: 'G-TEST12345',
        apiSecret: 'secret',
      }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('https://www.google-analytics.com/mp/collect');
    expect(String(url)).toContain('measurement_id=G-TEST12345');
    expect(String(url)).toContain('api_secret=secret');
    expect(init?.method).toBe('POST');

    const body = JSON.parse(String(init?.body));
    expect(body.events[0].name).toBe('language_changed');
    expect(body.events[0].params.locale).toBe('de');
  });
});
