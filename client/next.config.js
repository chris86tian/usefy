/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "expertize-bucket-migration.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "expertize-bucket-migration-dev.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "expertize-bucket-migration-prod.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "khbciw4vke.execute-api.us-east-1.amazonaws.com",
        port: "",
        pathname: "/prod/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://khbciw4vke.execute-api.us-east-1.amazonaws.com/prod/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
