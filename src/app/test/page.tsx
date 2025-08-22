export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tailwind测试页面</h1>
        <p className="text-gray-600">如果您能看到蓝色背景和白色卡片，说明Tailwind正常工作</p>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          测试按钮
        </button>
      </div>
    </div>
  )
}