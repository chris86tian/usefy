 /** @type {import('next').NextConfig}  */
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
      domains: ['expertize-bucket.s3.us-east-1.amazonaws.com', 'd2d2uxovkp6xho.cloudfront.net']
    },
  };
  
  module.exports = nextConfig;