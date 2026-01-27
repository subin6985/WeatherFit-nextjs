import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup, EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from "firebase/auth";
import {auth, db} from "../lib/firebase";
import {doc, getDoc, setDoc} from "firebase/firestore";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  lastLoginTime: number | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setUser: (user: User | null) => void;
  initAuth: () => () => void;
  checkAuthExpiry: () => void;
}

// 로그인 유지 기간 30일
const AUTH_EXPIRY_DAYS = 30;
const AUTH_EXPIRY_MS = AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
          user: null,
          isLoggedIn: false,
          isLoading: true,
          lastLoginTime: null,

          // 로그인 만료 체크
          checkAuthExpiry: () => {
            const { lastLoginTime, isLoggedIn } = get();

            if (!isLoggedIn || !lastLoginTime) return;

            const now = Date.now();
            const timeSinceLogin = now - lastLoginTime;

            if (timeSinceLogin > AUTH_EXPIRY_MS) {
              console.log("로그인 세션이 만료되었습니다.");
              get().logout();
            }
          },

          // Firebase 인증 상태 초기화
          initAuth: () => {
            // 앱 시작 시 만료 체크
            get().checkAuthExpiry();

            const unsubscribe = onAuthStateChanged(auth, (user) => {
              const { isLoggedIn, lastLoginTime } = get();

              if (isLoggedIn && lastLoginTime) {
                const timeSinceLogin = Date.now() - lastLoginTime;
                if (timeSinceLogin > AUTH_EXPIRY_MS) {
                  get().logout();
                  return;
                }
              }

              set({
                user,
                isLoggedIn: !!user,
                isLoading: false,
                // Firebase에 user가 있으면 lastLoginTime 갱신
                lastLoginTime: user ? Date.now() : null,
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
              lastLoginTime: user ? Date.now() : null,
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
                lastLoginTime: Date.now(),
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
                lastLoginTime: null,
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
              const user = userCredential.user;

              // Firestore에서 사용자 확인
              const userDocRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);

              let isNewUser = false;

              // 신규 사용자인 경우 Firestore에 저장
              if (!userDoc.exists()) {
                isNewUser = true;
                await setDoc(userDocRef, {
                  nickname: user.displayName || '익명',
                  email: user.email,
                  profilePhoto: user.photoURL || '',
                  createdAt: Date.now(),
                  provider: 'google',
                  gender: "NO_SELECT"
                });
              }

              set({
                user: userCredential.user,
                isLoggedIn: true,
                isLoading: false,
                lastLoginTime: Date.now(),
              });

              return { isNewUser };
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
                lastLoginTime: null,
              });
            } catch (error) {
              console.error("로그아웃 실패:", error);
              throw error;
            }
          },

          // 비밀번호 변경
          changePassword: async (currentPassword, newPassword) => {
            try {
              const user = auth.currentUser;

              if (!user || !user.email) {
                throw new Error("로그인된 사용자가 없습니다.");
              }

              // Google 로그인 사용자는 비밀번호 변경 불가
              const providerData = user.providerData[0];
              if (providerData?.providerId === 'google.com') {
                throw new Error("Google 계정은 비밀번호를 변경할 수 없습니다.");
              }

              // 1. 기존 비밀번호로 재인증
              const credential = EmailAuthProvider.credential(
                  user.email,
                  currentPassword
              );

              await reauthenticateWithCredential(user, credential);

              // 2. 새 비밀번호로 변경
              await updatePassword(user, newPassword);

              alert("비밀번호가 성공적으로 변경되었습니다.");
            } catch (error: any) {
              console.error("비밀번호 변경 실패:", error);

              // 에러 메시지 처리
              if (error.code === 'auth/wrong-password') {
                throw new Error("현재 비밀번호가 올바르지 않습니다.");
              } else if (error.code === 'auth/weak-password') {
                throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
              } else if (error.code === 'auth/requires-recent-login') {
                throw new Error("보안을 위해 다시 로그인해주세요.");
              }

              throw error;
            }
          }
        }),
        {
          name: "auth-storage",
          // user 객체는 직렬화가 복잡하므로 persist에서 제외
          partialize: (state) => ({
            isLoggedIn: state.isLoggedIn,
            lastLoginTime: state.lastLoginTime,
          }),
        }
    )
);