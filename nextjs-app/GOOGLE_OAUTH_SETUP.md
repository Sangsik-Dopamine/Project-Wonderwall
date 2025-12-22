# Google OAuth 설정 가이드 (YouTube API 접근 포함)

## 📋 개요

YouTube 구독 데이터에 접근하기 위한 Google OAuth 2.0 설정 가이드입니다.

## 🔧 1. Google Cloud Console 설정

### 1-1. 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단의 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: "YouTube Subscription Analyzer")
4. **만들기** 클릭

### 1-2. YouTube Data API v3 활성화

1. 왼쪽 메뉴 → **API 및 서비스** → **라이브러리**
2. "YouTube Data API v3" 검색
3. 클릭 후 **사용 설정** 버튼 클릭

### 1-3. OAuth 동의 화면 구성

1. 왼쪽 메뉴 → **API 및 서비스** → **OAuth 동의 화면**
2. User Type: **외부** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: `YouTube Subscription Analyzer`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. **저장 후 계속** 클릭

### 1-4. 범위(Scope) 추가

1. **범위 추가 또는 삭제** 클릭
2. 다음 범위들을 추가:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/youtube.readonly` ⭐ (YouTube 구독 목록 조회)
3. **업데이트** → **저장 후 계속**

### 1-5. 테스트 사용자 추가

1. **테스트 사용자 추가** 클릭
2. 본인의 Google 계정 이메일 추가
3. **저장 후 계속**

### 1-6. OAuth 2.0 클라이언트 ID 만들기

1. 왼쪽 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `YouTube Analyzer Web Client`
5. **승인된 JavaScript 원본**:
   ```
   http://localhost:3000
   ```
6. **승인된 리디렉션 URI**:
   ```
   http://localhost:3000/auth/callback
   ```
7. **만들기** 클릭
8. ⭐ **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사해두기!

## 🔑 2. 환경변수 설정

`.env.local` 파일에 다음 추가:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# OAuth Redirect URL
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## ✅ 3. 설정 확인

- [x] YouTube Data API v3 활성화
- [x] OAuth 동의 화면 구성
- [x] YouTube readonly 스코프 추가
- [x] 테스트 사용자 추가
- [x] OAuth 클라이언트 ID 생성
- [x] 환경변수 설정

## 🚀 4. 운영 배포 시 추가 설정

### 4-1. 승인된 도메인 추가

운영 환경 URL을 추가:
```
https://yourdomain.com
https://yourdomain.com/auth/callback
```

### 4-2. OAuth 앱 검증

Google의 OAuth 앱 검증을 받아야 합니다:
1. OAuth 동의 화면 → **앱 게시**
2. 검증 요청 제출 (2-4주 소요)

## 📚 참고 자료

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

---

설정 완료 후 코드 구현을 진행하세요!
