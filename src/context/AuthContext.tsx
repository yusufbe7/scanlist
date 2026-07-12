import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSyncConfigured } from '../lib/supabaseClient'
import type { AppProfile } from '../types'

function mapProfile(row: Record<string, unknown>): AppProfile {
  return {
    id: row.id as string,
    fullName: (row.full_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    role: (row.role as 'user' | 'admin') ?? 'user',
    credits: Number(row.credits ?? 0),
    freeScansUsed: Number(row.free_scans_used ?? 0)
  }
}

interface AuthContextValue {
  user: User | null
  profile: AppProfile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)

  const subscribeProfile = useCallback((userId: string) => {
    if (!supabase) return
    channelRef.current?.unsubscribe()

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(mapProfile(data))
        setLoading(false)
      })

    channelRef.current = supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, payload => {
        if (payload.new) setProfile(mapProfile(payload.new as Record<string, unknown>))
      })
      .subscribe()
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        subscribeProfile(sessionUser.id)
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        setLoading(true)
        subscribeProfile(sessionUser.id)
      } else {
        setProfile(null)
        channelRef.current?.unsubscribe()
        setLoading(false)
      }
    })

    return () => {
      sub.subscription.unsubscribe()
      channelRef.current?.unsubscribe()
    }
  }, [subscribeProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Supabase sozlanmagan'
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone: string) => {
    if (!supabase) return 'Supabase sozlanmagan'
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName, phone } }
    })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}

export { isSyncConfigured }
