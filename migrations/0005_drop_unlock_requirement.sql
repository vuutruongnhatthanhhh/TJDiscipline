-- Bỏ "mốc mở khoá" thủ công — giờ các loài nuôi tuần tự theo đúng thứ tự
-- trong bộ sưu tập, nuôi xong loài này (25 lần điểm danh) thì tự chuyển
-- sang loài tiếp theo.

ALTER TABLE species DROP COLUMN IF EXISTS unlock_requirement;
