import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

export const metadata: Metadata = {
  title: 'DPPT Bojonegoro — Pendataan Bidang Tanah',
  description:
    'DDokumen Perencanaan Pengadaan Tanah Jalur Lingkar Selatan Kabupaten Bojonegoro',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}