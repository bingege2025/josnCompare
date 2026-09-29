import type { AnalyticsEventType } from './analytics';

export interface GoogleAnalyticsConfig {
  enabled?: boolean;
  measurementId?: string;
  apiSecret?: string;
  debug?: boolean;
}

interface GoogleAnalyticsPayload {
  client_id: string;
  events: Array<{
    name: AnalyticsEventType;
    params: Record<string, string | number | boolean>;
  }>;
}

const CLIENT_ID_KEY = 'json_compare_ga_client_id';
const DEFAULT_SESSION_ID = String(Date.now());
const GA_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';

const SAFE_META_KEYS = {
  addedCount: 'added_count',
  diffCount: 'diff_count',
  filter: 'filter',
  ignoredCount: 'ignored_count',
  leftInvalid: 'left_invalid',
  locale: 'locale',
  open: 'open',
  pageSize: 'page_size',
  removedCount: 'removed_count',
  rightInvalid: 'right_invalid',
  side: 'side',
  typeChangedCount: 'type_changed_count',
  valueChangedCount: 'value_changed_count',
} as const;

type SafeMetaKey = keyof typeof SAFE_META_KEYS;

function getRuntimeConfig(): Required<GoogleAnalyticsConfig> {
  return {
    enabled: import.meta.env.VITE_GA_ENABLED === 'true',
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
    apiSecret: import.meta.env.VITE_GA_API_SECRET || '',
    debug: import.meta.env.VITE_GA_DEBUG === 'true',
  };
}

function isStringOrNumberOrBoolean(value: unknown): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

export function isGoogleAnalyticsConfigured(config: GoogleAnalyticsConfig = getRuntimeConfig()): boolean {
  return Boolean(config.enabled && config.measurementId && config.apiSecret);
}

function getRandomClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getClientId(): Promise<string> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get(CLIENT_ID_KEY);
      const stored = res[CLIENT_ID_KEY];
      if (typeof stored === 'string' && stored) {
        return stored;
      }
      const next = getRandomClientId();
      await chrome.storage.local.set({ [CLIENT_ID_KEY]: next });
      return next;
    }

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(CLIENT_ID_KEY);
      if (stored) {
        return stored;
      }
      const next = getRandomClientId();
      localStorage.setItem(CLIENT_ID_KEY, next);
      return next;
    }
  } catch (e) {
    console.warn('初始化 Google Analytics client_id 失败:', e);
  }

  return getRandomClientId();
}

function buildSafeParams(meta?: Record<string, unknown>): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    event_source: 'chrome_extension',
    app_version: '1.0.0',
    session_id: DEFAULT_SESSION_ID,
    engagement_time_msec: 1,
  };

  if (!meta) {
    return params;
  }

  (Object.keys(SAFE_META_KEYS) as SafeMetaKey[]).forEach((key) => {
    const value = meta[key];
    if (isStringOrNumberOrBoolean(value)) {
      params[SAFE_META_KEYS[key]] = value;
    }
  });

  return params;
}

export async function buildGoogleAnalyticsPayload(
  event: AnalyticsEventType,
  meta?: Record<string, unknown>
): Promise<GoogleAnalyticsPayload> {
  return {
    client_id: await getClientId(),
    events: [
      {
        name: event,
        params: buildSafeParams(meta),
      },
    ],
  };
}

export async function sendGoogleAnalyticsEvent(
  event: AnalyticsEventType,
  meta?: Record<string, unknown>,
  config: GoogleAnalyticsConfig = getRuntimeConfig()
): Promise<void> {
  if (!isGoogleAnalyticsConfigured(config) || typeof fetch === 'undefined') {
    return;
  }

  const endpoint = config.debug ? GA_DEBUG_URL : GA_COLLECT_URL;
  const url = `${endpoint}?measurement_id=${encodeURIComponent(config.measurementId || '')}&api_secret=${encodeURIComponent(config.apiSecret || '')}`;

  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(await buildGoogleAnalyticsPayload(event, meta)),
    });
  } catch (e) {
    console.warn('发送 Google Analytics 埋点失败:', e);
  }
}
