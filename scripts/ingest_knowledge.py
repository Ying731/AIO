import os
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv
import tiktoken
import re

# 加载环境变量
load_dotenv(dotenv_path='../.env.local')

# Supabase 配置
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# OpenAI 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Supabase URL and Anon Key must be set in .env.local")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API Key must be set in .env.local")

# 初始化 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# 初始化 OpenAI 客户端
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# 嵌入模型和分词器
EMBEDDING_MODEL = "text-embedding-ada-002"
tokenizer = tiktoken.encoding_for_model(EMBEDDING_MODEL)

def get_embedding(text: str) -> list[float]:
    """生成文本的嵌入向量"""
    text = text.replace("\n", " ")
    response = openai_client.embeddings.create(input=[text], model=EMBEDDING_MODEL)
    return response.data[0].embedding

def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> list[str]:
    """
    将长文本分割成指定最大 token 数量的块，并带有重叠。
    """
    tokens = tokenizer.encode(text)
    chunks = []
    i = 0
    while i < len(tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunks.append(tokenizer.decode(chunk_tokens))
        if i + max_tokens >= len(tokens):
            break
        i += (max_tokens - overlap)
        if i < 0: # 防止负数索引
            i = 0
    return chunks

def ingest_document(file_path: str):
    """
    读取文档内容，分块，生成嵌入，并存储到 Supabase。
    支持 .txt 和 .md 文件。
    对于 PDF 文件，您需要使用额外的库（如 PyPDF2 或 pypdf）来提取文本。
    """
    print(f"正在处理文件: {file_path}")
    
    file_extension = os.path.splitext(file_path)[1].lower()
    content = ""

    if file_extension == ".txt" or file_extension == ".md":
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    elif file_extension == ".pdf":
        # 示例：处理 PDF 文件，需要安装 pypdf: pip install pypdf
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                content += page.extract_text() + "\n"
        except ImportError:
            print("请安装 pypdf 库 (pip install pypdf) 来处理 PDF 文件。跳过此文件。")
            return
        except Exception as e:
            print(f"处理 PDF 文件 {file_path} 时发生错误: {e}")
            return
    else:
        print(f"不支持的文件类型: {file_extension}。跳过此文件。")
        return

    if not content.strip():
        print(f"文件 {file_path} 内容为空或无法提取。跳过。")
        return

    chunks = chunk_text(content)
    
    for i, chunk in enumerate(chunks):
        try:
            embedding = get_embedding(chunk)
            data_to_insert = {
                "content": chunk,
                "embedding": embedding
            }
            response = supabase.from("knowledge_chunks").insert([data_to_insert]).execute()
            if response.data:
                print(f"  - 成功插入块 {i+1}/{len(chunks)}")
            elif response.error:
                print(f"  - 插入块 {i+1}/{len(chunks)} 失败: {response.error}")
        except Exception as e:
            print(f"  - 处理块 {i+1}/{len(chunks)} 时发生错误: {e}")

def main():
    knowledge_base_dir = "knowledge_base" # 知识库文件存放目录
    
    # 创建知识库目录（如果不存在）
    if not os.path.exists(knowledge_base_dir):
        os.makedirs(knowledge_base_dir)
        print(f"已创建知识库目录: {knowledge_base_dir}")
        print("请将您的知识库文件（如 .txt, .md, .pdf）放入此目录中。")
        print("然后再次运行此脚本。")
        return

    # 遍历知识库目录下的所有文件
    for filename in os.listdir(knowledge_base_dir):
        file_path = os.path.join(knowledge_base_dir, filename)
        if os.path.isfile(file_path):
            ingest_document(file_path)
    
    print("\n知识库导入完成。")

if __name__ == "__main__":
    main()