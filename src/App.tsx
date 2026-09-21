import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { parseJson } from './core/parser';
import { compareJson } from './core/comparator';
import { formatJsonValue } from './core/format';
import type { CompareResult, DiffType } from './core/types';
import { MOCK_LEFT_JSON, MOCK_RIGHT_JSON } from './data/mockData';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { SummaryBar } from './components/SummaryBar';
import { IgnoredDrawer } from './components/IgnoredDrawer';
import { DiffTable } from './components/DiffTable';
import { Pagination } from './components/Pagination';
import { StatsModal } from './components/StatsModal';
import { trackEvent, getUsageStats } from './services/analytics';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { I18nProvider, normalizeLocale, translations, type Locale } from './i18n';

const LOCALE_STORAGE_KEY = 'json_compare_locale';

export const App: React.FC = () => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved) return normalizeLocale(saved);
    }
    return normalizeLocale(typeof navigator !== 'undefined' ? navigator.language : 'zh-CN');
  });
  const t = translations[locale];

  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');

  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  const [ignoredPaths, setIgnoredPaths] = useState<Set<string>>(new Set());
  const [showIgnoredDrawer, setShowIgnoredDrawer] = useState<boolean>(false);

  const [filterType, setFilterType] = useState<DiffType | 'all'>('all');
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // 统计弹窗与比对次数
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [totalCompares, setTotalCompares] = useState<number>(0);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // 初始化埋点：记录打开插件，并拉取当前总比对频次
  useEffect(() => {
    trackEvent('extension_open').then((stats) => {
      setTotalCompares(stats.totalCompares);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.title = t.appTitle;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, t.appTitle, t.htmlLang]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  // 执行核心对比操作
  const executeCompare = useCallback(
    (leftStr: string, rightStr: string, currentIgnored: Set<string>) => {
      const pLeft = parseJson(leftStr, locale);
      const pRight = parseJson(rightStr, locale);

      let hasError = false;
      if (!pLeft.success) {
        setLeftError(pLeft.error);
        hasError = true;
      } else {
        setLeftError(null);
      }

      if (!pRight.success) {
        setRightError(pRight.error);
        hasError = true;
      } else {
        setRightError(null);
      }

      if (hasError) {
        setCompareResult(null);
        setIsStale(false);
        return;
      }

      // 两侧均解析成功，执行结构化对比
      if (pLeft.success && pRight.success) {
        const result = compareJson(pLeft.data, pRight.data, currentIgnored, locale);
        setCompareResult(result);
        setIsStale(false);
        setCurrentPage(1);

        // 记录埋点：比对执行
        trackEvent('compare_execute', {
          diffCount: result.summary.totalCount,
          added: result.summary.addedCount,
          removed: result.summary.removedCount,
          valueChanged: result.summary.valueChangedCount,
          typeChanged: result.summary.typeChangedCount,
          ignoredCount: result.ignoredCount,
        }).then((stats) => {
          setTotalCompares(stats.totalCompares);
        });
      }
    },
    [locale]
  );

  // 输入变动
  const handleLeftChange = (val: string) => {
    setLeftText(val);
    setIsStale(true);
    if (leftError) setLeftError(null);
  };

  const handleRightChange = (val: string) => {
    setRightText(val);
    setIsStale(true);
    if (rightError) setRightError(null);
  };

  // 点击执行对比
  const handleManualCompare = () => {
    executeCompare(leftText, rightText, ignoredPaths);
  };

  // 加载模拟数据并立即对比
  const handleLoadMock = () => {
    setLeftText(MOCK_LEFT_JSON);
    setRightText(MOCK_RIGHT_JSON);
    const initialIgnored = new Set<string>();
    setIgnoredPaths(initialIgnored);
    setLeftError(null);
    setRightError(null);
    trackEvent('mock_loaded');
    executeCompare(MOCK_LEFT_JSON, MOCK_RIGHT_JSON, initialIgnored);
  };

  // 格式化两侧
  const handleFormatBoth = () => {
    let newLeft = leftText;
    let newRight = rightText;

    if (leftText.trim()) {
      const pLeft = parseJson(leftText, locale);
      if (pLeft.success) {
        newLeft = formatJsonValue(pLeft.data, true, locale);
        setLeftText(newLeft);
        setLeftError(null);
      } else {
        setLeftError(pLeft.error);
      }
    }

    if (rightText.trim()) {
      const pRight = parseJson(rightText, locale);
      if (pRight.success) {
        newRight = formatJsonValue(pRight.data, true, locale);
        setRightText(newRight);
        setRightError(null);
      } else {
        setRightError(pRight.error);
      }
    }

    trackEvent('format_both');
    if (compareResult) {
      executeCompare(newLeft, newRight, ignoredPaths);
    }
  };

  // 格式化单侧
  const handleFormatLeft = () => {
    if (!leftText.trim()) return;
    const pLeft = parseJson(leftText, locale);
    if (pLeft.success) {
      const formatted = formatJsonValue(pLeft.data, true, locale);
      setLeftText(formatted);
      setLeftError(null);
      trackEvent('format_single', { side: 'left' });
    } else {
      setLeftError(pLeft.error);
    }
  };

  const handleFormatRight = () => {
    if (!rightText.trim()) return;
    const pRight = parseJson(rightText, locale);
    if (pRight.success) {
      const formatted = formatJsonValue(pRight.data, true, locale);
      setRightText(formatted);
      setRightError(null);
      trackEvent('format_single', { side: 'right' });
    } else {
      setRightError(pRight.error);
    }
  };

  // 交换两侧
  const handleSwap = () => {
    const tempLeft = leftText;
    setLeftText(rightText);
    setRightText(tempLeft);
    setIsStale(true);
    trackEvent('swap_sides');
  };

  // 清空两侧
  const handleClearBoth = () => {
    setLeftText('');
    setRightText('');
    setLeftError(null);
    setRightError(null);
    setCompareResult(null);
    setIgnoredPaths(new Set());
    setIsStale(false);
    trackEvent('clear_all');
  };

  // 忽略某一路径
  const handleIgnorePath = (pointer: string) => {
    const nextIgnored = new Set(ignoredPaths);
    nextIgnored.add(pointer);
    setIgnoredPaths(nextIgnored);
    trackEvent('ignore_path');
    // 立即重新对比
    if (leftText && rightText) {
      executeCompare(leftText, rightText, nextIgnored);
    }
  };

  // 恢复单项被忽略路径
  const handleRemoveIgnoredPath = (pointer: string) => {
    const nextIgnored = new Set(ignoredPaths);
    nextIgnored.delete(pointer);
    setIgnoredPaths(nextIgnored);
    trackEvent('restore_path');
    if (leftText && rightText) {
      executeCompare(leftText, rightText, nextIgnored);
    }
  };

  // 恢复所有被忽略路径
  const handleClearAllIgnored = () => {
    const emptyIgnored = new Set<string>();
    setIgnoredPaths(emptyIgnored);
    trackEvent('clear_ignored');
    if (leftText && rightText) {
      executeCompare(leftText, rightText, emptyIgnored);
    }
  };

  // 复制操作埋点
  const handleCopyAction = (type: 'path' | 'value') => {
    trackEvent(type === 'path' ? 'copy_path' : 'copy_value');
  };

  // 根据 filterType 筛选后的差异列表
  const filteredDiffs = useMemo(() => {
    if (!compareResult) return [];
    if (filterType === 'all') return compareResult.diffs;
    return compareResult.diffs.filter((d) => d.type === filterType);
  }, [compareResult, filterType]);

  // 当前分页切片数据
  const paginatedDiffs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDiffs.slice(start, start + pageSize);
  }, [filteredDiffs, currentPage, pageSize]);

  const canCompare = Boolean(leftText.trim() && rightText.trim());

  return (
    <I18nProvider locale={locale} t={t} setLocale={setLocale}>
      <div className="app-container">
      <Header
        onLoadMock={handleLoadMock}
        onFormatBoth={handleFormatBoth}
        onSwap={handleSwap}
        onClearBoth={handleClearBoth}
        onCompare={handleManualCompare}
        onOpenStats={() => {
          setIsStatsOpen(true);
          getUsageStats().then((s) => setTotalCompares(s.totalCompares));
        }}
        isStale={isStale}
        canCompare={canCompare}
        totalCompares={totalCompares}
      />

      <main className="main-content">
        {/* 双栏输入区 */}
        <div className="editors-grid">
          <EditorPanel
            title={t.app.leftTitle}
            value={leftText}
            onChange={handleLeftChange}
            onFormat={handleFormatLeft}
            onClear={() => {
              setLeftText('');
              setLeftError(null);
              setIsStale(true);
            }}
            error={leftError}
            placeholder={t.app.leftPlaceholder}
          />

          <EditorPanel
            title={t.app.rightTitle}
            value={rightText}
            onChange={handleRightChange}
            onFormat={handleFormatRight}
            onClear={() => {
              setRightText('');
              setRightError(null);
              setIsStale(true);
            }}
            error={rightError}
            placeholder={t.app.rightPlaceholder}
          />
        </div>

        {/* 结果已过期提示条 */}
        {isStale && compareResult && (
          <div className="stale-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{t.app.stale}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleManualCompare}
            >
              <RefreshCw size={12} />
              {t.app.compareNow}
            </button>
          </div>
        )}

        {/* 比较结果呈现区 */}
        {compareResult ? (
          <div className="results-section">
            <SummaryBar
              summary={compareResult.summary}
              currentFilter={filterType}
              onFilterChange={(f) => {
                setFilterType(f);
                setCurrentPage(1);
              }}
              ignoredCount={compareResult.ignoredCount}
              showIgnoredDrawer={showIgnoredDrawer}
              onToggleIgnoredDrawer={() => setShowIgnoredDrawer((prev) => !prev)}
            />

            {showIgnoredDrawer && (
              <IgnoredDrawer
                ignoredPaths={ignoredPaths}
                onRemovePath={handleRemoveIgnoredPath}
                onClearAll={handleClearAllIgnored}
              />
            )}

            <DiffTable
              diffs={paginatedDiffs}
              onIgnorePath={handleIgnorePath}
              ignoredCount={compareResult.ignoredCount}
              onCopyAction={handleCopyAction}
            />

            {filteredDiffs.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredDiffs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            )}
          </div>
        ) : (
          !leftError &&
          !rightError && (
            <div
              className="empty-state"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="empty-state-icon neutral">
                <Layers size={24} />
              </div>
              <div className="empty-state-title">{t.app.readyTitle}</div>
              <div className="empty-state-desc">
                {t.app.readyDesc}
              </div>
            </div>
          )
        )}
      </main>

      <footer className="footer">
        {t.app.footer}
      </footer>

      {/* 使用统计与埋点抽屉/模态框 */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      </div>
    </I18nProvider>
  );
};
