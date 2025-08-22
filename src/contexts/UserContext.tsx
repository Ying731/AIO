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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 检查当前会话
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        // 获取用户详细信息
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name || null
        })
      }
      
      setLoading(false)
    }

    checkSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // 获取用户详细信息
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single()

          // 如果profiles表中没有记录，且用户已确认邮箱，则创建记录
          if (profileError && profileError.code === 'PGRST116' && session.user.email_confirmed_at) {
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

            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: newProfile?.name || session.user.user_metadata?.name || null
            })
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: profile?.name || null
            })
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            email: data.user.email!,
            name: name
          }
        ])
      
      if (profileError) {
        console.error('Error inserting profile:', profileError)
        return { error: profileError }
      }
    }
    
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}