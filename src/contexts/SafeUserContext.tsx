'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
}

interface UserContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function SafeUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // 检查当前会话
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session && !error) {
          // 获取用户详细信息
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .single()

            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: profile?.name || null
              })
            }
          } catch (profileError) {
            console.warn('Profile fetch error:', profileError)
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: null
              })
            }
          }
        }
      } catch (error) {
        console.warn('Session check error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        try {
          if (session) {
            // 获取用户详细信息
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .single()

            // 如果profiles表中没有记录，且用户已确认邮箱，则创建记录
            if (profileError && profileError.code === 'PGRST116' && session.user.email_confirmed_at) {
              try {
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .insert([
                    { 
                      id: session.user.id, 
                      email: session.user.email!,
                      name: session.user.user_metadata?.name || null
                    }
                  ])
                  .select('name')
                  .single()

                if (mounted) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: newProfile?.name || session.user.user_metadata?.name || null
                  })
                }
              } catch (insertError) {
                console.warn('Profile insert error:', insertError)
                if (mounted) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.name || null
                  })
                }
              }
            } else if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: profile?.name || null
              })
            }
          } else if (mounted) {
            setUser(null)
          }
        } catch (error) {
          console.warn('Auth state change error:', error)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: name
          }
        }
      })
      
      if (!error && data.user) {
        // 立即插入用户信息到 profiles 表
        try {
          await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                email: data.user.email!,
                name: name
              }
            ])
        } catch (profileError) {
          console.warn('Profile creation error:', profileError)
        }
      }
      
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.warn('Sign out error:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a SafeUserProvider')
  }
  return context
}