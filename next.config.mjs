/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Header keamanan dasar. Data bidang bersifat rahasia — jangan diindeks,
  // jangan dikirim sebagai referrer ke pihak lain.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' }
      ]
    }];
  }
};
export default nextConfig;
