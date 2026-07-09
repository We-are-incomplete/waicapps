/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 この項目を追加（スマホのIPアドレスからの接続を許可）
  allowedDevOrigins: ['192.168.10.103:3000', '192.168.10.103'],
};

module.exports = nextConfig;