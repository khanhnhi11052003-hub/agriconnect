# 🌾 AgriConnect: NỀN TẢNG NÔNG SẢN MINH BẠCH BÌNH PHƯỚC
**Mô hình Hybrid Logistics: Xe khách QL13 & Shipper Công Nghệ Đa Điểm (Lalamove / Ahamove)**

Dự án phục vụ đề tài nghiên cứu kinh tế và cuộc thi khởi nghiệp đổi mới sáng tạo, giải quyết bài toán tiêu thụ sầu riêng Ri6 và măng cụt chín cây từ nhà vườn Bình Phước đến giảng đường và từng hộ gia đình đô thị.

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```
Dự Án AgriConnect/
├── css/
│   └── style.css                 # Giao diện, hiệu ứng chuyển động & CSS in ấn nhãn thùng
├── images/                       # 5 hình ảnh thực tế từ vựa & vườn Bình Phước
│   ├── durian-open.jpg           # Sầu riêng Ri6 múi vàng óng béo ngậy
│   ├── durian-pile.jpg           # Núi sầu riêng chuẩn bị đóng thùng
│   ├── durian-warehouse.jpg      # Bãi tập kết sầu riêng tại kho
│   ├── mangosteen-basket.jpg     # Sọt măng cụt đỏ tuyển chọn loại 1
│   └── mangosteen-harvest.jpg    # Bãi măng cụt vừa thu hái trên bạt tại vườn
├── js/
│   ├── config.js                 # Cấu hình Supabase, tài khoản ngân hàng VietQR & chiến dịch
│   ├── supabaseClient.js         # Kết nối Supabase Cloud & Mock Database LocalStorage
│   ├── app.js                    # Logic trang đặt hàng, giỏ hàng, tính cước & sinh mã VietQR
│   └── admin.js                  # Logic trang quản trị, xuất lộ trình shipper, in tem nhãn
├── supabase/
│   └── schema.sql                # File SQL tạo bảng Supabase (farms, products, orders,...)
├── index.html                    # Trang chủ & form đặt hàng khách hàng
├── admin.html                    # Trang quản trị nhóm, báo cáo tài chính & xuất tuyến ship
├── trace.html                    # Trang quét tem QR truy xuất nguồn gốc lô hàng
├── contact.html                  # Trang liên hệ & giới thiệu mô hình chuỗi ngắn
├── vercel.json                   # Cấu hình routing tối ưu khi deploy Vercel
├── .gitignore                    # Bỏ qua các file không cần thiết khi đẩy lên Git
├── KE_HOACH_PHAT_TRIEN_WEBSITE.md# Kế hoạch phát triển chi tiết dự án
└── HUONG_DAN_TRIEN_KHAI.md       # Tài liệu hướng dẫn 4 bước triển khai chi tiết
```

---

## 🚀 HƯỚNG DẪN 4 BƯỚC: LOCAL ➔ GITHUB ➔ SUPABASE ➔ VERCEL

### BƯỚC 1: KIỂM TRA & CHẠY THỬ TRÊN LOCAL (MÁY TÍNH BẠN)
1. Bạn có thể mở trực tiếp file `index.html` bằng trình duyệt (Google Chrome, Cốc Cốc, Edge, Firefox).
2. Web đã được thiết lập sẵn **Mock Database Dual-Mode thông minh**:
   - Khi chưa điền Supabase key, web tự động lưu đơn hàng và dữ liệu vào trình duyệt của bạn (LocalStorage).
   - Bạn có thể đặt hàng thử nghiệm, xem mã VietQR sinh tự động, vào `admin.html` để kiểm tra đơn, in thử tem phiếu giao hàng và xem bảng tính lợi nhuận ròng!

---

