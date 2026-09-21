import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';

interface IgnoredDrawerProps {
  ignoredPaths: Set<string>;
  onRemovePath: (path: string) => void;
  onClearAll: () => void;
}

export const IgnoredDrawer: React.FC<IgnoredDrawerProps> = ({
  ignoredPaths,
  onRemovePath,
  onClearAll,
}) => {
  const { t } = useI18n();
  const paths = Array.from(ignoredPaths);

  return (
    <div className="ignored-drawer">
      <div className="ignored-drawer-header">
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          {t.ignored.title}
        </span>
        {paths.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClearAll}
            title={t.ignored.restoreAllTitle}
          >
            <RotateCcw size={12} />
            {t.ignored.restoreAll}
          </button>
        )}
      </div>

      {paths.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          {t.ignored.empty}
        </div>
      ) : (
        <div className="ignored-tags">
          {paths.map((p) => (
            <span key={p} className="ignored-tag">
              <span>{p === '' ? t.ignored.rootPath : p}</span>
              <button
                type="button"
                className="ignored-tag-remove"
                onClick={() => onRemovePath(p)}
                title={t.ignored.restorePathTitle(p)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
