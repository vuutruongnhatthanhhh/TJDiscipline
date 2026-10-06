-- Bỏ 8 loài vẽ SVG có sẵn trong code — danh mục giờ chỉ gồm loài admin tự
-- thêm (ảnh upload) trong bảng species. active_species_id giờ có thể NULL
-- (chưa có loài nào để nuôi cho tới khi admin thêm loài đầu tiên).
-- Chạy sau migration 0002 (bảng species đã tồn tại).

ALTER TABLE game_state ALTER COLUMN active_species_id DROP NOT NULL;
ALTER TABLE game_state ALTER COLUMN active_species_id DROP DEFAULT;

-- Các id cũ (meo-mun, cun-bong, ...) không còn tồn tại trong bảng species
-- (trước đây được vẽ bằng SVG trong code) — xoá tham chiếu để tránh trỏ tới
-- id không tồn tại.
UPDATE game_state
SET active_species_id = NULL
WHERE active_species_id IS NOT NULL
  AND active_species_id NOT IN (SELECT id FROM species);