### BƯỚC 2: TẠO VÀ LƯU TRỮ DỮ LIỆU MIỄN PHÍ TRÊN SUPABASE (POSTGRESQL)
1. Truy cập [https://supabase.com](https://supabase.com) và đăng ký tài khoản miễn phí (bằng GitHub hoặc Google).
2. Bấm nút **"New Project"**:
   - Project Name: `agriconnect`
   - Database Password: Nhập mật khẩu bạn tự đặt (nhớ lưu lại).
   - Region: Chọn `Southeast Asia (Singapore)` để tốc độ kết nối tại Việt Nam nhanh nhất.
3. Khi project tạo xong (khoảng 1-2 phút):
   - Vào menu bên trái chọn biểu tượng **SQL Editor** ➔ Bấm **"New query"**.
   - Mở file `supabase/schema.sql` trong thư mục dự án này, copy toàn bộ nội dung và dán vào ô SQL Editor.
   - Bấm nút xanh **"Run"**. Toàn bộ các bảng `farms`, `products`, `batches`, `orders`, `financial_metrics` cùng dữ liệu mẫu Bình Phước và chính sách bảo mật RLS sẽ được tạo ngay tức khắc!
4. Lấy API Key để kết nối với Web:
   - Vào mục **Project Settings** (biểu tượng bánh răng) ➔ Chọn thẻ **API**.
   - Copy mục **Project URL** và **anon public key**.
   - Mở file `js/config.js` trong thư mục máy bạn và dán vào:
   ```javascript
   SUPABASE_URL: "https://your-project-id.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

---

### BƯỚC 3: ĐẨY TOÀN BỘ MÃ NGUỒN LÊN GITHUB (MIỄN PHÍ)

Bạn có thể chọn 1 trong 2 cách sau:

#### Cách A: Dùng Git dòng lệnh (Khuyên dùng)
Mở PowerShell tại thư mục `D:\Antigravity\Dự Án AgriConnect` và chạy các lệnh:
```powershell
git init
git add .
git commit -m "Khoi tao du an AgriConnect Binh Phuoc"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/agriconnect.git
git push -u origin main
```

#### Cách B: Kéo thả trực tiếp trên trang web GitHub
1. Vào [https://github.com](https://github.com) ➔ Bấm **"New repository"**.
2. Đặt tên repository: `agriconnect` ➔ Chọn chế độ **Public** ➔ Bấm **Create repository**.
3. Bấm vào dòng chữ **"uploading an existing file"**, kéo toàn bộ các file và thư mục trong dự án thả vào trình duyệt rồi bấm **Commit changes**.

---

### BƯỚC 4: KẾT NỐI VÀ DEPLOY LÊN VERCEL APP (MIỄN PHÍ 100%)
1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Bấm nút **"Add New..."** ➔ Chọn **Project**.
3. Vercel sẽ tự động liệt kê các repository của bạn. Bấm nút **"Import"** cạnh dự án `agriconnect`.
4. Giữ nguyên toàn bộ cấu hình mặc định ➔ Bấm nút **"Deploy"**.
5. Trong vòng 15-30 giây, Vercel sẽ cấp cho bạn một đường link web miễn phí toàn cầu có đuôi dạng:
   `https://agriconnect-xxx.vercel.app`
6. Mỗi lần bạn cập nhật mã nguồn trên GitHub, Vercel sẽ **tự động build và đồng bộ web online ngay lập tức**!

---

## ⚙️ HƯỚNG DẪN ĐIỀU CHỈNH THÔNG TIN DỰ ÁN (BẠN ĐIỀU CHỈNH SAU)

Khi muốn thay đổi thông tin số tài khoản ngân hàng hoặc giá bán:

1. **Thay đổi tài khoản nhận tiền VietQR:**
   Mở file `js/config.js`, tìm đến mục `BANK`:
   ```javascript
   BANK: {
     BANK_ID: "MB",               // Mã ngân hàng: MB, VCB, TCB, ACB, BIDV, VPB, TPB...
     ACCOUNT_NO: "0987654321",    // Số tài khoản ngân hàng của bạn
     ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI", // Tên chủ tài khoản viết hoa không dấu
     TEMPLATE: "compact2"
   }
   ```
2. **Thay đổi giá bán & thông tin nông sản:**
   - Khi chạy Local: Chỉnh sửa trực tiếp mảng sản phẩm trong file `js/supabaseClient.js`.
   - Khi đã dùng Supabase: Mở bảng `products` trên trang quản trị Supabase Table Editor để sửa giá bán (`price_sale`) hoặc giá vốn (`price_original`) trực tiếp trên giao diện trực quan!
