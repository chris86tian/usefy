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
       source: "/courses/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/courses/:path*",
     },
     {
       source: "/users/clerk/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/clerk/:path*",
     },
     {
       source: "/teacher/transactions",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/teacher/transactions",
     },      
     {
       source: "/notifications/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/notifications/:path*",
     },
     {
       source: "/commits/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/commits/:path*",
     },
     {
       source: "/users/course-progress/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/users/course-progress/:path*",
     },
     {
       source: "/api/:path*",
       destination: "https://w10mtexzig.execute-api.us-east-1.amazonaws.com/dev/:path*",
     },
   ];
 },
 async headers() {
   return [
     {
       source: "/:path*",
       headers: [
         { key: "Access-Control-Allow-Origin", value: "*" },
         { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
         { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
       ],
     },
   ];
 },
};

export default nextConfig;