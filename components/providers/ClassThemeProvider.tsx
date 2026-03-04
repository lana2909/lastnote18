
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function ClassThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.themeId) {
      document.body.setAttribute('data-theme', session.user.themeId);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [session?.user?.themeId]);

  return <>{children}</>;
}
