/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 이미지 도메인 허용 (필요시)
    domains: [],
    // 이미지 최적화 비활성화 (로컬 이미지만 사용시)
    unoptimized: false,
  },
};

module.exports = nextConfig;