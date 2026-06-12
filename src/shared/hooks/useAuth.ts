'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import type { Profile } from '@/shared/types'

type UseAuthReturn = {
  userId: string | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isOfficerOrAbove: boolean
}

/**
 * 認証チェックとプロフィール取得を行う共通フック
 * 未ログインの場合は /login へリダイレクト
 * requireAdmin: true の場合、admin未満は /dashboard へリダイレクト
 */
export function useAuth(requireAdmin = false): UseAuthReturn {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
        if (requireAdmin && data.role !== 'admin' && data.role !== 'super_admin') {
          router.push('/dashboard')
          return
        }
      }

      setLoading(false)
    }
    check()
  }, [])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isOfficerOrAbove = isAdmin || profile?.role === 'officer'

  return { userId, profile, loading, isAdmin, isOfficerOrAbove }
}
