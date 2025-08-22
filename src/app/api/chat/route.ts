import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    console.log('Chat API called')
    
    // 检查API Key
    const apiKey = process.env.GOOGLE_AI_API_KEY
    console.log('API Key exists:', !!apiKey)
    
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY not found')
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 })
    }

    const { message, okr } = await req.json()
    console.log('Received message:', message)

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let prompt = ''
    let aiResponse = ''

    // 检查是否是询问每日任务
    if (message.includes('今天') && (message.includes('做什么') || message.includes('任务'))) {
      if (okr && okr.objective && okr.keyResults && okr.keyResults.length > 0) {
        const krList = okr.keyResults.map((kr: string, index: number) => `${index + 1}. ${kr}`).join('\n')
        prompt = `用户设定了以下学习目标(OKR)：\n目标：${okr.objective}\n关键结果：\n${krList}\n\n请根据这个OKR，为用户推荐3-5个今日可执行的学习任务。请直接列出任务，不需要寒暄。`
      } else {
        aiResponse = '你还没有设置学习目标(OKR)。建议你先创建一个目标，这样我就能为你提供更个性化的学习建议了！'
      }
    } else {
      // 通用AI助手对话
      prompt = `你是一个专业的AI学习助手，请回答用户的问题。如果用户询问学习相关的问题，请提供有用的建议和指导。\n\n用户问题：${message}\n\n请用中文回答：`
    }

    if (prompt) {
      try {
        console.log('Initializing Google AI...')
        const genAI = new GoogleGenerativeAI(apiKey)
        
        console.log('Getting model...')
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
        
        console.log('Generating content...')
        const result = await model.generateContent(prompt)
        
        console.log('Getting response...')
        const response = await result.response
        
        console.log('Extracting text...')
        aiResponse = response.text()
        
        console.log('AI response received successfully')
      } catch (aiError: any) {
        console.error('Google AI Error:', aiError)
        console.error('Error message:', aiError.message)
        console.error('Error status:', aiError.status)
        console.error('Error details:', JSON.stringify(aiError, null, 2))
        
        // 提供更详细的错误信息
        if (aiError.message?.includes('API_KEY_INVALID')) {
          aiResponse = '抱歉，API密钥无效。请检查配置。'
        } else if (aiError.message?.includes('QUOTA_EXCEEDED')) {
          aiResponse = '抱歉，API配额已用完。请稍后再试。'
        } else if (aiError.message?.includes('SAFETY')) {
          aiResponse = '抱歉，您的问题触发了安全过滤器。请换个方式提问。'
        } else {
          aiResponse = `抱歉，AI服务暂时不可用。错误：${aiError.message || '未知错误'}`
        }
      }
    }

    console.log('Sending response:', aiResponse.substring(0, 100) + '...')
    return NextResponse.json({ response: aiResponse })

  } catch (error: any) {
    console.error('General Error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 })
  }
}
