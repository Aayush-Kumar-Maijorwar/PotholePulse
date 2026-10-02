'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Download, X } from 'lucide-react';
import { useReports } from './ReportsProvider';
import { STATUSES, TYPE_LABELS } from '@/lib/constants';
import { ZONES, zoneNameFor, pointInZone } from '@/lib/zones';
import { formatTimestamp } from '@/lib/format';
import StatsStrip from './StatsStrip';
import StatusFilter from './StatusFilter';
import RegionFilter from './RegionFilter';
import DetailPanel from './DetailPanel';

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'region', label: 'Region' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
  { key: 'lastUpdated', label: 'Last Updated' }
];

function getLastUpdatedMs(report) {
  if (Array.isArray(report.history) && report.history.length > 0) {
    return new Date(report.history[report.history.length - 1].at).getTime();
  }
  return report.timestamp;
}

function csvEscape(value) {
  const str = String(value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function downloadCsv(rows) {
  const header = ['ID', 'Type', 'Confidence', 'Region', 'Status', 'Created', 'Last Updated'];
  const lines = [header.join(',')];
  rows.forEach((r) => {
    lines.push(
      [
        r.id,
        TYPE_LABELS[r.type],
        r.confidence.toFixed(2),
        r.region,
        r.status,
        new Date(r.timestamp).toISOString(),
        new Date(r.lastUpdatedMs).toISOString()
      ]
        .map(csvEscape)
        .join(',')
    );
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `potholepulse-reports-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ArchiveView() {
  const { reports, loading, applyStatusUpdate } = useReports();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState({ key: 'created', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const enriched = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        region: zoneNameFor(r.lat, r.lng),
        lastUpdatedMs: getLastUpdatedMs(r)
      })),
    [reports]
  );

  const regionZone = useMemo(
    () => (regionFilter ? ZONES.find((z) => z.name === regionFilter) : null),
    [regionFilter]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toMs = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : null;

    return enriched.filter((r) => {
      if (term && !r.id.toLowerCase().includes(term) && !r.address.toLowerCase().includes(term)) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (regionZone && !pointInZone(r.lat, r.lng, regionZone)) return false;
      if (fromMs !== null && r.timestamp < fromMs) return false;
      if (toMs !== null && r.timestamp > toMs) return false;
      return true;
    });
  }, [enriched, search, statusFilter, regionZone, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort.key) {
        case 'type':
          return dir * TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
        case 'region':
          return dir * a.region.localeCompare(b.region);
        case 'status':
          return dir * (STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
        case 'created':
          return dir * (a.timestamp - b.timestamp);
        case 'lastUpdated':
          return dir * (a.lastUpdatedMs - b.lastUpdatedMs);
        case 'id':
        default:
          return dir * a.id.localeCompare(b.id);
      }
    });
    return arr;
  }, [filtered, sort]);

  // Stats strip reflects the currently filtered set (pre-sort/pre-page).
  const stats = useMemo(
    () => ({
      total: filtered.length,
      new: filtered.filter((r) => r.status === 'New').length,
      ack: filtered.filter((r) => r.status === 'Acknowledged').length,
      repaired: filtered.filter((r) => r.status === 'Repaired').length
    }),
    [filtered]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, regionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('All');
    setRegionFilter(null);
    setDateFrom('');
    setDateTo('');
  }

  function openReport(id) {
    setSelectedId(id);
    setPanelOpen(true);
  }

  const selectedReport = reports.find((r) => r.id === selectedId) || null;

  return (
    <>
      <main className="archive-main">
        <div className="archive-title-row">
          <h2 className="archive-title">Reports Archive</h2>
        </div>

        <StatsStrip stats={stats} pulseKeys={new Set()} loading={loading} />

        <div className="archive-controls">
          <input
            type="text"
            className="archive-search"
            placeholder="Search by ID or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          <RegionFilter value={regionFilter} onChange={setRegionFilter} />
          <div className="archive-date-range">
            <label>
              From
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
          <button className="btn-secondary archive-btn" onClick={clearFilters}>
            <X size={13} strokeWidth={2} /> Clear Filters
          </button>
          <button className="btn-primary archive-btn" onClick={() => downloadCsv(sorted)}>
            <Download size={13} strokeWidth={2} /> Export CSV
          </button>
        </div>

        <div className="archive-table-wrap">
          <table className="archive-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}>
                    <span className="th-inner">
                      {col.label}
                      {sort.key === col.key ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp size={13} strokeWidth={2.5} />
                        ) : (
                          <ChevronDown size={13} strokeWidth={2.5} />
                        )
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="archive-empty">
                    Loading reports…
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="archive-empty">
                    No reports match the current filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((r) => (
                  <tr key={r.id} onClick={() => openReport(r.id)}>
                    <td>{r.id}</td>
                    <td>{TYPE_LABELS[r.type]}</td>
                    <td>{r.region}</td>
                    <td>
                      <span className={`badge ${r.status}`}>{r.status}</span>
                    </td>
                    <td>{formatTimestamp(r.timestamp)}</td>
                    <td>{formatTimestamp(r.lastUpdatedMs)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="archive-pagination">
          <span className="archive-pagination-label">
            {sorted.length === 0
              ? 'Showing 0 of 0'
              : `Showing ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, sorted.length)} of ${sorted.length}`}
          </span>
          <div className="archive-pagination-btns">
            <button
              className="btn-secondary-light"
              disabled={clampedPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn-secondary-light"
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </main>

      <DetailPanel
        report={selectedReport}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onStatusUpdated={applyStatusUpdate}
      />
    </>
  );
}
