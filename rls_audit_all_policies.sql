-- =====================================================
-- machi-connect RLSポリシー全体監査
-- 目的：重複ポリシー（同一テーブル・同一コマンドに複数ポリシーが存在し
--       OR結合されてしまっている箇所）を洗い出す
-- Supabase SQL Editorで実行し、結果を共有してください
-- =====================================================

-- ① 全ポリシー一覧（テーブル・コマンド順）
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ② 「同一テーブル・同一コマンドに複数ポリシー」＝OR結合で危険な箇所だけを抽出
SELECT tablename, cmd, count(*) AS policy_count, array_agg(policyname) AS policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING count(*) > 1
ORDER BY tablename, cmd;

-- ③ 参考：各テーブルのRLS有効化状況
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
