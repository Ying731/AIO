# 部署说明

## Vercel 部署配置

### 环境变量设置

在Vercel项目设置中，需要添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://jkruhhahrtylpexojyaw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcnVoaGFocnR5bHBleG9qeWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDI2ODUsImV4cCI6MjA3MTMxODY4NX0.ZaVyLI1DTq25ushwdxblR7l6VujId87-3ZhBUSGfEyY
GOOGLE_AI_API_KEY=AIzaSyCDhk44KrPvYISgA9rLbRHmboRKoWwI37U
```

### 部署步骤

1. 登录 [Vercel](https://vercel.com)
2. 导入GitHub仓库 `https://github.com/Ying731/AIO.git`
3. 在项目设置 → Environment Variables 中添加上述环境变量
4. 重新部署项目

### 注意事项

- 确保所有环境变量都已正确设置
- Supabase数据库需要创建相应的表结构
- Google AI API密钥需要有效且有足够配额

## 数据库表结构

需要在Supabase中创建以下表：

### profiles 表
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);
```

### okrs 表
```sql
CREATE TABLE okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  objective TEXT NOT NULL,
  key_results TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### chat_history 表
```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  message JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);