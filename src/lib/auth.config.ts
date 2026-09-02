import type { NextAuthConfig } from 'next-auth';

const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
} satisfies NextAuthConfig;

export default authConfig;