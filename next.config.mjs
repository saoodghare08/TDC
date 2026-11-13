/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/pdf-generator',
        destination: '/admin/diet-plan-generator',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
