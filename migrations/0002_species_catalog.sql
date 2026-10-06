-- Danh mục thú cưng/cây cảnh do admin thêm từ trang /admin, dùng chung cho
-- mọi user (không phải dữ liệu riêng từng người). 8 loài gốc trong code vẫn
-- dùng SVG vẽ tay, không nằm trong bảng này — bảng này chỉ chứa loài thêm
-- bằng ảnh upload (5 ảnh ứng với 5 giai đoạn trưởng thành).

CREATE TABLE IF NOT EXISTS species (
  id                  TEXT PRIMARY KEY,
  kind                TEXT NOT NULL CHECK (kind IN ('pet', 'plant')),
  name                TEXT NOT NULL,
  tagline             TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  unlock_requirement  INTEGER NOT NULL DEFAULT 0,
  stage_images        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Mọi user đã đăng nhập đều xem được danh mục (để hiện trong bộ sưu tập).
-- Ghi (thêm/sửa/xoá) chỉ thực hiện qua service role trong API routes /api/admin.
CREATE POLICY "select_species_authenticated" ON species
  FOR SELECT USING (auth.role() = 'authenticated');

-- Bucket public để lưu ảnh loài (đã convert sang webp phía server trước khi
-- upload). Ghi/xoá object chỉ thực hiện qua service role nên không cần thêm
-- policy cho storage.objects.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('species-images', 'species-images', TRUE, 5242880, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;
