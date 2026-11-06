# 🌾 BẢN KẾ HOẠCH CHIẾN LƯỢC & THIẾT KẾ HỆ THỐNG AGRICONNECT
**Dự Án Kết Nối Trực Tiếp Nông Sản Bình Phước - Người Tiêu Dùng Đô Thị & Giảng Đường**
*Phiên bản nâng cấp toàn diện: Tích hợp Nông học - UI/UX - Phân tích Dữ liệu - Kiến trúc Web - Tài chính Doanh nghiệp*

---

## Executive Summary (Tóm Tắt Điều Hành)
**AgriConnect** là mô hình thương mại điện tử chuỗi cung ứng ngắn (Short Food Supply Chain - SFSC) ứng dụng cơ chế **Gom cầu đặt trước (Pre-order Aggregation)** kết hợp **Hybrid Logistics (Trục chính xe khách QL13 + Giao đa điểm chặng cuối bằng shipper công nghệ)**. Dự án giải quyết triệt để 3 nỗi đau kinh niên của ngành nông sản:
1. *Nông dân bị ép giá & lệ thuộc thương lái trung gian.*
2. *Người tiêu dùng đô thị phải ăn trái cây ủ hóa chất bảo quản và chín ép do lưu kho dài ngày.*
3. *Mô hình khởi nghiệp sinh viên tự phát bị vỡ trận khi tăng quy mô vì thiếu tự động hóa và tự đi ship thủ công.*

---

## 🌿 I. GÓC NHÌN CHUYÊN GIA NÔNG SẢN & BẢO QUẢN SAU THU HOẠCH (POST-HARVEST AGRONOMY)

### 1. Đặc tính sinh lý học của Sầu riêng Ri6 & Măng cụt Bình Phước
* **Sầu riêng Ri6 (Trái cây có đỉnh hô hấp - Climacteric Fruit):**
  * *Nguy cơ thực tế:* Nếu hái non (chưa đủ 8.5 - 9 tuổi), sầu riêng sẽ không bao giờ chín ngọt tự nhiên mà bị sượng, nhạt nhẽo và bắt buộc thương lái phải nhúng hóa chất kích chín (Ethylene nhân tạo/phân bón lá đậm đặc).
  * *Quy chuẩn thu hái AgriConnect:* Cắt tỉa đúng độ chín sinh lý (trên 90% tuổi, gai nở căng, nứt đường chỉ cuống nhẹ, âm thanh "bộp bộp" khi gõ cán dao). Hái vào khung giờ vàng **05:30 - 08:30 sáng Thứ Sáu** để tránh tích nhiệt bức xạ mặt trời (Field Heat).
* **Măng cụt cổ thụ đất đỏ (Trái cây không đỉnh hô hấp - Non-climacteric):**
  * *Nguy cơ thực tế:* Vỏ măng cụt chứa nhiều tannin và túi mủ. Nếu va đập trong quá trình vận chuyển, mủ sẽ chảy ngược vào múi gây hiện tượng "mủ sáp", vị đắng chát và vỏ bị chai cứng.
  * *Quy chuẩn thu hái AgriConnect:* Chỉ hái ở giai đoạn điểm màu da cam đốm tím (Giai đoạn 3-4), cuống còn tươi xanh. Dùng vợt có túi vải đỡ từng quả, tuyệt đối không để rơi chạm đất.

### 2. Quy trình kiểm soát chất lượng & Đóng gói không hóa chất
```
[HÁI SÁNG SỚM] ➔ [HẠ NHIỆT TỰ NHIÊN (PRE-COOLING)] ➔ [LỰA LOẠI 1 & CÂN] ➔ [ĐÓNG THÙNG BẢO VỆ]
05:30 - 08:30        Phơi gió quạt mát 60 phút         Loại bỏ quả dị tật       Thùng carton đục lỗ + chống sốc
```
* **Kỹ thuật đóng thùng bảo vệ:**
  * **Sầu riêng:** Đặt trong túi lưới thông khí chuyên dụng, chèn bìa carton ngăn gai va đập giữa các quả.
  * **Măng cụt:** Lót giấy tổ ong hoặc rơm khô sạch đáy và thành hộp, chia từng lớp không quá 3 tầng để tránh đè nén vỡ quả.
  * **Tem niêm phong bảo chứng:** Dán tem QR niêm phong miệng thùng tại vườn Bình Phước lúc 16:30 Thứ Sáu.

