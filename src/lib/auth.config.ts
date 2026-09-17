import type { NextAuthConfig } from 'next-auth';

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 jam

const authConfig = {
  pages: {
    signIn: '/login',
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
      const sekarang = Date.now();

      // Saat pertama kali login
      if (user) {
        token.lastActivity = sekarang;
        return token;
      }

      // Kalau tidak ada catatan aktivitas,
      // session dianggap tidak valid.
      if (!token.lastActivity) {
        return {};
      }

      // Lebih dari 8 jam sejak aktivitas terakhir
      if (sekarang - token.lastActivity >= INACTIVITY_TIMEOUT) {
        return {};
      }

      // Masih aktif → perbarui waktu aktivitas
      token.lastActivity = sekarang;

      return token;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
