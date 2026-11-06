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

  // ---------------- Phí giao hàng & Ưu đãi ra mắt ----------------
  // Khách chi trả phí giao tận nhà (chuẩn chi phí shipper thực tế hiện nay tại TP.HCM: 25.000 đ)
  // Ưu đãi ra mắt: Đơn từ 250.000 đ được TẶNG 100% PHÍ SHIP TẬN NHÀ (FREESHIP)!
  SHIPPING: {
    CAMPUS_FEE: 0,
    HOME_DELIVERY_FEE: 25000,
    FREESHIP_THRESHOLD: 250000
  },

  // ---------------- Khuyến mãi khi mới ra mắt ----------------
  PROMOTION: {
    LAUNCH_CODE: "AGRICONNECT",
    DISCOUNT_AMOUNT: 10000,
    GIFT_NOTE: "Tặng kèm 0.5kg Dâu da đất hoặc Chôm chôm nhãn cho 50 đơn hàng đầu tiên!",
    WARRANTY_NOTE: "Bao ăn 1 đổi 1 tận nơi nếu sượng, hư hỏng 100% miễn phí"
  },

  // ---------------- Giả định tài chính (dùng cho bảng tính ở trang Admin) ----------------
  // Đây là GIẢ ĐỊNH, cần cập nhật theo chi phí thực tế sau mỗi chuyến.
  FINANCE: {
    BUS_COST_PER_TRIP: 120000,       // Cước xe khách QL13 / chuyến
    BOX_COST_PER_ORDER: 5000,        // Thùng carton + tem / đơn
    SHIPPER_COST_PER_DROP: 25000,    // Chi phí shipper thực trả / điểm giao tận nhà (ước tính)
    DEFECT_RESERVE_PCT: 0.03,        // Quỹ dự phòng đổi trả (3% doanh thu hàng)
    MARKETING_PER_TRIP: 0            // Chi phí quảng cáo / chuyến (nếu có)
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
