import { NextResponse } from 'next/server';
import { getReports, addReportRecord, buildRandomReport } from '@/lib/store';

export async function GET() {
  const reports = await getReports();
  return NextResponse.json(reports);
}

// Used by "Simulate Incoming Alert". With no body (or no `type`), a
// random plausible report is generated server-side so every click
// produces a different, persisted report visible to anyone else
// viewing this deployment.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const reports = await getReports();

  const newReport =
    body && body.type
      ? (() => {
          const createdAtMs = Date.now();
          return {
            id: body.id || 'PH-' + createdAtMs,
            type: body.type,
            status: 'New',
            confidence: typeof body.confidence === 'number' ? body.confidence : 0.75,
            lat: body.lat,
            lng: body.lng,
            address: body.address || '',
            timestamp: createdAtMs,
            imageSeed: Math.floor(Math.random() * 1000000),
            history: [{ status: 'New', at: new Date(createdAtMs).toISOString(), note: 'Report created' }]
          };
        })()
      : buildRandomReport(reports);

  await addReportRecord(newReport);
  return NextResponse.json(newReport, { status: 201 });
}
