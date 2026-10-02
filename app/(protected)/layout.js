import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReportsProvider } from '@/components/ReportsProvider';
import LeftRail from '@/components/LeftRail';
import Header from '@/components/Header';

export default function ProtectedLayout({ children }) {
  const session = cookies().get('pp_session');
  if (!session || session.value !== 'admin') {
    redirect('/login');
  }

  return (
    <ReportsProvider>
      <div className="shell-root">
        <LeftRail />
        <div className="app-shell">
          <Header />
          {children}
        </div>
      </div>
    </ReportsProvider>
  );
}
