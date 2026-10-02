'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import Seal from './Seal';
import LiveClock from './LiveClock';
import { useReports } from './ReportsProvider';

export default function Header() {
  const router = useRouter();
  const { reports, simulating, bellBounce, triggerSimulate } = useReports();

  const newCount = useMemo(() => reports.filter((r) => r.status === 'New').length, [reports]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Seal size={36} />
        <h1>Municipal Road Hazard Monitoring Portal</h1>
      </div>
      <div className="topbar-right">
        <LiveClock />
        <span className="pilot-tag">PotholePulse — Pilot Deployment</span>
        <button className="alert-btn" onClick={triggerSimulate} disabled={simulating}>
          {simulating ? 'Reporting…' : 'Simulate Incoming Alert'}
        </button>
        <div className="bell-wrap" title={`${newCount} New report${newCount === 1 ? '' : 's'}`}>
          <Bell size={19} strokeWidth={2} />
          <span className={`bell-badge ${newCount === 0 ? 'hidden' : ''} ${bellBounce ? 'bounce' : ''}`}>
            {newCount}
          </span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={14} strokeWidth={2} />
          Logout
        </button>
      </div>
    </header>
  );
}
