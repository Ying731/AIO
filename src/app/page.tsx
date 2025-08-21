'use client'

import { useState } from 'react'
import { Star, BookOpen, Target, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">启明星</h1>
              <span className="ml-2 text-sm text-gray-500">AI驱动智慧学习平台</span>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                登录
              </Link>
              <Link 
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            你的专属AI学习伙伴
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            基于OKR目标管理，结合AI智能问答，为河北师范大学软件学院学生提供个性化学习指导
          </p>
          <div className="mt-8">
            <Link 
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center"
            >
              开始学习之旅
              <Star className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">目标管理</h3>
            <p className="text-gray-600">
              设定学习目标和关键结果(OKR)，AI助手帮你制定每日学习计划
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">智能问答</h3>
            <p className="text-gray-600">
              基于课程知识库的AI问答，随时解答你的学习疑问
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">学习跟踪</h3>
            <p className="text-gray-600">
              记录学习进度，查看历史对话，持续优化学习效果
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}