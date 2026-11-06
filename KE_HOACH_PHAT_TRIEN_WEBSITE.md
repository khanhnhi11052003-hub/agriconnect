# 📋 KẾ HOẠCH PHÁT TRIỂN DỰ ÁN & WEBSITE AGRICONNECT
**Nền Tảng Kết Nối Nông Dân Bình Phước - Người Tiêu Dùng Đô Thị & Giảng Đường**
*Mô hình: Chuỗi cung ứng ngắn (Short Food Supply Chain) & Hybrid Logistics Đa Điểm*

---

## 📌 I. TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIÊN CỨU

### 1. Bối cảnh thị trường
* **Thực trạng nông sản Bình Phước:** Các đặc sản như Sầu riêng Ri6, Măng cụt cổ thụ đất đỏ bazan có chất lượng hàng đầu nhưng thường bị phụ thuộc vào thương lái trung gian, dẫn đến tình trạng "được mùa mất giá", bị ép giá hoặc nông sản bị xử lý hóa chất để bảo quản khi lưu kho dài ngày.
* **Nhu cầu người tiêu dùng đô thị (TP.HCM, Bình Dương):** Giảng viên, sinh viên và các hộ gia đình đô thị khao khát nông sản sạch chín cây tự nhiên, minh bạch nguồn gốc và cam kết không hóa chất kích chín, sẵn sàng đặt trước (Pre-order) nếu đảm bảo chất lượng.

### 2. Mục tiêu dự án
1. **Kết nối trực tiếp:** Cắt giảm khâu trung gian, đưa trái chín già từ vườn nhà Bình Phước đến tận cửa nhà/giảng đường trong vòng dưới 24 giờ sau thu hái.
2. **Cơ chế gom cầu (Pre-order Aggregation):** Chỉ thu hoạch theo đúng số lượng đơn đặt trước từ Thứ 2 đến Thứ 5, đạt đủ tải chuyến xe khách, hạn chế 100% rủi ro tồn kho nông sản.
3. **Mô hình Hybrid Logistics (Giao tận nhà):** Kết hợp trục vận tải chính giá rẻ (Xe khách QL13) với mạng lưới giao hàng công nghệ chặng cuối (Ahamove / Lalamove đa điểm - Multi-drop).

---

## 🚚 II. QUY TRÌNH VẬN HÀNH LOGISTICS 1 TUẦN (THEO CHU KỲ)

```
[THỨ 2 - THỨ 5]                 [THỨ 6: TẠI BÌNH PHƯỚC]               [THỨ 7: GIAO TẬN CỬA]
Khách đặt hàng trên Web    ➔    Nhà vườn cắt trái già chín cây   ➔    06:30: Xe khách cập bến TP.HCM
Điền địa chỉ nhà / trường        Đóng thùng riêng từng đơn hàng        07:30: Shipper Lalamove/Ahamove nhận
Chốt đơn lúc 23h59 Thứ 5         Dán tem QR + Phiếu ship từng đơn      08:00 - 11:30: Giao thẳng tận tay
```

### 1. Chặng 1: Nhận đơn & Lập lộ trình giao hàng (Thứ Hai - Thứ Năm)
* Khách hàng đặt mua trên website, lựa chọn nhận tại sảnh trường đại học (miễn phí) hoặc giao tận nhà/phòng trọ (+20.000 đ phí hỗ trợ ship).
* **23h59 Thứ Năm:** Hệ thống chốt danh sách.
* Thành viên Quản trị xuất dữ liệu từ trang `admin.html` để gom tuyến giao hàng tối ưu (Route Optimization) chuẩn bị đặt tài xế giao đa điểm.

