'use client';

import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { STATUSES, TYPE_LABELS } from '@/lib/constants';
import { formatTimestamp } from '@/lib/format';
import { drawMockPhoto } from '@/lib/mockImage';
import RelativeTime from './RelativeTime';
import StatusHistory from './StatusHistory';

export default function DetailPanel({ report, open, onClose, onStatusUpdated }) {
  const canvasRef = useRef(null);
  const [staged, setStaged] = useState(report ? report.status : 'New');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Whenever the panel opens (including reopening the same report),
  // reset any staged-but-unsubmitted change back to the saved status
  // and redraw the deterministic mock photo for that report.
  useEffect(() => {
    if (open && report) {
      setStaged(report.status);
      setError('');
      setConfirmed(false);
      if (canvasRef.current) {
        drawMockPhoto(canvasRef.current, report);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report && report.id]);

  if (!report) {
    return (
      <>
        <div className={`backdrop ${open ? 'open' : ''}`} onClick={onClose} />
        <div className={`detail-panel ${open ? 'open' : ''}`} />
      </>
    );
  }

  const dirty = staged !== report.status;

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reports/' + report.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: staged })
      });
      if (!res.ok) {
        throw new Error('Request failed');
      }
      const updated = await res.json();
      onStatusUpdated(updated);
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 1500);
    } catch (err) {
      setError('Could not save the status change. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={`backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`detail-panel ${open ? 'open' : ''}`}>
        <div className="detail-head">
          <div className="detail-head-title">
            <h2>Report {report.id}</h2>
            <span className={`badge ${report.status}`}>{report.status}</span>
          </div>
          <button className="detail-close" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="detail-body">
          <div className="photo-frame">
            <canvas ref={canvasRef} width="360" height="180" />
          </div>
          <div className="photo-caption">Captured Image</div>

          <div className="detail-row">
            <span className="k">Hazard</span>
            <span className="v">
              {TYPE_LABELS[report.type]} — {report.confidence.toFixed(2)}
            </span>
          </div>
          <div className="detail-row">
            <span className="k">Report ID</span>
            <span className="v">{report.id}</span>
          </div>
          <div className="detail-row">
            <span className="k">GPS Coordinates</span>
            <span className="v">
              {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
            </span>
          </div>
          <div className="detail-row">
            <span className="k">Location</span>
            <span className="v">{report.address}</span>
          </div>
          <div className="detail-row">
            <span className="k">Detected</span>
            <span className="v">
              {formatTimestamp(report.timestamp)} &middot; <RelativeTime timestamp={report.timestamp} />
            </span>
          </div>

          <div className="status-select-wrap">
            <label htmlFor="statusSelect">Status</label>
            <select
              id="statusSelect"
              className="status-select"
              value={staged}
              onChange={(e) => setStaged(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="submit-status-btn" disabled={!dirty || saving} onClick={handleSubmit}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
            {confirmed ? (
              <div className="status-confirm">
                <CheckCircle2 size={14} strokeWidth={2} /> Status updated
              </div>
            ) : null}
            {error ? (
              <div className="status-error">
                <AlertTriangle size={14} strokeWidth={2} /> {error}
              </div>
            ) : null}
          </div>

          <StatusHistory history={report.history} />
        </div>
      </div>
    </>
  );
}
