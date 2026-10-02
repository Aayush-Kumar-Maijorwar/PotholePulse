import { kv } from '@vercel/kv';

const KEY = 'pp_reports';
const TYPES = ['pothole', 'crack', 'person'];

const LOCALITIES = [
  { name: 'Shankar Nagar Chowk, Raipur', lat: 21.2495, lng: 81.6366 },
  { name: 'Civil Lines, Raipur', lat: 21.2602, lng: 81.618 },
  { name: 'Telibandha, Raipur', lat: 21.2385, lng: 81.641 },
  { name: 'Devendra Nagar, Raipur', lat: 21.244, lng: 81.595 },
  { name: 'Mowa, Raipur', lat: 21.27, lng: 81.645 },
  { name: 'Gudhiyari, Raipur', lat: 21.221, lng: 81.608 },
  { name: 'Tatibandh, Raipur', lat: 21.255, lng: 81.655 },
  { name: 'Pandri, Raipur', lat: 21.232, lng: 81.623 },
  { name: 'Avanti Vihar, Raipur', lat: 21.265, lng: 81.605 },
  { name: 'Byron Bazaar, Raipur', lat: 21.246, lng: 81.67 },
  { name: 'Kota, Raipur', lat: 21.218, lng: 81.635 },
  { name: 'Amlidih, Raipur', lat: 21.258, lng: 81.59 },
  { name: 'Dumartarai, Raipur', lat: 21.229, lng: 81.65 },
  { name: 'Vidhan Sabha Road, Raipur', lat: 21.273, lng: 81.625 }
];

// Seed definitions: [type, localityIndex, status, confidence, hoursAgo]
const SEED_DEFS = [
  ['pothole', 0, 'Repaired', 0.82, 22],
  ['crack', 1, 'Acknowledged', 0.71, 49],
  ['pothole', 2, 'New', 0.91, 5],
  ['person', 3, 'New', 0.66, 14],
  ['pothole', 4, 'Acknowledged', 0.78, 63],
  ['crack', 5, 'Repaired', 0.69, 92],
  ['pothole', 6, 'New', 0.88, 3],
  ['pothole', 7, 'Acknowledged', 0.75, 28],
  ['person', 8, 'Repaired', 0.62, 74],
  ['pothole', 9, 'New', 0.93, 1],
  ['crack', 10, 'New', 0.73, 9],
  ['pothole', 11, 'Acknowledged', 0.8, 34]
];

const STATUS_ORDER = ['New', 'Acknowledged', 'Repaired'];

function hasKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// In-memory fallback so `npm run dev` works immediately with zero cloud
// setup. This lives only for the lifetime of the server process — fine
// for local dev and for a demo, not meant to be durable storage.
let memoryReports = null;

function pad4(n) {
  return String(n).padStart(4, '0');
}

// Synthesizes a plausible history for seeded reports that already start
// somewhere past "New" (e.g. a seeded "Repaired" report gets a 3-entry
// New -> Acknowledged -> Repaired trail spread between its creation
// time and now), so the archive/timeline don't show a one-entry history
// for reports that were never actually just-created.
function buildSeedHistory(status, createdAtMs) {
  const targetIdx = STATUS_ORDER.indexOf(status);
  const steps = targetIdx + 1;
  const span = Date.now() - createdAtMs;
  const history = [];
  for (let i = 0; i < steps; i++) {
    const at = i === 0 ? createdAtMs : createdAtMs + Math.round((span * (i + 1)) / (steps + 1));
    history.push({
      status: STATUS_ORDER[i],
      at: new Date(at).toISOString(),
      note: i === 0 ? 'Report created' : `Status changed to ${STATUS_ORDER[i]}`
    });
  }
  return history;
}

function seedReports() {
  return SEED_DEFS.map(([type, locIdx, status, confidence, hrsAgo], i) => {
    const loc = LOCALITIES[locIdx];
    const createdAtMs = Date.now() - hrsAgo * 3600 * 1000;
    return {
      id: 'PH-' + pad4(i + 1),
      type,
      status,
      confidence,
      lat: loc.lat,
      lng: loc.lng,
      address: loc.name,
      timestamp: createdAtMs,
      imageSeed: Math.floor(Math.random() * 1000000) + i,
      history: buildSeedHistory(status, createdAtMs)
    };
  });
}

export async function getReports() {
  if (hasKvConfig()) {
    try {
      let data = await kv.get(KEY);
      if (!Array.isArray(data) || data.length === 0) {
        data = seedReports();
        await kv.set(KEY, data);
      }
      return data;
    } catch (err) {
      console.error('Vercel KV read failed, falling back to in-memory store:', err);
    }
  }
  if (!memoryReports) {
    memoryReports = seedReports();
  }
  return memoryReports;
}

export async function saveReports(reports) {
  if (hasKvConfig()) {
    try {
      await kv.set(KEY, reports);
      return;
    } catch (err) {
      console.error('Vercel KV write failed, falling back to in-memory store:', err);
    }
  }
  memoryReports = reports;
}

export async function addReportRecord(report) {
  const reports = await getReports();
  reports.push(report);
  await saveReports(reports);
  return report;
}

export async function updateReportStatus(id, status) {
  const reports = await getReports();
  const report = reports.find((r) => r.id === id);
  if (!report) return null;
  report.status = status;
  if (!Array.isArray(report.history)) report.history = [];
  report.history.push({
    status,
    at: new Date().toISOString(),
    note: `Status changed to ${status}`
  });
  await saveReports(reports);
  return report;
}

export function buildRandomReport(existingReports) {
  const nums = existingReports
    .map((r) => parseInt(String(r.id).replace('PH-', ''), 10))
    .filter((n) => !Number.isNaN(n));
  const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const loc = LOCALITIES[Math.floor(Math.random() * LOCALITIES.length)];
  const jitterLat = (Math.random() - 0.5) * 0.01;
  const jitterLng = (Math.random() - 0.5) * 0.01;
  const confidence = Math.round((0.6 + Math.random() * 0.35) * 100) / 100;
  const createdAtMs = Date.now();

  return {
    id: 'PH-' + pad4(nextNum),
    type,
    status: 'New',
    confidence,
    lat: loc.lat + jitterLat,
    lng: loc.lng + jitterLng,
    address: loc.name,
    timestamp: createdAtMs,
    imageSeed: Math.floor(Math.random() * 1000000) + nextNum,
    history: [{ status: 'New', at: new Date(createdAtMs).toISOString(), note: 'Report created' }]
  };
}
