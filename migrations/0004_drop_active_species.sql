-- Bỏ tính năng "chọn nuôi" thủ công — bạn đồng hành hiện tại giờ tự động là
-- loài mở khoá gần nhất (theo mốc điểm danh), không cần lưu lựa chọn riêng.

ALTER TABLE game_state DROP COLUMN IF EXISTS active_species_id;
