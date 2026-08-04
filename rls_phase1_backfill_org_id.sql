-- =====================================================
-- machi-connect RLS フェーズ1: 既存データのorg_idバックフィル
-- 対象：households.org_id / notices.organization_id が NULL のレコードを
--       「デモ町内会」(aebd8f96-825c-42e3-aa16-45ebc36077b7) に紐付ける
-- Supabase SQL Editorで実行してください
-- =====================================================

-- ① households: org_idがNULLのレコードをデモ町内会に紐付け
UPDATE households
SET org_id = 'aebd8f96-825c-42e3-aa16-45ebc36077b7'
WHERE org_id IS NULL;

-- ② notices: organization_idがNULLのレコードをデモ町内会に紐付け
UPDATE notices
SET organization_id = 'aebd8f96-825c-42e3-aa16-45ebc36077b7'
WHERE organization_id IS NULL;

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT count(*) AS households_null_org FROM households WHERE org_id IS NULL;
-- SELECT count(*) AS notices_null_org FROM notices WHERE organization_id IS NULL;
