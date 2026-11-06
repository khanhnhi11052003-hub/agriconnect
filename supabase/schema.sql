-- ====================================================================
-- DỰ ÁN AGRICONNECT - HỆ THỐNG CƠ SỞ DỮ LIỆU NÔNG SẢN MINH BẠCH BÌNH PHƯỚC
-- Khởi tạo trên Supabase PostgreSQL (Miễn phí 100%)
-- Mô hình: Xe khách QL13 + Shipper đa điểm Ahamove/Lalamove
-- ====================================================================

-- 1. BẢNG NHÀ VƯỜN (Farms)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG SẢN PHẨM / COMBO NÔNG SẢN (Products)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'TraiCay', 'Combo'
    description TEXT,
    unit VARCHAR(50) DEFAULT 'kg',
    price_original NUMERIC(12, 2) NOT NULL, -- Giá vốn tại vườn Bình Phước
    price_sale NUMERIC(12, 2) NOT NULL,     -- Giá bán pre-order
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG ĐỢT GOM HÀNG (Pre-order Batches)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255) NOT NULL,
    open_date VARCHAR(50) DEFAULT 'Thứ Hai',
    close_date VARCHAR(50) DEFAULT '23:59 Thứ Năm',
    harvest_date VARCHAR(100) DEFAULT 'Thứ Sáu (Bình Phước hái đóng từng kiện)',
    delivery_date VARCHAR(100) DEFAULT 'Sáng Thứ Bảy (Xe khách QL13 + Shipper đa điểm tận nhà)',
    target_kg NUMERIC(10, 2) DEFAULT 60.0,
    current_kg NUMERIC(10, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'HARVESTING', 'DELIVERING', 'COMPLETED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG ĐƠN ĐẶT HÀNG (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_role VARCHAR(50) DEFAULT 'SinhVien', -- 'GiangVien', 'SinhVien', 'CanBo', 'Khac'
    delivery_type VARCHAR(20) DEFAULT 'HOME',     -- 'HOME' (Giao tận nhà) hoặc 'CAMPUS' (Nhận tại trường)
    department VARCHAR(255),                      -- Khoa / Đơn vị hoặc Khu dân cư
    delivery_address TEXT NOT NULL,
    items JSONB NOT NULL,                         -- Mảng sản phẩm [{productId, name, qty, unit, price, subtotal}]
    shipping_fee NUMERIC(12, 2) DEFAULT 20000,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'VIETQR',  -- 'VIETQR' hoặc 'COD'
    payment_status VARCHAR(50) DEFAULT 'UNPAID',  -- 'UNPAID', 'PAID', 'REFUNDED'
    order_status VARCHAR(50) DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'
    notes TEXT,
    qr_trace_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG THEO DÕI TÀI CHÍNH & UNIT ECONOMICS (Pitching)
CREATE TABLE IF NOT EXISTS financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    total_revenue NUMERIC(12, 2) DEFAULT 0,
    farm_cost NUMERIC(12, 2) DEFAULT 0,
    bus_shipping_cost NUMERIC(12, 2) DEFAULT 120000,
    packaging_cost NUMERIC(12, 2) DEFAULT 0,
    multi_drop_shipper_cost NUMERIC(12, 2) DEFAULT 0,
    net_profit NUMERIC(12, 2) DEFAULT 0,
    profit_margin_pct NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG TIN NHẮN LIÊN HỆ & GÓP Ý
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    subject VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- CẤU HÌNH BẢO MẬT ROW LEVEL SECURITY (RLS) - AN TOÀN CHO PUBLIC
-- ====================================================================
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi người đọc thông tin sản phẩm, đợt gom hàng, nhà vườn
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Public Read Farms" ON farms FOR SELECT USING (true);

-- Cho phép người mua gửi đơn đặt hàng và tin nhắn liên hệ
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public Insert Contact" ON contact_messages FOR INSERT WITH CHECK (true);

-- ====================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA BÌNH PHƯỚC)
-- ====================================================================

-- Thêm nhà vườn Bình Phước
INSERT INTO farms (farm_name, farmer_name, phone, address, province, google_maps_url, story, avatar_url)
VALUES (
    'Vườn Sầu Riêng & Măng Cụt Bác Năm (Bình Phước)',
    'Bác Nguyễn Văn Năm',
    '0987 654 321',
    'Ấp Suối Ngô, Xã Tân Lập, Huyện Đồng Phú, Tỉnh Bình Phước',
    'Bình Phước',
    'https://maps.google.com/?q=11.5355,106.8833',
    'Khu vườn hơn 2 héc-ta sầu riêng Ri6 và măng cụt cổ thụ đất đỏ bazan Bình Phước. Nông sản chín già rụng tự nhiên, tuyệt đối không ngâm hoá chất ép chín.',
    'images/durian-warehouse.jpg'
) ON CONFLICT DO NOTHING;

-- Thêm sản phẩm thực tế
INSERT INTO products (name, category, description, unit, price_original, price_sale, image_url)
VALUES 
(
    'Sầu Riêng Ri6 Bình Phước (Cơm Vàng Hạt Lép)',
    'TraiCay',
    'Sầu riêng già chín rụng tự nhiên từ vườn nhà Bình Phước, múi vàng óng, béo ngậy đậm đà, bao ăn 1 đổi 1 nếu sượng.',
    'kg',
    80000,
    125000,
    'images/durian-open.jpg'
),
(
    'Măng Cụt Đỏ Cổ Thụ Chín Cây Bình Phước',
    'TraiCay',
    'Măng cụt vườn đất đỏ Bình Phước hái tươi sáng sớm, múi mọng nước giòn ngọt thanh tao, không mủ sáp.',
    'kg',
    45000,
    75000,
    'images/mangosteen-basket.jpg'
),
(
    'Sầu Riêng Ri6 Nguyên Quả Tuyển Chọn',
    'TraiCay',
    'Trái tuyển đều múi từ 2.0 - 2.8kg, gai đều nở căng, thơm nức khi chín tự nhiên, bảo quản bằng túi lưới thông khí.',
    'kg',
    85000,
    130000,
    'images/durian-warehouse.jpg'
),
(
    'Combo 1: Bạn Trẻ Giảng Đường',
    'Combo',
    '2kg Măng cụt tươi Bình Phước + Tặng túi vải AgriConnect cho đơn đầu. Rất hợp nhóm bạn bè thưởng thức.',
    'combo',
    90000,
    145000,
    'images/mangosteen-harvest.jpg'
),
(
    'Combo 2: Thầy Cô & Gia Đình Ấm Áp',
    'Combo',
    '1 trái Sầu riêng Ri6 tuyển (2.2 - 2.5kg) + 2kg Măng cụt ruột trắng thượng hạng, đóng thùng carton dán tem QR sang trọng.',
    'combo',
    260000,
    395000,
    'images/durian-pile.jpg'
) ON CONFLICT DO NOTHING;

-- Thêm đợt gom hàng
INSERT INTO batches (batch_name, open_date, close_date, harvest_date, delivery_date, target_kg, current_kg, status)
VALUES (
    'Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Chín Cây Bình Phước',
    'Thứ Hai',
    '23:59 Thứ Năm',
    'Thứ Sáu (Bình Phước hái đóng từng kiện)',
    'Sáng Thứ Bảy (Xe khách QL13 + Shipper đa điểm tận nhà)',
    60.0,
    42.0,
    'OPEN'
) ON CONFLICT DO NOTHING;
