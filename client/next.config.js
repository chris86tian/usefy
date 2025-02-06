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
        source: "/courses/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/courses/:path*",
      },
      {
        source: "/users/clerk/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/clerk/:path*",
      },
      {
        source: "/transactions/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/transactions/:path*",
      },
      {
        source: "/notifications/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/notifications/:path*",
      },
      {
        source: "/commits/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/commits/:path*",
      },
      {
        source: "/users/course-progress/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/course-progress/:path*",
      },
    ];
  },
};

export default nextConfig;
