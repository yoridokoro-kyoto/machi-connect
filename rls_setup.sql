-- =====================================================
-- machi-connect RLS有効化SQL
-- Supabase SQL Editorで実行してください
-- =====================================================

-- ① organization_featuresテーブルを新規作成
CREATE TABLE IF NOT EXISTS organization_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, feature_key)
);

-- ② profilesテーブルにorg_idとroleカラムを確認・追加
-- ※既に存在する場合はスキップされます
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- ③ RLSを有効化
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE circular_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;

-- ④ 既存のポリシーを削除（再作成のため）
DROP POLICY IF EXISTS "notices_select" ON notices;
DROP POLICY IF EXISTS "notices_insert" ON notices;
DROP POLICY IF EXISTS "notices_update" ON notices;
DROP POLICY IF EXISTS "notices_delete" ON notices;
DROP POLICY IF EXISTS "confirmations_select" ON circular_confirmations;
DROP POLICY IF EXISTS "confirmations_insert" ON circular_confirmations;
DROP POLICY IF EXISTS "confirmations_update" ON circular_confirmations;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "features_select" ON organization_features;

-- ⑤ noticesのRLSポリシー
-- 読み取り：ログイン済みユーザー全員（organization_id NULLはデモ用として全員に表示）
CREATE POLICY "notices_select" ON notices
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 投稿：admin・officer・super_adminのみ
CREATE POLICY "notices_insert" ON notices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'officer', 'super_admin')
    )
  );

-- 更新：adminとsuper_adminのみ
CREATE POLICY "notices_update" ON notices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 削除：adminとsuper_adminのみ
CREATE POLICY "notices_delete" ON notices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ⑥ circular_confirmationsのRLSポリシー
-- 読み取り：自分の確認記録のみ（adminは全件）
CREATE POLICY "confirmations_select" ON circular_confirmations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 書き込み：自分のレコードのみ
CREATE POLICY "confirmations_insert" ON circular_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 更新：自分のレコードのみ
CREATE POLICY "confirmations_update" ON circular_confirmations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ⑦ profilesのRLSポリシー
-- 読み取り：全ログインユーザー（名前表示のため）
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- 更新：自分のプロフィールのみ
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ⑧ organization_featuresのRLSポリシー
-- 読み取り：全ログインユーザー
CREATE POLICY "features_select" ON organization_features
  FOR SELECT TO authenticated
  USING (true);

-- ⑨ 既存のadminユーザーのroleを確認・設定
-- ※admin@test.comのユーザーIDを確認して設定してください
-- UPDATE profiles SET role = 'admin' WHERE id = '（ユーザーID）';

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT policyname, tablename, cmd FROM pg_policies WHERE schemaname = 'public';
