-- =====================================================
-- machi-connect RLS フェーズ2: profilesの重複ポリシー削除
-- 対象：Supabase Studio等で手動作成されたと思われる古いポリシー2件。
--       PostgreSQLのRLSは同一テーブル・同一コマンドの複数ポリシーをOR結合するため、
--       「プロフィールを全員が読める」(USING (true)) が残っている限り、
--       rls_phase2_profiles_features.sqlで設定した組織スコープ制限
--       （profiles_select）は実質的に無効化されてしまう。
--
-- 実行前に rls_audit_all_policies.sql の結果でポリシー名の完全一致を確認してください。
-- Supabase SQL Editorで実行してください
-- =====================================================

DROP POLICY IF EXISTS "プロフィールを全員が読める" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールを読める" ON profiles;

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
-- ↑ profiles_select と profiles_update の2件のみになっているはずです
