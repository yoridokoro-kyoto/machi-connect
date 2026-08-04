-- =====================================================
-- machi-connect RLS フェーズ1: デモ町内会の機能フラグ初期化
-- 対象：デモ町内会 (aebd8f96-825c-42e3-aa16-45ebc36077b7)
-- 実装済み機能（notices, households）のみ有効化する
-- 未実装機能（safety, survey, messaging, events等）のページは
-- まだ存在しないため、意図的に含めていません
-- Supabase SQL Editorで実行してください
-- =====================================================

INSERT INTO organization_features (org_id, feature_key, enabled)
VALUES
  ('aebd8f96-825c-42e3-aa16-45ebc36077b7', 'notices', true),
  ('aebd8f96-825c-42e3-aa16-45ebc36077b7', 'households', true)
ON CONFLICT (org_id, feature_key) DO UPDATE SET enabled = true;

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT * FROM organization_features WHERE org_id = 'aebd8f96-825c-42e3-aa16-45ebc36077b7';
