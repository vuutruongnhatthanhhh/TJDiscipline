-- Khung giờ check-in giờ thuộc về TỪNG VIỆC trong checklist, không còn
-- chung cho cả mục tiêu nữa — mỗi việc có giờ/độ linh hoạt/ngày trong tuần
-- riêng, và lỡ việc nào thì phạt việc đó (không gộp theo ngày nữa).

ALTER TABLE goals DROP COLUMN IF EXISTS check_time;
ALTER TABLE goals DROP COLUMN IF EXISTS window_minutes;
ALTER TABLE goals DROP COLUMN IF EXISTS check_days;

ALTER TABLE goal_tasks ADD COLUMN IF NOT EXISTS check_time TEXT NOT NULL DEFAULT '21:00';
ALTER TABLE goal_tasks ADD COLUMN IF NOT EXISTS window_minutes INTEGER NOT NULL DEFAULT 45;
ALTER TABLE goal_tasks ADD COLUMN IF NOT EXISTS check_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb;

-- goal_checkins (1 dòng/ngày, gộp cả checklist) không còn khớp mô hình mới
-- — thay bằng goal_task_checkins (1 dòng/việc/ngày), vì giờ mỗi việc tự
-- điểm danh độc lập theo khung giờ riêng của nó. Tính năng này chưa có
-- người dùng thật nào dùng nên xoá thẳng bảng cũ, không cần giữ dữ liệu.
DROP TABLE IF EXISTS goal_checkins;

CREATE TABLE IF NOT EXISTS goal_task_checkins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  task_id    UUID NOT NULL REFERENCES goal_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, check_date)
);

ALTER TABLE goal_task_checkins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS goal_task_checkins_goal_idx ON goal_task_checkins(goal_id);
