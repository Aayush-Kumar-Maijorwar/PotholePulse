'use client';

import { memo } from 'react';

const OPTIONS = ['All', 'New', 'Acknowledged', 'Repaired'];

function StatusFilter({ value, onChange }) {
  return (
    <div className="status-filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`status-chip ${value === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default memo(StatusFilter);