---

## 🎨 II. GÓC NHÌN CHUYÊN GIA UI/UX (USER EXPERIENCE & CONVERSION OPTIMIZATION)

### 1. Phân tích Hành vi & Tâm lý Khách hàng mục tiêu
* **Đối tượng 1: Thầy Cô Giảng viên & Cán bộ trường:**
  * *Tâm lý:* Coi trọng nguồn gốc rõ ràng, cần biếu tặng hoặc cho gia đình, sẵn sàng trả giá cao nếu đảm bảo bao ăn, ngại thủ tục đặt hàng phức tạp.
  * *UX Solution:* Nhấn mạnh bảo chứng nhà vườn Bác Năm, cam kết 1 đổi 1 tận nơi, gói Combo quà tặng lịch sự.
* **Đối tượng 2: Bạn Sinh viên & Nhóm trọ:**
  * *Tâm lý:* Nhạy cảm về giá, thích mua chung chia tiền, chuộng thanh toán chuyển khoản quét QR hoặc nhận hàng COD.
  * *UX Solution:* Thiết kế Combo Bạn Trẻ Tiết Kiệm, chia sẻ link nhóm, sinh mã VietQR hiển thị ngay trên màn hình.
* **Đối tượng 3: Hộ gia đình đô thị (Bình Dương, TP.HCM):**
  * *Tâm lý:* Muốn nhận hàng tận cửa nhà đúng sáng Thứ Bảy để kịp chuẩn bị bữa ăn cuối tuần.
  * *UX Solution:* Switcher 1-chạm giữa "Giao Tận Cửa" và "Nhận Tại Trường", tự động tính phí ship minh bạch.

### 2. Nguyên lý Thiết kế & Tối ưu Luồng Chuyển Đổi (Checkout Funnel)
* **Quy luật Hick & Fitts (Giảm ma sát tối đa):**
  * Không bắt người dùng tạo tài khoản/đăng nhập.
  * Quy trình đặt hàng rút gọn trong **1 màn hình duy nhất (One-page Checkout)**: Chỉ 3 khối thông tin (Ai nhận? ➔ Nhận ở đâu? ➔ Mua món gì?).
* **Tác động tâm lý Loss Aversion (Nỗi sợ bỏ lỡ):**
  * Đồng hồ đếm ngược Live Countdown đếm lùi từng giây tới 23h59 Thứ Năm.
  * Thanh tiến độ gom tải xe khách (42/60kg) kích thích hành vi "đặt sớm kẻo hết chuyến xe".
* **Trải nghiệm Unboxing & Hậu mãi với Tem QR:**
  * Khi nhận thùng hàng vào sáng Thứ Bảy, khách quét camera vào tem trên nắp hộp để mở trang `trace.html`.
  * Trang xác thực hiển thị ảnh chụp vựa thực tế, tọa độ GPS vườn, và nút bấm 1-chạm "Chat Zalo Báo Sượng Đổi Mới".

---

## 📊 III. GÓC NHÌN CHUYÊN GIA PHÂN TÍCH DỮ LIỆU (DATA ANALYTICS & LOGISTICS OPTIMIZATION)

