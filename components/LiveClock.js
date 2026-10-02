'use client';

import { useEffect, useState } from 'react';
import { formatClock } from '@/lib/format';

// Self-contained: owns its own interval and state, so ticking every
// second only re-renders this small component — never the parent
// Header, the map, or the report list.
//
// Starts as null so the server-rendered markup and the client's first
// render match exactly (both show the placeholder); the real clock
// only takes over after mount, avoiding a hydration mismatch from
// "current time" differing between server render and client hydration.
export default function LiveClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="live-clock">{now ? formatClock(now) : ' '}</span>;
}
