import React from 'react';
import { EyeOff } from 'lucide-react';
import type { DiffSummary, DiffType } from '../core/types';
import { useI18n } from '../i18n';

interface SummaryBarProps {
  summary: DiffSummary;
  currentFilter: DiffType | 'all';
  onFilterChange: (filter: DiffType | 'all') => void;
  ignoredCount: number;
  showIgnoredDrawer: boolean;
  onToggleIgnoredDrawer: () => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({
  summary,
  currentFilter,
  onFilterChange,
  ignoredCount,
  showIgnoredDrawer,
  onToggleIgnoredDrawer,
}) => {
  const { t } = useI18n();

  return (
    <div className="summary-toolbar">
      <div className="filter-badges">
        <button
          type="button"
          className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          {t.summary.all}
          <span className="filter-count">{summary.totalCount}</span>
        </button>

        <button
          type="button"
          className={`filter-btn ${currentFilter === 'added' ? 'active' : ''}`}
          onClick={() => onFilterChange('added')}
          style={
            currentFilter === 'added'
              ? { borderColor: 'var(--added-badge)', color: 'var(--added-text)', backgroundColor: 'var(--added-bg)' }
              : {}
          }
        >
          <span style={{ color: 'var(--added-badge)', fontWeight: 700 }}>+</span>
          {t.summary.added}
          <span className="filter-count">{summary.addedCount}</span>
        </button>

        <button
          type="button"
          className={`filter-btn ${currentFilter === 'removed' ? 'active' : ''}`}
          onClick={() => onFilterChange('removed')}
          style={
            currentFilter === 'removed'
              ? { borderColor: 'var(--removed-badge)', color: 'var(--removed-text)', backgroundColor: 'var(--removed-bg)' }
              : {}
          }
        >
          <span style={{ color: 'var(--removed-badge)', fontWeight: 700 }}>-</span>
          {t.summary.removed}
          <span className="filter-count">{summary.removedCount}</span>
        </button>

        <button
          type="button"
          className={`filter-btn ${currentFilter === 'value_changed' ? 'active' : ''}`}
          onClick={() => onFilterChange('value_changed')}
          style={
            currentFilter === 'value_changed'
              ? { borderColor: 'var(--modified-badge)', color: 'var(--modified-text)', backgroundColor: 'var(--modified-bg)' }
              : {}
          }
        >
          <span style={{ color: 'var(--modified-badge)', fontWeight: 700 }}>~</span>
          {t.summary.valueChanged}
          <span className="filter-count">{summary.valueChangedCount}</span>
        </button>

        <button
          type="button"
          className={`filter-btn ${currentFilter === 'type_changed' ? 'active' : ''}`}
          onClick={() => onFilterChange('type_changed')}
          style={
            currentFilter === 'type_changed'
              ? { borderColor: 'var(--type-badge)', color: 'var(--type-text)', backgroundColor: 'var(--type-bg)' }
              : {}
          }
        >
          <span style={{ color: 'var(--type-badge)', fontWeight: 700 }}>⇄</span>
          {t.summary.typeChanged}
          <span className="filter-count">{summary.typeChangedCount}</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          className="ignore-manage-btn"
          onClick={onToggleIgnoredDrawer}
          style={ignoredCount > 0 ? { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' } : {}}
        >
          <EyeOff size={14} />
          {t.summary.ignoredPaths}
          <span className="filter-count" style={{ marginLeft: '4px' }}>
            {ignoredCount}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {showIgnoredDrawer ? t.summary.collapse : t.summary.view}
          </span>
        </button>
      </div>
    </div>
  );
};
