
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        classId: { label: 'Class ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const supabase = supabaseServer();

        // Debug Log
        console.log('Login Attempt:', { username: credentials.username, classId: credentials.classId });

        const { data: user, error } = await supabase
          .from('users')
          .select('*, class:classes!users_class_id_fkey(id, theme_id)')
          .eq('username', credentials.username)
          .maybeSingle();

        if (error || !user) {
          console.log('User not found or DB error:', error);
          return null;
        }

        const userWithClass = user as any;
        let effectiveClassId = userWithClass.class?.id;
        let effectiveThemeId = userWithClass.class?.theme_id;
        
        console.log('Found User:', { 
          id: user.id, 
          role: user.role, 
          dbClassId: effectiveClassId,
          providedClassId: credentials.classId 
        });

        // 1. Validate Class Selection
        // If user has a class assigned (not a super admin without class), enforce class match
        if (effectiveClassId && credentials.classId) {
           if (effectiveClassId !== credentials.classId) {
             console.log('Class mismatch. User belongs to', effectiveClassId, 'but selected', credentials.classId);
             return null;
           }
        }

        // If user has NO fixed class (e.g. Global Editor), use the selected class from login
        if (!effectiveClassId && credentials.classId) {
           const { data: selectedClass } = await supabase
             .from('classes')
             .select('id, theme_id')
             .eq('id', credentials.classId)
             .single();
             
           if (selectedClass) {
              effectiveClassId = selectedClass.id;
              effectiveThemeId = selectedClass.theme_id;
              // Set the class object so originalClassId is populated correctly below
              userWithClass.class = { id: selectedClass.id }; 
           } else {
             console.log('Selected class not found:', credentials.classId);
             return null;
           }
        }
        
        // IMPORTANT: If user is ADMINISTRATOR or EDITOR without class, they MUST select a class to login?
        // Or can they login without class? The UI forces class selection.
        // If credentials.classId is missing and user has no class, maybe fail?
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log('Invalid password for user:', user.username);
          return null;
        }

        // Check if ADMINISTRATOR has a view_as_class_id set
        if (user.role === 'ADMINISTRATOR' && user.view_as_class_id) {
           // Fetch the theme for the viewed class
           const { data: viewedClass } = await supabase
             .from('classes')
             .select('id, theme_id')
             .eq('id', user.view_as_class_id)
             .single();
           
           if (viewedClass) {
             effectiveClassId = viewedClass.id;
             effectiveThemeId = viewedClass.theme_id;
           }
        }

        console.log('Login Successful. Returning user session data.');

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role, // ADMINISTRATOR, EDITOR, AUTHOR, SUBSCRIBER
          isUnlocked: user.is_unlocked,
          isSuperAdmin: user.is_super_admin,
          classId: effectiveClassId,
          themeId: effectiveThemeId,
          originalClassId: userWithClass.class?.id || effectiveClassId, // Use effective if no original
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isUnlocked = user.isUnlocked;
        token.username = user.username;
        token.isSuperAdmin = user.isSuperAdmin;
        token.classId = user.classId;
        token.themeId = user.themeId;
        token.originalClassId = user.originalClassId;
      }

      // Refresh data from DB on every session check to handle role changes or class switching
      if (token.id) {
        const supabase = supabaseServer();
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_unlocked, is_super_admin, view_as_class_id, class:classes!users_class_id_fkey(id, theme_id)')
          .eq('id', token.id)
          .maybeSingle();

        if (userData) {
          const userWithClass = userData as any;
          token.role = userData.role;
          token.isUnlocked = userData.is_unlocked;
          token.isSuperAdmin = userData.is_super_admin;
          token.originalClassId = userWithClass.class?.id;
          
          // Handle Class Switching for ADMINISTRATOR
          if (userData.role === 'ADMINISTRATOR' && userData.view_as_class_id) {
             const { data: viewedClass } = await supabase
               .from('classes')
               .select('id, theme_id')
               .eq('id', userData.view_as_class_id)
               .single();
             
             if (viewedClass) {
               token.classId = viewedClass.id;
               token.themeId = viewedClass.theme_id;
             } else {
               // Fallback if viewed class not found
               token.classId = userWithClass.class?.id;
               token.themeId = userWithClass.class?.theme_id;
             }
          } else {
            // Normal behavior
            token.classId = userWithClass.class?.id;
            token.themeId = userWithClass.class?.theme_id;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isUnlocked = token.isUnlocked as boolean;
        session.user.username = token.username as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.classId = token.classId as string;
        session.user.themeId = token.themeId as string;
        session.user.originalClassId = token.originalClassId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable NextAuth debugging
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
