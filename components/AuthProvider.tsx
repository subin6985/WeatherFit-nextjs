"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Firebase Auth 초기화 및 세션 관리를 담당하는 Provider
 * - 앱 시작 시 Firebase Auth 상태 리스너 등록
 * - 주기적으로 세션 만료 체크
 * - 활동 기반 자동 로그인 시간 갱신
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const checkAuthExpiry = useAuthStore((state) => state.checkAuthExpiry);

  useEffect(() => {
    // Firebase Auth 상태 리스너 초기화
    const unsubscribe = initAuth();

    // 세션 만료 체크 (5분마다)
    const expiryInterval = setInterval(() => {
      checkAuthExpiry();
    }, 5 * 60 * 1000);

    // 자동 로그인 시간 갱신 (1시간마다 체크)
    const refreshInterval = setInterval(() => {
      const { isLoggedIn, lastLoginTime } = useAuthStore.getState();

      if (isLoggedIn && lastLoginTime) {
        const timeSinceRefresh = Date.now() - lastLoginTime;

        // 1시간 지났으면 자동 갱신
        if (timeSinceRefresh > 60 * 60 * 1000) {
          useAuthStore.setState({ lastLoginTime: Date.now() });
          console.log("🔄 로그인 시간 자동 갱신");
        }
      }
    }, 10 * 60 * 1000); // 10분마다 체크

    // 정리 함수
    return () => {
      unsubscribe();
      clearInterval(expiryInterval);
      clearInterval(refreshInterval);
    };
  }, [initAuth, checkAuthExpiry]);

  return <>{children}</>;
}