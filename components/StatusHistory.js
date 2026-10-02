'use client';

import { formatTimestamp } from '@/lib/format';
import RelativeTime from './RelativeTime';

const DOT_CLASS = {
  New: 'history-dot-new',
  Acknowledged: 'history-dot-ack',
  Repaired: 'history-dot-repaired'
};

export default function StatusHistory({ history }) {
  const entries = Array.isArray(history) ? [...history].reverse() : [];

  if (entries.length === 0) return null;

  return (
    <div className="history-section">
      <div className="section-header">Status History</div>
      <ul className="history-timeline">
        {entries.map((entry, i) => {
          const atMs = new Date(entry.at).getTime();
          return (
            <li key={i} className="history-item">
              <span className={`history-dot ${DOT_CLASS[entry.status] || ''}`} />
              <div className="history-item-body">
                <div className="history-item-status">{entry.status}</div>
                <div className="history-item-time">
                  {formatTimestamp(atMs)} &middot; <RelativeTime timestamp={atMs} />
                </div>
                {entry.note ? <div className="history-item-note">{entry.note}</div> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
