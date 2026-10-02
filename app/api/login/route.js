import { NextResponse } from 'next/server';

// DEMO AUTH ONLY. The credentials are hardcoded and the session cookie
// is a plain "it equals admin" flag with no signing/expiry logic beyond
// maxAge — this is intentionally not production-grade authentication,
// just enough of a server round trip for a hackathon demo.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body || {};

  if (username === 'admin' && password === 'admin123') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('pp_session', 'admin', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: 'Invalid username or password.' }, { status: 401 });
}
