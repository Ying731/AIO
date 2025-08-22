'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Target, MessageCircle, Plus, Send, User, LogOut } from 'lucide-react'
import { useUser } from '@/contexts/SafeUserContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface OKR {
  id: string
  objective: string
  key_results: string[]
  user_id: string
  created_at: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function DashboardPage() {
  const { user, loading: userLoading, signOut } = useUser()
  const router = useRouter()

  const [okr, setOkr] = useState<OKR | null>(null)
  const [showOkrForm, setShowOkrForm] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [okrLoading, setOkrLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  // Fetch OKR
  const fetchOkr = useCallback(async () => {
    if (!user) return
    setOkrLoading(true)
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching OKR:', error)
    } else if (data) {
      setOkr(data)
    } else {
      setOkr(null)
    }
    setOkrLoading(false)
  }, [user])

  // Fetch Chat History
  const fetchChatHistory = useCallback(async () => {
    if (!user) return
    setChatLoading(true)
    const { data, error } = await supabase
      .from('chat_history')
      .select('id, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
    } else if (data) {
      const formattedMessages: ChatMessage[] = data.map(item => ({
        id: item.id.toString(),
        role: item.message.role,
        content: item.message.content,
        created_at: item.created_at
      }))
      setChatMessages(formattedMessages)
    }
    setChatLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchOkr()
      fetchChatHistory()
    }
  }, [user, fetchOkr, fetchChatHistory])

  const handleCreateOrUpdateOkr = async (objective: string, keyResults: string[]) => {
    if (!user) return

    try {
      const newOkrData = {
        objective,
        key_results: keyResults,
        user_id: user.id,
      }

      let result
      if (okr) {
        // Update existing OKR
        result = await supabase
          .from('okrs')
          .update(newOkrData)
          .eq('id', okr.id)
          .select()
          .single()
      } else {
        // Create new OKR
        result = await supabase
          .from('okrs')
          .insert([newOkrData])
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      console.log('OKR saved successfully:', result.data)
      
      // Re-fetch to get the latest data
      await fetchOkr()
      setShowOkrForm(false)
      
      // Add a system message to chat history
      const systemMessageContent = `你已成功${okr ? '更新' : '创建'}了新的学习目标！\n\n目标：${objective}\n\n关键结果：\n${keyResults.map((kr, i) => `${i+1}. ${kr}`).join('\n')}\n\n你可以问我"今天要做什么"，我会根据你的目标推荐任务。`
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: systemMessageContent,
        created_at: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, systemMessage])
      
      // Save system message to DB
      await supabase.from('chat_history').insert([{ 
        user_id: user.id, 
        message: { role: 'assistant', content: systemMessageContent } 
      }])
      
    } catch (error: any) {
      console.error('Error saving OKR:', error)
      alert('保存OKR失败，请重试。错误信息：' + (error?.message || '未知错误'))
      throw error // Re-throw to be caught by the form's error handler
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user) return

    const userMessageContent = currentMessage
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, newUserMessage])
    setCurrentMessage('')
    setIsLoadingAI(true)
    console.log('User message sent:', userMessageContent)

    // Save user message to DB
    console.log('Saving user message to DB...')
    await supabase.from('chat_history').insert([{ user_id: user.id, message: { role: 'user', content: userMessageContent } }])
    console.log('User message saved to DB.')

    try {
      console.log('Sending request to /api/chat...')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageContent,
          okr: okr ? { objective: okr.objective, keyResults: okr.key_results } : null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
      }

      const data = await response.json()
      console.log('Received response from /api/chat:', data)
      const aiResponseContent = data.response || '抱歉，我暂时无法回答这个问题。'

      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseContent,
        created_at: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, newAiMessage])
      // Save AI message to DB
      console.log('Saving AI message to DB...')
      await supabase.from('chat_history').insert([{ user_id: user.id, message: { role: 'assistant', content: aiResponseContent } }])
      console.log('AI message saved to DB.')

    } catch (error: any) {
      console.error('Error sending message to AI:', error)
      const errorMessageContent = `抱歉，AI助手出现问题，请稍后再试。错误详情：${error.message || '未知错误'}`
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessageContent,
        created_at: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, errorMessage])
      await supabase.from('chat_history').insert([{ user_id: user.id, message: { role: 'assistant', content: errorMessageContent } }])
    } finally {
      setIsLoadingAI(false)
      console.log('AI loading state set to false.')
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (userLoading || okrLoading || chatLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-lg text-gray-700">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">启明星</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-1" />
                  {user.name || user.email}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - OKR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  我的学习目标
                </h2>
                <button
                  onClick={() => setShowOkrForm(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              {okr ? (
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">目标 (Objective)</h3>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded whitespace-pre-wrap">{okr.objective}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">关键结果 (Key Results)</h3>
                    <ul className="space-y-2">
                      {okr.key_results.map((kr, index) => (
                        <li key={index} className="text-gray-700 bg-gray-50 p-2 rounded flex items-start">
                          <span className="text-blue-600 mr-2">{index + 1}.</span>
                          {kr}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">还没有设置学习目标</p>
                  <button
                    onClick={() => setShowOkrForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    创建目标
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                  AI学习助手
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoadingAI && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <p>正在思考中...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入你的问题..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoadingAI}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OKR Form Modal */}
      {showOkrForm && (
        <OkrFormModal
          existingOkr={okr}
          onSave={handleCreateOrUpdateOkr}
          onClose={() => setShowOkrForm(false)}
        />
      )}
    </div>
  )
}

// OKR Form Modal Component
function OkrFormModal({ 
  existingOkr, 
  onSave, 
  onClose 
}: { 
  existingOkr: OKR | null
  onSave: (objective: string, keyResults: string[]) => Promise<void>
  onClose: () => void 
}) {
  const [objective, setObjective] = useState(existingOkr?.objective || '')
  const [keyResults, setKeyResults] = useState(existingOkr?.key_results || ['', '', ''])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filteredKRs = keyResults.filter(kr => kr.trim() !== '')
    if (objective.trim() && filteredKRs.length > 0) {
      setIsSaving(true)
      try {
        await onSave(objective.trim(), filteredKRs)
        // 如果成功，onSave会关闭表单，所以这里不需要设置setIsSaving(false)
      } catch (err: any) {
        console.error('保存OKR时发生异常:', err)
        alert('保存失败：' + (err?.message || '未知错误'))
        setIsSaving(false) // 只在失败时重置状态
      }
    } else {
      alert('目标和至少一个关键结果不能为空。')
    }
  }

  const updateKeyResult = (index: number, value: string) => {
    const newKRs = [...keyResults]
    newKRs[index] = value
    setKeyResults(newKRs)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {existingOkr ? '编辑学习目标' : '创建学习目标'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标 (Objective)
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="例如：掌握数据结构与算法基础知识"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关键结果 (Key Results)
            </label>
            {keyResults.map((kr, index) => (
              <input
                key={index}
                type="text"
                value={kr}
                onChange={(e) => updateKeyResult(index, e.target.value)}
                placeholder={`关键结果 ${index + 1}`}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}