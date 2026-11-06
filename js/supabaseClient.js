/**
 * LỚP KẾT NỐI DỮ LIỆU AGRICONNECT (Dual-Mode)
 * - Chế độ CLOUD: Có SUPABASE_URL & SUPABASE_ANON_KEY -> dùng Supabase (PostgreSQL + RLS).
 * - Chế độ DEMO : Chưa cấu hình -> dùng LocalStorage của trình duyệt để chạy thử / thuyết trình offline.
 *
 * Nguyên tắc: Ở chế độ CLOUD, nếu gửi đơn lỗi thì BÁO LỖI cho khách,
 * tuyệt đối không âm thầm lưu vào trình duyệt (vì nhóm sẽ không bao giờ thấy đơn đó).
 */

// ================= TIỆN ÍCH DÙNG CHUNG =================

// Chống chèn mã độc (XSS) khi hiển thị dữ liệu do người dùng nhập
window.escapeHTML = function (value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

window.formatVND = function (n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
};

// Địa chỉ website gốc để in mã QR trên tem
window.getSiteUrl = function () {
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.SITE_URL) || "";
  if (cfg) return cfg.replace(/\/+$/, "");
  if (location.protocol.startsWith("http")) return location.origin;
  return ""; // Mở file trực tiếp trên máy -> không có địa chỉ web
};

// Dữ liệu mẫu cho chế độ DEMO (⚠️ giá & thông tin là MẪU, cần cập nhật)
const DEMO_PRODUCTS = [
  {
    id: "p1", name: "Sầu Riêng Ri6 Bình Phước (Cơm Vàng Hạt Lép)", category: "TraiCay",
    description: "Sầu riêng hái đủ độ già tại vườn Bình Phước, cơm vàng, béo. Đổi trả nếu sượng theo chính sách của nhóm.",
    unit: "kg", weight_kg: 1, price_original: 80000, price_sale: 125000, image_url: "images/durian-open.jpg", is_available: true
  },
  {
    id: "p2", name: "Măng Cụt Bình Phước Chín Cây", category: "TraiCay",
    description: "Măng cụt hái lựa tại vườn, giòn ngọt, đóng thùng lót giấy chống dập.",
    unit: "kg", weight_kg: 1, price_original: 45000, price_sale: 75000, image_url: "images/mangosteen-basket.jpg", is_available: true
  },
  {
    id: "p3", name: "Sầu Riêng Ri6 Nguyên Quả Tuyển Chọn", category: "TraiCay",
    description: "Trái tuyển 2.0 - 2.8kg, tính tiền theo cân thực tế khi đóng thùng.",
    unit: "kg", weight_kg: 1, price_original: 85000, price_sale: 130000, image_url: "images/durian-warehouse.jpg", is_available: true
  },
  {
    id: "p4", name: "Combo 1: Bạn Trẻ Giảng Đường", category: "Combo",
    description: "2kg Măng cụt tươi Bình Phước, phù hợp nhóm bạn cùng phòng.",
    unit: "combo", weight_kg: 2, price_original: 90000, price_sale: 145000, image_url: "images/mangosteen-harvest.jpg", is_available: true
  },
  {
    id: "p5", name: "Combo 2: Thầy Cô & Gia Đình", category: "Combo",
    description: "1 trái Sầu riêng Ri6 (2.2 - 2.5kg) + 2kg Măng cụt, đóng thùng carton dán tem QR.",
    unit: "combo", weight_kg: 4.5, price_original: 260000, price_sale: 395000, image_url: "images/durian-pile.jpg", is_available: true
  }
];

