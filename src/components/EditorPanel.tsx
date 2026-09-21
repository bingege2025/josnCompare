import React from 'react';
import { AlertCircle, AlignLeft, Trash2 } from 'lucide-react';
import { getByteLength, MAX_INPUT_BYTES } from '../core/parser';
import { useI18n } from '../i18n';

interface EditorPanelProps {
  title: string;
  value: string;
  onChange: (val: string) => void;
  onFormat: () => void;
  onClear: () => void;
  error?: string | null;
  placeholder?: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  title,
  value,
  onChange,
  onFormat,
  onClear,
  error,
  placeholder,
}) => {
  const { t } = useI18n();
  const bytes = getByteLength(value);
  const isOverLimit = bytes > MAX_INPUT_BYTES;

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="editor-card">
      <div className="editor-header">
        <div className="editor-title-wrap">
          <span className="editor-title">{title}</span>
          <span
            className="editor-meta"
            style={{ color: isOverLimit ? '#dc2626' : undefined, fontWeight: isOverLimit ? 600 : undefined }}
          >
            {formatSize(bytes)} / 1 MiB
          </span>
        </div>

        <div className="editor-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onFormat}
            disabled={!value.trim()}
            title={t.editor.formatTitle}
          >
            <AlignLeft size={13} />
            {t.editor.format}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            disabled={!value}
            title={t.editor.clearTitle}
          >
            <Trash2 size={13} />
            {t.editor.clear}
          </button>
        </div>
      </div>

      <div className="editor-textarea-wrap">
        <textarea
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t.editor.placeholder}
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="editor-error-banner">
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
