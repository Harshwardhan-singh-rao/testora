'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboardPage from './admin/page';
import { getCurrentAdmin } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const active = getCurrentAdmin();
    if (!active || (active.status === 'PENDING_APPROVAL' && active.role !== 'SUPER_ADMIN') || active.status === 'REJECTED') {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return null;

  return <AdminDashboardPage />;
}
