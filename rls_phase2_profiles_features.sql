-- =====================================================
-- machi-connect RLS フェーズ2
-- profiles / organization_features のSELECTポリシーを組織単位に絞る
-- フェーズ1で作成済みの is_super_admin() / current_org_id() を再利用
-- Supabase SQL Editorで実行してください
-- =====================================================

-- ① profiles: 自分自身の行 or 自組織 or super_admin のみ閲覧可能
--    「id = auth.uid()」を明示的に含めているのは、org_idが未設定(NULL)の
--    ユーザーが自分のプロフィールすら見えなくなる事態を防ぐため。
--    SQLでは NULL = NULL は真にならないため、org_id同士の比較だけに頼ると
--    org_id未設定ユーザーは自分の行も含めて閲覧不可になってしまう。
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_super_admin()
    OR org_id = current_org_id()
  );

-- profiles_update（id = auth.uid()、自分のみ更新可）は変更しない

-- ② organization_features: 自組織 or super_admin のみ閲覧可能
DROP POLICY IF EXISTS "features_select" ON organization_features;

CREATE POLICY "features_select" ON organization_features
  FOR SELECT TO authenticated
  USING (
    is_super_admin() OR org_id = current_org_id()
  );

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'organization_features';
