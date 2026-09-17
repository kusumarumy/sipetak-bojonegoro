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

      // Tidak ada catatan aktivitas
      if (!token.lastActivity) {
        return {};
      }

      // Tidak aktif selama 8 jam
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
