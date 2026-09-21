import React from 'react';
import { ArrowLeftRight, Trash2, FileText, Play, AlignLeft, BarChart2, Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, useI18n, type Locale } from '../i18n';

interface HeaderProps {
  onLoadMock: () => void;
  onFormatBoth: () => void;
  onSwap: () => void;
  onClearBoth: () => void;
  onCompare: () => void;
  onOpenStats: () => void;
  isStale: boolean;
  canCompare: boolean;
  totalCompares?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadMock,
  onFormatBoth,
  onSwap,
  onClearBoth,
  onCompare,
  onOpenStats,
  isStale,
  canCompare,
  totalCompares = 0,
}) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="header">
      <div className="brand-section">
        <div className="brand-logo">{}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">JSON Compare</span>
            <span className="brand-badge">{t.header.badge}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <label className="language-select-wrap" title={t.header.languageTitle}>
          <Languages size={14} />
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="language-select"
            aria-label={t.header.languageTitle}
          >
            {LANGUAGE_OPTIONS.map((item) => (
              <option key={item.locale} value={item.locale}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onLoadMock}
          title={t.header.loadSampleTitle}
        >
          <FileText size={14} />
          {t.header.loadSample}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onFormatBoth}
          title={t.header.formatBothTitle}
        >
          <AlignLeft size={14} />
          {t.header.formatBoth}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onSwap}
          title={t.header.swapTitle}
        >
          <ArrowLeftRight size={14} />
          {t.header.swap}
        </button>

        <button
          type="button"
          className="btn btn-danger"
          onClick={onClearBoth}
          title={t.header.clearTitle}
        >
          <Trash2 size={14} />
          {t.header.clear}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenStats}
          title={t.header.statsTitle}
          style={{ position: 'relative' }}
        >
          <BarChart2 size={14} color="#2563eb" />
          {t.header.stats}
          {totalCompares > 0 && (
            <span
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '10px',
                padding: '1px 5px',
                fontWeight: 600,
              }}
            >
              {totalCompares}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`btn btn-primary ${isStale ? 'btn-pulse' : ''}`}
          onClick={onCompare}
          disabled={!canCompare}
          title={isStale ? t.header.recompareTitle : t.header.compareTitle}
          style={{ minWidth: '100px' }}
        >
          <Play size={14} fill="currentColor" />
          {isStale ? t.header.recompare : t.header.compare}
        </button>
      </div>
    </header>
  );
};
