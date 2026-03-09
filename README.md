# 🌡️ 날씨 기반 옷차림 공유 플랫폼

> [WeatherFit](https://weather-fit-nextjs.vercel.app)  
> "오늘 같은 날씨에는 뭐 입지?" - 실제 날씨 데이터와 AI 분석 기반 옷차림 추천 및 공유 서비스  
> [블로그 회고록](https://fullstackdiary.tistory.com/27)

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.0-green)](https://socket.io/)

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [주요 기능 상세](#-주요-기능-상세)
- [배포](#-배포)
- [데이터베이스 구조](#-데이터베이스-구조)

---

## 🎯 주요 기능

### 1. 🤖 AI 기반 옷차림 분석
- **Google Vision API**를 활용한 자동 의류 인식
- 상의/하의 자동 분류 (민소매, 반소매, 긴소매, 아우터 / 반바지, 긴바지, 짧은치마, 긴치마)
- 신뢰도 기반 품질 검증

### 2. 🌤️ 실시간 날씨 연동
- **OpenWeather, Open-Meteo API** 기반 현재 위치 날씨 자동 감지
- 온도 범위별 통계 자동 생성
- 8단계 온도 구간 분류 (4도 미만 ~ 28도 이상)

### 3. 📊 스마트 통계 시스템
- 온도별 · 성별별 옷차림 통계 실시간 제공
- 사용자 성별 변경, 게시글 삭제 시 통계 자동 재계산
- Firebase onSnapshot 기반 실시간 업데이트

### 4. 💬 실시간 1:1 채팅
- **WebSocket (Socket.io)** 기반 즉시 메시지 전송
- 타이핑 인디케이터 (입력 중 표시)
- 읽음/안 읽음 상태 관리
- 탈퇴 회원 처리 (채팅 불가, UI 표시)

### 5. 💡 댓글 & 답글 시스템
- 2단계 깊이 댓글 (원댓글 → 답댓글)
- 실시간 댓글 수 업데이트
- 댓글/답글 알림 자동 생성

### 6. 🔔 실시간 알림
- 좋아요, 댓글, 답글 알림
- Firebase onSnapshot 기반 실시간 수신
- 읽음/안 읽음 상태 관리

### 7. 📱 반응형 UI
- 게시글 상세: 댓글 패널 슬라이드
- 모바일 최적화 (393px 기준)
- 이미지 비율 자동 조정 (1:1 ~ 4:5)

### 8. 🎨 개인화
- 프로필 사진, 닉네임, 성별 설정
- 내가 쓴 글 / 좋아요한 글 모아보기
- Google 로그인 연동

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand

### Backend & Database
- **BaaS**: Firebase (Firestore, Storage, Authentication)
- **Real-time**: Socket.io (WebSocket)
- **AI**: Google Cloud Vision API
- **Weather**: OpenWeather API

### Infrastructure
- **Frontend Hosting**: Vercel
- **WebSocket Server**: Railway
- **CI/CD**: GitHub Actions (자동 배포)

---

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자                                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Vercel     │    │   Railway    │    │   Firebase   │
│              │    │              │    │              │
│  Next.js     │◄──►│  Socket.io   │    │  Firestore   │
│  Frontend    │    │  WebSocket   │    │  Storage     │
│              │    │  Server      │    │  Auth        │
│  API Routes: │    │              │    │              │
│  - Vision AI │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────────────────────────┐
│      External APIs               │
│  - Google Vision API             │
│  - OpenWeather API               │
└──────────────────────────────────┘
```

### 데이터 흐름

#### 1. 게시글 작성
```
사용자 이미지 업로드
    ↓
Firebase Storage 저장
    ↓
Google Vision API 분석
    ↓
Firestore 저장 (AI 결과 포함)
    ↓
통계 자동 업데이트
```

#### 2. 실시간 채팅
```
메시지 입력
    ↓
WebSocket으로 즉시 전송 (상대방)
    ↓
Firebase에 영구 저장
    ↓
onSnapshot으로 실시간 동기화
```

#### 3. 통계 시스템
```
게시글 생성/수정/삭제
    ↓
AI 분석 결과 기반 통계 업데이트
    ↓
Firebase onSnapshot으로 실시간 반영
    ↓
성별 필터링 적용
```

---

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Firebase 프로젝트
- Google Cloud 프로젝트 (Vision API 활성화)
- OpenWeather API 키

### 설치

#### 1. 저장소 클론

```bash
git clone https://github.com/subin6985/WeatherFit-nextjs.git
cd weather-outfit
```

#### 2. 의존성 설치

```bash
npm install
```

#### 3. 환경 변수 설정

`.env.local` 파일 생성
`.env.example` 참고

#### 4. WebSocket 서버 설정

WebSocket 서버는 별도 레포지토리로 관리됩니다.

**레포지토리**: [socket-server](https://github.com/subin6985/WeatherFit-socket)

같은 상위 디렉토리에 클론하는 것을 권장합니다.

```
weatherfit/
├── app/            # FE
└── socket-server/  # WebSocket 서버
```

```bash
# 1. 별도로 클론
git clone https://github.com/subin6985/WeatherFit-socket.git
cd socket-server

# 2. 의존성 설치
npm install

# 3. .env 파일 생성
echo "CLIENT_URL=http://localhost:3000" > .env
echo "PORT=3001" >> .env
```

#### 5. 개발 서버 실행

```bash
# 터미널 1: WebSocket 서버
cd socket-server
npm run dev

# 터미널 2: Next.js 앱
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📁 프로젝트 구조

```
weather-outfit/
├── app/                          # Next.js App Router
│   ├── (feed)/                   # 게시글 관련
│   │   ├── feed/                 # 게시글 목록
│   │   ├── post/
│   │   │   ├── [id]/             # 게시글 상세
│   │   │   └── edit/             # 게시글 수정
│   │   ├── write/                # 게시글 작성
│   │   └── layout.tsx            # 게시글 Layout
│   ├── (home)/                   # 메인 페이지
│   ├── (mypage)/                 # 마이페이지 관련
│   │   ├── delete-account/       # 회원 탈퇴
│   │   ├── mypage/               # 마이페이지
│   │   │   ├── edit/             # 개인정보 수정
│   │   │   │   └── password/     # 비밀번호 변경
│   │   │   ├── like/             # 좋아요 한 게시글
│   │   │   └── mypage/           # 내가 쓴 게시글
│   │   └── layout.tsx            # 마이페이지 Layout
│   ├── (user)/                   # 로그인, 회원가입 관련
│   │   ├── login/                # 로그인
│   │   ├── signup/               # 회원가입
│   │   │   ├── finish-google/    # 소셜 회원가입 마무리 (닉네임, 성별 설정)
│   │   │   └── layout.tsx        # 로그인 Layout
│   ├── api/                      # API Routes
│   │   ├── invalidate-verification/    # 인증 코드 무효화
│   │   ├── send-verification/    # 인증 코드 발송
│   │   ├── verify-code/          # 인증 코드 검증
│   │   └── analyze-clothing/     # Google Vision AI
│   └── layout.tsx                # Root Layout
│
├── components/                   # React 컴포넌트
│   ├── baseUI/                   # 기본 공통 UI
│   ├── chat/                     # 채팅 관련
│   ├── comment/                  # 댓글 관련
│   ├── feed/                     # 게시글 목록 관련
│   ├── signupUI/                 # 회원가입 관련
│   ├── writeUI/                  # 게시글 작성 관련
│   ├── AuthProvider.tsx          # Firebase Auth 초기화 및 세션 관리
│   ├── LayoutWrapper             # 반응형 채팅창 레이아웃 관리
│   ├── NotificationBell          # 알림창 관련
│   ├── ProfileButton             # 프로필 아이콘
│   ├── Ratio.tsx                 # 통계 컴포넌트
│   └── WeatherClient.tsx         # 현재 날씨 별 메인 페이지 커스텀
├── lib/                          # 유틸리티 & 서비스
│   ├── services/                 # 비즈니스 로직
│   │   ├── aiClothingService.ts
│   │   ├── chatService.ts
│   │   ├── clothingStatsService.ts
│   │   ├── commentService.ts
│   │   ├── notificationService.ts
│   │   └── postService.ts
│   ├── email.ts                  # 보안 코드 발송 유틸
│   ├── firebase.ts               # Firebase 설정
│   └── weatherUtils.ts           # 날씨 유틸
│
├── store/                        # Zustand 상태 관리
│   ├── useAuthStore.ts
│   ├── useCommentStore.ts
│   ├── useChatStore.ts
│   ├── useWriteStore.ts
│   └── useNavigationStore.ts
│
├── socket-server/                # WebSocket 서버 (별도 배포)
│
├── types/                        # TypeScript 타입 정의
│   └── index.ts
│
└── public/                       # 정적 파일
    └── images/
```

---

## 🔥 주요 기능 상세

### 1. AI 옷차림 분석

**흐름:**
```typescript
// 1. 이미지 업로드
const file = await uploadToStorage(image);

// 2. Vision API 호출
const response = await fetch('/api/analyze-clothing', {
  method: 'POST',
  body: JSON.stringify({ imageUrl: file.url })
});

// 3. 결과 저장
const aiAnalysis = await response.json();
// { top: '반소매', bottom: '긴바지', confidence: 0.85 }
```

**분류 카테고리:**
- 상의: 민소매, 반소매, 긴소매, 아우터
- 하의: 반바지, 긴바지, 짧은 치마, 긴 치마

**신뢰도 검증:**
- 0.6 미만: 분석 실패 → 재업로드 요청

---

### 2. 통계 시스템

**데이터 구조 (Firestore):**
```javascript
clothingStats/
  └─ FROM20_TO22/              // 온도 범위
      ├─ all/                  // 전체
      │   ├─ top: { 민소매: 5, 반소매: 10, ... }
      │   └─ bottom: { 반바지: 8, 긴바지: 12, ... }
      ├─ female/               // 여성
      └─ male/                 // 남성
```

**실시간 업데이트:**
```typescript
// Firebase onSnapshot 구독
subscribeClothingStats(tempRange, gender, (stats) => {
  setData(stats);  // 자동 업데이트
});
```

**통계 재계산 시나리오:**
1. 게시글 생성: 해당 온도·성별 통계 +1
2. 게시글 삭제: 해당 온도·성별 통계 -1
3. 게시글 수정: 온도 변경 시 이전 통계 -1, 새 통계 +1
4. 성별 변경: 모든 게시글 통계 재계산

---

### 3. 실시간 채팅

**하이브리드 구조:**
- **WebSocket**: 실시간 전송 (즉시성)
- **Firebase**: 메시지 저장 (영구성)

**메시지 전송 흐름:**
```typescript
// 1. WebSocket으로 즉시 전송
socket.emit('send-message', messageData);

// 2. Firebase에 저장
await saveMessage(roomId, userId, message);

// 3. onSnapshot으로 동기화
subscribeMessages(roomId, (messages) => {
  setMessages(messages);
});
```

**주요 기능:**
- 타이핑 인디케이터 (2초 타임아웃)
- 읽음 처리
- 탈퇴 회원 처리
- 연결 상태 표시

---

### 4. 댓글 시스템

**데이터 구조:**
```javascript
posts/{postId}/comments/
  └─ {commentId}/
      ├─ userId
      ├─ content
      ├─ parentId: null        // 원댓글
      ├─ depth: 0
      └─ replyCount: 2
      
      └─ replies/              // 서브컬렉션
          ├─ {replyId1}/
          │   └─ parentId: commentId  // 답댓글
          └─ {replyId2}/
```

**기능:**
- 2단계 깊이만 허용 (원댓글 → 답댓글)
- 실시간 댓글 수 업데이트
- 삭제 시 "삭제된 댓글" 표시 (답댓글 있는 경우)
- 답댓글이 없어지면 원댓글도 완전히 제거
- 알림 자동 생성

---

### 5. 알림 시스템

**알림 타입:**
- `like`: 좋아요
- `comment`: 댓글
- `reply`: 답글

**실시간 구독:**
```typescript
subscribeNotifications(userId, (notifications) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  setUnreadCount(unreadCount);
});
```

**UI 표시:**
- 헤더 알림 아이콘 (빨간 뱃지)
- 알림 목록 모달
- 읽음 처리

---

## 🌐 배포

- WebSocket 서버 (Railway)
- Frontend (Vercel)
- https://weather-fit-nextjs.vercel.app

---

## 📊 데이터베이스 구조

### Firestore Collections

```javascript
users/
  └─ {userId}/
      ├─ email
      ├─ nickname
      ├─ profilePhoto
      ├─ gender
      └─ createdAt

posts/
  └─ {postId}/
      ├─ memberId
      ├─ post
      ├─ photo
      ├─ temp
      ├─ tempRange
      ├─ region
      ├─ outfitDate
      ├─ gender
      ├─ likes
      ├─ likedBy[]
      ├─ aiAnalysis { top, bottom, confidence }
      └─ createdAt
      
      └─ comments/
          └─ {commentId}/
              ├─ userId
              ├─ content
              ├─ parentId
              ├─ depth
              ├─ replyCount
              └─ createdAt

chatRooms/
  └─ {roomId}/
      ├─ participants[]
      ├─ participantNames{}
      ├─ participantPhotos{}
      ├─ lastMessage
      ├─ lastMessageTime
      ├─ unreadCount{}
      └─ createdAt
      
      └─ messages/
          └─ {messageId}/
              ├─ senderId
              ├─ message
              ├─ timestamp
              └─ isRead

notifications/
  └─ {notificationId}/
      ├─ recipientId
      ├─ senderId
      ├─ type
      ├─ postId
      ├─ message
      ├─ isRead
      └─ createdAt

clothingStats/
  └─ {tempRange}/
      ├─ all { top{}, bottom{} }
      ├─ female { top{}, bottom{} }
      └─ male { top{}, bottom{} }

emailVerifications/
  └─ {email}/
      ├─ email
      ├─ code
      ├─ createdAt
      ├─ expiresAt
      └─ verified
```