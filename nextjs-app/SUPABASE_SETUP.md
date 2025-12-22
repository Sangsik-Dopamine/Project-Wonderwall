# Supabase 데이터베이스 설정 가이드

## 📋 개요

이 가이드는 YouTube 구독 분석 서비스를 위한 Supabase 데이터베이스를 설정하는 방법을 안내합니다.

## 🔐 보안 주의사항

**⚠️ 중요**: SQL 실행 전에 반드시 암호화 키를 변경하세요!

## 📝 설정 단계

### 1. 강력한 암호화 키 생성

터미널에서 다음 명령어를 실행하여 안전한 키를 생성하세요:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

또는

```bash
openssl rand -base64 32
```

생성된 키를 복사해두세요. 예시:
```
3xK9mP2vL8nQ5rT7wY1zA4bC6dE8fG0hI2jK4lM6nO8=
```

### 2. SQL 파일 수정

`supabase-setup.sql` 파일을 열어서 **39번째 줄**을 찾으세요:

```sql
ALTER DATABASE postgres
  SET app.settings.encryption_key TO 'your-super-secret-encryption-key-change-this-in-production-min-32-chars';
```

`'your-super-secret-encryption-key-change-this-in-production-min-32-chars'` 부분을
**1단계에서 생성한 키**로 변경하세요:

```sql
ALTER DATABASE postgres
  SET app.settings.encryption_key TO '3xK9mP2vL8nQ5rT7wY1zA4bC6dE8fG0hI2jK4lM6nO8=';
```

### 3. 로컬 환경변수 업데이트

`.env.local` 파일을 열어서 같은 키로 업데이트하세요:

```env
SUPABASE_ENCRYPTION_KEY=3xK9mP2vL8nQ5rT7wY1zA4bC6dE8fG0hI2jK4lM6nO8=
```

### 4. Supabase에서 SQL 실행

1. **Supabase Dashboard** 접속 (https://app.supabase.com)
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. `supabase-setup.sql` 파일의 **전체 내용**을 복사해서 붙여넣기
6. **Run** 버튼 클릭 (또는 Cmd/Ctrl + Enter)

### 5. 설정 확인

SQL 실행 후 다음을 확인하세요:

1. **Table Editor** 메뉴로 이동
2. `users` 테이블이 생성되었는지 확인
3. 테이블 구조:
   - ✅ id (uuid)
   - ✅ email (text)
   - ✅ google_id (text)
   - ✅ handle (text)
   - ✅ access_token_encrypted (bytea)
   - ✅ refresh_token_encrypted (bytea)
   - ✅ raw_data (jsonb)
   - ✅ analysis_result (jsonb)
   - ✅ created_at (timestamptz)
   - ✅ updated_at (timestamptz)

## 📊 데이터베이스 스키마

### users 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY | 사용자 고유 식별자 |
| email | TEXT | UNIQUE, NOT NULL | 사용자 이메일 |
| google_id | TEXT | UNIQUE, NOT NULL | 구글 OAuth ID |
| handle | TEXT | UNIQUE, NOT NULL | 고유 페이지 주소 (@userid) |
| access_token_encrypted | BYTEA | - | YouTube API 접근 토큰 (암호화) |
| refresh_token_encrypted | BYTEA | - | YouTube API 갱신 토큰 (암호화) |
| raw_data | JSONB | - | YouTube 구독 리스트 |
| analysis_result | JSONB | - | AI 분석 결과 |
| created_at | TIMESTAMPTZ | NOT NULL | 계정 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | 마지막 업데이트 시각 |

## 🔧 제공되는 함수

### 1. encrypt_token(token TEXT)
- 토큰을 AES-256으로 암호화
- 반환: BYTEA

### 2. decrypt_token(encrypted_token BYTEA)
- 암호화된 토큰을 복호화
- 반환: TEXT

### 3. save_encrypted_tokens(p_user_id UUID, p_access_token TEXT, p_refresh_token TEXT)
- 사용자의 YouTube API 토큰을 암호화하여 저장
- RLS 적용: 본인만 수정 가능

### 4. users_with_tokens (뷰)
- 암호화된 토큰을 자동으로 복호화하여 조회
- RLS 적용: 본인 데이터만 조회 가능

## 🛡️ 보안 기능

### Row Level Security (RLS)
- ✅ 활성화됨
- ✅ 사용자는 본인의 데이터만 조회/수정/삭제 가능
- ✅ 다른 사용자의 데이터 접근 불가

### 암호화
- ✅ AES-256 암호화 (pgcrypto)
- ✅ access_token, refresh_token 암호화 저장
- ✅ 암호화 키는 데이터베이스 설정에 저장

## 🧪 테스트

SQL 실행 후 다음 쿼리로 테스트해보세요:

```sql
-- 1. 테이블 확인
SELECT * FROM public.users LIMIT 1;

-- 2. 함수 테스트
SELECT encrypt_token('test-token');
SELECT decrypt_token(encrypt_token('test-token'));

-- 3. 뷰 확인
SELECT * FROM public.users_with_tokens LIMIT 1;
```

## ❓ 문제 해결

### "extension pgcrypto does not exist" 오류
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
를 먼저 실행하세요.

### "permission denied" 오류
Supabase 프로젝트의 owner 권한이 있는지 확인하세요.

### 암호화 키 변경하기
```sql
ALTER DATABASE postgres
  SET app.settings.encryption_key TO '새로운-키';
```

⚠️ 주의: 키 변경 시 기존 암호화된 데이터는 복호화할 수 없습니다!

## 📚 다음 단계

데이터베이스 설정이 완료되었다면:
1. ✅ Google OAuth 설정
2. ✅ 로그인 페이지 구현
3. ✅ YouTube Data API 연동
4. ✅ 사용자 데이터 관리

---

**작성일**: 2024-12-23
**버전**: 1.0.0
