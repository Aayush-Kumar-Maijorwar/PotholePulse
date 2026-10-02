'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import StatsStrip from './StatsStrip';
import StatusFilter from './StatusFilter';
import RegionFilter from './RegionFilter';
import ReportList from './ReportList';
import DetailPanel from './DetailPanel';
import { useReports } from './ReportsProvider';
import { ZONES, pointInZone } from '@/lib/zones';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function DashboardView() {
  const { reports, loading, loadError, lastSimulated, applyStatusUpdate } = useReports();

  const [selectedId, setSelectedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [pulseKeys, setPulseKeys] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState(null);
  const mapRef = useRef(null);
  const lastHandledSimId = useRef(null);

  const regionZone = useMemo(
    () => (regionFilter ? ZONES.find((z) => z.name === regionFilter) : null),
    [regionFilter]
  );

  // Status + region filters combine with AND logic. Only the list and
  // the map obey this — the stats strip above always shows totals.
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (regionZone && !pointInZone(r.lat, r.lng, regionZone)) return false;
      return true;
    });
  }, [reports, statusFilter, regionZone]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      new: reports.filter((r) => r.status === 'New').length,
      ack: reports.filter((r) => r.status === 'Acknowledged').length,
      repaired: reports.filter((r) => r.status === 'Repaired').length
    }),
    [reports]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    if (regionFilter) {
      mapRef.current.fitToZone(regionFilter);
    } else {
      mapRef.current.resetView();
    }
  }, [regionFilter]);

  // React to a freshly simulated report — but only the pin-drop pulse,
  // list-row flash, and stat pulse while this page is actually mounted.
  useEffect(() => {
    if (!lastSimulated || lastSimulated.id === lastHandledSimId.current) return;
    lastHandledSimId.current = lastSimulated.id;

    if (mapRef.current) mapRef.current.dropPulse(lastSimulated);

    setTimeout(() => {
      setFlashId(lastSimulated.id);
      setTimeout(() => setFlashId(null), 1500);
    }, 300);

    setTimeout(() => {
      setPulseKeys(new Set(['total', 'new']));
      setTimeout(() => setPulseKeys(new Set()), 400);
    }, 300);
  }, [lastSimulated]);

  const selectReport = useCallback((id) => {
    setSelectedId(id);
    setPanelOpen(true);
    if (mapRef.current) mapRef.current.panTo(id);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const handleStatusUpdated = useCallback(
    (updated) => {
      applyStatusUpdate(updated);
      if (mapRef.current) mapRef.current.updateMarkerStyle(updated);
    },
    [applyStatusUpdate]
  );

  // Detail panel looks up the report in the full (unfiltered) list, so
  // it keeps working even if the admin changes filters while it's open.
  const selectedReport = reports.find((r) => r.id === selectedId) || null;

  return (
    <>
      {loadError ? <div className="load-error">{loadError}</div> : null}

      <main className="main-area">
        <MapView mapRef={mapRef} reports={filteredReports} onSelect={selectReport} />
        <aside className="sidebar">
          <StatsStrip stats={stats} pulseKeys={pulseKeys} loading={loading} />

          <div className="filter-bar">
            <div className="filter-section-label">Filters</div>
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <RegionFilter value={regionFilter} onChange={setRegionFilter} />
          </div>

          <ReportList
            reports={filteredReports}
            selectedId={selectedId}
            flashId={flashId}
            onSelect={selectReport}
            loading={loading}
          />
        </aside>
      </main>

      <footer className="app-footer">
        Prototype demonstration — PotholePulse, Team KangarooCoders, Navonmesh 2026.
      </footer>

      <DetailPanel
        report={selectedReport}
        open={panelOpen}
        onClose={closePanel}
        onStatusUpdated={handleStatusUpdated}
      />
    </>
  );
}
