# CẨM NANG PHẢN BIỆN BAN GIÁM KHẢO (CHUẨN XÁC 100% VỚI WEBSITE AGRICONNECT)
## MÔN: KHỞI NGHIỆP VÀ ĐỔI MỚI SÁNG TẠO
**Website chạy thực tế (Live Demo):** [https://agriconnect-yagt.vercel.app/](https://agriconnect-yagt.vercel.app/)  
**Đặc quyền phòng thi:** Mọi câu trả lời đều có thể **chỉ tay trực tiếp vào màn hình web** để chứng minh với Ban Giám Khảo (BGK).

---

## 28 CÂU HỎI & CÂU TRẢ LỜI ĐÃ ĐƯỢC CHUẨN HÓA VÀ KHỚP VỚI HỆ THỐNG WEB

---

### CÂU 1: BGK hỏi: "Nông dân và khách hàng tự kết nối mua bán ngầm ngoài web thì sao?"
* **Câu trả lời chuẩn web:**
  > *"Thưa Ban Giám Khảo, khách hàng và nông dân sẽ không bao giờ mua bán ngầm vì chi phí và rủi ro tự phát đắt hơn rất nhiều so với giao dịch trên AgriConnect:"*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Khách hàng mất quyền bảo chứng Ví Escrow:** Trên thanh menu có nút **"Ví Escrow"** (dẫn sang trang [`trace.html`](https://agriconnect-yagt.vercel.app/trace.html)). Mua qua web, tiền được tạm giữ an toàn, nhận trái sượng/hư được bảo hành 1 đổi 1 hoặc hoàn tiền 100%. Mua ngầm bên ngoài khách tự chịu rủi ro.
  2. **Nông dân gửi lẻ tốn kém hơn:** Nông dân tự gửi xe khách ra bến tốn thêm **35.000đ – 45.000đ/đơn** và quả bị dập úa do không có xe lạnh. Gửi qua đợt gom của AgriConnect chỉ tốn **6.000đ/đơn**.
  3. **Tự động làm mờ liên hệ:** Cổng Nhà Vườn ([`farmer.html`](https://agriconnect-yagt.vercel.app/farmer.html)) tích hợp bộ lọc chặn hiển thị số điện thoại cá nhân trong bài đăng để bảo vệ dữ liệu nền tảng.

---

### CÂU 2 & 8: BGK hỏi: "Startup sinh viên lấy đâu ra tiền mua hệ thống kho lạnh và xe tải lạnh đắt tiền?"
* **Câu trả lời chuẩn web:**
  > *"Chúng em áp dụng mô hình **Asset-Light (Không sở hữu xe)** — thuê lại chiều về rỗng của các đội xe tải lạnh xuất khẩu với giá rẻ hơn 60% thị trường."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Lịch trình gom Thứ Năm - Thứ Bảy:** Trên đầu trang web luôn có đồng hồ đếm ngược **"Đợt Gom Hàng Tuần - Chốt đơn 23h59 Thứ Năm"**. Chiều Thứ Sáu là lúc các xe lạnh xuất khẩu từ miền Tây, Tây Nguyên về lại TP.HCM nên giá thuê chiều về rỗng cực rẻ.
  2. **Thuật toán Geo-fencing 20km trên Web:** Trong giỏ hàng ([`index.html`](https://agriconnect-yagt.vercel.app/#preorder)), nếu khách chọn sản phẩm tươi sống ngoài bán kính 20km, web tự động hiển thị thông báo vàng chuyển đơn sang **Điểm Tập Kết Xe Lạnh Hub-to-Hub**, không cần mở kho lạnh tràn lan.

---

### CÂU 3: BGK hỏi: "Lỡ Thứ Sáu mưa bão lớn, nhà vườn không hái được thì xử lý thế nào?"
* **Câu trả lời chuẩn web:**
  > *"Hệ thống kiểm soát rủi ro thời tiết chủ động và có cơ chế hoàn tiền tức thì qua Ví Escrow kèm voucher đền bù."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Cổng Nông Dân theo dõi mùa vụ:** Trên trang [`farmer.html`](https://agriconnect-yagt.vercel.app/farmer.html), nông dân cập nhật trạng thái thu hái từ Thứ Năm. Nếu phát hiện bão, hệ thống chuyển sang nhà vườn dự phòng ở tỉnh lân cận.
  2. **Tự động hoàn tiền qua Ví Escrow:** Trên trang [`trace.html`](https://agriconnect-yagt.vercel.app/trace.html), trạng thái đơn hàng sẽ tự động chuyển sang hoàn tiền 100% cho khách hàng.
  3. **Voucher đền bù tự động:** Khách được tặng ngay mã giảm giá 30.000đ hiển thị trực tiếp trong mục **"Mã giảm giá đang có của bạn"** trên Web để giữ chân cho đợt sau.

---

### CÂU 4: BGK hỏi: "Bao bì bẹ cau, lá chuối và thùng giữ nhiệt đắt tiền thì làm sao có lời?"
* **Câu trả lời chuẩn web:**
  > *"Chúng em vận hành cơ chế Kinh Tế Tuần Hoàn (Deposit-Return) — chi phí bao bì giảm chỉ còn 3.000đ/lần giao nhờ vòng đời quay vòng 6–8 lần."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Cơ chế trả thùng tích Hạt Mầm:** Khách hàng trả lại thùng giữ nhiệt đợt trước sẽ được cộng ngay **40 Hạt Mầm Xanh** vào **Vườn Ảo AgriConnect** trên web (đủ đổi ngay 1 voucher 15.000đ).
  2. **Mục Trực tiếp cộng đồng:** Thanh thông báo chạy liên tục trên web có hiển thị: *“Gia đình chị Ánh (Phú Nhuận) vừa đăng ký trả lại 2 thùng giấy đợt trước!”*.
  3. Khấu hao thùng 24.000đ chia cho 8 lần dùng thực tế rẻ hơn việc mua thùng carton dùng 1 lần (8.000đ/thùng).

---

### CÂU 5 & 13: BGK hỏi: "Có bằng chứng nào chứng minh các bạn không vẽ dự án trên giấy?"
* **Câu trả lời chuẩn web:**
  > *"Kính mời Ban Giám khảo mở điện thoại vào ngay `agriconnect-yagt.vercel.app` — toàn bộ sản phẩm, ví escrow, hệ thống phân quyền và các cổng tương tác đang chạy trực tiếp trên máy chủ đám mây!"*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Cổng Khách Hàng:** [`index.html`](https://agriconnect-yagt.vercel.app/) có giỏ hàng, đo độ ngọt Brix, Merkle Hash, game Vườn ảo chăm cây và âm thanh ASMR sinh học.
  2. **Cổng Quản Trị:** Bấm nút **"Cổng Quản Trị"** góc phải trên dẫn sang [`admin.html`](https://agriconnect-yagt.vercel.app/admin.html) (Mã PIN: `123456`) xem quản lý đơn hàng, kho vận và giải ngân tiền Escrow.
  3. **Cổng Nhà Vườn:** Bấm nút **"🌾 Cổng Nông Dân"** dẫn sang [`farmer.html`](https://agriconnect-yagt.vercel.app/farmer.html) (Mã PIN: `AGRI2026`) xem sản lượng thu hoạch của Bác Năm.
  4. **Cổng Tra cứu:** Trang [`trace.html`](https://agriconnect-yagt.vercel.app/trace.html) tra cứu chuỗi cung ứng lạnh và ví bảo chứng.

---

### CÂU 6: BGK hỏi: "Định giá startup 450.000 USD giai đoạn đầu có bị quá cao không?"
* **Câu trả lời chuẩn web:**
  > *"Dạ không. Dự án đã hoàn thiện sản phẩm ở mức độ TRL 7 (chạy thật), liên kết 3 Hợp tác xã lớn và mô hình không mua xe lạnh nên chỉ cần 1.200 đơn/tuần là đã đạt điểm hòa vốn."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Đã có nền tảng hoàn thiện không tốn chi phí thuê ngoài (Outsource).
  2. Giá trị đơn hàng trung bình (AOV) trên web luôn được thiết kế đạt chuẩn **≥ 350.000đ** (thanh thông báo Upsell Freeship 350k).
  3. Biên lợi nhuận phí sàn 15–20% đảm bảo dòng tiền dương sau 6 tháng.

---

### CÂU 7: BGK hỏi: "Khách dồn đặt lúc 23h59 Thứ Năm có làm sập web không?"
* **Câu trả lời chuẩn web:**
  > *"Hệ thống dùng bộ đệm CDN toàn cầu tải trang dưới 50ms và động cơ lưu trữ kép LocalStorage + Supabase Realtime, cam kết không nghẽn mạng và không mất dữ liệu."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Toàn bộ mã nguồn chạy trên nền tảng Serverless Edge Network của Vercel với các tiêu chuẩn bảo mật ngân hàng: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
  2. Dù khách F5 hay mất mạng, giỏ hàng và số lượng đã chọn vẫn được lưu trữ nguyên vẹn trong bộ nhớ trình duyệt.

---

### CÂU 9: BGK hỏi: "Xe lạnh mở cửa giao nhiều điểm nội thành có bị mất nhiệt làm hỏng quả?"
* **Câu trả lời chuẩn web:**
  > *"Mỗi đơn hàng được bọc cách nhiệt 3 lớp trong hộp bẹ cau và túi giữ nhiệt, nhiệt độ lệch dưới 1.5°C; đồng thời web tự động cảnh báo tách khí Ethylene ngay trong giỏ hàng."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Tính năng phân khoang Ethylene:** Hãy thử chọn đồng thời 1kg Sầu riêng (chất sinh khí Ethylene) và 1kg Xà lách Đà Lạt (nhạy cảm Ethylene) trên web -> Giỏ hàng sẽ hiện ngay hộp cảnh báo màu xanh: **"Cảnh báo Phân Khoang Nhiệt Độ & Tách Khí Ethylene Tự Động"**.
  2. Túi đá gel sinh học duy trì mức nhiệt 12–15°C đảm bảo quả chín cây không bị sốc nhiệt khi shipper mở thùng.

---

### CÂU 10: BGK hỏi: "Nếu GrabMart hoặc Bách Hóa Xanh làm mô hình này thì sao?"
* **Câu trả lời chuẩn web:**
  > *"Siêu thị không thể bỏ mặt bằng đắt đỏ để bán gom tuần, còn shipper xe máy của Grab không chở được xe lạnh liên tỉnh bảo quản quả chín cây."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Siêu thị phải bán hàng tồn mỗi ngày, trái cây phải hái non để lâu. AgriConnect chỉ bán **trái chín cây già trĩu cành** (thể hiện qua chỉ số Brix cao từ 16.5° - 18.0° đo trên từng thẻ sản phẩm).
  2. GrabMart chỉ giao hàng nội thành bán kính 5–7km; AgriConnect kết nối chuỗi cung ứng lạnh 200km từ vùng trồng Bình Phước, Lâm Đồng về tận sảnh công ty.

---

### CÂU 11: BGK hỏi: "Ví Escrow giữ tiền có vi phạm luật Ngân hàng Nhà nước?"
* **Câu trả lời chuẩn web:**
  > *"Chúng em không tự giữ tiền mà tích hợp Cổng thanh toán/Ngân hàng được cấp phép; AgriConnect chỉ gửi lệnh Logic mở khóa giải ngân khi khách nghiệm thu."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Khi thanh toán đơn hàng trên web, hệ thống tạo mã **VietQR Động** chuyển tiền vào tài khoản tạm giữ bảo chứng.
  2. Trên trang [`trace.html`](https://agriconnect-yagt.vercel.app/trace.html), trạng thái ghi rõ: **"ESCROW_HOLDING: Tiền đang được bảo lưu an toàn"**. Chỉ khi khách hàng xác nhận nhận hàng chuẩn, hệ thống mới gửi lệnh API giải ngân.

---

### CÂU 12, 23 & 24: BGK hỏi: "Lỡ có người in mã QR giả dán lên hoa quả bẩn, hoặc shipper tráo hàng thì sao?"
* **Câu trả lời chuẩn web:**
  > *"Tem của chúng em là QR Động có mã băm Merkle Root Hash trên Blockchain và tem niêm phong vỡ (Void Seal), không thể làm giả hay tráo đổi."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Nút bấm Blockchain trên Web:** Bấm vào nút `⛓️ Hash: 0x... ↗` trên bất kỳ thẻ sản phẩm nào ở trang chủ -> Một Modal màu trắng tím sẽ bật lên, hiển thị **Khối băm Polygon PoS Layer-2, Merkle Root Hash SHA-256** chứng thực lô thu hoạch bất biến.
  2. Kiện hàng được dán tem niêm phong tại Hub, khách quét QR nhận hàng thì mã tự động đổi trạng thái sang "ĐÃ NHẬN", không thể bóc tem dán lại lên thùng quả khác.

---

### CÂU 14 & 15: BGK hỏi: "Sản phẩm lỗi bên trong (chua, sượng, hư ruột) hoặc khách e ngại hình ảnh một đằng nhận hàng một nẻo thì sao?"
* **Câu trả lời chuẩn web:**
  > *"AgriConnect có chính sách 'Bảo hành tận ruột' — chỉ cần gửi ảnh/video unbox qua Web trong 24 giờ để được bồi hoàn 100% hoặc đổi quả mới mà không cần thu hồi quả hỏng."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Trên trang chủ và chân trang có cam kết rõ ràng: **"Bảo hành 1 đổi 1 trong 24h qua Ví Escrow"**.
  2. Khách vào trang [`trace.html`](https://agriconnect-yagt.vercel.app/trace.html) nhập số điện thoại hoặc mã đơn để yêu cầu khiếu nại hoàn tiền tự động mà không cần đôi co cãi vã.
  3. Hình ảnh nhà vườn Bác Năm, toạ độ GPS và video đóng thùng đều được công khai minh bạch.

---

### CÂU 16: BGK hỏi: "Điểm khác biệt với tem VietGAP tĩnh tại siêu thị là gì?"
* **Câu trả lời chuẩn web:**
  > *"Tem siêu thị chỉ là giấy tĩnh dán lên quả, còn AgriConnect cung cấp Nhật ký số tương tác kết hợp chỉ số Nông học chính xác."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Bấm nút **"Nhật ký & Nhà vườn"** trên mỗi thẻ sản phẩm để xem: Lịch bón phân hữu cơ, nguồn nước tưới, ngày hái.
  2. Hiển thị trực tiếp hai thông số độc quyền:
     - `🍯 Brix: 16.5° - 18.0°`: Độ ngọt kiểm định bằng khúc xạ kế.
     - `🧪 Cách ly PHI: 14 ngày (0% tồn dư)`: Cam kết an toàn thực phẩm.

---

### CÂU 17: BGK hỏi: "Nhỡ như người mua hàng sau khi ăn xong bị ngộ độc thì xử lý thế nào?"
* **Câu trả lời chuẩn web:**
  > *"Hệ thống ràng buộc nông dân ký cam kết PHI điện tử trước khi mở bán, có mẫu lưu độc lập và trích 2% lập Quỹ Bảo Hiểm Nông Sản An Toàn."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Trên Cổng Quản Trị và Cổng Nhà Vườn, mọi sản phẩm đăng bán đều phải cam kết đạt thời gian cách ly thuốc BVTV an toàn (PHI ≥ 14 ngày).
  2. Tại chân trang web có hiển thị số dư thực tế của **"Quỹ An Sinh Nông Nghiệp & Bảo Hiểm ATVSTP"** (đang hiển thị số dư 4.850.000đ) để chủ động chi trả viện phí ngay cho khách nếu có sự cố.

---

### CÂU 18: BGK hỏi: "Lợi thế cạnh tranh khi đối thủ sao chép ứng dụng là gì?"
* **Câu trả lời chuẩn web:**
  > *"Đối thủ có thể sao chép giao diện web trong 1 tuần, nhưng không thể sao chép được 'Con hào kinh tế' (Moat) gồm mạng lưới liên kết HTX độc quyền, quy trình đo độ ngọt chuẩn hóa và tệp khách hàng Vườn ảo trung thành."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Sự gắn kết của khách hàng qua hệ thống **Vườn Ảo tích lũy hạt mầm** và **Chuỗi điểm danh Streak liên tục**. Khách đã tích lũy điểm mầm và thăng cấp cây lên Cấp 4 sẽ không bỏ sang nền tảng khác.

---

### CÂU 19: BGK hỏi: "Làm thế nào để cạnh tranh với chợ truyền thống và siêu thị lớn?"
* **Câu trả lời chuẩn web:**
  > *"Chợ thì rẻ nhưng không rõ nguồn gốc; Siêu thị thì đắt và mất công đi lại; AgriConnect mang lại sự an tâm tuyệt đối với giá tận vườn và giao tận cửa."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Bảng giá so sánh công khai trên web ([`index.html#campaign`](https://agriconnect-yagt.vercel.app/#campaign)):
     - Sầu riêng Ri6: AgriConnect 98.000 đ/kg (Thị trường 120.000 – 140.000 đ/kg).
     - Măng cụt cổ thụ: AgriConnect 95.000 đ/kg (Thị trường 115.000 đ/kg).
  2. Tiết kiệm 2 giờ đi chợ mỗi tuần cho các gia đình đô thị.

---

### CÂU 20: BGK hỏi: "Cân bằng chi phí logistics bảo quản lạnh so với giá bán chung thế nào?"
* **Câu trả lời chuẩn web:**
  > *"Cắt giảm hoàn toàn 2–3 tầng thương lái trung gian để bù đắp chi phí logistics; gom đơn B2B2C Office Drop-point giúp hạ giá thành chặng cuối chỉ còn 6.000đ/đơn."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Trong form đặt hàng trên web, có lựa chọn **"🏢 Nhận tại Điểm Tập Kết Tòa Nhà (Office Drop-point)"**:
     - *Viettel Complex Q.10 (Cách mạng Tháng 8)*
     - *Landmark 81 (Vinhomes Central Park)*
     - *Bitexco Financial Tower Q.1*
     - *Khu Đô thị ĐHQG TP.HCM*
  2. Gom 20–30 đơn tại sảnh toà nhà giúp 1 shipper giao trọn gói trong 15 phút, tiết kiệm 75% chi phí giao hàng.

---

### CÂU 21: BGK hỏi: "Cách thích ứng với bối cảnh kinh tế suy thoái / sức mua giảm?"
* **Câu trả lời chuẩn web:**
  > *"Chia nhỏ giỏ hàng theo Combo Tiết Kiệm Tuần với mức giá vừa túi tiền và kích hoạt hệ thống nhiệm vụ tích hạt mầm đổi mã giảm giá."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Các gói **Combo Đi Chợ Tuần** trên web có giá chỉ từ 250.000đ – 359.000đ đủ rau, củ, quả sạch cho cả tuần.
  2. Khách hàng làm nhiệm vụ ngày trên web nhận ngay voucher 15k, 25k, 50k áp dụng trực tiếp vào giỏ hàng.

---

### CÂU 22: BGK hỏi: "Cách giữ chân khách hàng sau lần đặt hàng đầu tiên?"
* **Câu trả lời chuẩn web:**
  > *"Áp dụng vòng lặp Gamification Vườn Ảo Mini-Farm kết hợp âm thanh ASMR sinh học và Checklist 4 Nhiệm vụ ngày."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. **Khu Vườn Ảo trên Web ([`#interactive-hub`](https://agriconnect-yagt.vercel.app/#interactive-hub)):**
     - Cây có 4 cấp độ: *Cấp 1 Mầm xanh -> Cấp 2 Cây non -> Cấp 3 Đơm hoa -> Cấp 4 Trái chín thu hoạch tặng Voucher 30.000đ*.
     - Bấm tưới nước phát ra **tiếng giọt nước ASMR** êm dịu, tăng +25 EXP.
  2. **4 Nhiệm Vụ Ngày:**
     - ⚪ 1. Điểm danh (+20 Hạt)
     - ⚪ 2. Tưới nước (+25 EXP)
     - ⚪ 3. Quay vòng quay may mắn
     - ⚪ 4. Thả tim món ngon góc bếp (+5 Hạt)
     -> Làm xong 4/4 tự động bật hộp thông báo thưởng nóng **+50 Hạt Mầm Xanh**.
  3. **Bảng Vinh Danh "Cộng Đồng Xanh":** Hiển thị Top khách hàng chăm chỉ chăm cây và gom đơn tuần.

---

### CÂU 25: BGK hỏi: "Dự án mất bao lâu để thu hồi lại 40% vốn đầu tư ban đầu vào hệ thống hạ tầng và chuỗi lạnh?"
* **Câu trả lời chuẩn web:**
  > *"Thời gian hoàn vốn đầu tư dự kiến từ 2,5 – 3 năm nhờ mô hình Asset-Light không gánh khấu hao mua xe và vòng đời khai thác cây ăn trái kéo dài 15–30 năm."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Nền tảng công nghệ web PWA tự phát triển nội bộ, chi phí duy trì máy chủ Vercel và Supabase gần như bằng 0 ở giai đoạn đầu.
  2. Điểm hòa vốn chỉ cần **1.200 đơn/tuần**.

---

### CÂU 26: BGK hỏi: "Điểm khác biệt lớn nhất giữa việc bán qua Web App AgriConnect so với việc bán qua hội nhóm Zalo, Facebook là gì?"
* **Câu trả lời chuẩn web:**
  > *"Bán qua mạng xã hội thiếu cơ chế bảo vệ thanh toán, dễ bị bùng đơn và không kiểm chứng được chất lượng; AgriConnect bảo chứng bằng Ví Escrow, độ ngọt Brix và hợp đồng số minh bạch."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Trên Facebook không ai đo được độ ngọt, trên web AgriConnect có chỉ số khúc xạ Brix rõ ràng.
  2. Trên Zalo khách phải cọc tiền trước rồi hồi hộp lo sợ; trên AgriConnect tiền được tạm giữ trong Ví Escrow, an toàn 100%.

---

### CÂU 27: BGK hỏi: "Mô hình này giúp giải quyết vấn đề rác thải nông nghiệp đô thị cụ thể như thế nào?"
* **Câu trả lời chuẩn web:**
  > *"Toàn bộ lượng phế phẩm vỏ sầu riêng, vỏ măng cụt được chuyển giao cho trại Ruồi Lính Đen (BSF Farm) để sản xuất phân bón vi sinh và ấu trùng giàu đạm."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Trên trang chủ web có mục **"Đối Tác Mạng Lưới Kinh Tế Tuần Hoàn ESG"**:
     - Hiển thị danh sách đối tác thực tế: *Trại Ruồi Lính Đen BSF Farm (Đã thu gom 1.250 kg vỏ trái cây)* và *Xưởng Phân Bón Hữu Cơ Sinh Học*.
     - Có nút **"Đăng Ký Trở Thành Đối Tác Thu Gom ESG"** để mở rộng mạng lưới xử lý rác thải.

---

### CÂU 28: BGK hỏi: "Người tiêu dùng nhận được giá trị gì ngoài việc mua được trái cây sạch?"
* **Câu trả lời chuẩn web:**
  > *"Người mua được kết nối trực tiếp với người nông dân trồng ra quả, an tâm về dinh dưỡng cho gia đình và trực tiếp đóng góp vào các chỉ số giảm phát thải môi trường hiển thị minh bạch trên Web."*
* **Bằng chứng trên Web để chỉ cho BGK:**
  1. Được trải nghiệm niềm vui chăm cây thư giãn sau giờ làm việc căng thẳng với **âm thanh ASMR sinh học (nút bật/tắt `🔊 Âm Thanh: Bật`)**.
  2. Được đọc công thức nấu ăn đặc sản tại mục **"Góc Bếp Nông Sản"** (Gỏi gà măng cụt, Canh sườn sầu riêng).
  3. Tham gia vào lối sống tiêu dùng có trách nhiệm (SDG 12) và hỗ trợ sinh kế bền vững cho bà con nông dân Việt Nam.