### 1. Hệ thống Chỉ số Đo lường Hiệu quả (KPI & Metrics Hierarchy)
Hệ thống quản trị `admin.html` theo dõi 4 tầng chỉ số cốt lõi:
1. **Acquisition (Thu hút):** Lượng truy cập chiến dịch (Visits), Tỷ lệ chuyển đổi đơn hàng ($CVR = \frac{\text{Orders}}{\text{Visits}} \times 100\%$, mục tiêu $\ge 12\%$).
2. **Order Economics (Quy mô đơn):** Giá trị trung bình đơn ($AOV = \frac{\text{Doanh thu}}{\text{Số đơn}}$, mục tiêu $\ge 250.000\text{ đ}$), Số lượng sản phẩm/đơn ($Basket Size \ge 2.2\text{ item}$).
3. **Logistics Efficiency (Hiệu quả vận tải):** Tỷ lệ đầy tải xe khách ($Load Factor = \frac{\text{Kg thực tế}}{\text{Kg mục tiêu}} \ge 85\%$), Mật độ giao đa điểm ($Drop Density = \frac{\text{Số đơn}}{\text{Tuyến đường km}}$).
4. **Quality & Retention (Chất lượng & Trung thành):** Tỷ lệ khiếu nại đền bù ($Defect Rate \le 3\%$), Tỷ lệ khách mua lại tuần kế tiếp ($Repeat Rate \ge 35\%$).

### 2. Tối ưu hóa Tuyến đường Giao hàng Đa điểm (Vehicle Routing Optimization)
* **Vấn đề:** 30-50 đơn giao lẻ khắp TP.HCM nếu không gom tuyến sẽ khiến cước shipper công nghệ tăng vọt.
* **Thuật toán xử lý trên trang Admin:**
  1. Tự động chuẩn hóa địa chỉ thành 3 cụm (Cluster):
     * *Cụm Bắc/Đông Bắc:* TP. Thủ Đức, Dĩ An, Thuận An (gần trục QL13 đón xe khách sớm nhất).
     * *Cụm Trung Tâm:* Quận 1, Quận 3, Bình Thạnh, Phú Nhuận.
     * *Cụm Nam:* Quận 7, Nhà Bè, Quận 4.
  2. Nút bấm **"Xuất Lộ Trình Shipper"** tự sắp xếp các điểm theo thứ tự cự ly ngắn nhất (Nearest Neighbor) để dán trực tiếp vào đơn đặt xe Lalamove/Ahamove Multi-drop 5-8 điểm/tuyến, tối ưu cước chỉ còn ~15.000 - 18.000 đ/điểm!

---

## 💻 IV. GÓC NHÌN KIẾN TRÚC SƯ CÔNG NGHỆ (SOFTWARE ARCHITECTURE & DEVSECOPS)

```
[CLIENT / FRONTEND]
  HTML5 + Tailwind CSS + Vanilla JS (Zero Build Step, Native Performance)
       │                                         │
       ▼ (Direct API Call)                       ▼ (Direct Bank API)
[SUPABASE CLOUD (PostgreSQL)]            [VIETQR GATEWAY (NAPAS 247)]
  - RLS Security Policies                   - Live QR Generator
  - Realtime Table Subscriptions             - Compact2 Format
       │
       ▼ (Auto Continuous Deployment)
[VERCEL EDGE NETWORK]
  - Global SSL/HTTPS CDN (< 1s TTI)
  - 100% Free Hosting
```

### 1. Kiến trúc JAMstack Zero-Cost & Dual-Mode
* **Không tốn 1 đồng chi phí hạ tầng (Zero Infrastructure Cost):**
  * Không cần thuê máy chủ VPS, không cần backend Node.js nặng nề. Toàn bộ logic chạy client-side kết hợp Supabase BaaS (Backend-as-a-Service).
