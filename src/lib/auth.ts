import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import type { Peran } from '@/types';

const INACTIVITY_TIMEOUT = 8 * 60 * 60; // 8 jam dalam detik

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      peran: Peran;
    };
  }

  interface User {
    id: string;
    name: string;
    username: string;
    peran: Peran;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: INACTIVITY_TIMEOUT,
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },

      async authorize(kredensial) {
        const username = String(
          kredensial?.username ?? ''
        )
          .trim()
          .toLowerCase();

        const password = String(
          kredensial?.password ?? ''
        );

        if (!username || !password) return null;

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

        if (!u || !u.aktif || !cocok) return null;

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
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      // Saat login pertama kali
      if (user) {
        token.uid = user.id;
        token.peran = user.peran;
        token.username = user.username;
        token.lastActivity = Math.floor(Date.now() / 1000);

        return token;
      }

      // Kalau tidak ada waktu aktivitas,
      // jangan mengubah token.
      if (typeof token.lastActivity !== 'number') {
        return token;
      }

      const sekarang = Math.floor(Date.now() / 1000);

      // Jika sudah tidak aktif 8 jam,
      // hapus identitas dari token.
      if (
        sekarang - token.lastActivity >=
        INACTIVITY_TIMEOUT
      ) {
        delete token.uid;
        delete token.peran;
        delete token.username;
        delete token.lastActivity;

        return token;
      }

      // Aktivitas masih dalam batas waktu.
      // Perbarui waktu aktivitas.
      token.lastActivity = sekarang;

      return token;
    },

    session({ session, token }) {
      // Token sudah tidak memiliki user
      if (!token.uid) {
        return session;
      }

      session.user.id = token.uid as string;
      session.user.peran = token.peran as Peran;
      session.user.username = token.username as string;

      return session;
    },
  },
});

/** Dipakai di setiap API route. Melempar 401 bila belum masuk. */
export async function wajibMasuk() {
  const sesi = await auth();

  if (!sesi?.user) {
    throw new Response('Belum masuk', { status: 401 });
  }

  return sesi.user;
}
