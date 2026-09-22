'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login?mode=register');
  }, [router]);

  return null;
}
