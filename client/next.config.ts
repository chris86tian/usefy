import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
   remotePatterns: [
     {
       protocol: "https",
       hostname: "**",
       port: "",
       pathname: "/**",
     },
   ],
   domains: [
     "expertize-bucket.s3.us-east-1.amazonaws.com",
     "d2d2uxovkp6xho.cloudfront.net",
     "w10mtexzig.execute-api.us-east-1.amazonaws.com",
   ],
 },
 async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/:path*",
    },
  ];
},
};

export default nextConfig;