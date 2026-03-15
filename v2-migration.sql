-- ============================================================
-- 芯约会 v2.0 数据库迁移
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================================

-- ── 1. profiles 新增字段 ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_preference text DEFAULT '';

-- ── 2. dates 表完善 ──────────────────────────────────────────
-- 如果 dates 表不存在则创建
CREATE TABLE IF NOT EXISTS dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_b uuid REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id),
  package_id uuid REFERENCES packages(id),
  restaurant_name text DEFAULT '',
  package_name text DEFAULT '',
  package_price numeric DEFAULT 0,
  status text DEFAULT 'pending',  -- pending / confirmed / completed / cancelled
  male_rated boolean DEFAULT false,
  female_rated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 如果 dates 已存在，补充缺失列
ALTER TABLE dates ADD COLUMN IF NOT EXISTS restaurant_name text DEFAULT '';
ALTER TABLE dates ADD COLUMN IF NOT EXISTS package_name text DEFAULT '';
ALTER TABLE dates ADD COLUMN IF NOT EXISTS package_price numeric DEFAULT 0;
ALTER TABLE dates ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE dates ADD COLUMN IF NOT EXISTS male_rated boolean DEFAULT false;
ALTER TABLE dates ADD COLUMN IF NOT EXISTS female_rated boolean DEFAULT false;

-- ── 3. ratings 评价表 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date_id uuid REFERENCES dates(id) ON DELETE CASCADE,
  rater_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score int CHECK (score BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ── 4. RLS 策略 ───────────────────────────────────────────────
ALTER TABLE dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- dates: 参与者可读写
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dates' AND policyname='dates_participants') THEN
    CREATE POLICY "dates_participants" ON dates
      FOR ALL TO authenticated
      USING (auth.uid() = user_a OR auth.uid() = user_b)
      WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
  END IF;
END $$;

-- ratings: 认证用户可读，本人可写
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='ratings_read') THEN
    CREATE POLICY "ratings_read" ON ratings FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='ratings_insert') THEN
    CREATE POLICY "ratings_insert" ON ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);
  END IF;
END $$;

-- ── 5. EXP 更新函数 ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_exp_and_update_rank(p_user_id uuid, p_exp int)
RETURNS void AS $$
DECLARE
  v_new_exp int;
  v_dates int;
BEGIN
  UPDATE profiles
    SET exp = exp + p_exp
    WHERE id = p_user_id
    RETURNING exp, total_dates INTO v_new_exp, v_dates;

  -- 根据 exp + 约会次数 计算新段位
  UPDATE profiles SET rank = CASE
    WHEN v_new_exp >= 10000 AND v_dates >= 100 THEN '黑金'
    WHEN v_new_exp >= 5000  AND v_dates >= 50  THEN '钻石'
    WHEN v_new_exp >= 2000  AND v_dates >= 30  THEN '铂金'
    WHEN v_new_exp >= 500   AND v_dates >= 10  THEN '黄金'
    WHEN v_new_exp >= 100   AND v_dates >= 3   THEN '白银'
    ELSE '青铜'
  END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. 确认约会并结算 EXP 的函数 ─────────────────────────────
CREATE OR REPLACE FUNCTION confirm_date(p_date_id uuid, p_confirmer_id uuid)
RETURNS void AS $$
DECLARE
  v_date RECORD;
BEGIN
  SELECT * INTO v_date FROM dates WHERE id = p_date_id;

  -- 只允许被邀请方 (user_b) 确认
  IF v_date.user_b != p_confirmer_id THEN
    RAISE EXCEPTION 'Only the invitee can confirm';
  END IF;

  -- 更新状态
  UPDATE dates SET status = 'confirmed' WHERE id = p_date_id;

  -- 双方 +50 EXP
  PERFORM add_exp_and_update_rank(v_date.user_a, 50);
  PERFORM add_exp_and_update_rank(v_date.user_b, 50);

  -- 更新约会次数
  UPDATE profiles SET total_dates = total_dates + 1
    WHERE id IN (v_date.user_a, v_date.user_b);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. 验证 ──────────────────────────────────────────────────
SELECT 'v2 migration done ✅' as status;
