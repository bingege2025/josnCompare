import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="pagination-bar">
      <div>
        {t.pagination.range(startIdx, endIdx, totalItems)}
      </div>

      <div className="pagination-controls">
        <span>{t.pagination.pageSize}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            fontSize: '12px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <option value={10}>{t.pagination.items(10)}</option>
          <option value={25}>{t.pagination.items(25)}</option>
          <option value={50}>{t.pagination.items(50)}</option>
          <option value={100}>{t.pagination.items(100)}</option>
        </select>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title={t.pagination.prev}
        >
          <ChevronLeft size={14} />
          {t.pagination.prev}
        </button>

        <span style={{ margin: '0 4px', fontSize: '12px', fontWeight: 600 }}>
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title={t.pagination.next}
        >
          {t.pagination.next}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
