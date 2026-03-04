
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    username: string;
    role: string;
    isUnlocked: boolean;
    isSuperAdmin: boolean;
    classId?: string;
    themeId?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: string;
      isUnlocked: boolean;
      isSuperAdmin: boolean;
      classId?: string;
      themeId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    isUnlocked: boolean;
    isSuperAdmin: boolean;
    username: string;
    classId?: string;
    themeId?: string;
  }
}
