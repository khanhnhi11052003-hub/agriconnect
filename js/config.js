/**
 * CẤU HÌNH HỆ THỐNG AGRICONNECT
 * 
 * 1. Supabase: Sau khi tạo project miễn phí trên https://supabase.com,
 *    hãy copy Project URL và anon public key vào đây.
 *    (Nếu để trống, web tự động dùng LocalStorage giả lập để bạn thử nghiệm ngay trên máy local).
 * 
 * 2. VietQR: Cấu hình tài khoản ngân hàng để tự động tạo mã QR chuyển khoản chuẩn NAPAS 247.
 */

window.APP_CONFIG = {
  // Cấu hình Supabase (PostgreSQL Cloud miễn phí)
  SUPABASE_URL: "", // Ví dụ: "https://your-project.supabase.co"
  SUPABASE_ANON_KEY: "", // Ví dụ: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  // Cấu hình thanh toán VietQR (Tự động sinh mã QR ngân hàng)
  // Danh sách mã ngân hàng: MB, VCB (Vietcombank), TCB (Techcombank), ACB, VPB, TPB, BIDV, CTG (VietinBank)...
  BANK: {
    BANK_ID: "MB",               // Mã ngân hàng của nhóm bạn (MB, VCB, ACB, BIDV,...)
    ACCOUNT_NO: "0987654321",    // Số tài khoản ngân hàng nhận tiền cọc/đơn
    ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI", // Tên chủ tài khoản (Viết hoa không dấu)
    TEMPLATE: "compact2"         // Giao diện VietQR: compact, compact2, qr_only
  },

  // Phí giao hàng cấu hình
  SHIPPING: {
    CAMPUS_FEE: 0,        // Nhận tại trường/cơ quan: Miễn phí
    HOME_DELIVERY_FEE: 20000 // Giao tận nhà bằng shipper Lalamove/Ahamove đa điểm: 20.000 đ
  },

  // Thông tin chiến dịch & liên hệ
  CAMPAIGN: {
    NAME: "AgriConnect Bình Phước - Mùa 1",
    BATCH_NAME: "Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Chín Cây Bình Phước",
    HOTLINE: "0987 654 321",
    ZALO: "https://zalo.me",
    DEADLINE_TEXT: "23h59 Thứ Năm hàng tuần",
    DELIVERY_SCHEDULE: "Sáng Thứ Bảy (Giao tận nhà bằng shipper công nghệ & Nhận tại trường)",
    TARGET_KG: 60.0,
    ADMIN_PIN: "123456" // Mã PIN mặc định vào trang Admin
  }
};
