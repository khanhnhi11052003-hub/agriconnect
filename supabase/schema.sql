-- ====================================================================
-- DỰ ÁN AGRICONNECT - CƠ SỞ DỮ LIỆU SUPABASE (PostgreSQL)
-- Phiên bản 2: Đã khóa bảo mật dữ liệu khách hàng (Row Level Security)
--
-- CÁCH DÙNG: Supabase Dashboard -> SQL Editor -> New query -> dán toàn bộ file -> Run.
-- Script có thể chạy lại nhiều lần mà không bị nhân đôi dữ liệu mẫu.
--
-- NGUYÊN TẮC BẢO MẬT:
--   * Khách (anon) CHỈ được: xem sản phẩm/đợt hàng/nhà vườn, GỬI đơn mới, gửi liên hệ,
--     và tra cứu 1 đơn theo mã đơn (không trả về tên, SĐT, địa chỉ).
--   * Khách KHÔNG được đọc, sửa, xóa danh sách đơn hàng.
--   * Giá tiền, phí ship, trạng thái thanh toán được TÍNH LẠI TRÊN SERVER,
--     khách không thể tự sửa giá trong trình duyệt.
--   * Chỉ tài khoản có email nằm trong bảng admin_users mới xem/sửa được đơn.
-- ====================================================================

-- ---------------------------------------------------------------
-- 1. CÁC BẢNG DỮ LIỆU
-- ---------------------------------------------------------------

-- 1.1 Danh sách email quản trị (không ai đọc được bảng này từ trình duyệt)
CREATE TABLE IF NOT EXISTS admin_users (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Nhà vườn
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name VARCHAR(255) NOT NULL,
    farmer_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    province VARCHAR(100) DEFAULT 'Bình Phước',
    google_maps_url TEXT,
    story TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Sản phẩm / Combo
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),                       -- 'TraiCay' | 'Combo'
    description TEXT,
    unit VARCHAR(50) DEFAULT 'kg',
    weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 1,  -- Số kg quy đổi cho 1 đơn vị (để tính tải xe)
    price_original NUMERIC(12, 2) NOT NULL,      -- Giá vốn trả nhà vườn
    price_sale NUMERIC(12, 2) NOT NULL,          -- Giá bán cho khách
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 1;

