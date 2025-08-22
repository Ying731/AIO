-- 更新 okrs 表结构以支持进度跟踪
-- 如果表已存在，先备份数据，然后更新结构

-- 1. 添加 overall_progress 列（如果不存在）
ALTER TABLE okrs ADD COLUMN IF NOT EXISTS overall_progress INTEGER DEFAULT 0;

-- 2. 更新现有数据的 key_results 格式
-- 将简单字符串数组转换为包含进度信息的对象数组
UPDATE okrs 
SET key_results = (
  SELECT json_agg(
    json_build_object(
      'id', 'kr_' || generate_random_uuid()::text,
      'text', kr_text,
      'completed', false,
      'progress', 0
    )
  )
  FROM (
    SELECT unnest(
      CASE 
        WHEN jsonb_typeof(key_results) = 'array' AND jsonb_typeof(key_results->0) = 'string'
        THEN ARRAY(SELECT jsonb_array_elements_text(key_results))
        ELSE ARRAY[]::text[]
      END
    ) AS kr_text
  ) AS kr_data
)
WHERE jsonb_typeof(key_results) = 'array' AND jsonb_typeof(key_results->0) = 'string';

-- 3. 确保 overall_progress 有默认值
UPDATE okrs SET overall_progress = 0 WHERE overall_progress IS NULL;

-- 4. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_overall_progress ON okrs(overall_progress);

-- 5. 添加约束确保数据完整性
ALTER TABLE okrs ADD CONSTRAINT IF NOT EXISTS check_overall_progress 
  CHECK (overall_progress >= 0 AND overall_progress <= 100);

-- 验证数据结构
-- SELECT id, objective, key_results, overall_progress FROM okrs LIMIT 5;