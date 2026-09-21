import React, { useState } from 'react';
import { Copy, EyeOff, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { DiffItem, DiffType } from '../core/types';
import { formatJsonValue, getValueTypeLabel } from '../core/format';
import { useI18n } from '../i18n';

interface DiffTableProps {
  diffs: DiffItem[];
  onIgnorePath: (pointer: string) => void;
  ignoredCount: number;
  onCopyAction?: (type: 'path' | 'value') => void;
}

const TYPE_CONFIG: Record<
  DiffType,
  { className: string; symbol: string }
> = {
  added: {
    className: 'added',
    symbol: '+',
  },
  removed: {
    className: 'removed',
    symbol: '-',
  },
  value_changed: {
    className: 'value_changed',
    symbol: '~',
  },
  type_changed: {
    className: 'type_changed',
    symbol: '⇄',
  },
};

export const DiffTable: React.FC<DiffTableProps> = ({
  diffs,
  onIgnorePath,
  ignoredCount,
  onCopyAction,
}) => {
  const { locale, t } = useI18n();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleCopy = async (key: string, text: string, copyType: 'path' | 'value') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (onCopyAction) onCopyAction(copyType);
      setTimeout(() => {
        setCopiedKey(null);
      }, 1500);
    } catch {
      // 容错处理
    }
  };

  const toggleExpand = (rowKey: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  if (diffs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon success">
          <Check size={28} />
        </div>
        <div className="empty-state-title">{t.diff.identicalTitle}</div>
        <div className="empty-state-desc">
          {t.diff.identicalDesc}
          {ignoredCount > 0 && ` ${t.diff.ignoredApplied(ignoredCount)}`}
        </div>
      </div>
    );
  }

  return (
    <div className="diff-table-wrap">
      <table className="diff-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>{t.diff.fieldPath}</th>
            <th style={{ width: '12%' }}>{t.diff.changeType}</th>
            <th style={{ width: '28%' }}>{t.diff.oldValue}</th>
            <th style={{ width: '28%' }}>{t.diff.newValue}</th>
            <th style={{ width: '10%', textAlign: 'center' }}>{t.diff.actions}</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map((diff) => {
            const rowKey = `${diff.type}-${diff.pointer}`;
            const isExpanded = expandedRows.has(rowKey);

            const oldFormatted = formatJsonValue(diff.oldValue, true, locale);
            const newFormatted = formatJsonValue(diff.newValue, true, locale);

            const isOldLong = oldFormatted.length > 120 || oldFormatted.includes('\n');
            const isNewLong = newFormatted.length > 120 || newFormatted.includes('\n');
            const hasLongContent = isOldLong || isNewLong;

            const oldTypeLabel = getValueTypeLabel(diff.oldValue, locale);
            const newTypeLabel = getValueTypeLabel(diff.newValue, locale);

            const typeMeta = TYPE_CONFIG[diff.type];

            return (
              <tr key={rowKey}>
                {/* 字段路径 */}
                <td>
                  <div className="path-cell">
                    <span className="path-display">{diff.displayPath}</span>
                    <span className="path-pointer">
                      {diff.pointer === '' ? t.diff.rootNode : diff.pointer}
                    </span>
                    <div className="path-actions">
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy(`path-${rowKey}`, diff.pointer, 'path')}
                        title={t.diff.copyPathTitle}
                      >
                        {copiedKey === `path-${rowKey}` ? (
                          <Check size={12} color="#16a34a" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span style={{ fontSize: '11px', marginLeft: '2px' }}>
                          {copiedKey === `path-${rowKey}` ? t.diff.copied : t.diff.copyPath}
                        </span>
                      </button>
                    </div>
                  </div>
                </td>

                {/* 变化类型 */}
                <td>
                  <span className={`type-badge ${typeMeta.className}`}>
                    <span>{typeMeta.symbol}</span>
                    <span>{t.diff[diff.type]}</span>
                  </span>
                </td>

                {/* 原始值 */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {oldTypeLabel}
                      </span>
                      {diff.oldValue !== undefined && (
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => handleCopy(`old-${rowKey}`, oldFormatted, 'value')}
                          title={t.diff.copyOldTitle}
                        >
                          {copiedKey === `old-${rowKey}` ? (
                            <Check size={11} color="#16a34a" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      )}
                    </div>
                    <div
                      className={`value-box old-val ${diff.oldValue === undefined ? 'missing' : ''}`}
                      style={
                        !isExpanded && hasLongContent
                          ? { maxHeight: '80px', overflow: 'hidden' }
                          : { maxHeight: '300px' }
                      }
                    >
                      {oldFormatted}
                    </div>
                  </div>
                </td>

                {/* 新值 */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {newTypeLabel}
                      </span>
                      {diff.newValue !== undefined && (
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => handleCopy(`new-${rowKey}`, newFormatted, 'value')}
                          title={t.diff.copyNewTitle}
                        >
                          {copiedKey === `new-${rowKey}` ? (
                            <Check size={11} color="#16a34a" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      )}
                    </div>
                    <div
                      className={`value-box new-val ${diff.newValue === undefined ? 'missing' : ''}`}
                      style={
                        !isExpanded && hasLongContent
                          ? { maxHeight: '80px', overflow: 'hidden' }
                          : { maxHeight: '300px' }
                      }
                    >
                      {newFormatted}
                    </div>
                  </div>
                </td>

                {/* 操作列 */}
                <td style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onIgnorePath(diff.pointer)}
                      title={t.diff.ignoreTitle(diff.pointer || t.diff.rootShort)}
                    >
                      <EyeOff size={12} />
                      {t.diff.ignore}
                    </button>

                    {hasLongContent && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleExpand(rowKey)}
                        style={{ fontSize: '11px' }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={12} /> {t.diff.collapse}
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> {t.diff.expand}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
