/**
 * CẤU HÌNH HỆ THỐNG AGRICONNECT
 *
 * 1. Supabase: Sau khi tạo project miễn phí trên https://supabase.com,
 *    copy Project URL và anon public key vào đây.
 *    - Để trống  => web chạy chế độ DEMO, dữ liệu lưu trong trình duyệt (LocalStorage).
 *    - Điền đủ   => web chạy chế độ CLOUD, dữ liệu lưu trên Supabase.
 *    (anon key được phép công khai; dữ liệu được bảo vệ bằng RLS trong supabase/schema.sql)
 *
 * 2. VietQR: Tài khoản ngân hàng nhận tiền (mã QR chuẩn NAPAS 247).
 *
 * 3. SITE_URL: Địa chỉ web sau khi deploy Vercel (dùng để in mã QR trên tem thùng hàng).
 */

window.APP_CONFIG = {
  // ---------------- Supabase ----------------
  SUPABASE_URL: "https://lrzjsmjjqqygqesaltpl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_0zU88ThdIESJurt5Ht-TcQ_7GUe-Cqc",

  // Địa chỉ website chính thức (sau khi deploy). Ví dụ: "https://agriconnect.vercel.app"
  // Để trống: tự lấy địa chỉ hiện tại (khi mở file trực tiếp trên máy, mã QR trên tem sẽ không dùng được).
  SITE_URL: "https://agriconnect-yagt.vercel.app",

  // ---------------- VietQR ----------------
  // Ngân hàng Vietcombank (VCB)
  BANK: {
    BANK_ID: "VCB",
    ACCOUNT_NO: "1020202919",
    ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI",
    TEMPLATE: "compact2"
  },

  // ---------------- Phí giao hàng & Điều kiện Freeship (Chuẩn Tối Ưu Biên Lợi Nhuận) ----------------
  // - Đơn dưới 350.000 đ: Thu phí đồng giá 25.000 đ (Thanh toán trước Ví Escrow) hoặc 35.000 đ (COD) để chống bù lỗ cước ship
  // - Đơn từ 350.000 đ trở lên: TẶNG 100% PHÍ SHIP TẬN NHÀ (FREESHIP) vì lãi gộp đơn >=350k đủ cover toàn bộ chi phí Logistics!
  SHIPPING: {
    CAMPUS_FEE: 0,
    HOME_DELIVERY_FEE: 25000,
    COD_DELIVERY_FEE: 35000,
    FREESHIP_THRESHOLD: 350000
  },

  // ---------------- Khuyến mãi & Thu hồi vật tư (Circular Packaging) ----------------
  PROMOTION: {
    LAUNCH_CODE: "AGRICONNECT",
    DISCOUNT_AMOUNT: 10000,
    RETURN_BOX_VOUCHER: 10000,       // Đổi thùng trống đợt trước nhận ngay voucher giảm 10.000 đ (tiết kiệm chi phí thùng)
    GIFT_NOTE: "Tặng kèm 0.5kg Dâu da đất hoặc Chôm chôm nhãn cho đơn đạt mốc Freeship 350k!",
    WARRANTY_NOTE: "Bao ăn 1 đổi 1 tận nơi nếu sượng, hư hỏng 100% miễn phí"
  },

  // ---------------- Cấu hình Tài chính, Điểm Hòa Vốn & Công Nợ (Unit Economics) ----------------
  FINANCE: {
    BUS_COST_PER_TRIP: 120000,       // Cước xe lạnh/xe khách liên tỉnh cố định / chuyến
    BOX_COST_PER_ORDER: 5000,        // Chi phí thùng carton/xốp + tem QR / đơn (giảm còn 1.500đ nếu thu hồi thùng)
    SHIPPER_COST_PER_DROP: 20000,    // Cước shipper chặng cuối (25.000đ cuốc lẻ; giảm 20-25% còn 18.000đ-20.000đ khi Gom Tuyến Đa Điểm)
    DEFECT_RESERVE_PCT: 0.05,        // Quỹ dự phòng hao hụt tự nhiên & đổi trả 5% giai đoạn đầu (tránh "lãi giả, lỗ thật")
    MARKETING_PER_TRIP: 0,           // Chi phí quảng cáo / chuyến
    MIN_VIABLE_LOAD_KG: 35.0,        // Mức trần gom đơn tối thiểu (MVL): Phải đạt >= 35kg mới xuất xe
    TARGET_AOV: 350000,              // Mục tiêu Giá trị đơn trung bình (AOV > 350.000 đ)
    FARM_CREDIT_DAYS: 4              // Chính sách gối đầu công nợ nhà vườn 3-5 ngày (giữ dòng tiền lưu động trả cước xe)
  },

  // ---------------- Gom tuyến giao hàng ----------------
  ROUTING: {
    MAX_STOPS_PER_ROUTE: 8           // Số điểm tối đa mỗi tuyến shipper (kiểm tra giới hạn thực tế của ứng dụng giao hàng)
  },

  // ---------------- Chiến dịch & liên hệ ----------------
  CAMPAIGN: {
    NAME: "AgriConnect - Đặc Sản Các Vùng Miền",
    BATCH_NAME: "Đợt Gom Hàng #01: Đặc Sản Trái Cây Chín Cây Các Vùng Miền",
    HOTLINE: "0784 203 424",
    ZALO: "https://zalo.me/0784203424",
    DEADLINE_TEXT: "23h59 Thứ Năm hàng tuần",
    TARGET_KG: 60.0,

    // ⚠️ Mã PIN CHỈ dùng cho chế độ DEMO (chưa có Supabase).
    // Mã này nằm công khai trong file JS nên KHÔNG phải bảo mật thật.
    // Khi chạy chế độ CLOUD, trang Admin bắt buộc đăng nhập bằng tài khoản Supabase.
    ADMIN_PIN: "123456"
  }
};