### 2. Chặng 2: Thu hoạch & Đóng gói cá nhân hóa (Thứ Sáu tại Bình Phước)
* Nhà vườn tại Bình Phước (Hộ Bác Năm - Đồng Phú) thu hái sầu riêng già rụng tự nhiên và măng cụt chín cây theo đúng số lượng đặt trước.
* **Đóng gói cá nhân hóa (Per-order packaging):**
  * Mỗi đơn được đóng vào thùng carton riêng biệt.
  * Dán tem truy xuất nguồn gốc QR Code của AgriConnect (quét để vào trang `trace.html`).
  * Dán phiếu giao hàng (Shipping Label) ghi rõ: Mã đơn, Tên người nhận, SĐT, Địa chỉ giao hàng cụ thể, Số tiền thu hộ COD.
* **17:00 Thứ Sáu:** Gửi toàn bộ các kiện hàng lên chuyến xe khách quen chạy tuyến QL13 (Bình Phước ➔ TP.HCM).

### 3. Chặng 3: Giao hàng thẳng đến địa chỉ khách hàng (Sáng Thứ Bảy)
* **06:30 - 07:00:** Xe khách cập bến/văn phòng nhà xe tại TP.HCM.
* **07:15:** Nhóm đặt dịch vụ giao hàng đa điểm (Ahamove / Lalamove).
* **07:30 - 11:30:** Tài xế nhận các kiện hàng tại nhà xe và phân phối trực tiếp đến tận tay từng khách hàng theo lộ trình được định tuyến sẵn.
* Nhóm sinh viên theo dõi tiến độ trên ứng dụng (Tracking) và hỗ trợ liên hệ khi khách không nghe máy, không phải tự chạy xe máy giao từng nơi!

---

## 💰 III. CẤU TRÚC CHI PHÍ & TÀI CHÍNH THỰC CHỨNG (UNIT ECONOMICS)

| Khoản mục chi phí | Cách tính thực tế | Đơn giá dự kiến | Tỷ trọng |
| :--- | :--- | :--- | :--- |
| **Giá vốn nông sản tại vườn** | Trả trực tiếp cho nhà vườn Bình Phước | Sầu riêng: ~80.000 đ/kg<br>Măng cụt: ~45.000 đ/kg | ~55% - 60% |
| **Cước xe khách QL13** | Tính gộp trọn gói cho toàn chuyến hàng | ~100.000 - 120.000 đ / chuyến | ~3% - 5% |
| **Thùng carton & Tem QR** | Đóng gói bảo vệ từng đơn hàng | ~5.000 đ / hộp | ~2% - 3% |
| **Cước Shipper giao đa điểm** | Lalamove / Ahamove giao chặng cuối | ~15.000 - 20.000 đ / điểm giao | Phụ phí ship thu bù |
| **Doanh thu bán lẻ** | Thu từ khách hàng (VietQR / COD) | Sầu riêng: 125.000 đ/kg<br>Măng cụt: 75.000 đ/kg | 100% |
| **Biên lợi nhuận ròng dự kiến** | Doanh thu - Tổng chi phí | **Lợi nhuận ròng đạt 20% - 30%** | **20% - 30%** |

---

## 💻 IV. KIẾN TRÚC CÔNG NGHỆ WEBSITE (100% MIỄN PHÍ)

### 1. Kiến trúc hệ thống
* **Frontend:** HTML5, Tailwind CSS, FontAwesome, Vanilla JS (không dùng framework cồng kềnh, tải cực nhanh trên điện thoại).
* **Cơ sở dữ liệu:** Supabase PostgreSQL Cloud (Miễn phí 500MB, bảo mật RLS).
* **Mã nguồn:** GitHub Repository (`agriconnect`).
* **Hosting:** Vercel App (SSL/HTTPS tự động, đồng bộ tức thì với GitHub).
* **Cổng thanh toán:** VietQR API (chuẩn NAPAS 247, tự động sinh mã chuyển khoản chính xác).

### 2. Cấu trúc các trang web
1. **`index.html` (Giao diện khách hàng):**
   * Đếm ngược thời gian chốt đơn (23h59 Thứ Năm).
   * Thanh tiến độ gom tải xe khách QL13 (kg).
   * Thư viện 5 ảnh thực tế chụp tại vựa & vườn Bình Phước.
   * Form đặt hàng thông minh: Chọn Giao tận nhà (nhập số nhà, đường, phường, quận) hoặc Nhận tại trường đại học.
   * Modal thanh toán VietQR tự động.
