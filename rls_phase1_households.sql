-- =====================================================
-- machi-connect RLS フェーズ1
-- security definer関数の作成 + householdsテーブルのRLS
-- Supabase SQL Editorで実行してください
-- =====================================================

-- ① is_super_admin(): 現在のユーザーがsuper_adminかどうかを返す
--    SECURITY DEFINERでprofilesテーブルのRLSをバイパスして参照することで、
--    「profilesのRLSがprofilesを参照する」再帰を避ける
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ② current_org_id(): 現在のユーザーのorg_idを返す
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- authenticatedロールに実行権限を付与
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION current_org_id() TO authenticated;

-- ③ householdsテーブルのRLSを有効化（これまで未設定だった）
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- ④ 既存ポリシーを削除（再実行対応）
DROP POLICY IF EXISTS "households_select" ON households;
DROP POLICY IF EXISTS "households_insert" ON households;
DROP POLICY IF EXISTS "households_update" ON households;
DROP POLICY IF EXISTS "households_delete" ON households;

-- ⑤ 読み取り：同一組織 or super_admin
CREATE POLICY "households_select" ON households
  FOR SELECT TO authenticated
  USING (
    is_super_admin() OR org_id = current_org_id()
  );

-- ⑥ 追加：同一組織 or super_admin
CREATE POLICY "households_insert" ON households
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin() OR org_id = current_org_id()
  );

-- ⑦ 更新：同一組織 or super_admin（org_idの書き換えで他組織に移動させることも禁止）
CREATE POLICY "households_update" ON households
  FOR UPDATE TO authenticated
  USING (
    is_super_admin() OR org_id = current_org_id()
  )
  WITH CHECK (
    is_super_admin() OR org_id = current_org_id()
  );

-- ⑧ 削除：同一組織 or super_admin
CREATE POLICY "households_delete" ON households
  FOR DELETE TO authenticated
  USING (
    is_super_admin() OR org_id = current_org_id()
  );

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('is_super_admin', 'current_org_id');
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'households';
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'households';
