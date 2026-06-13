/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // wagmi / walletconnect pull in optional native deps that must be externalized.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
