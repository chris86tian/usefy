/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: [
      "expertize-bucket.s3.us-east-1.amazonaws.com",
      "d2d2uxovkp6xho.cloudfront.net",
      "oo9i2g3jc9.execute-api.us-east-1.amazonaws.com", // Removed "https://"
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://oo9i2g3jc9.execute-api.us-east-1.amazonaws.com/dev/:path*",
      },
    ];
  },
};

module.exports = nextConfig;