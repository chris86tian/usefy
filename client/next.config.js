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
      // Catch requests to "/courses" and "/courses/:path*"
      {
        source: "/courses",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/courses",
      },
      {
        source: "/courses/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/courses/:path*",
      },

      // Users Clerk API
      {
        source: "/users/clerk",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/clerk",
      },
      {
        source: "/users/clerk/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/clerk/:path*",
      },

      // Transactions API
      {
        source: "/transactions",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/transactions",
      },
      {
        source: "/transactions/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/transactions/:path*",
      },

      // Notifications API
      {
        source: "/notifications",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/notifications",
      },
      {
        source: "/notifications/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/notifications/:path*",
      },

      // Commits API
      {
        source: "/commits",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/commits",
      },
      {
        source: "/commits/:path*",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/commits/:path*",
      },

      // Users Course Progress API
      {
        source: "/users/course-progress",
        destination:
          "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/course-progress",
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
