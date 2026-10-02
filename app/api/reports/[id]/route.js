import { NextResponse } from 'next/server';
import { updateReportStatus } from '@/lib/store';

const VALID_STATUSES = ['New', 'Acknowledged', 'Repaired'];

export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const status = body && body.status;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const updated = await updateReportStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
