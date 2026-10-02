'use client';

import { TYPE_LABELS } from '@/lib/constants';

const MAX_LISTED = 4;

export default function ZoneTooltip({ x, y, zone, reports, onSelectReport, onMouseEnter, onMouseLeave }) {
  if (!zone) return null;

  const shown = reports.slice(0, MAX_LISTED);
  const extra = reports.length - shown.length;

  return (
    <div
      className="zone-tooltip"
      style={{ left: x, top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="zone-tooltip-head">
        <span className="zone-tooltip-name">{zone.name}</span>
        <span className="zone-tooltip-count">
          {reports.length === 0 ? 'No reports' : `${reports.length} report${reports.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {reports.length > 0 ? (
        <ul className="zone-tooltip-list">
          {shown.map((r) => (
            <li
              key={r.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectReport(r.id);
              }}
            >
              <span className={`badge ${r.status}`}>{r.status}</span>
              <span className="zone-tooltip-type">{TYPE_LABELS[r.type]}</span>
              <span className="zone-tooltip-id">{r.id}</span>
            </li>
          ))}
          {extra > 0 ? <li className="zone-tooltip-more">+{extra} more</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
