'use client'

import { useState } from 'react'
import { Star, Target, MessageCircle, Plus, Send, User, LogOut } from 'lucide-react'

interface OKR {
  id: string
  objective: string
  keyResults: string[]
  createdAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function DashboardPage() {
  const [okr, setOkr] = useState<OKR | null>(null)
  const [showOkrForm, setShowOkrForm] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的AI学习助手。你可以向我提问学习相关的问题，或者询问"今天我该做什么？"来获取基于你的OKR的学习建议。',
      timestamp: new Date().toISOString()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 模拟用户数据
  const user = {
    name: '张三',
    email: 'zhangsan@example.com'
  }

  const handleCreateOkr = (objective: string, keyResults: string[]) => {
    const newOkr: OKR = {
      id: Date.now().toString(),
      objective,
      keyResults,
      createdAt: new Date().toISOString()
    }
    setOkr(newOkr)
    setShowOkrForm(false)
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    // 模拟AI回复
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(currentMessage, okr),
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  const getAIResponse = (message: string, okr: OKR | null): string => {
    if (message.includes('今天') && message.includes('做什么')) {
      if (okr) {
        return `基于你的目标"${okr.objective}"，我建议你今天可以：\n\n1. 复习相关的理论知识\n2. 完成一个小的实践项目\n3. 整理学习笔记\n\n这些任务将帮助你朝着关键结果迈进。有什么具体问题需要我帮助吗？`
      } else {
        return '你还没有设置学习目标(OKR)。建议你先创建一个目标，这样我就能为你提供更个性化的学习建议了！'
      }
    }
    
    if (message.includes('B+树') || message.includes('数据结构')) {
      return 'B+树是一种多路搜索树，常用于数据库和文件系统中。它的特点包括：\n\n1. 所有叶子节点都在同一层\n2. 非叶子节点只存储键值，不存储数据\n3. 叶子节点存储所有数据，并且通过指针连接\n4. 支持范围查询和顺序访问\n\n相比B树，B+树的优势是更适合磁盘存储和范围查询。你想了解更多关于B+树的哪个方面？'
    }

    return '这是一个很好的问题！作为你的AI学习助手，我会尽力帮助你。不过目前我的知识库还在完善中，建议你可以：\n\n1. 查阅相关教材\n2. 向老师或同学请教\n3. 在线搜索相关资料\n\n有其他学习相关的问题吗？'
  }

  const handleLogout = () => {
    // TODO: 实现登出逻辑
    window.location.href = '/'
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
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {user.name}
              </div>
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  我的学习目标
                </h2>
                {!okr && (
                  <button
                    onClick={() => setShowOkrForm(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {okr ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">目标 (Objective)</h3>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded">{okr.objective}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">关键结果 (Key Results)</h3>
                    <ul className="space-y-2">
                      {okr.keyResults.map((kr, index) => (
                        <li key={index} className="text-gray-700 bg-gray-50 p-2 rounded flex items-start">
                          <span className="text-blue-600 mr-2">{index + 1}.</span>
                          {kr}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setShowOkrForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    编辑目标
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
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
                {isLoading && (
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
                    disabled={!currentMessage.trim() || isLoading}
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
          onSave={handleCreateOkr}
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
  onSave: (objective: string, keyResults: string[]) => void
  onClose: () => void 
}) {
  const [objective, setObjective] = useState(existingOkr?.objective || '')
  const [keyResults, setKeyResults] = useState(existingOkr?.keyResults || ['', '', ''])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredKRs = keyResults.filter(kr => kr.trim() !== '')
    if (objective.trim() && filteredKRs.length > 0) {
      onSave(objective.trim(), filteredKRs)
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              保存
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