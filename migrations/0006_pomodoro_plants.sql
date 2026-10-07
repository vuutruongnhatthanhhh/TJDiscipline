-- Cây cảnh giờ lớn theo thời gian tập trung (Pomodoro) thay vì điểm danh —
-- tách hoàn toàn khỏi tiến trình nuôi thú cưng. Mỗi cây có mốc thời gian
-- nuôi riêng (phút) do admin đặt khi thêm/sửa loài; nuôi đủ thời gian của
-- cây hiện tại thì tự chuyển sang cây tiếp theo, giống cơ chế thú cưng.

ALTER TABLE species ADD COLUMN IF NOT EXISTS grow_minutes INTEGER NOT NULL DEFAULT 60;

ALTER TABLE game_state ADD COLUMN IF NOT EXISTS total_focus_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS pomodoro_minutes INTEGER NOT NULL DEFAULT 25;
