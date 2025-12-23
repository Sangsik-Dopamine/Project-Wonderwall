-- ============================================================================
-- YouTube 구독 분석 서비스 - Users 테이블 생성 스크립트
-- ============================================================================
-- 이 스크립트는 Supabase SQL Editor에 한 번에 붙여넣어 실행하세요.
-- ============================================================================

-- 1. pgcrypto 확장 활성화 (암호화 기능)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- 2. users 테이블 생성
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 정보
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,

  -- YouTube API 토큰 (암호화된 바이너리 데이터)
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,

  -- JSON 데이터
  raw_data JSONB DEFAULT '{}'::jsonb,
  analysis_result JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- 3. updated_at 자동 업데이트 트리거
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 4. 암호화 키 설정
-- ----------------------------------------------------------------------------
-- 주의: Supabase에서는 함수 내에 키를 포함시킵니다
-- 암호화 키: snioizx72mCUCJYclw1eYgRe7vsmfzxSZ4nscfysUlY=
-- 운영 환경에서는 Supabase Vault 사용을 권장합니다


-- 5. 토큰 암호화 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encrypt_token(token TEXT)
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT := 'snioizx72mCUCJYclw1eYgRe7vsmfzxSZ4nscfysUlY=';
BEGIN
  IF token IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. 토큰 복호화 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token BYTEA)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := 'snioizx72mCUCJYclw1eYgRe7vsmfzxSZ4nscfysUlY=';
BEGIN
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. 토큰 저장 RPC 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_encrypted_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    access_token_encrypted = encrypt_token(p_access_token),
    refresh_token_encrypted = encrypt_token(p_refresh_token),
    updated_at = NOW()
  WHERE id = p_user_id
    AND auth.uid()::text = p_user_id::text; -- 본인만 수정 가능

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or access denied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. 복호화된 토큰 조회 뷰
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.users_with_tokens AS
SELECT
  id,
  email,
  google_id,
  handle,
  decrypt_token(access_token_encrypted) AS access_token,
  decrypt_token(refresh_token_encrypted) AS refresh_token,
  raw_data,
  analysis_result,
  created_at,
  updated_at
FROM public.users
WHERE auth.uid()::text = id::text; -- 본인 데이터만 조회 가능


-- 9. 인덱스 생성 (성능 최적화)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_handle ON public.users(handle);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);


-- 10. RLS (Row Level Security) 활성화
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 오류 방지)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;


-- 11. RLS 정책 생성
-- ----------------------------------------------------------------------------
-- 조회: 본인 데이터만
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- 수정: 본인 데이터만
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- 삽입: 본인 데이터만
CREATE POLICY "Users can insert their own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- 삭제: 본인 데이터만
CREATE POLICY "Users can delete their own data"
  ON public.users
  FOR DELETE
  USING (auth.uid()::text = id::text);


-- 12. 테이블 및 컬럼 설명 (문서화)
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.users IS 'YouTube 구독 분석 서비스 사용자 정보';
COMMENT ON COLUMN public.users.id IS '사용자 고유 식별자 (UUID)';
COMMENT ON COLUMN public.users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN public.users.google_id IS '구글 OAuth 고유 식별자';
COMMENT ON COLUMN public.users.handle IS '사용자 고유 페이지 주소 (예: @userid)';
COMMENT ON COLUMN public.users.access_token_encrypted IS 'YouTube Data API 접근 토큰 (AES-256 암호화됨)';
COMMENT ON COLUMN public.users.refresh_token_encrypted IS 'YouTube Data API 갱신 토큰 (AES-256 암호화됨)';
COMMENT ON COLUMN public.users.raw_data IS 'YouTube 구독 리스트 원본 데이터 (JSONB)';
COMMENT ON COLUMN public.users.analysis_result IS 'AI 분석 결과 데이터 (JSONB)';
COMMENT ON COLUMN public.users.created_at IS '계정 생성 시각';
COMMENT ON COLUMN public.users.updated_at IS '마지막 업데이트 시각 (자동 갱신)';


-- 13. admin_settings 테이블 생성 (관리자 설정 저장용)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 설정 타입 (keywords 또는 wonderwall)
  setting_type TEXT UNIQUE NOT NULL CHECK (setting_type IN ('keywords', 'wonderwall')),

  -- LLM 모델 설정
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5',

  -- API 키 (암호화된 바이너리 데이터)
  api_key_encrypted BYTEA,

  -- 프롬프트 설정
  system_prompt TEXT,
  user_prompt_template TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- 14. admin_settings updated_at 트리거
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_admin_settings ON public.admin_settings;
CREATE TRIGGER set_updated_at_admin_settings
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 15. API 키 암호화 함수 (admin용)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key TEXT)
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT := 'snioizx72mCUCJYclw1eYgRe7vsmfzxSZ4nscfysUlY=';
BEGIN
  IF api_key IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_encrypt(api_key, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 16. API 키 복호화 함수 (admin용)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_api_key BYTEA)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := 'snioizx72mCUCJYclw1eYgRe7vsmfzxSZ4nscfysUlY=';
BEGIN
  IF encrypted_api_key IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(encrypted_api_key, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 17. 관리자 설정 저장 RPC 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_admin_settings(
  p_setting_type TEXT,
  p_model TEXT,
  p_api_key TEXT,
  p_system_prompt TEXT,
  p_user_prompt_template TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_settings (
    setting_type,
    model,
    api_key_encrypted,
    system_prompt,
    user_prompt_template
  ) VALUES (
    p_setting_type,
    p_model,
    encrypt_api_key(p_api_key),
    p_system_prompt,
    p_user_prompt_template
  )
  ON CONFLICT (setting_type)
  DO UPDATE SET
    model = EXCLUDED.model,
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    system_prompt = EXCLUDED.system_prompt,
    user_prompt_template = EXCLUDED.user_prompt_template,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 18. 관리자 설정 조회 RPC 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_settings(p_setting_type TEXT)
RETURNS TABLE (
  setting_type TEXT,
  model TEXT,
  api_key TEXT,
  system_prompt TEXT,
  user_prompt_template TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.setting_type,
    s.model,
    decrypt_api_key(s.api_key_encrypted) AS api_key,
    s.system_prompt,
    s.user_prompt_template
  FROM public.admin_settings s
  WHERE s.setting_type = p_setting_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 19. 테이블 설명 (문서화)
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.admin_settings IS '관리자 페이지 설정 저장소 (키워드 추출 및 Wonderwall 설정)';
COMMENT ON COLUMN public.admin_settings.setting_type IS '설정 타입 (keywords 또는 wonderwall)';
COMMENT ON COLUMN public.admin_settings.model IS 'LLM 모델명 (예: claude-sonnet-4-5, gpt-4o)';
COMMENT ON COLUMN public.admin_settings.api_key_encrypted IS 'LLM API 키 (AES-256 암호화됨)';
COMMENT ON COLUMN public.admin_settings.system_prompt IS 'System prompt 텍스트';
COMMENT ON COLUMN public.admin_settings.user_prompt_template IS 'User prompt 템플릿 ({channelTitles} 또는 {keywords} 변수 포함)';


-- ============================================================================
-- 완료!
-- ============================================================================
-- 다음 단계:
-- 1. 위 SQL을 Supabase SQL Editor에 붙여넣고 실행
-- 2. 4번의 암호화 키를 강력한 키로 변경 (필수!)
-- 3. 테이블 생성 확인: Supabase Dashboard > Table Editor > users, admin_settings
-- ============================================================================
