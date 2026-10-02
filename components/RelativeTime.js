'use client';

import { useEffect, useState } from 'react';
import { formatRelative } from '@/lib/format';

// Owns its own 1s interval so only this tiny label re-renders on tick —
// not the row, not the list, not the rest of the dashboard.
//
// Starts as null (matching between server render and first client
// render) and fills in after mount, avoiding a hydration mismatch —
// see LiveClock for the same pattern.
export default function RelativeTime({ timestamp }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="row-relative">{now ? formatRelative(timestamp, now) : ' '}</span>;
}
