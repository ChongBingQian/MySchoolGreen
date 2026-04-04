import { useEffect } from 'react';
import { logout } from '@/client/lib/cloudflare/modelenceClient';

export default function LogoutPage() {
  useEffect(() => {
    logout().then(() => {
      window.location.href = '/login';
    });
  }, []);

  return null;
}

