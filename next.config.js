/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 이미지 도메인 허용 (필요시)
    domains: [
        "lh3.googleusercontent.com",
        "firebasestorage.googleapis.com"
    ],
    // 이미지 최적화 비활성화 (로컬 이미지만 사용시)
    unoptimized: false,
  },
};

module.exports = nextConfig;