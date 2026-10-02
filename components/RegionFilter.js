'use client';

import { memo } from 'react';
import { ZONES } from '@/lib/zones';

function RegionFilter({ value, onChange }) {
  return (
    <select
      className="region-select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Filter by region"
    >
      <option value="">All Regions</option>
      {ZONES.map((z) => (
        <option key={z.name} value={z.name}>
          {z.name}
        </option>
      ))}
    </select>
  );
}

export default memo(RegionFilter);
