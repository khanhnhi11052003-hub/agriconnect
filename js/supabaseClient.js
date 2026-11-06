/**
 * LỚP KẾT NỐI DỮ LIỆU AGRICONNECT (Dual-Mode)
 * - Chế độ CLOUD: Có SUPABASE_URL & SUPABASE_ANON_KEY -> dùng Supabase (PostgreSQL + RLS).
 * - Chế độ DEMO : Chưa cấu hình hoặc mất mạng -> dùng dữ liệu mẫu dự phòng (DEMO_PRODUCTS) & LocalStorage.
 */

// ================= TIỆN ÍCH DÙNG CHUNG =================

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

window.getSiteUrl = function () {
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.SITE_URL) || "";
  if (cfg) return cfg.replace(/\/+$/, "");
  if (location.protocol.startsWith("http")) return location.origin;
  return "";
};

// Dữ liệu mẫu chuẩn (Đầy đủ 13 đặc sản đất đỏ Bình Phước & Các Combo tiết kiệm theo giá thị trường hiện nay)
const DEMO_PRODUCTS = [
  {
    id: "p1", name: "Sầu Riêng Ri6 Ruột Vàng", category: "TraiCay",
    highlights: ["Múi vàng rực, dẻo quánh béo ngậy", "Hái già rụng tự nhiên, ngọt đậm sâu", "Bao ăn 1 đổi 1 tận tay nếu sượng"],
    description: "Những quả sầu riêng Ri6 tuyển lựa khắt khe từ vùng đất đỏ bazan Phước Long trù phú. Cây nuôi trái già đủ độ, thu hái sáng sớm Thứ Sáu. Múi vàng rực rỡ, cơm dẻo quánh, khô ráo không nhão nước, vị ngọt bùi béo ngậy tan chảy trên đầu lưỡi. (Giá thị trường TP.HCM: 95.000 - 125.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 68000, price_sale: 98000, image_url: "images/hero-fruits.jpg", is_available: true
  },
  {
    id: "p2", name: "Măng Cụt Cổ Thụ", category: "TraiCay",
    highlights: ["Vườn cổ thụ 25 năm không hóa chất", "Múi trắng tinh khiết, hạt lép giòn sần sật", "Vị chua ngọt thanh tao giải nhiệt tuyệt đỉnh"],
    description: "Măng cụt thu hoạch từ những gốc đại thụ Bình Phước, nuôi dưỡng bằng nước ngầm tinh khiết. Đang vào giai đoạn nghịch vụ/cuối vụ khan hiếm, nhà vườn tỉ mỉ hái từng trái chín cành vỏ tím mỏng mịn, múi trắng nõn như hoa tuyết mọng nước. (Giá thị trường TP.HCM: 90.000 - 140.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 65000, price_sale: 95000, image_url: "images/mangosteen-basket.jpg", is_available: true
  },
  {
    id: "p3", name: "Chôm Chôm Nhãn Giòn Ngọt", category: "TraiCay",
    highlights: ["Trái nhỏ râu vàng đỏ, tróc hạt 100%", "Cùi dày ráo nước, giòn rụm ngọt lịm", "Hái sớm tươi rói, không dập nát"],
    description: "Đặc sản chôm chôm nhãn 'nhỏ mà có võ' của miệt vườn Bình Phước. Hàng trái vụ quả nhỏ xinh râu xoăn vàng ửng đỏ, cùi dày trắng trong ráo nước và tróc hạt sạch sẽ 100%. Vị ngọt đậm đà thơm mát như hương nhãn lồng. (Giá thị trường TP.HCM: 50.000 - 75.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 32000, price_sale: 52000, image_url: "images/chomchom.jpg", is_available: true
  },
  {
    id: "p4", name: "Nhãn Xuồng Cơm Vàng", category: "TraiCay",
    highlights: ["Trái to tròn da bò, căng bóng", "Cùi vàng dày cộm, giòn ngọt ứa nước", "Hương thơm nồng nàn sang trọng"],
    description: "Từng chùm nhãn xuồng trĩu quả màu vàng da bò căng mọng. Bóc lớp vỏ mỏng là phần cùi nhãn dày cộm vàng ươm, giòn dai sần sật ngập tràn nước ngọt lịm. Vị ngọt sắc kèm hương thơm nồng nàn đặc trưng của đất đỏ phù sa.",
    unit: "kg", weight_kg: 1, price_original: 35000, price_sale: 55000, image_url: "images/nhan.jpg", is_available: true
  },
  {
    id: "p5", name: "Bòn Bon Đất Đỏ", category: "TraiCay",
    highlights: ["Chùm sai trĩu quả, vỏ mỏng dính", "Múi trong veo mọng nước, ngọt thanh mát", "Không dính mủ tay, giải nhiệt ngày hè"],
    description: "Thức quà quê tinh tế được cắt cẩn thận từng chùm trên thân cây cổ thụ cuối vụ. Vỏ màu vàng ngà mềm mịn, khi bóp nhẹ lộ ra 5 múi bòn bon trong veo lấp lánh như ngọc. Vị ngọt thanh khiết xen chút chua dịu nhẹ tan êm ái. (Giá thị trường TP.HCM: 65.000 - 85.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 42000, price_sale: 68000, image_url: "images/bonbon.jpg", is_available: true
  },
  {
    id: "p6", name: "Dâu Da Đất Vàng", category: "TraiCay",
    highlights: ["Trái vàng óng ả mọc kín thân cây", "Vị chua ngọt hài hòa, mọng nước", "Món quà vặt dân dã cực kỳ gây nghiện"],
    description: "Đặc sản dân dã đậm chất rừng vườn Đông Nam Bộ. Đã qua cao điểm hè, nhà vườn gom hái từng đợt cây già. Múi dâu ngậm nước mọng óng ả, vị chua ngọt kích thích vị giác, xua tan ngay cảm giác uể oải. (Giá thị trường TP.HCM: 35.000 - 55.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 22000, price_sale: 38000, image_url: "images/dauda.jpg", is_available: true
  },
  {
    id: "p7", name: "Bơ Sáp Dẻo Loại 1", category: "TraiCay",
    highlights: ["Cơm dẻo quánh như bơ sữa, không xơ", "Vỏ mỏng hạt nhỏ, cơm vàng đậm tự nhiên", "Giàu dưỡng chất, ăn tươi hoặc dầm sinh tố"],
    description: "Bơ sáp loại 1 trái dài chắc nịch, da xanh bóng láng. Khi chín tới, phần cơm bơ vàng ươm dẻo quánh như kem tươi, hạt nhỏ xíu tróc vỏ dễ dàng. Vị béo bùi ngậy đượm đà, thích hợp ăn trực tiếp hoặc làm sinh tố. (Giá thị trường TP.HCM: 30.000 - 50.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 22000, price_sale: 38000, image_url: "images/bo-sap.jpg", is_available: true
  },
  {
    id: "p8", name: "Combo 1: Bạn Trẻ Giảng Đường (Măng Cụt + Chôm Chôm + Dâu Da)", category: "Combo",
    highlights: ["3kg trái cây tươi đủ vị chua ngọt thanh mát", "Tiết kiệm hơn so với mua lẻ", "Lựa chọn hàng đầu cho nhóm sinh viên"],
    description: "Set trái cây 3kg chuẩn 'ngon - bổ - rẻ' gồm: 1kg Măng cụt cổ thụ giòn ngọt + 1kg Chôm chôm nhãn tróc hạt + 1kg Dâu da đất chua ngọt dịu mát. Mua lẻ 185.000 đ, đặt theo combo trọn gói chỉ 159.000 đ.",
    unit: "combo", weight_kg: 3, price_original: 119000, price_sale: 159000, image_url: "images/mangosteen-harvest.jpg", is_available: true
  },
  {
    id: "p9", name: "Combo 2: Thầy Cô & Gia Đình (1 Trái Sầu Riêng + 2kg Măng Cụt)", category: "Combo",
    highlights: ["Cặp đôi hoàn hảo 'Vua & Hoàng Hậu' trái cây", "Cân bằng âm dương béo ngậy & thanh mát", "Đóng thùng dán tem QR sang trọng"],
    description: "Set quà tặng cao cấp gồm 1 quả Sầu riêng Ri6 tuyển chọn cơm vàng béo ngậy (2.2 - 2.5kg) đi kèm 2kg Măng cụt cổ thụ chín cây ngọt mát. Mua lẻ 435.000 đ, đặt theo combo chỉ 389.000 đ (tiết kiệm 46.000 đ).",
    unit: "combo", weight_kg: 4.5, price_original: 300000, price_sale: 389000, image_url: "images/durian-pile.jpg", is_available: true
  },
  {
    id: "p10", name: "Combo 3: Đại Tiệc Vườn Nhà (Sầu Riêng + Măng Cụt + Chôm Chôm + Nhãn)", category: "Combo",
    highlights: ["Trọn bộ 4 đặc sản nổi tiếng nhất (5kg)", "Đầy đủ hương vị từ béo ngậy đến ngọt lịm", "Lý tưởng cho liên hoan phòng ban, sum họp"],
    description: "Đại tiệc miệt vườn thịnh soạn gồm: 1 quả Sầu riêng Ri6 thơm nức (~2kg) + 1kg Măng cụt cổ thụ + 1kg Chôm chôm nhãn tróc hạt + 1kg Nhãn xuồng cơm vàng. Mua lẻ 398.000 đ, giá combo chỉ 359.000 đ.",
    unit: "combo", weight_kg: 5, price_original: 270000, price_sale: 359000, image_url: "images/hero-fruits.jpg", is_available: true
  },
  {
    id: "p11", name: "Combo 4: Dinh Dưỡng Khỏe Đẹp (Bơ Sáp Dẻo + Măng Cụt + Nhãn Xuồng)", category: "Combo",
    highlights: ["3.5kg hoa quả giàu vitamin & chất chống oxy hóa", "Cực tốt cho vóc dáng & làn da", "Lựa chọn vàng của chị em công sở"],
    description: "Set quà sức khỏe lành mạnh gồm: 1kg Bơ sáp dẻo vàng ươm + 1.5kg Măng cụt cổ thụ trắng muốt + 1kg Nhãn xuồng cơm vàng mọng nước. Mua lẻ 235.500 đ, đặt combo chỉ 209.000 đ.",
    unit: "combo", weight_kg: 3.5, price_original: 154500, price_sale: 209000, image_url: "images/bo-sap.jpg", is_available: true
  },
  {
    id: "p12", name: "Combo 5: Vị Ngọt Tuổi Thơ Miệt Vườn (Bòn Bon + Dâu Da + Chôm Chôm)", category: "Combo",
    highlights: ["3kg đặc sản dân dã mọng nước", "Chua thanh ngọt mát giải nhiệt tức thì", "Tiết kiệm 19.000 đ so với mua lẻ"],
    description: "Bộ ba thức quà tuổi thơ giải nhiệt dân dã: 1kg Bòn bon đất đỏ mọng nước + 1kg Dâu da đất chua ngọt + 1kg Chôm chôm nhãn giòn rụm. Mua lẻ 158.000 đ, đặt combo chỉ 139.000 đ.",
    unit: "combo", weight_kg: 3, price_original: 96000, price_sale: 139000, image_url: "images/bonbon.jpg", is_available: true
  },
  {
    id: "p13", name: "Combo 6: Hộp Quà Tri Ân Thượng Hạng (Sầu Riêng VIP + Măng Cụt + Bơ Sáp)", category: "Combo",
    highlights: ["Set thượng hạng 5.5kg tuyển trái loại 1", "Thùng carton quai xách in thương hiệu dán tem QR", "Bao ăn 1 đổi 1 tận nơi"],
    description: "Set quà 5.5kg thượng hạng: 1 quả Sầu riêng Ri6 VIP chuẩn đẹp (2.5kg) + 2kg Măng cụt cổ thụ + 1kg Bơ sáp dẻo loại 1. Mua lẻ 473.000 đ, giá combo ưu đãi chỉ 425.000 đ (tiết kiệm 48.000 đ).",
    unit: "combo", weight_kg: 5.5, price_original: 329000, price_sale: 425000, image_url: "images/hero-fruits.jpg", is_available: true
  }
];

