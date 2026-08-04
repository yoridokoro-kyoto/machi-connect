-- =====================================================
-- machi-connect Web Push フェーズ3: push_subscriptionsテーブル
-- ブラウザのプッシュ購読情報を保存するテーブル。1ユーザーが複数端末を
-- 持ちうるため複数レコード前提。
--
-- アクセス方針：本人のみ読み書き削除、super_adminのみ全件アクセス可。
-- admin/officer等、他の役職への閲覧権限は付与しない
--   - 通知送信はサーバー側でSERVICE_ROLE_KEYを使うためRLSを経由せず、
--     admin向けのSELECT権限は不要
--   - endpoint/p256dh/auth_keyはユーザーのブラウザを特定・偽装しうる
--     機微な値のため、必要のない相手には見せない
-- Supabase SQL Editorで実行してください
-- =====================================================

-- ① テーブル作成
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ② RLSを有効化
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ③ 既存ポリシーを削除（再実行対応）
DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;

-- ④ 読み取り：本人の購読 or super_adminのみ
CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_super_admin()
  );

-- ⑤ 追加：本人のみ。org_idは自分の所属組織と一致必須
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id = current_org_id()
  );

-- ⑥ 更新：本人のみ（例：期限切れ購読の鍵をローテーションする場合）
CREATE POLICY "push_subscriptions_update" ON push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ⑦ 削除：本人のみ（購読解除）
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 実行後の確認クエリ
-- =====================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'push_subscriptions';
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'push_subscriptions' ORDER BY cmd;
