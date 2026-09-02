import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import type { Peran } from '@/types';

declare module 'next-auth' {
  interface Session { user: { id: string; name: string; username: string; peran: Peran } }
  interface User { id: string; name: string; username: string; peran: Peran }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },   // 8 jam, sepanjang jam kerja
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
  username: {},
  password: {},
  peran: {},
},
      async authorize(kredensial) {
  const username = String(kredensial?.username ?? '').trim().toLowerCase();
  const password = String(kredensial?.password ?? '');
  const peranDipilih = String(kredensial?.peran ?? '') as Peran;

  if (!username || !password || !peranDipilih) return null;

  const [u] = await query<{
    id: string;
    nama: string;
    username: string;
    password_hash: string;
    peran: Peran;
    aktif: boolean;
  }>(
    `SELECT id, nama, username, password_hash, peran, aktif
     FROM pengguna
     WHERE username = $1`,
    [username]
  );

  // Tetap lakukan bcrypt.compare walaupun pengguna tidak ditemukan.
  const hash =
    u?.password_hash ??
    '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

  const cocok = await bcrypt.compare(password, hash);

  // Username/password/akun/role semuanya harus cocok.
  if (
    !u ||
    !u.aktif ||
    !cocok ||
    u.peran !== peranDipilih
  ) {
    return null;
  }

  await query(
    'UPDATE pengguna SET login_terakhir = now() WHERE id = $1',
    [u.id]
  );

  return {
    id: u.id,
    name: u.nama,
    username: u.username,
    peran: u.peran,
  };
}
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.uid = user.id; token.peran = user.peran; token.username = user.username; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.peran = token.peran as Peran;
      session.user.username = token.username as string;
      return session;
    }
  }
});

/** Dipakai di setiap API route. Melempar 401 bila belum masuk. */
export async function wajibMasuk() {
  const sesi = await auth();
  if (!sesi?.user) throw new Response('Belum masuk', { status: 401 });
  return sesi.user;
}
