
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    username: string;
    role: string;
    isUnlocked: boolean;
    isSuperAdmin: boolean;
    classId?: string | null;
    themeId?: string | null;
    originalClassId?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    isUnlocked: boolean;
    username: string;
    isSuperAdmin: boolean;
    classId?: string | null;
    themeId?: string | null;
    originalClassId?: string | null;
  }
}