-- 1.4 Đợt gom hàng
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255) NOT NULL,
    open_date VARCHAR(50) DEFAULT 'Thứ Hai',
    close_date VARCHAR(50) DEFAULT '23:59 Thứ Năm',
    harvest_date VARCHAR(100) DEFAULT 'Thứ Sáu (thu hái & đóng thùng tại Bình Phước)',
    delivery_date VARCHAR(100) DEFAULT 'Sáng Thứ Bảy (xe khách QL13 + shipper giao đa điểm)',
    target_kg NUMERIC(10, 2) DEFAULT 60.0,
    current_kg NUMERIC(10, 2) DEFAULT 0.0,       -- Tự động tính từ đơn thật, không nhập tay
    status VARCHAR(50) DEFAULT 'OPEN',           -- OPEN | CLOSED | HARVESTING | DELIVERING | COMPLETED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Đơn hàng
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_role VARCHAR(50) DEFAULT 'Khac',
    delivery_type VARCHAR(20) DEFAULT 'HOME',
    department VARCHAR(255),
    delivery_address TEXT NOT NULL,
    items JSONB NOT NULL,
    total_kg NUMERIC(10, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'VIETQR',
    payment_status VARCHAR(50) DEFAULT 'UNPAID',
    order_status VARCHAR(50) DEFAULT 'CONFIRMED',
    notes TEXT,
    consent_at TIMESTAMPTZ,                      -- Thời điểm khách đồng ý xử lý dữ liệu cá nhân
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_kg NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

-- Ràng buộc dữ liệu đầu vào (chặn dữ liệu rác / quá dài)
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_code_format CHECK (order_code ~ '^AC-[0-9]{6}-[A-Z0-9]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_phone_format CHECK (customer_phone ~ '^(0|\+84)[0-9]{9,10}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_name_len CHECK (char_length(customer_name) BETWEEN 2 AND 150);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_address_len CHECK (char_length(delivery_address) BETWEEN 5 AND 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_delivery_type CHECK (delivery_type IN ('HOME', 'CAMPUS'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_payment_method CHECK (payment_method IN ('VIETQR', 'COD'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_role CHECK (customer_role IN ('GiangVien', 'SinhVien', 'CanBo', 'Khac'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1.6 Tài chính theo đợt (dành cho báo cáo)
CREATE TABLE IF NOT EXISTS financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    total_revenue NUMERIC(12, 2) DEFAULT 0,
    farm_cost NUMERIC(12, 2) DEFAULT 0,
    bus_shipping_cost NUMERIC(12, 2) DEFAULT 0,
    packaging_cost NUMERIC(12, 2) DEFAULT 0,
    multi_drop_shipper_cost NUMERIC(12, 2) DEFAULT 0,
    net_profit NUMERIC(12, 2) DEFAULT 0,
    profit_margin_pct NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Tin nhắn liên hệ
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
    phone VARCHAR(20) NOT NULL CHECK (char_length(phone) BETWEEN 9 AND 20),
    email VARCHAR(100),
    subject VARCHAR(100),
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 2000),
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 2. HÀM KIỂM TRA QUYỀN QUẢN TRỊ
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------
-- 3. TRIGGER: TÍNH LẠI GIÁ TRÊN SERVER KHI KHÁCH GỬI ĐƠN
--    (Khách chỉ gửi productId + qty; giá, tên, phí ship do server quyết định)
-- ---------------------------------------------------------------
-- LƯU Ý: Phí giao tận nhà 20.000đ ở đây phải trùng với SHIPPING.HOME_DELIVERY_FEE trong js/config.js
CREATE OR REPLACE FUNCTION public.compute_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  item JSONB;
  p RECORD;
  qty INT;
  new_items JSONB := '[]'::jsonb;
  subtotal NUMERIC := 0;
  kg NUMERIC := 0;
BEGIN
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Đơn hàng phải có ít nhất 1 sản phẩm';
  END IF;
  IF jsonb_array_length(NEW.items) > 20 THEN
    RAISE EXCEPTION 'Đơn hàng có quá nhiều dòng sản phẩm';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    qty := (item ->> 'qty')::INT;
    IF qty IS NULL OR qty < 1 OR qty > 50 THEN
      RAISE EXCEPTION 'Số lượng sản phẩm không hợp lệ';
    END IF;

    SELECT id, name, unit, price_sale, weight_kg INTO p
    FROM products
    WHERE id = (item ->> 'productId')::UUID AND is_available = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm không tồn tại hoặc đã ngừng bán';
    END IF;

    new_items := new_items || jsonb_build_object(
      'productId', p.id, 'name', p.name, 'unit', p.unit,
      'qty', qty, 'price', p.price_sale, 'subtotal', p.price_sale * qty
    );
    subtotal := subtotal + p.price_sale * qty;
    kg := kg + p.weight_kg * qty;
  END LOOP;

  NEW.items          := new_items;
  NEW.total_kg       := kg;
  NEW.shipping_fee   := CASE WHEN NEW.delivery_type = 'HOME' THEN 20000 ELSE 0 END;
  NEW.total_amount   := subtotal + NEW.shipping_fee;
  NEW.payment_status := 'UNPAID';      -- Khách không thể tự đánh dấu "đã thanh toán"
  NEW.order_status   := 'CONFIRMED';
  NEW.created_at     := NOW();

  IF NEW.batch_id IS NULL THEN
    SELECT id INTO NEW.batch_id FROM batches WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_order_totals ON orders;
CREATE TRIGGER trg_compute_order_totals
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.compute_order_totals();

-- ---------------------------------------------------------------
-- 4. TRIGGER: CẬP NHẬT SỐ KG ĐÃ GOM CỦA ĐỢT HÀNG TỪ ĐƠN THẬT
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_batch_kg()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  b_id UUID := COALESCE(NEW.batch_id, OLD.batch_id);
BEGIN
  IF b_id IS NOT NULL THEN
    UPDATE batches
    SET current_kg = (
      SELECT COALESCE(SUM(total_kg), 0) FROM orders
      WHERE batch_id = b_id AND order_status <> 'CANCELLED'
    )
    WHERE id = b_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_batch_kg ON orders;
CREATE TRIGGER trg_refresh_batch_kg
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.refresh_batch_kg();

-- ---------------------------------------------------------------
-- 5. HÀM TRA CỨU ĐƠN THEO MÃ (cho trang trace.html)
--    Chỉ trả về thông tin KHÔNG nhạy cảm: không có tên, SĐT, địa chỉ.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_trace(p_code TEXT)
RETURNS TABLE (
  order_code TEXT, order_status TEXT, payment_status TEXT, delivery_type TEXT,
  total_kg NUMERIC, created_at TIMESTAMPTZ, batch_name TEXT,
  harvest_date TEXT, delivery_date TEXT, item_summary TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    o.order_code::TEXT, o.order_status::TEXT, o.payment_status::TEXT, o.delivery_type::TEXT,
    o.total_kg, o.created_at, b.batch_name::TEXT, b.harvest_date::TEXT, b.delivery_date::TEXT,
    (SELECT string_agg((i ->> 'qty') || 'x ' || (i ->> 'name'), ', ') FROM jsonb_array_elements(o.items) i)
  FROM orders o
  LEFT JOIN batches b ON b.id = o.batch_id
  WHERE o.order_code = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_trace(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;  -- Không tạo policy => không ai đọc được từ trình duyệt
ALTER TABLE farms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages  ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ (bản 1 cho phép đọc/sửa toàn bộ đơn - KHÔNG AN TOÀN)
DROP POLICY IF EXISTS "Public Read Products"   ON products;
DROP POLICY IF EXISTS "Public Read Batches"    ON batches;
DROP POLICY IF EXISTS "Public Read Farms"      ON farms;
DROP POLICY IF EXISTS "Public Insert Orders"   ON orders;
DROP POLICY IF EXISTS "Public Read Own Orders" ON orders;
DROP POLICY IF EXISTS "Public Update Orders"   ON orders;
DROP POLICY IF EXISTS "Public Insert Contact"  ON contact_messages;

DROP POLICY IF EXISTS products_public_read   ON products;
DROP POLICY IF EXISTS products_admin_all     ON products;
DROP POLICY IF EXISTS batches_public_read    ON batches;
DROP POLICY IF EXISTS batches_admin_all      ON batches;
DROP POLICY IF EXISTS farms_public_read      ON farms;
DROP POLICY IF EXISTS farms_admin_all        ON farms;
DROP POLICY IF EXISTS orders_public_insert   ON orders;
DROP POLICY IF EXISTS orders_admin_select    ON orders;
DROP POLICY IF EXISTS orders_admin_update    ON orders;
DROP POLICY IF EXISTS orders_admin_delete    ON orders;
DROP POLICY IF EXISTS finance_admin_all      ON financial_metrics;
DROP POLICY IF EXISTS contact_public_insert  ON contact_messages;
DROP POLICY IF EXISTS contact_admin_select   ON contact_messages;
DROP POLICY IF EXISTS contact_admin_update   ON contact_messages;

-- Sản phẩm: ai cũng xem được hàng đang bán; admin quản lý toàn bộ
CREATE POLICY products_public_read ON products FOR SELECT USING (is_available = TRUE OR public.is_admin());
CREATE POLICY products_admin_all   ON products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Đợt hàng & nhà vườn: ai cũng xem được; admin sửa
CREATE POLICY batches_public_read ON batches FOR SELECT USING (TRUE);
CREATE POLICY batches_admin_all   ON batches FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY farms_public_read   ON farms   FOR SELECT USING (TRUE);
CREATE POLICY farms_admin_all     ON farms   FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Đơn hàng: khách chỉ được GỬI; chỉ admin được xem / sửa / xóa
CREATE POLICY orders_public_insert ON orders FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY orders_admin_select  ON orders FOR SELECT USING (public.is_admin());
CREATE POLICY orders_admin_update  ON orders FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin_delete  ON orders FOR DELETE USING (public.is_admin());

-- Tài chính: chỉ admin
CREATE POLICY finance_admin_all ON financial_metrics FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Liên hệ: khách gửi; admin đọc / cập nhật
CREATE POLICY contact_public_insert ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (status = 'NEW');
CREATE POLICY contact_admin_select  ON contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY contact_admin_update  ON contact_messages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------
-- 7. DỮ LIỆU MẪU (chỉ thêm khi bảng còn trống)
--    ⚠️ Thông tin nhà vườn và giá bán dưới đây là DỮ LIỆU MẪU.
--    Hãy sửa thành thông tin thật trước khi mở bán.
-- ---------------------------------------------------------------
INSERT INTO farms (farm_name, farmer_name, phone, address, province, google_maps_url, story, avatar_url)
SELECT
  'Vườn Sầu Riêng & Măng Cụt (Bình Phước) - DỮ LIỆU MẪU',
  'Tên chủ vườn (cập nhật)',
  '0987654321',
  'Huyện Đồng Phú, Tỉnh Bình Phước (cập nhật địa chỉ thật)',
  'Bình Phước',
  'https://maps.google.com/?q=11.5355,106.8833',
  'Mô tả câu chuyện vườn (cập nhật thông tin thật).',
  'images/durian-warehouse.jpg'
WHERE NOT EXISTS (SELECT 1 FROM farms);

INSERT INTO products (name, category, description, unit, weight_kg, price_original, price_sale, image_url)
SELECT * FROM (VALUES
  ('Sầu Riêng Ri6 Đất Đỏ Bình Phước (Cơm Vàng Hạt Lép)', 'TraiCay',
   'Sầu riêng già chín rụng tự nhiên từ Phước Long - Bình Phước. Múi vàng ươm, dẻo béo ngậy, hạt lép ngọt đậm đà, bao ăn 1 đổi 1 nếu sượng.',
   'kg', 1.0, 80000, 125000, 'images/hero-fruits.jpg'),
  ('Măng Cụt Cổ Thụ Bình Phước Chín Cây', 'TraiCay',
   'Măng cụt vườn cổ thụ hái chín cành, vỏ mỏng rám phấn tự nhiên, múi trắng tinh khiết, giòn ngọt thanh mát, không mủ sượng.',
   'kg', 1.0, 45000, 75000, 'images/mangosteen-basket.jpg'),
  ('Chôm Chôm Nhãn Bình Phước (Giòn Ngọt Tróc Hạt)', 'TraiCay',
   'Chôm chôm nhãn râu vàng ửng đỏ, cơm dày ráo nước, tróc hạt hoàn toàn, vị ngọt đậm thơm lừng giòn sần sật.',
   'kg', 1.0, 28000, 45000, 'images/chomchom.jpg'),
  ('Nhãn Xuồng Cơm Vàng Bình Phước (Dày Cùi Mọng Nước)', 'TraiCay',
   'Trái to tròn vỏ vàng da bò, cơm dày ráo ngọt lịm mang hương thơm đặc trưng của vùng đất đỏ bazan màu mỡ.',
   'kg', 1.0, 40000, 65000, 'images/nhan.jpg'),
  ('Bòn Bon Đất Đỏ Bình Phước (Chùm Mọng Ngọt Thanh)', 'TraiCay',
   'Bòn bon chùm quả căng mọng sai trĩu cành, múi trong veo ngậm nước, vị ngọt thanh mát xen lẫn vị chua nhẹ tự nhiên.',
   'kg', 1.0, 35000, 55000, 'images/bonbon.jpg'),
  ('Dâu Da Đất Vàng Bình Phước (Chua Ngọt Dịu Mát)', 'TraiCay',
   'Dâu da đất truyền thống trái tròn vàng óng mọc từ thân cây cổ thụ, múi mọng nước vị chua ngọt hài hòa ăn hoài không ngán.',
   'kg', 1.0, 20000, 35000, 'images/dauda.jpg'),
  ('Bơ Sáp Dẻo Bình Phước Tuyển Chọn (Béo Quánh Vàng Ươm)', 'TraiCay',
   'Bơ sáp đất đỏ trái dài vỏ mỏng hạt nhỏ, cơm dẻo quánh vàng ươm béo ngậy tự nhiên, giàu dinh dưỡng và vitamin lành tính.',
   'kg', 1.0, 30000, 50000, 'images/bo-sap.jpg'),
  ('Combo 1: Bạn Trẻ Giảng Đường (Măng Cụt + Chôm Chôm + Dâu Da)', 'Combo',
   'Set 3kg gồm 1kg Măng cụt + 1kg Chôm chôm nhãn + 1kg Dâu da đất. Tiết kiệm, đủ vị chua ngọt thanh mát cho nhóm bạn sinh viên.',
   'combo', 3.0, 93000, 145000, 'images/mangosteen-harvest.jpg'),
  ('Combo 2: Thầy Cô & Gia Đình (1 Trái Sầu Riêng + 2kg Măng Cụt)', 'Combo',
   '1 quả Sầu riêng Ri6 (2.2 - 2.5kg) + 2kg Măng cụt cổ thụ chín cây, đóng thùng carton dán tem QR sang trọng, bao ăn tận bàn.',
   'combo', 4.5, 260000, 395000, 'images/durian-pile.jpg'),
  ('Combo 3: Đại Tiệc Vườn Nhà (Sầu Riêng + Măng Cụt + Chôm Chôm + Nhãn)', 'Combo',
   'Thưởng thức trọn vẹn 4 đặc sản nổi tiếng nhất: 1 quả Sầu riêng (~2kg) + 1kg Măng cụt + 1kg Chôm chôm nhãn + 1kg Nhãn xuồng cơm vàng.',
   'combo', 5.0, 320000, 485000, 'images/hero-fruits.jpg')
) AS v(name, category, description, unit, weight_kg, price_original, price_sale, image_url)
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO batches (batch_name, target_kg, current_kg, status)
SELECT 'Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Bình Phước', 60.0, 0.0, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM batches);

-- ---------------------------------------------------------------
-- 8. THÊM EMAIL QUẢN TRỊ (BẮT BUỘC - sửa email rồi chạy dòng này)
--    Sau đó vào Authentication -> Users -> Add user để tạo tài khoản với đúng email này.
-- ---------------------------------------------------------------
-- INSERT INTO admin_users (email) VALUES ('email-quan-tri-cua-ban@gmail.com') ON CONFLICT DO NOTHING;
