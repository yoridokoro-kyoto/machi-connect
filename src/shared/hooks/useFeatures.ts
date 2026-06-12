'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { FeatureKey } from '@/shared/types'

/**
 * 町内会の有効機能一覧を取得するフック
 * orgId が null の場合は全機能有効として扱う（デモ・開発用）
 */
export function useFeatures(orgId: string | null) {
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureKey>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) {
      // org未設定時は全機能有効（デモ用）
      setEnabledFeatures(new Set([
        'notices', 'safety', 'survey', 'messaging', 'events', 'line_notify', 'emergency'
      ]))
      setLoading(false)
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('organization_features')
        .select('feature_key, enabled')
        .eq('org_id', orgId)
        .eq('enabled', true)

      const keys = (data || []).map((f: { feature_key: FeatureKey }) => f.feature_key)
      setEnabledFeatures(new Set(keys))
      setLoading(false)
    }
    fetch()
  }, [orgId])

  const hasFeature = (key: FeatureKey) => enabledFeatures.has(key)

  return { enabledFeatures, hasFeature, loading }
}
