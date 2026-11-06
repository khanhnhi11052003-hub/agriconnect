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
  SUPABASE_URL: "",       // Ví dụ: "https://abcxyz.supabase.co"
  SUPABASE_ANON_KEY: "",  // Ví dụ: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  // Địa chỉ website chính thức (sau khi deploy). Ví dụ: "https://agriconnect.vercel.app"
  // Để trống: tự lấy địa chỉ hiện tại (khi mở file trực tiếp trên máy, mã QR trên tem sẽ không dùng được).
  SITE_URL: "",

  // ---------------- VietQR (CẬP NHẬT SAU) ----------------
  // Mã ngân hàng: MB, VCB, TCB, ACB, VPB, TPB, BIDV, ICB (VietinBank)...
  BANK: {
    BANK_ID: "MB",
    ACCOUNT_NO: "0987654321",              // ⚠️ SỐ TÀI KHOẢN MẪU - cần thay
    ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI", // ⚠️ TÊN MẪU - viết hoa không dấu
    TEMPLATE: "compact2"
  },

  // ---------------- Phí giao hàng ----------------
  // ⚠️ HOME_DELIVERY_FEE phải trùng với số 20000 trong hàm compute_order_totals() của schema.sql
  SHIPPING: {
    CAMPUS_FEE: 0,
    HOME_DELIVERY_FEE: 20000
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
    NAME: "AgriConnect Bình Phước - Mùa 1",
    BATCH_NAME: "Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Bình Phước",
    HOTLINE: "0987 654 321",          // ⚠️ SỐ MẪU - cần thay
    ZALO: "https://zalo.me/0987654321",
    DEADLINE_TEXT: "23h59 Thứ Năm hàng tuần",
    TARGET_KG: 60.0,

    // ⚠️ Mã PIN CHỈ dùng cho chế độ DEMO (chưa có Supabase).
    // Mã này nằm công khai trong file JS nên KHÔNG phải bảo mật thật.
    // Khi chạy chế độ CLOUD, trang Admin bắt buộc đăng nhập bằng tài khoản Supabase.
    ADMIN_PIN: "123456"
  }
};
