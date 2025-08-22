import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { message, okr } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let prompt = ''
    let aiResponse = ''

    // 检查是否是询问每日任务
    if (message.includes('今天') && (message.includes('做什么') || message.includes('任务'))) {
      if (okr && okr.objective && okr.keyResults && okr.keyResults.length > 0) {
        const krList = okr.keyResults.map((kr: string, index: number) => `${index + 1}. ${kr}`).join('\\n')
        prompt = `用户设定了以下学习目标(OKR)：\\n目标：${okr.objective}\\n关键结果：\\n${krList}\\n\\n请根据这个OKR，为用户推荐3-5个今日可执行的学习任务。请直接列出任务，不需要寒暄。`
      } else {
        aiResponse = '你还没有设置学习目标(OKR)。建议你先创建一个目标，这样我就能为你提供更个性化的学习建议了！'
      }
    } else {
      // 否则，进行知识库问答 (RAG)
      // 1. 获取用户消息的嵌入
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: message,
      })
      const userEmbedding = embeddingResponse.data[0].embedding

      // 2. 在Supabase中搜索相似的知识块
      const { data: knowledgeChunks, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: userEmbedding,
        match_threshold: 0.78, // 相似度阈值，可调
        match_count: 5, // 返回最相似的5个知识块
      })

      if (searchError) {
        console.error('Error searching knowledge chunks:', searchError)
        aiResponse = '抱歉，在知识库中查找信息时出现问题。'
      } else {
        const context = knowledgeChunks.map((chunk: any) => chunk.content).join('\\n\\n')
        
        prompt = `你是一个专业的AI学习助手，请根据以下提供的知识内容来回答用户的问题。如果知识内容中没有直接的答案，请礼貌地告知用户你无法回答，并建议他们查阅相关资料或向老师请教。\\n\\n知识内容：\\n${context}\\n\\n用户问题：${message}\\n\\n回答：`
      }
    }

    if (prompt) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // 可以根据需要选择更强大的模型，如 gpt-4
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      })
      aiResponse = completion.choices[0].message.content || '抱歉，我暂时无法回答这个问题。'
    }

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}