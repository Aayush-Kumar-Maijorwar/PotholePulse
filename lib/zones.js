// Rough, hand-drawn rectangular zones covering the demo area around
// Raipur/Durg. Boundaries are intentionally approximate — this is a
// hackathon demo, not a survey-accurate municipal ward map. Upper
// bounds are treated as exclusive (see pointInZone) so a report sitting
// exactly on a shared edge between two zones is only ever counted once.

export const ZONES = [
  { name: 'Amlidih', latMin: 21.2375, latMax: 21.285, lngMin: 81.565, lngMax: 81.595 },
  { name: 'Civil Lines', latMin: 21.2375, latMax: 21.285, lngMin: 81.595, lngMax: 81.625 },
  { name: 'Shankar Nagar', latMin: 21.2375, latMax: 21.285, lngMin: 81.625, lngMax: 81.655 },
  { name: 'Tatibandh', latMin: 21.2375, latMax: 21.285, lngMin: 81.655, lngMax: 81.685 },
  { name: 'Durg Road', latMin: 21.19, latMax: 21.2375, lngMin: 81.565, lngMax: 81.595 },
  { name: 'Pandri', latMin: 21.19, latMax: 21.2375, lngMin: 81.595, lngMax: 81.625 },
  { name: 'Kota', latMin: 21.19, latMax: 21.2375, lngMin: 81.625, lngMax: 81.655 },
  { name: 'Station Road', latMin: 21.19, latMax: 21.2375, lngMin: 81.655, lngMax: 81.685 }
];

export function pointInZone(lat, lng, zone) {
  return lat >= zone.latMin && lat < zone.latMax && lng >= zone.lngMin && lng < zone.lngMax;
}

// Used by the Archive table's Region column/export — a report's
// coordinates may not fall in any defined zone (rare, near the demo
// area's edges), hence the fallback label.
export function zoneNameFor(lat, lng) {
  const zone = ZONES.find((z) => pointInZone(lat, lng, z));
  return zone ? zone.name : 'Unassigned';
}

export function zoneReportCounts(reports) {
  return ZONES.map((zone) => ({
    zone,
    count: reports.filter((r) => pointInZone(r.lat, r.lng, zone)).length
  }));
}

// 4-step bucketed scale: High (5+) / Medium (3-4) / Low (1-2) / None (0)
export function zoneBucketStyle(count) {
  if (count >= 5) return { fill: '#C23B3B', border: '#8E2A2A', fillOpacity: 0.4, label: 'High' };
  if (count >= 3) return { fill: '#D98A2B', border: '#A8651B', fillOpacity: 0.38, label: 'Medium' };
  if (count >= 1) return { fill: '#E0C23A', border: '#A8911F', fillOpacity: 0.35, label: 'Low' };
  return { fill: '#FFFFFF', border: '#B9C0C8', fillOpacity: 0.02, label: 'None' };
}
