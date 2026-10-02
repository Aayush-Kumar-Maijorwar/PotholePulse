'use client';

import { memo } from 'react';
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { formatTimestamp } from '@/lib/format';
import RelativeTime from './RelativeTime';

const ReportRow = memo(function ReportRow({ report, selected, flashing, onSelect }) {
  return (
    <div
      data-id={report.id}
      className={`row ${selected ? 'selected' : ''} ${flashing ? 'flash' : ''}`}
      onClick={() => onSelect(report.id)}
    >
      <span className="type-dot" style={{ background: TYPE_COLORS[report.type] }} />
      <div className="row-main">
        <div className="row-id">
          {report.id} &middot; {TYPE_LABELS[report.type]}
        </div>
        <div className="row-loc">{report.address}</div>
        <div className="row-time">
          {formatTimestamp(report.timestamp)} &middot; <RelativeTime timestamp={report.timestamp} />
        </div>
      </div>
      <span className={`badge ${report.status}`}>{report.status}</span>
    </div>
  );
});

function ReportList({ reports, selectedId, flashId, onSelect, loading }) {
  const sorted = [...reports].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="list-panel">
      <div className="list-header">Reports ({sorted.length})</div>
      <div className="list-scroll">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div className="row row-skeleton" key={i}>
                <span className="skeleton-dot" />
                <div className="row-main">
                  <div className="skeleton-line skeleton-line-sm" />
                  <div className="skeleton-line skeleton-line-md" />
                </div>
              </div>
            ))
          : sorted.length === 0
          ? <div className="list-empty">No reports match the current filters.</div>
          : sorted.map((r) => (
              <ReportRow
                key={r.id}
                report={r}
                selected={r.id === selectedId}
                flashing={r.id === flashId}
                onSelect={onSelect}
              />
            ))}
      </div>
    </div>
  );
}

export default memo(ReportList);
