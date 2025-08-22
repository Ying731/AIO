/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用严格模式以避免某些开发时的警告
  reactStrictMode: false,
  
  // 配置安全头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // 配置图片域名白名单
  images: {
    domains: [],
  },
}

module.exports = nextConfig