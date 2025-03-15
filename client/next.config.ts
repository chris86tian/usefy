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
     "expertize-bucket-migration.s3.us-east-1.amazonaws.com",
   ],
 },
};

export default nextConfig;