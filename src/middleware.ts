import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Seluruh aplikasi tertutup. Hanya halaman masuk dan endpoint auth yang terbuka.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const terbuka =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth');

  if (!req.auth && !terbuka) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('kembali', pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|woff2)$).*)',
  ],
};