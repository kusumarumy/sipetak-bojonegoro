import type { NextAuthConfig } from 'next-auth';

const INACTIVITY_TIMEOUT = 8 * 60 * 60; // 8 jam

const authConfig = {
  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: INACTIVITY_TIMEOUT,
    updateAge: 0,
  },

  providers: [],

  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const terbuka =
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth');

      if (terbuka) return true;

      return !!auth?.user;
    },

    jwt({ token, user }) {
      const t = token as typeof token & {
        uid?: string;
        peran?: import('@/types').Peran;
        username?: string;
        lastActivity?: number;
      };

      // Login pertama
      if (user) {
        t.uid = user.id;
        t.peran = user.peran;
        t.username = user.username;
        t.lastActivity = Math.floor(Date.now() / 1000);

        return t;
      }

      // Belum punya lastActivity
      if (typeof t.lastActivity !== 'number') {
        return t;
      }

      const sekarang = Math.floor(Date.now() / 1000);

      // Tidak ada aktivitas selama 8 jam
      if (
        sekarang - t.lastActivity >=
        INACTIVITY_TIMEOUT
      ) {
        delete t.uid;
        delete t.peran;
        delete t.username;
        delete t.lastActivity;

        return t;
      }

      // Masih aktif → geser waktu aktivitas
      t.lastActivity = sekarang;

      return t;
    },

    session({ session, token }) {
      const t = token as typeof token & {
        uid?: string;
        peran?: import('@/types').Peran;
        username?: string;
      };

      if (!t.uid) {
        return session;
      }

      session.user.id = t.uid;
      session.user.peran = t.peran as import('@/types').Peran;
      session.user.username = t.username as string;

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