2. **`admin.html` (Quản trị & Báo cáo Đi Thi):**
   * Dashboard số liệu tài chính thời gian thực: Doanh thu, Tiền trả nhà vườn, Chi phí vận chuyển, Lợi nhuận ròng.
   * Xuất danh sách lộ trình giao hàng đa điểm (Ahamove / Lalamove).
   * In nhãn kiện hàng (Shipping Label) dán từng thùng carton tại Bình Phước.
   * Xuất file Excel / CSV báo cáo.
3. **`trace.html` (Truy xuất nguồn gốc QR Code):**
   * Hiển thị thông tin nhà vườn Bác Năm, định vị Google Maps, ngày thu hái, cam kết bao ăn 1 đổi 1.
4. **`contact.html` (Liên hệ & Kết nối):**
   * Giới thiệu mô hình chuỗi cung ứng ngắn, kết nối nhà vườn và khách hàng.

---

## 👥 V. PHÂN CÔNG NHIỆM VỤ TRONG NHÓM DỰ ÁN

1. **Thành viên phụ trách Nguồn hàng (Tại Bình Phước):**
   * Liên hệ nhà vườn theo dõi độ già của trái.
   * Sáng Thứ Sáu: Giám sát thu hái, phân loại chất lượng.
   * Chiều Thứ Sáu: Đóng thùng carton riêng từng đơn, dán phiếu giao hàng + tem QR, gửi nhà xe QL13 lúc 17:00.
2. **Thành viên Quản trị Hệ thống & Dữ liệu (Admin):**
   * Quản lý website, đồng bộ dữ liệu đơn về Supabase.
   * Chốt danh sách lúc 23h59 Thứ Năm, xuất danh sách lộ trình giao hàng cho đơn vị vận chuyển.
3. **Thành viên Điều phối Logistics (Coordinator):**
   * Sáng Thứ Bảy lúc 07:15: Đặt xe Lalamove/Ahamove đa điểm nhận hàng tại văn phòng nhà xe QL13.
   * Theo dõi lộ trình giao hàng của tài xế trên ứng dụng, đối soát tiền thu hộ COD.
4. **Thành viên Truyền thông & Chăm sóc khách hàng (CSKH):**
   * Xác nhận đơn qua Zalo, hỗ trợ gọi điện khi khách chưa nhận được hàng.
   * Tiếp nhận phản hồi chất lượng và thực hiện chính sách 1 đổi 1 nếu trái bị sượng/hỏng.

---

## 🎯 VI. ĐIỂM CỘNG ĐẶC BIỆT KHI ĐI THI PITCHING & BẢO VỆ ĐỀ TÀI

Khi thuyết trình trước Hội đồng Giám khảo, dự án sở hữu các luận điểm cạnh tranh vượt trội:
1. **Giải pháp vận hành có tính mở rộng (Scalable):**
   > *"AgriConnect không làm theo cách sinh viên tự phát là chia nhau chạy xe máy đi ship thủ công. Chúng em áp dụng giải pháp **Hybrid Logistics: Tuyến chính giá rẻ bằng xe khách QL13 kết hợp chặng cuối bằng shipper công nghệ đa điểm (Multi-drop)**. Nhờ đó, dự án có thể mở rộng từ 30 đơn lên 300 đơn mỗi tuần mà không cần tăng nhân sự!"*
2. **Minh chứng số liệu tài chính thực (Unit Economics):**
   > Có sẵn bảng phân tích chi phí từng chặng, chứng minh được biên lợi nhuận ròng 20% - 30% bền vững.
3. **Ứng dụng công nghệ Zero-Cost (Chi phí công nghệ 0đ):**
   > Tận dụng tối đa hệ sinh thái miễn phí GitHub + Supabase + Vercel + VietQR, giúp dự án sống sót và có lãi ngay từ những đơn hàng đầu tiên mà không chịu chi phí máy chủ hay phần mềm.