* **Cơ chế Dual-Mode thông minh (`AgriDB`):**
  * *Chế độ 1 (Offline/Local Demo):* Sử dụng `LocalStorage` tự khởi tạo dữ liệu mẫu, cho phép chạy thử và thuyết trình ngay cả khi phòng hội thảo mất mạng Internet.
  * *Chế độ 2 (Cloud Production):* Tự động chuyển sang Supabase PostgreSQL khi điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` vào `config.js`.

### 2. Bảo mật & Toàn vẹn Dữ liệu (Row-Level Security)
* Bảng `orders` được áp dụng chính sách: Khách vãng lai (`anon`) chỉ được phép `INSERT` đơn mới và `SELECT` thông tin đơn của chính mình qua mã đơn duy nhất, tuyệt đối không lộ danh sách số điện thoại hay địa chỉ của khách hàng khác.
* Trang quản trị `admin.html` có mã PIN bảo vệ và phân quyền truy cập.

---

## 💵 V. GÓC NHÌN CHUYÊN GIA TÀI CHÍNH & KINH TẾ NÔNG NGHIỆP (CFO & FINANCIAL MODELING)

### 1. Chu kỳ Chuyển đổi Tiền mặt Âm (Negative Cash Conversion Cycle - "Vốn Tự Sinh")
Đây là đòn bẩy tài chính thông minh nhất của mô hình AgriConnect:
* **Thứ Hai - Thứ Năm:** Khách đặt đơn và quét mã VietQR thanh toán 100% (hoặc cọc 50%). Nhóm thu tiền trước từ người mua.
* **Thứ Sáu:** Dùng chính nguồn tiền đã thu để thanh toán tiền trái cây tại vườn cho Bác Năm.
* **Thứ Bảy:** Thanh toán cước xe khách và tiền shipper sau khi hoàn tất chuyến hàng.
* 👉 **Kết luận:** *Dự án có nhu cầu vốn lưu động bằng 0 (Zero Working Capital Requirement). Nhóm sinh viên không cần vay vốn hay bỏ tiền túi ôm hàng.*

### 2. Bảng Phân Tích Đơn Vị Kinh Tế (Unit Economics) Cho 1 Chuyến Hàng 60kg

| Chỉ số tài chính | Công thức / Căn cứ tính toán | Giá trị (VNĐ) | Tỷ lệ (%) |
| :--- | :--- | :--- | :--- |
| **Tổng Doanh Thu (Gross Revenue)** | 30kg Sầu riêng (125k) + 30kg Măng cụt (75k) | **6.000.000 đ** | **100.0%** |
| *(-) Tiền trả nhà vườn (COGS)* | 30kg Sầu (80k) + 30kg Măng cụt (45k) | 3.750.000 đ | 62.5% |
| **Lợi Nhuận Gộp 1 (Gross Profit 1)** | Doanh thu - Giá vốn nhà vườn | **2.250.000 đ** | **37.5%** |
| *(-) Cước xe khách QL13* | Trọn gói toàn chuyến 60kg về TP.HCM | 120.000 đ | 2.0% |
| *(-) Thùng carton + Tem QR dán kiện* | 20 đơn hàng × 5.000 đ/thùng | 100.000 đ | 1.7% |
| *(-) Hỗ trợ ship chặng cuối* | Bù cước sau khi khách đã trả 20k/đơn | 100.000 đ | 1.7% |
| *(-) Dự phòng hao hụt / Đổi sượng (3%)* | Quỹ bảo hành 1 đổi 1 cam kết | 180.000 đ | 3.0% |
| **LỢI NHUẬN RÒNG CUỐI CÙNG (NET PROFIT)**| Lợi nhuận gộp - Toàn bộ chi phí vận hành | **1.700.000 đ** | **28.3%** |

> **Nhận định của CFO:** Biên lợi nhuận ròng **28.3%** là con số mơ ước trong ngành bán lẻ nông sản tươi sống (vốn thường chỉ đạt 5-8% do hao hụt tồn kho). Nhờ triệt tiêu 100% rủi ro hàng tồn qua mô hình Pre-order, AgriConnect đạt hiệu quả dòng tiền vượt trội.

### 3. Phân tích Điểm Hòa Vốn (Break-even Analysis)
* Chi phí cố định cho mỗi chuyến hàng xe khách: $F = 120.000\text{ đ (xe)} + 100.000\text{ đ (vật tư cố định)} = 220.000\text{ đ}$.
* Lãi gộp đóng góp trên mỗi kg nông sản trung bình: $CM = 37.500\text{ đ/kg}$.
* **Sản lượng hòa vốn tối thiểu:** $Q_{BEP} = \frac{220.000}{37.500} \approx 5.86\text{ kg}$.
* 👉 *Chỉ cần có 3 khách đặt (khoảng 6kg) là chuyến xe đã không bị lỗ! Mọi kg từ mức thứ 7 trở đi đều tạo ra lợi nhuận ròng.*

---

## 🚀 VI. LỘ TRÌNH 4 BƯỚC TRIỂN KHAI THỰC TẾ (ACTION ROADMAP)

```
[BƯỚC 1: LOCAL TEST]      ➔    [BƯỚC 2: GITHUB PUSH]    ➔    [BƯỚC 3: SUPABASE CLOUD]    ➔    [BƯỚC 4: VERCEL LIVE]
Chạy thử trên trình duyệt       Lưu trữ mã nguồn an toàn       Khởi tạo database miễn phí         Phát hành web toàn cầu
```

### Bước 1: Khảo sát & Kiểm tra trên máy tính cá nhân
* Mở trực tiếp [`index.html`](file:///D:/Antigravity/Dự%20Án%20AgriConnect/index.html) để kiểm tra giao diện, giỏ hàng, bộ đếm ngược và modal VietQR.
* Mở [`admin.html`](file:///D:/Antigravity/Dự%20Án%20AgriConnect/admin.html) để test tính năng xuất tuyến shipper và in thử nhãn thùng hàng.

### Bước 2: Đẩy toàn bộ mã nguồn lên GitHub
Dự án đã được khởi tạo sẵn Git commit. Mở PowerShell và chạy:
```powershell
cd "D:\Antigravity\Dự Án AgriConnect"
git remote add origin https://github.com/<tai-khoan-cua-ban>/agriconnect.git
git push -u origin main
```

### Bước 3: Thiết lập Cơ sở dữ liệu Supabase (PostgreSQL)
1. Đăng ký tại [supabase.com](https://supabase.com) ➔ New Project `agriconnect` (khu vực Singapore).
2. Vào **SQL Editor** ➔ Dán toàn bộ nội dung file [`supabase/schema.sql`](file:///D:/Antigravity/Dự%20Án%20AgriConnect/supabase/schema.sql) ➔ Bấm **Run**.
3. Copy **Project URL** và **anon key** dán vào file [`js/config.js`](file:///D:/Antigravity/Dự%20Án%20AgriConnect/js/config.js).

### Bước 4: Deploy miễn phí lên Vercel
1. Đăng nhập [vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **Add New Project** ➔ Chọn repo `agriconnect` ➔ Bấm **Deploy**.
3. Nhận ngay link web chính thức có SSL xanh: `https://agriconnect-xxx.vercel.app`.

