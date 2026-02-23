-- Diary App 테이블 설정
-- 기존 Wonderwall 프로젝트의 users 테이블을 공유합니다.
-- 이 SQL은 diary_entries 테이블만 추가로 생성합니다.

-- diary_entries 테이블 생성
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 한 사용자당 하루에 하나의 엔트리만 허용
  UNIQUE(user_id, entry_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, entry_date);

-- RLS 활성화
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS 정책: Service Role Key를 통한 접근만 허용 (API 라우트에서 admin client 사용)
CREATE POLICY "Service role access" ON diary_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
