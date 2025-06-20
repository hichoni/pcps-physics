
import type {NextConfig} from 'next';
import type { PWAConfig } from '@ducanh2912/next-pwa'; // PWAConfig 타입을 명시적으로 임포트
import withPWAInit from '@ducanh2912/next-pwa';

// PWA 설정을 PWAConfig 타입으로 명시
const pwaConfig: PWAConfig = {
  dest: 'public', // PWA 관련 파일들이 생성될 디렉토리
  register: true, // 서비스 워커 등록 활성화
  skipWaiting: true, // 새 서비스 워커가 준비되면 즉시 활성화
  disable: process.env.NODE_ENV === 'development', // 개발 환경에서는 PWA 비활성화
  // runtimeCaching: [ // 필요에 따라 런타임 캐싱 전략을 설정할 수 있습니다.
  //   {
  //     urlPattern: /^https?.*/,
  //     handler: 'NetworkFirst',
  //     options: {
  //       cacheName: 'offlineCache',
  //       expiration: {
  //         maxEntries: 200,
  //       },
  //     },
  //   },
  // ],
};

const withPWA = withPWAInit(pwaConfig);

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Firebase Storage 도메인 추가
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
