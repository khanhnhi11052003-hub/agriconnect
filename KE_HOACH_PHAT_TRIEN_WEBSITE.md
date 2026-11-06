# 📋 KẾ HOẠCH PHÁT TRIỂN DỰ ÁN AGRICONNECT (CẬP NHẬT: LOGISTICS GIAO TẬN NHÀ)
**Nền Tảng Kết Nối Nông Dân Bình Phước - Người Tiêu Dùng (Đô Thị & Giảng Đường)**

---

## 📌 I. TỔNG QUAN DỰ ÁN & MÔ HÌNH VẬN HÀNH

### 1. Bối cảnh & Mục tiêu
* **Mục tiêu:** Cung cấp giải pháp kết nối trực tiếp trái cây chín cây từ vườn nhà Bình Phước đến tận cửa nhà/cơ quan của từng khách hàng tại TP.HCM, Bình Dương và các khu vực lân cận.
* **Mô hình Logistics Tối Ưu (Phương Án 2 - Xe Khách QL13 + Ship Công Nghệ Đa Điểm):**
  * Không cần địa điểm tập kết trung gian làm phiền nhóm hay khách hàng.
  * Từng đơn hàng được đóng gói, dán nhãn thông tin người nhận (Tên, SĐT, Số nhà, Phường/Xã, Quận/Huyện) ngay tại Bình Phước.
  * Xe khách QL13 vận chuyển nhanh về bến xe/văn phòng nhà xe vào sáng sớm Thứ Bảy.
  * Tích hợp tài xế giao hàng công nghệ (Ahamove / Lalamove đa điểm - Multi-drop) nhận toàn bộ kiện hàng và chạy giao thẳng đến từng địa chỉ khách hàng trong buổi sáng.

---

## 🚚 II. QUY TRÌNH LOGISTICS CHI TIẾT (CHU TRÌNH 1 TUẦN)

```
[THỨ 2 - THỨ 5]                [THỨ 6: TẠI BÌNH PHƯỚC]              [THỨ 7: GIAO TẬN CỬA]
Khách đặt hàng trên Web   ➔    Nhà vườn thu hái trái chín cành  ➔   06:30: Xe khách đến TP.HCM
Điền địa chỉ nhà/cơ quan       Đóng thùng riêng cho từng khách      07:30: Shipper Lalamove/Ahamove lấy
Chốt đơn lúc 23h59             Dán tem QR + Phiếu ship từng đơn     08:00 - 11:30: Giao tận tay khách
```

### 1. Chặng 1: Nhận đơn & Lập lộ trình giao hàng (Thứ Hai - Thứ Năm)
* Khách hàng đặt mua trên website, nhập địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Ghi chú giao hàng).
* 23h59 Thứ Năm: Hệ thống chốt toàn bộ danh sách đơn.
* Nhóm xuất danh sách địa chỉ từ trang Admin, gom thành lộ trình giao hàng tối ưu (Route Optimization) để sẵn sàng đặt tài xế Lalamove/Ahamove giao đa điểm.

### 2. Chặng 2: Thu hoạch & Đóng gói theo từng đơn lẻ (Thứ Sáu)
* Nhà vườn tại Bình Phước thu hái trái già chín cành theo đúng số lượng đã chốt.
* **Đóng gói cá nhân hóa (Per-order packaging):** 
  * Mỗi đơn hàng được đóng vào một hộp/thùng carton riêng biệt.
  * Dán tem truy xuất nguồn gốc QR Code của AgriConnect.
  * Dán phiếu giao hàng (Shipping Label) ghi rõ: Mã đơn, Tên người nhận, SĐT, Địa chỉ giao hàng cụ thể, Số tiền cần thu (nếu chọn COD).
* 17:00: Nhà vườn gửi toàn bộ các thùng hàng lên chuyến xe khách quen chạy tuyến QL13 (Bình Phước ➔ TP.HCM).

### 3. Chặng 3: Giao hàng thẳng đến địa chỉ khách hàng (Sáng Thứ Bảy)
* 06:30 - 07:00: Xe khách cập bến/văn phòng nhà xe tại TP.HCM (ví dụ: Bến xe Miền Đông hoặc văn phòng đại diện trên QL13).
* 07:15: Nhóm đặt dịch vụ giao hàng đa điểm (Ahamove / Lalamove xe máy hoặc xe bán tải tùy tổng số lượng).
* 07:30 - 11:30: Tài xế shipper công nghệ nhận các kiện hàng tại nhà xe và phân phối trực tiếp đến tận tay từng khách hàng theo lộ trình được định tuyến sẵn.
* Nhóm sinh viên chỉ cần theo dõi tiến độ giao hàng trên ứng dụng (Tracking) và hỗ trợ gọi điện khi khách không nghe máy. Không phải tự đi xe máy giao từng nơi!

---

## 💰 III. CẤU TRÚC CHI PHÍ & TÀI CHÍNH (UNIT ECONOMICS MỚI)

| Khoản mục | Cách tính | Mức phí dự kiến |
| :--- | :--- | :--- |
| **Giá vốn nông sản tại vườn** | Trả trực tiếp cho nhà vườn Bình Phước | ~50% - 60% giá bán lẻ |
| **Cước xe khách QL13** | Tính gộp cho toàn bộ chuyến hàng | ~100.000 - 150.000 đ / chuyến |
| **Thùng carton & Tem QR** | Chi phí đóng gói bảo vệ từng đơn | ~4.000 - 6.000 đ / hộp |
| **Cước Shipper giao đa điểm** | Lalamove / Ahamove giao tận nhà | ~15.000 - 25.000 đ / điểm giao |
| **Doanh thu bán lẻ** | Thu từ khách hàng (đã bao gồm phí ship) | 100% |
| **Biên lợi nhuận ròng dự kiến** | Doanh thu - Tổng tất cả chi phí trên | **20% - 30%** |

---

## 👥 IV. PHÂN CÔNG CÔNG VIỆC TRONG NHÓM (THEO MÔ HÌNH MỚI)

1. **Thành viên tại Bình Phước:** Phụ trách điều phối thu hái tại vườn, phân loại trái cây, đóng từng hộp và dán phiếu địa chỉ + tem QR, gửi nhà xe QL13.
2. **Thành viên Quản trị Hệ thống (Admin):** Quản lý website, đồng bộ dữ liệu đơn về Supabase, xuất file danh sách địa chỉ cho đơn vị ship.
3. **Thành viên Điều phối Logistics (Coordinator):** Đặt xe giao hàng đa điểm (Lalamove/Ahamove) sáng Thứ Bảy, theo dõi hành trình shipper và đối soát tiền thu hộ COD.
4. **Thành viên Truyền thông & Chăm sóc khách hàng:** Tiếp nhận đơn, xác nhận đơn qua Zalo, gửi tin nhắn thông báo thời gian shipper giao tới.

---

## 🎯 V. ĐIỂM CỘNG ĐẶC BIỆT KHI ĐI THI PITCHING
Khi thuyết trình trước Hội đồng Giám khảo, mô hình này sở hữu một "Key Selling Point" cực lớn:
> *"AgriConnect không làm theo cách sinh viên tự phát là chia nhau đi ship thủ công thiếu tính mở rộng (Unscalable). Chúng em áp dụng giải pháp **Hybrid Logistics: Tuyến chính vận chuyển giá rẻ bằng xe khách QL13 kết hợp chặng cuối bằng mạng lưới shipper công nghệ theo mô hình giao đa điểm (Multi-drop)**. Mô hình này cho phép hệ thống mở rộng từ 30 đơn lên 300 đơn mỗi tuần mà không cần tăng nhân sự!"*
