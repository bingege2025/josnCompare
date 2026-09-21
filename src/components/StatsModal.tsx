import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart2,
  Activity,
  Calendar,
  Layers,
  RotateCcw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  getUsageStats,
  resetUsageStats,
  type UsageStats,
  type AnalyticsEventType,
} from '../services/analytics';
import { useI18n } from '../i18n';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { locale, t } = useI18n();
  const [stats, setStats] = useState<UsageStats | null>(null);

  const loadData = async () => {
    const data = await getUsageStats();
    setStats(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const handleReset = async () => {
    if (window.confirm(t.stats.confirmReset)) {
      const reset = await resetUsageStats();
      setStats(reset);
    }
  };

  const formatTime = (ts: number) => {
    if (!ts) return t.stats.none;
    return new Date(ts).toLocaleString(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
              {t.stats.title}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 核心指标卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {t.stats.today}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>
                {stats.todayCompares} <span style={{ fontSize: '12px', fontWeight: 400 }}>{t.stats.unit}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
              <div style={{ fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={13} /> {t.stats.totalCompares}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#14532d', marginTop: '4px' }}>
                {stats.totalCompares} <span style={{ fontSize: '12px', fontWeight: 400 }}>{t.stats.unit}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={13} /> {t.stats.opens}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {stats.totalOpens} <span style={{ fontSize: '12px', fontWeight: 400 }}>{t.stats.unit}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {t.stats.recent}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '8px' }}>
                {formatTime(stats.lastUsedAt)}
              </div>
            </div>
          </div>

          {/* 各功能使用分布 */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#334155' }}>
              {t.stats.featureDetail}
            </div>
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                fontSize: '12.5px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>{t.stats.eventFeature}</th>
                    <th style={{ padding: '8px 12px', width: '120px', textAlign: 'right' }}>{t.stats.count}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.eventCounts).length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        {t.stats.noEvents}
                      </td>
                    </tr>
                  ) : (
                    Object.entries(stats.eventCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([evt, count]) => (
                        <tr key={evt} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ fontWeight: 500 }}>
                              {t.stats.eventNames[evt as AnalyticsEventType] || evt}
                            </span>
                            <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              ({evt})
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                            {count} {t.stats.unit}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 本地隐私说明 */}
          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              <ShieldCheck size={16} color="#059669" />
              {t.stats.privacyTitle}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.stats.privacyDesc}
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            {t.stats.reset}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            {t.stats.close}
          </button>
        </div>
      </div>
    </div>
  );
};
