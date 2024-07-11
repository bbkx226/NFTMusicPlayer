/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "cryptopunks.app",
        protocol: "https"
      },
      {
        hostname: "bbkx-music-nfts.s3.ap-southeast-1.amazonaws.com",
        protocol: "https"
      }
    ]
  }
};

export default nextConfig;
