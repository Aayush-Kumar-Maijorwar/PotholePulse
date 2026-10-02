'use client';

import { memo } from 'react';

const ITEMS = [
  { key: 'total', label: 'Total Reports' },
  { key: 'new', label: 'New' },
  { key: 'ack', label: 'Acknowledged' },
  { key: 'repaired', label: 'Repaired' }
];

function StatsStrip({ stats, pulseKeys, loading }) {
  return (
    <section className="stat-strip">
      {ITEMS.map((it) => (
        <div className={`stat-card stat-card-${it.key}`} key={it.key}>
          <div className="label">{it.label}</div>
          {loading ? (
            <div className="stat-skeleton" />
          ) : (
            <div className={`value ${pulseKeys.has(it.key) ? 'pulse' : ''}`}>{stats[it.key]}</div>
          )}
        </div>
      ))}
    </section>
  );
}

export default memo(StatsStrip);
