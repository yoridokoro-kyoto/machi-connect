-- =====================================================
-- machi-connect RLS フェーズ3
-- notices の UPDATE/DELETE/INSERT と circular_confirmations の SELECT に
-- 組織スコープ（org一致）条件を追加する
-- フェーズ1で作成済みの is_super_admin() / current_org_id() を再利用
-- Supabase SQL Editorで実行してください
--
-- 変更しないもの（参考）：
--   notices_select（既にorganization_id一致 or NULL条件あり）
--   confirmations_insert / confirmations_update（user_id = auth.uid()、自分の
--   レコードのみのため組織を問わず安全）
-- =====================================================

-- ① notices_update
--    条件は「admin/super_adminロールであること」と「同一組織であること」の
--    2つを分けて記述（意味は変えず、可読性のためAND条件として並べている）
DROP POLICY IF EXISTS "notices_update" ON notices;
CREATE POLICY "notices_update" ON notices
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR (
      -- 条件1：admin または super_admin ロールであること
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      )
      -- 条件2：対象noticeが自分の所属組織のものであること
      AND organization_id = current_org_id()
    )
  );

-- ② notices_delete（notices_updateと同じ条件）
DROP POLICY IF EXISTS "notices_delete" ON notices;
CREATE POLICY "notices_delete" ON notices
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR (
      -- 条件1：admin または super_admin ロールであること
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      )
      -- 条件2：対象noticeが自分の所属組織のものであること
      AND organization_id = current_org_id()
    )
  );

-- ③ notices_insert
--    従来通りofficerも投稿可能。挿入するorganization_idが自分の所属組織と
--    一致することを追加で要求する
DROP POLICY IF EXISTS "notices_insert" ON notices;
CREATE POLICY "notices_insert" ON notices
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR (
      -- 条件1：admin / officer / super_admin ロールであること
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'officer', 'super_admin')
      )
      -- 条件2：挿入するorganization_idが自分の所属組織と一致すること
      AND organization_id = current_org_id()
    )
  );

-- ④ confirmations_select（案B：notices経由のサブクエリ、org_id列は追加しない）
DROP POLICY IF EXISTS "confirmations_select" ON circular_confirmations;
CREATE POLICY "confirmations_select" ON circular_confirmations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_super_admin()
    OR EXISTS (
      SELECT 1 FROM notices n
      WHERE n.id = circular_confirmations.notice_id
        -- 条件1：閲覧者が admin または super_admin ロールであること
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
        -- 条件2：対象noticeが自分の所属組織のものであること
        AND n.organization_id = current_org_id()
    )
  );

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT policyname, cmd, qual, with_check FROM pg_policies
--   WHERE tablename = 'notices' ORDER BY cmd, policyname;
-- SELECT policyname, cmd, qual, with_check FROM pg_policies
--   WHERE tablename = 'circular_confirmations' ORDER BY cmd, policyname;