---

## 🏆 VII. LUẬN ĐIỂM CHIẾN LƯỢC KHI BẢO VỆ ĐỀ TÀI / PITCHING KHỞI NGHIỆP

Khi đứng trước Hội đồng Giám khảo, hãy trình bày bằng 3 thông điệp đanh thép sau:

1. **Về Tính Khả Thi Công Nghệ (Technical Viability):**
   > *"Chúng em không xây dựng một ứng dụng viển vông tốn kém. Toàn bộ nền tảng vận hành trên mô hình Jamstack 0 đồng kết hợp VietQR của Ngân hàng Nhà nước, sẵn sàng phục vụ hàng nghìn người dùng đồng thời mà không tốn chi phí vận hành server."*

2. **Về Tính Mở Rộng Vận Hành (Operational Scalability):**
   > *"AgriConnect giải quyết triệt để nút thắt cổ chai logistics của sinh viên: Tuyến đường dài gom hàng giá rẻ qua xe khách liên tỉnh QL13, chặng cuối ủy thác cho shipper công nghệ giao đa điểm. Mô hình tăng trưởng từ 50 đơn lên 500 đơn mà không cần tăng thêm 1 nhân sự giao hàng nào."*

3. **Về Tính Bền Vững Tài Chính (Financial Sustainability):**
   > *"Nhờ mô hình đặt trước thu tiền trước, chu kỳ tiền mặt của chúng em là chu kỳ âm. Điểm hòa vốn chỉ 6kg nông sản. Doanh nghiệp sinh viên có lãi ngay từ tuần đầu tiên vận hành và hoàn toàn tự chủ tài chính."*
