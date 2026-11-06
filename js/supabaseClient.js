/**
 * Client kết nối Supabase với cơ chế Dual-Mode:
 * - Khi có URL & Key: Kết nối PostgreSQL Cloud Supabase.
 * - Khi chưa cấu hình: Tự động chạy LocalStorage Mock DB để người dùng trải nghiệm ngay lập tức trên Local.
 */

class AgriDB {
  constructor() {
    this.isSupabaseConfigured = false;
    this.client = null;
    this.init();
  }

  init() {
    const config = window.APP_CONFIG || {};
    if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase) {
      try {
        this.client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        this.isSupabaseConfigured = true;
        console.log("🟢 [AgriConnect] Đã kết nối Supabase Cloud thành công!");
      } catch (err) {
        console.warn("⚠️ Không thể kết nối Supabase, chuyển sang chế độ LocalStorage:", err);
      }
    } else {
      console.log("ℹ️ [AgriConnect] Đang chạy chế độ LocalStorage (Chưa điền Supabase Key trong js/config.js).");
    }

    this.initMockData();
  }

  initMockData() {
    if (!localStorage.getItem("agri_products")) {
      const defaultProducts = [
        {
          id: "p1",
          name: "Sầu Riêng Ri6 Bình Phước (Cơm Vàng Hạt Lép)",
          category: "TraiCay",
          description: "Sầu riêng già chín rụng tự nhiên từ vườn nhà Bình Phước, múi vàng óng, béo ngậy đậm đà, bao ăn 1 đổi 1 nếu sượng.",
          unit: "kg",
          price_original: 80000,
          price_sale: 125000,
          image_url: "images/durian-open.jpg",
          is_available: true
        },
        {
          id: "p2",
          name: "Măng Cụt Đỏ Cổ Thụ Chín Cây Bình Phước",
          category: "TraiCay",
          description: "Măng cụt vườn đất đỏ Bình Phước hái tươi sáng sớm, múi mọng nước giòn ngọt thanh tao, không mủ sáp.",
          unit: "kg",
          price_original: 45000,
          price_sale: 75000,
          image_url: "images/mangosteen-basket.jpg",
          is_available: true
        },
        {
          id: "p3",
          name: "Sầu Riêng Ri6 Nguyên Quả Tuyển Chọn",
          category: "TraiCay",
          description: "Trái tuyển đều múi từ 2.0 - 2.8kg, gai đều nở căng, thơm nức khi chín tự nhiên, bảo quản bằng túi lưới thông khí.",
          unit: "kg",
          price_original: 85000,
          price_sale: 130000,
          image_url: "images/durian-warehouse.jpg",
          is_available: true
        },
        {
          id: "p4",
          name: "Combo 1: Bạn Trẻ Giảng Đường",
          category: "Combo",
          description: "2kg Măng cụt tươi Bình Phước + Tặng 1 nón bảo hiểm hoặc túi vải AgriConnect cho đơn đầu. Rất hợp nhóm bạn bè thưởng thức.",
          unit: "combo",
          price_original: 90000,
          price_sale: 145000,
          image_url: "images/mangosteen-harvest.jpg",
          is_available: true
        },
        {
          id: "p5",
          name: "Combo 2: Thầy Cô & Gia Đình Ấm Áp",
          category: "Combo",
          description: "1 trái Sầu riêng Ri6 tuyển (2.2 - 2.5kg) + 2kg Măng cụt ruột trắng thượng hạng, đóng thùng carton dán tem QR sang trọng.",
          unit: "combo",
          price_original: 260000,
          price_sale: 395000,
          image_url: "images/durian-pile.jpg",
          is_available: true
        }
      ];
      localStorage.setItem("agri_products", JSON.stringify(defaultProducts));
    }

    if (!localStorage.getItem("agri_orders")) {
      const defaultOrders = [
        {
          id: "ord-001",
          order_code: "AC-BP-001",
          customer_name: "Thầy Trần Văn Minh",
          customer_phone: "0912345678",
          customer_role: "GiangVien",
          delivery_type: "CAMPUS",
          department: "Khoa Kinh Tế - Phòng 302 Nhà A (ĐH Kinh Tế)",
          delivery_address: "Bàn làm việc Khoa Kinh Tế, Cơ sở A Nguyễn Đình Chiểu, Q.3, TP.HCM",
          items: [{ productId: "p5", name: "Combo 2: Thầy Cô & Gia Đình Ấm Áp", qty: 1, price: 395000, subtotal: 395000 }],
          shipping_fee: 0,
          total_amount: 395000,
          payment_method: "VIETQR",
          payment_status: "PAID",
          order_status: "CONFIRMED",
          notes: "Giao sáng Thứ Bảy giúp thầy trước 11h.",
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: "ord-002",
          order_code: "AC-BP-002",
          customer_name: "Chị Hoàng Ánh Tuyết",
          customer_phone: "0908765432",
          customer_role: "Khac",
          delivery_type: "HOME",
          department: "Khu dân cư Him Lam",
          delivery_address: "Số 45 Đường số 6, KDC Him Lam, Phường Tân Hưng, Quận 7, TP.HCM",
          items: [
            { productId: "p1", name: "Sầu Riêng Ri6 Bình Phước (Cơm Vàng Hạt Lép)", qty: 2, price: 125000, subtotal: 250000 },
            { productId: "p2", name: "Măng Cụt Đỏ Cổ Thụ Chín Cây Bình Phước", qty: 2, price: 75000, subtotal: 150000 }
          ],
          shipping_fee: 20000,
          total_amount: 420000,
          payment_method: "VIETQR",
          payment_status: "PAID",
          order_status: "CONFIRMED",
          notes: "Shipper Ahamove giao lên lầu 3 căn hộ giúp mình.",
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: "ord-003",
          order_code: "AC-BP-003",
          customer_name: "Bạn Lê Quang Huy",
          customer_phone: "0933221144",
          customer_role: "SinhVien",
          delivery_type: "HOME",
          department: "Ký túc xá Đại học Quốc gia",
          delivery_address: "Phòng 405 Tòa BA2, KTX Khu B ĐHQG, Phường Đông Hòa, Dĩ An, Bình Dương",
          items: [{ productId: "p4", name: "Combo 1: Bạn Trẻ Giảng Đường", qty: 2, price: 145000, subtotal: 290000 }],
          shipping_fee: 20000,
          total_amount: 310000,
          payment_method: "COD",
          payment_status: "UNPAID",
          order_status: "CONFIRMED",
          notes: "Giao nhận hàng thanh toán tiền mặt nha nhóm.",
          created_at: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ];
      localStorage.setItem("agri_orders", JSON.stringify(defaultOrders));
    }

    if (!localStorage.getItem("agri_batch")) {
      const defaultBatch = {
        id: "batch-001",
        batch_name: "Đợt Gom Hàng #01: Hương Vị Chín Cây Bình Phước",
        target_kg: 60.0,
        current_kg: 42.0,
        status: "OPEN",
        open_date: "Thứ Hai",
        close_date: "23:59 Thứ Năm",
        harvest_date: "Thứ Sáu (Bình Phước hái đóng từng kiện)",
        delivery_date: "Sáng Thứ Bảy (Xe khách QL13 + Shipper đa điểm tận nhà)"
      };
      localStorage.setItem("agri_batch", JSON.stringify(defaultBatch));
    }
  }

  // ================= LẤY DANH SÁCH SẢN PHẨM =================
  async getProducts() {
    if (this.isSupabaseConfigured) {
      try {
        const { data, error } = await this.client.from("products").select("*").order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn("Lỗi lấy sản phẩm từ Supabase:", e);
      }
    }
    return JSON.parse(localStorage.getItem("agri_products") || "[]");
  }

  // ================= TẠO ĐƠN HÀNG MỚI =================
  async createOrder(orderData) {
    if (this.isSupabaseConfigured) {
      try {
        const { data, error } = await this.client.from("orders").insert([orderData]).select();
        if (!error && data) return data[0];
        console.error("Lỗi khi thêm đơn vào Supabase:", error);
      } catch (e) {
        console.warn("Lỗi tạo đơn trên Supabase:", e);
      }
    }

    // Fallback LocalStorage
    const orders = JSON.parse(localStorage.getItem("agri_orders") || "[]");
    orders.unshift(orderData);
    localStorage.setItem("agri_orders", JSON.stringify(orders));

    // Cập nhật số kg gom hàng
    const batch = JSON.parse(localStorage.getItem("agri_batch") || "{}");
    const estimatedKg = (orderData.items || []).reduce((acc, cur) => acc + (cur.qty || 1) * (cur.unit === "combo" ? 2.5 : 1), 0);
    batch.current_kg = Math.min((batch.current_kg || 0) + estimatedKg, batch.target_kg || 60);
    localStorage.setItem("agri_batch", JSON.stringify(batch));

    return orderData;
  }

  // ================= LẤY DANH SÁCH ĐƠN HÀNG (CHO ADMIN) =================
  async getOrders() {
    if (this.isSupabaseConfigured) {
      try {
        const { data, error } = await this.client.from("orders").select("*").order("created_at", { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn("Lỗi lấy đơn từ Supabase:", e);
      }
    }
    return JSON.parse(localStorage.getItem("agri_orders") || "[]");
  }

  // ================= CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG =================
  async updateOrderStatus(orderId, updates) {
    if (this.isSupabaseConfigured) {
      try {
        const { error } = await this.client.from("orders").update(updates).eq("id", orderId);
        if (!error) return true;
      } catch (e) {
        console.warn("Lỗi cập nhật trên Supabase:", e);
      }
    }

    const orders = JSON.parse(localStorage.getItem("agri_orders") || "[]");
    const idx = orders.findIndex(o => o.id === orderId || o.order_code === orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updates };
      localStorage.setItem("agri_orders", JSON.stringify(orders));
      return true;
    }
    return false;
  }

  // ================= LẤY THÔNG TIN ĐỢT GOM HÀNG =================
  async getCurrentBatch() {
    if (this.isSupabaseConfigured) {
      try {
        const { data, error } = await this.client.from("batches").select("*").limit(1).single();
        if (!error && data) return data;
      } catch (e) {
        console.warn("Lỗi lấy batch từ Supabase:", e);
      }
    }
    return JSON.parse(localStorage.getItem("agri_batch") || "{}");
  }

  // ================= CẬP NHẬT ĐỢT GOM HÀNG =================
  async updateBatch(updates) {
    const batch = JSON.parse(localStorage.getItem("agri_batch") || "{}");
    const newBatch = { ...batch, ...updates };
    localStorage.setItem("agri_batch", JSON.stringify(newBatch));
    return newBatch;
  }
}

// Khởi tạo instance toàn cục
window.db = new AgriDB();
