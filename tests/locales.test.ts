import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LANGUAGE_OPTIONS } from '../src/i18n';

const localeDirByAppLocale: Record<string, string> = {
  'zh-CN': 'zh_CN',
  en: 'en',
  de: 'de',
  fr: 'fr',
  ru: 'ru',
};

describe('Chrome 扩展多语言资源 (locales)', () => {
  it('Manifest 应启用 Chrome _locales 占位符', () => {
    const manifest = JSON.parse(readFileSync(resolve('public/manifest.json'), 'utf8'));

    expect(manifest.default_locale).toBe('zh_CN');
    expect(manifest.name).toBe('__MSG_extensionName__');
    expect(manifest.description).toBe('__MSG_extensionDescription__');
    expect(manifest.action.default_title).toBe('__MSG_actionTitle__');
  });

  it('每个应用语言都应提供 Chrome messages.json', () => {
    for (const { locale } of LANGUAGE_OPTIONS) {
      const chromeLocale = localeDirByAppLocale[locale];
      const messages = JSON.parse(
        readFileSync(resolve(`public/_locales/${chromeLocale}/messages.json`), 'utf8')
      );

      expect(messages.extensionName.message).toBeTruthy();
      expect(messages.extensionDescription.message).toBeTruthy();
      expect(messages.actionTitle.message).toBeTruthy();
    }
  });
});
