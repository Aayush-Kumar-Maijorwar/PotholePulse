import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const session = cookies().get('pp_session');
  redirect(session && session.value === 'admin' ? '/dashboard' : '/login');
}
