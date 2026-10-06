-- Bảng lưu tiến trình nuôi thú/cây của từng user (1 dòng/user).
-- RLS đảm bảo mỗi user chỉ đọc/ghi được dòng của chính mình.

CREATE TABLE IF NOT EXISTS game_state (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wake_time          TEXT NOT NULL DEFAULT '05:30',
  window_minutes     INTEGER NOT NULL DEFAULT 45,
  active_species_id  TEXT NOT NULL DEFAULT 'meo-mun',
  total_check_ins    INTEGER NOT NULL DEFAULT 0,
  streak             INTEGER NOT NULL DEFAULT 0,
  best_streak        INTEGER NOT NULL DEFAULT 0,
  last_check_in_date DATE,
  history            JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_game_state" ON game_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_game_state" ON game_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_game_state" ON game_state
  FOR UPDATE USING (auth.uid() = user_id);

-- Giữ updated_at luôn mới sau mỗi lần ghi.
CREATE OR REPLACE FUNCTION set_game_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_state_set_updated_at ON game_state;
CREATE TRIGGER game_state_set_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION set_game_state_updated_at();
