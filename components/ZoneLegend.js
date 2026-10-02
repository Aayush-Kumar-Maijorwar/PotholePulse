export default function ZoneLegend() {
  return (
    <div className="zone-legend">
      <div className="legend-title">Report Density</div>
      <div className="legend-row">
        <span className="legend-chip" style={{ background: '#C23B3B' }} />
        High (5+)
      </div>
      <div className="legend-row">
        <span className="legend-chip" style={{ background: '#D98A2B' }} />
        Medium (3–4)
      </div>
      <div className="legend-row">
        <span className="legend-chip" style={{ background: '#E0C23A' }} />
        Low (1–2)
      </div>
      <div className="legend-row">
        <span className="legend-chip none" />
        None (0)
      </div>
    </div>
  );
}
