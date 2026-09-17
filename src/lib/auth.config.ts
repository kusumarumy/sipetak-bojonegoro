import type { NextAuthConfig } from 'next-auth';

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
  },
} satisfies NextAuthConfig;

export default authConfig;
