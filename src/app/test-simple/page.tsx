'use client'

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold text-gray-900">简单测试页面</h1>
      <p className="mt-4 text-gray-600">如果你能看到这个页面，说明基本的React渲染是正常的。</p>
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">测试内容加载成功！</p>
      </div>
    </div>
  )
}