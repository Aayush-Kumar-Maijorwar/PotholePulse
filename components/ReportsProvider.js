'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ReportsContext = createContext(null);

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within a ReportsProvider');
  return ctx;
}

// Single shared source of truth for report data, mounted once in the
// protected layout so both /dashboard and /archive (and the header's
// bell badge + Simulate button) read and write the same data — a
// status change made on one page is immediately visible on the other,
// and the bell always reflects the true New-report count regardless of
// which page is currently open.
export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const [lastSimulated, setLastSimulated] = useState(null);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reports');
        return res.json();
      })
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Could not load reports from the server. Try refreshing the page.');
        setLoading(false);
      });
  }, []);

  const applyStatusUpdate = useCallback((updated) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const triggerSimulate = useCallback(async () => {
    let alreadyRunning = false;
    setSimulating((current) => {
      alreadyRunning = current;
      return true;
    });
    if (alreadyRunning) return null;

    try {
      const res = await fetch('/api/reports', { method: 'POST' });
      if (!res.ok) throw new Error('Simulate request failed');
      const newReport = await res.json();

      setReports((prev) => [...prev, newReport]);
      setLastSimulated(newReport);

      setTimeout(() => {
        setBellBounce(true);
        setTimeout(() => setBellBounce(false), 400);
      }, 500);

      return newReport;
    } catch (err) {
      console.error('Simulate incoming alert failed:', err);
      return null;
    } finally {
      setSimulating(false);
    }
  }, []);

  const value = {
    reports,
    loading,
    loadError,
    simulating,
    bellBounce,
    lastSimulated,
    applyStatusUpdate,
    triggerSimulate
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}
