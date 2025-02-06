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
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*", // This will catch all backend API calls
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/:path*",
      },
    ];
  },
};

export default nextConfig;
