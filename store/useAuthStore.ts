import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setUser: (user: User | null) => void;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
          user: null,
          isLoggedIn: false,
          isLoading: true,

          // Firebase 인증 상태 초기화
          initAuth: () => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              set({
                user,
                isLoggedIn: !!user,
                isLoading: false,
              });
            });

            // 컴포넌트 언마운트 시 구독 해제를 위해 반환
            return unsubscribe;
          },

          // 사용자 설정
          setUser: (user) => {
            set({
              user,
              isLoggedIn: !!user,
              isLoading: false,
            });
          },

          // 이메일/비밀번호 로그인
          login: async (email, password) => {
            try {
              set({ isLoading: true });
              const userCredential = await signInWithEmailAndPassword(
                  auth,
                  email,
                  password
              );
              set({
                user: userCredential.user,
                isLoggedIn: true,
                isLoading: false,
              });
            } catch (error) {
              set({ isLoading: false });
              console.error("로그인 실패:", error);
              throw error;
            }
          },

          // 회원가입
          signUp: async (email, password) => {
            try {
              set({ isLoading: true });
              const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  email,
                  password
              );
              set({
                user: userCredential.user,
                isLoggedIn: true,
                isLoading: false,
              });
            } catch (error) {
              set({ isLoading: false });
              console.error("회원가입 실패:", error);
              throw error;
            }
          },

          // Google 로그인
          loginWithGoogle: async () => {
            try {
              set({ isLoading: true });
              const provider = new GoogleAuthProvider();
              const userCredential = await signInWithPopup(auth, provider);
              set({
                user: userCredential.user,
                isLoggedIn: true,
                isLoading: false,
              });
            } catch (error) {
              set({ isLoading: false });
              console.error("Google 로그인 실패:", error);
              throw error;
            }
          },

          // 로그아웃
          logout: async () => {
            try {
              await signOut(auth);
              set({
                user: null,
                isLoggedIn: false,
              });
            } catch (error) {
              console.error("로그아웃 실패:", error);
              throw error;
            }
          },
        }),
        {
          name: "auth-storage",
          // user 객체는 직렬화가 복잡하므로 persist에서 제외
          partialize: (state) => ({
            isLoggedIn: state.isLoggedIn,
          }),
        }
    )
);