const DEMO_ORDERS = [
  {
    id: "ord-001", order_code: "AC-261105-DEMO01", customer_name: "Thầy Trần Văn Minh (demo)", customer_phone: "0912345678",
    customer_role: "GiangVien", delivery_type: "CAMPUS", department: "Khoa Kinh Tế - Phòng 302 Nhà A",
    delivery_address: "Văn phòng Khoa Kinh Tế, Quận 3, TP.HCM",
    items: [{ productId: "p5", name: "Combo 2: Thầy Cô & Gia Đình", unit: "combo", qty: 1, price: 395000, subtotal: 395000 }],
    total_kg: 4.5, shipping_fee: 0, total_amount: 395000, payment_method: "VIETQR", payment_status: "PAID", order_status: "CONFIRMED",
    notes: "Giao trước 11h.", created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "ord-002", order_code: "AC-261105-DEMO02", customer_name: "Chị Hoàng Ánh Tuyết (demo)", customer_phone: "0908765432",
    customer_role: "Khac", delivery_type: "HOME", department: "Giao tận nhà (Quận 7)",
    delivery_address: "45 Đường số 6, Phường Tân Hưng, Quận 7, TP.HCM",
    items: [
      { productId: "p1", name: "Sầu Riêng Ri6 Bình Phước (Cơm Vàng Hạt Lép)", unit: "kg", qty: 2, price: 125000, subtotal: 250000 },
      { productId: "p2", name: "Măng Cụt Bình Phước Chín Cây", unit: "kg", qty: 2, price: 75000, subtotal: 150000 }
    ],
    total_kg: 4, shipping_fee: 20000, total_amount: 420000, payment_method: "VIETQR", payment_status: "PAID", order_status: "CONFIRMED",
    notes: "Gọi trước 15 phút.", created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: "ord-003", order_code: "AC-261106-DEMO03", customer_name: "Bạn Lê Quang Huy (demo)", customer_phone: "0933221144",
    customer_role: "SinhVien", delivery_type: "HOME", department: "Giao tận nhà (Dĩ An)",
    delivery_address: "KTX Khu B ĐHQG, Phường Đông Hòa, Dĩ An, Bình Dương",
    items: [{ productId: "p4", name: "Combo 1: Bạn Trẻ Giảng Đường", unit: "combo", qty: 2, price: 145000, subtotal: 290000 }],
    total_kg: 4, shipping_fee: 20000, total_amount: 310000, payment_method: "COD", payment_status: "UNPAID", order_status: "CONFIRMED",
    notes: "", created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "ord-004", order_code: "AC-261106-DEMO04", customer_name: "Anh Phạm Đức (demo)", customer_phone: "0977111222",
    customer_role: "Khac", delivery_type: "HOME", department: "Giao tận nhà (Bình Thạnh)",
    delivery_address: "12 Đường D2, Phường 25, Quận Bình Thạnh, TP.HCM",
    items: [{ productId: "p2", name: "Măng Cụt Bình Phước Chín Cây", unit: "kg", qty: 3, price: 75000, subtotal: 225000 }],
    total_kg: 3, shipping_fee: 20000, total_amount: 245000, payment_method: "COD", payment_status: "UNPAID", order_status: "CONFIRMED",
    notes: "", created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

// Khóa LocalStorage phiên bản 2 (tránh dùng lại dữ liệu cũ không tương thích)
const LS = {
  products: "agri_v2_products",
  orders: "agri_v2_orders",
  batch: "agri_v2_batch",
  contacts: "agri_v2_contacts",
  adminSession: "agri_v2_admin_demo_session"
};

class AgriDB {
  constructor() {
    this.isCloud = false;
    this.client = null;
    this.init();
  }

  init() {
    const config = window.APP_CONFIG || {};
    if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase) {
      try {
        this.client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        this.isCloud = true;
        console.log("🟢 [AgriConnect] Chế độ CLOUD: đã kết nối Supabase.");
      } catch (err) {
        console.error("❌ Không khởi tạo được Supabase:", err);
      }
    } else {
      console.log("ℹ️ [AgriConnect] Chế độ DEMO: dữ liệu lưu trong trình duyệt (chưa điền Supabase trong js/config.js).");
    }
    if (!this.isCloud) this.initDemoData();
  }

  initDemoData() {
    if (!localStorage.getItem(LS.products)) localStorage.setItem(LS.products, JSON.stringify(DEMO_PRODUCTS));
    if (!localStorage.getItem(LS.orders)) localStorage.setItem(LS.orders, JSON.stringify(DEMO_ORDERS));
    if (!localStorage.getItem(LS.batch)) {
      localStorage.setItem(LS.batch, JSON.stringify({
        id: "batch-001",
        batch_name: (window.APP_CONFIG?.CAMPAIGN?.BATCH_NAME) || "Đợt Gom Hàng #01",
        target_kg: (window.APP_CONFIG?.CAMPAIGN?.TARGET_KG) || 60,
        status: "OPEN",
        harvest_date: "Thứ Sáu (thu hái & đóng thùng tại Bình Phước)",
        delivery_date: "Sáng Thứ Bảy (xe khách QL13 + shipper giao đa điểm)"
      }));
    }
  }

  _read(key) { return JSON.parse(localStorage.getItem(key) || "[]"); }
  _write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  _friendlyError(error) {
    const msg = (error && (error.message || error.details)) || String(error);
    console.error("[AgriConnect] Lỗi Supabase:", error);
    if (/fetch|network/i.test(msg)) return "Không kết nối được máy chủ. Vui lòng kiểm tra Internet và thử lại.";
    if (/phone_format/i.test(msg)) return "Số điện thoại không hợp lệ.";
    if (/duplicate key/i.test(msg)) return "Mã đơn bị trùng, vui lòng bấm đặt hàng lại.";
    return msg;
  }

  // ================= SẢN PHẨM =================
  async getProducts() {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from("products").select("*").eq("is_available", true).order("created_at", { ascending: true });
      if (error) throw new Error(this._friendlyError(error));
      return data || [];
    }
    return this._read(LS.products).filter(p => p.is_available !== false);
  }

  // Admin: lấy tất cả sản phẩm (kể cả ngừng bán) để tính giá vốn
  async getAllProducts() {
    if (this.isCloud) {
      const { data, error } = await this.client.from("products").select("*");
      if (error) throw new Error(this._friendlyError(error));
      return data || [];
    }
    return this._read(LS.products);
  }

  // ================= ĐỢT GOM HÀNG =================
  async getCurrentBatch() {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from("batches").select("*").eq("status", "OPEN")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(this._friendlyError(error));
      return data;
    }
    const batch = JSON.parse(localStorage.getItem(LS.batch) || "{}");
    // Demo: số kg tính từ đơn thật trong trình duyệt, không dùng số ảo
    batch.current_kg = this._read(LS.orders)
      .filter(o => o.order_status !== "CANCELLED")
      .reduce((s, o) => s + Number(o.total_kg || 0), 0);
    return batch;
  }

  // ================= GỬI ĐƠN HÀNG =================
  /**
   * orderInput: { order_code, customer_name, customer_phone, customer_role, delivery_type,
   *               department, delivery_address, items: [{productId, qty}], payment_method, notes }
   * Trả về đơn kèm giá đã tính. Ở chế độ CLOUD, server tự tính lại giá (trigger compute_order_totals).
   */
  async createOrder(orderInput, pricedPreview) {
    if (this.isCloud) {
      const payload = {
        order_code: orderInput.order_code,
        customer_name: orderInput.customer_name,
        customer_phone: orderInput.customer_phone,
        customer_role: orderInput.customer_role,
        delivery_type: orderInput.delivery_type,
        department: orderInput.department,
        delivery_address: orderInput.delivery_address,
        items: orderInput.items.map(i => ({ productId: i.productId, qty: i.qty })),
        payment_method: orderInput.payment_method,
        notes: orderInput.notes || null,
        consent_at: new Date().toISOString()
      };
      // Không gọi .select() vì khách không có quyền đọc lại bảng orders (bảo mật RLS)
      const { error } = await this.client.from("orders").insert([payload]);
      if (error) throw new Error(this._friendlyError(error));
      return { ...orderInput, ...pricedPreview };
    }

    // Chế độ DEMO
    const order = {
      id: "ord-" + Date.now(),
      ...orderInput,
      ...pricedPreview,
      payment_status: "UNPAID",
      order_status: "CONFIRMED",
      created_at: new Date().toISOString()
    };
    const orders = this._read(LS.orders);
    orders.unshift(order);
    this._write(LS.orders, orders);
    return order;
  }

  // ================= ADMIN: ĐƠN HÀNG =================
  async getOrders() {
    if (this.isCloud) {
      const { data, error } = await this.client.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(this._friendlyError(error));
      return data || [];
    }
    return this._read(LS.orders);
  }

  async updateOrder(orderId, updates) {
    if (this.isCloud) {
      const { error } = await this.client.from("orders").update(updates).eq("id", orderId);
      if (error) throw new Error(this._friendlyError(error));
      return true;
    }
    const orders = this._read(LS.orders);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;
    orders[idx] = { ...orders[idx], ...updates };
    this._write(LS.orders, orders);
    return true;
  }

  // ================= TRA CỨU ĐƠN (trang trace.html) =================
  // Chỉ trả về thông tin không nhạy cảm (không tên, SĐT, địa chỉ)
  async traceOrder(code) {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) return null;
    if (this.isCloud) {
      const { data, error } = await this.client.rpc("get_order_trace", { p_code: clean });
      if (error) throw new Error(this._friendlyError(error));
      return (data && data[0]) || null;
    }
    const o = this._read(LS.orders).find(x => String(x.order_code).toUpperCase() === clean);
    if (!o) return null;
    const batch = JSON.parse(localStorage.getItem(LS.batch) || "{}");
    return {
      order_code: o.order_code, order_status: o.order_status, payment_status: o.payment_status,
      delivery_type: o.delivery_type, total_kg: o.total_kg, created_at: o.created_at,
      batch_name: batch.batch_name, harvest_date: batch.harvest_date, delivery_date: batch.delivery_date,
      item_summary: (o.items || []).map(i => `${i.qty}x ${i.name}`).join(", ")
    };
  }

  // ================= LIÊN HỆ =================
  async submitContact(msg) {
    if (this.isCloud) {
      const { error } = await this.client.from("contact_messages").insert([{ ...msg, status: "NEW" }]);
      if (error) throw new Error(this._friendlyError(error));
      return true;
    }
    const list = this._read(LS.contacts);
    list.unshift({ id: "msg-" + Date.now(), ...msg, status: "NEW", created_at: new Date().toISOString() });
    this._write(LS.contacts, list);
    return true;
  }

  async getContacts() {
    if (this.isCloud) {
      const { data, error } = await this.client.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(this._friendlyError(error));
      return data || [];
    }
    return this._read(LS.contacts);
  }

  // ================= ĐĂNG NHẬP QUẢN TRỊ =================
  // CLOUD: Supabase Auth (email + mật khẩu) + kiểm tra email trong bảng admin_users
  // DEMO : mã PIN trong config.js (chỉ để thuyết trình, không phải bảo mật thật)
  async adminLogin({ email, password, pin }) {
    if (this.isCloud) {
      const { error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Sai email hoặc mật khẩu.");
      const ok = await this.isAdmin();
      if (!ok) {
        await this.client.auth.signOut();
        throw new Error("Tài khoản này chưa được cấp quyền quản trị (chưa có trong bảng admin_users).");
      }
      return true;
    }
    if (String(pin) === String(window.APP_CONFIG?.CAMPAIGN?.ADMIN_PIN)) {
      sessionStorage.setItem(LS.adminSession, "1");
      return true;
    }
    throw new Error("Sai mã PIN.");
  }

  async isAdmin() {
    if (this.isCloud) {
      const { data: { session } } = await this.client.auth.getSession();
      if (!session) return false;
      const { data, error } = await this.client.rpc("is_admin");
      if (error) return false;
      return data === true;
    }
    return sessionStorage.getItem(LS.adminSession) === "1";
  }

  async adminLogout() {
    if (this.isCloud) await this.client.auth.signOut();
    sessionStorage.removeItem(LS.adminSession);
  }
}

window.db = new AgriDB();