const DEMO_ORDERS = [
  {
    id: "ord-001", order_code: "AC-261105-DEMO01", customer_name: "Thầy Trần Văn Minh (demo)", customer_phone: "0912345678",
    customer_role: "GiangVien", delivery_type: "CAMPUS", department: "Khoa Kinh Tế - Phòng 302 Nhà A",
    delivery_address: "Văn phòng Khoa Kinh Tế, Quận 3, TP.HCM",
    items: [{ productId: "p9", name: "Combo 2: Thầy Cô & Gia Đình", unit: "combo", qty: 1, price: 389000, subtotal: 389000 }],
    total_kg: 4.5, shipping_fee: 0, total_amount: 389000, payment_method: "VIETQR", payment_status: "PAID", order_status: "CONFIRMED",
    notes: "Giao trước 11h.", created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "ord-002", order_code: "AC-261105-DEMO02", customer_name: "Chị Hoàng Ánh Tuyết (demo)", customer_phone: "0908765432",
    customer_role: "Khac", delivery_type: "HOME", department: "Giao tận nhà (Quận 7)",
    delivery_address: "45 Đường số 6, Phường Tân Hưng, Quận 7, TP.HCM",
    items: [
      { productId: "p1", name: "Sầu Riêng Ri6 Ruột Vàng", unit: "kg", qty: 2, price: 98000, subtotal: 196000 },
      { productId: "p2", name: "Măng Cụt Cổ Thụ", unit: "kg", qty: 1, price: 95000, subtotal: 95000 }
    ],
    total_kg: 3, shipping_fee: 0, total_amount: 291000, payment_method: "VIETQR", payment_status: "PAID", order_status: "CONFIRMED",
    notes: "Gọi trước 15 phút.", created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: "ord-003", order_code: "AC-261106-DEMO03", customer_name: "Bạn Lê Quang Huy (demo)", customer_phone: "0933221144",
    customer_role: "SinhVien", delivery_type: "HOME", department: "Giao tận nhà (Dĩ An)",
    delivery_address: "KTX Khu B ĐHQG, Phường Đông Hòa, Dĩ An, Bình Dương",
    items: [{ productId: "p8", name: "Combo 1: Bạn Trẻ Giảng Đường", unit: "combo", qty: 1, price: 159000, subtotal: 159000 }],
    total_kg: 3, shipping_fee: 25000, total_amount: 184000, payment_method: "COD", payment_status: "UNPAID", order_status: "CONFIRMED",
    notes: "", created_at: new Date(Date.now() - 14400000).toISOString()
  }
];

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
      console.log("ℹ️ [AgriConnect] Chế độ DEMO: dữ liệu lưu trong trình duyệt.");
    }
    this.initDemoData();
  }

  initDemoData() {
    try {
      localStorage.setItem(LS.products, JSON.stringify(DEMO_PRODUCTS));
      if (!localStorage.getItem(LS.orders)) localStorage.setItem(LS.orders, JSON.stringify(DEMO_ORDERS));
      if (!localStorage.getItem(LS.batch)) {
        localStorage.setItem(LS.batch, JSON.stringify({
          id: "batch-001",
          batch_name: (window.APP_CONFIG?.CAMPAIGN?.BATCH_NAME) || "Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Bình Phước",
          target_kg: (window.APP_CONFIG?.CAMPAIGN?.TARGET_KG) || 60,
          status: "OPEN",
          harvest_date: "Thứ Sáu (thu hái & đóng thùng tại Bình Phước)",
          delivery_date: "Sáng Thứ Bảy (xe khách QL13 + shipper giao đa điểm)"
        }));
      }
    } catch (e) {
      console.warn("LocalStorage warning:", e);
    }
  }

  _read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
      return [];
    }
  }

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("LocalStorage write error:", e);
    }
  }

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
      try {
        const { data, error } = await this.client
          .from("products").select("*").eq("is_available", true).order("created_at", { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("[AgriConnect] Không tải được từ Supabase, dùng dữ liệu dự phòng:", err);
      }
    }
    const local = this._read(LS.products);
    if (local && local.length > 0) return local.filter(p => p.is_available !== false);
    return DEMO_PRODUCTS;
  }

  async getAllProducts() {
    if (this.isCloud) {
      try {
        const { data, error } = await this.client.from("products").select("*");
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("[AgriConnect] Lỗi lấy sản phẩm admin:", err);
      }
    }
    const local = this._read(LS.products);
    return (local && local.length > 0) ? local : DEMO_PRODUCTS;
  }

  // ================= ĐỢT GOM HÀNG =================
  async getCurrentBatch() {
    if (this.isCloud) {
      try {
        const { data, error } = await this.client
          .from("batches").select("*").eq("status", "OPEN")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn("[AgriConnect] Lỗi lấy đợt gom từ Supabase:", err);
      }
    }
    try {
      const batch = JSON.parse(localStorage.getItem(LS.batch) || "{}");
      batch.current_kg = this._read(LS.orders)
        .filter(o => o.order_status !== "CANCELLED")
        .reduce((s, o) => s + Number(o.total_kg || 0), 0);
      if (batch.batch_name) return batch;
    } catch (e) {}

    return {
      batch_name: (window.APP_CONFIG?.CAMPAIGN?.BATCH_NAME) || "Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Bình Phước",
      target_kg: 60,
      current_kg: 0,
      status: "OPEN"
    };
  }

  // ================= GỬI ĐƠN HÀNG =================
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
        items: orderInput.items.map(i => ({
          id: i.productId,
          product_id: i.productId,
          productId: i.productId,
          name: i.name,
          unit: i.unit,
          price: i.price,
          subtotal: i.subtotal,
          qty: i.qty,
          quantity: i.qty
        })),
        payment_method: orderInput.payment_method,
        notes: orderInput.notes || null,
        consent_at: new Date().toISOString()
      };
      const { error } = await this.client.from("orders").insert([payload]);
      if (error) throw new Error(this._friendlyError(error));
      return { ...orderInput, ...pricedPreview };
    }

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
