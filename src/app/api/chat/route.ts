import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    console.log('Chat API called')
    
    const { message, okr } = await req.json()
    console.log('Received message:', message)

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // 检查API Key
    const apiKey = process.env.GOOGLE_AI_API_KEY
    
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY not found')
      return NextResponse.json({ 
        response: getFallbackResponse(message, okr)
      })
    }

    let aiResponse = ''

    // 检查是否是询问每日任务
    if (message.includes('今天') && (message.includes('做什么') || message.includes('任务'))) {
      if (okr && okr.objective && okr.keyResults && okr.keyResults.length > 0) {
        aiResponse = generateTaskRecommendations(okr)
      } else {
        aiResponse = `你还没有设置学习目标(OKR)。建议你先创建一个目标，这样我就能为你提供更个性化的学习建议了！

🎯 **如何设置学习目标：**
1. 点击左侧的"+"按钮创建目标
2. 设定一个明确的学习目标（如：掌握数据结构与算法）
3. 列出3个可衡量的关键结果
4. 我会根据你的目标推荐每日学习任务

设置好目标后，再问我"今天要做什么"，我会给你具体的学习计划！`
      }
    } else {
      // 尝试使用Google AI
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
        
        const prompt = `你是一个专业的AI学习助手，请回答用户的问题。如果用户询问学习相关的问题，请提供有用的建议和指导。

用户问题：${message}

请用中文回答：`
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        aiResponse = response.text()
        
        console.log('AI response received successfully')
      } catch (aiError: any) {
        console.error('Google AI Error:', aiError)
        aiResponse = getFallbackResponse(message, okr)
      }
    }

    return NextResponse.json({ response: aiResponse })

  } catch (error: any) {
    console.error('General Error:', error)
    return NextResponse.json({ 
      response: getFallbackResponse('', null)
    })
  }
}

function generateTaskRecommendations(okr: any): string {
  const krList = okr.keyResults.map((kr: string, index: number) => `${index + 1}. ${kr}`).join('\n')
  
  return `根据你的学习目标，我为你推荐今日学习任务：

📚 **目标：${okr.objective}**

🎯 **今日推荐任务：**

${okr.keyResults.map((kr: string, index: number) => {
    const taskSuggestions = [
      `• 针对"${kr}"，建议今天完成相关理论学习30分钟`,
      `• 完成与"${kr}"相关的练习题或实践项目`,
      `• 复习和总结"${kr}"的核心知识点`
    ]
    return `**${index + 1}. ${kr}**\n${taskSuggestions[index % taskSuggestions.length]}`
  }).join('\n\n')}

💡 **学习建议：**
- 建议采用番茄工作法，每25分钟专注学习，休息5分钟
- 记录学习进度和遇到的问题
- 可以随时向我提问具体的学习疑问

加油！每天的小进步都会积累成大成就！ 🌟`
}

function getFallbackResponse(message: string, okr: any): string {
  const lowerMessage = message.toLowerCase()
  
  // 学习方法相关
  if (lowerMessage.includes('学习方法') || lowerMessage.includes('怎么学')) {
    return `📚 **高效学习方法建议：**

🎯 **制定明确目标**
- 使用SMART原则设定学习目标
- 将大目标分解为小的可执行任务

⏰ **时间管理**
- 采用番茄工作法：25分钟专注学习 + 5分钟休息
- 制定每日学习计划并严格执行

🧠 **学习技巧**
- 主动学习：做笔记、提问、总结
- 间隔重复：定期复习已学内容
- 费曼技巧：用简单语言解释复杂概念

💪 **保持动力**
- 记录学习进度，庆祝小成就
- 找学习伙伴互相监督
- 定期回顾和调整学习策略

有具体的学习问题可以继续问我！`
  }
  
  // 编程相关
  if (lowerMessage.includes('编程') || lowerMessage.includes('代码') || lowerMessage.includes('算法')) {
    return `💻 **编程学习建议：**

🔧 **基础技能**
- 选择一门编程语言深入学习
- 掌握基本的数据结构和算法
- 练习代码调试和问题解决

📖 **学习资源**
- 在线编程平台：LeetCode、牛客网
- 开源项目：GitHub上的优秀项目
- 技术文档：官方文档是最好的学习资料

🎯 **实践项目**
- 从小项目开始，逐步增加复杂度
- 参与开源项目贡献代码
- 建立个人项目作品集

需要具体的编程问题解答，请告诉我详细情况！`
  }
  
  // 考试相关
  if (lowerMessage.includes('考试') || lowerMessage.includes('复习') || lowerMessage.includes('备考')) {
    return `📝 **考试备考策略：**

📋 **制定复习计划**
- 分析考试大纲，明确重点内容
- 制定时间表，合理分配复习时间
- 留出充足时间进行模拟练习

🎯 **复习方法**
- 知识梳理：制作思维导图
- 重点突破：针对薄弱环节加强练习
- 真题练习：熟悉考试题型和时间分配

💡 **应试技巧**
- 保持良好作息，考前充分休息
- 考试时先易后难，合理分配时间
- 保持冷静，仔细审题

有具体科目的复习问题可以详细咨询！`
  }
  
  // 默认响应
  return `你好！我是你的AI学习助手 🌟

💬 **我可以帮助你：**
- 制定学习计划和目标
- 提供学习方法和技巧
- 解答学习中的疑问
- 推荐学习资源

🎯 **你可以问我：**
- "如何提高学习效率？"
- "编程应该怎么学？"
- "如何准备考试？"
- "今天要做什么？"（需要先设置OKR目标）

请告诉我你的具体问题，我会尽力帮助你！`
}