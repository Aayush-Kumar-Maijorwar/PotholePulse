const IST_TZ = 'Asia/Kolkata';

export function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    timeZone: IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Matches the header clock's format: "Fri, 03 Oct 2026 · 14:32:07" (IST).
export function formatClock(d) {
  const datePart = d.toLocaleDateString('en-GB', {
    timeZone: IST_TZ,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString('en-GB', {
    timeZone: IST_TZ,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return `${datePart} · ${timePart}`;
}

// Short relative tag ("just now", "5 min ago", "3 hr ago", "2 days ago").
export function formatRelative(ts, now) {
  const diffMs = (now instanceof Date ? now.getTime() : now) - ts;
  const diffSec = Math.max(0, Math.round(diffMs / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}
