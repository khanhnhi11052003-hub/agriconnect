/**
 * LOGIC TRANG KHÁCH HÀNG - AGRICONNECT BÌNH PHƯỚC (Production-Ready 5 Trụ Cột)
 * 1. UI/UX: Nhật ký canh tác (Swipeable Traceability Timeline), Thanh tiến trình FOMO gom xe lạnh
 * 2. E-commerce & Vận hành: Data Masking SĐT nhà vườn, In-App Chat, Subscription hàng tuần (-8%) & Pre-order lứa tương lai (Cọc 30%)
 * 3. Logistics Cold-Chain: Cờ is_fresh / is_dry & Thuật toán Geo-fencing (<20km giao 2-4h Ahamove/Lalamove/GrabExpress; >20km khóa ship lẻ, gom Hub-to-Hub)
 * 4. Chuyên gia Nông sản: Phân hạng Biến thể (Loại 1 VIP / Loại 2 Gia đình -15% / Loại 3 Dạt size làm sinh tố -30%) & Bộ lọc Đã Kiểm Định VietGAP
 * 5. Tài chính & Ví Tạm Giữ (Escrow Wallet): Thanh toán trước qua Ví Escrow được Freeship + Giảm 5% (giữ tiền 12h sau nhận hàng); COD chịu phí ship cao nhất 30k + cọc 20%
 */

window.escapeHTML = window.escapeHTML || function (value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

window.formatVND = window.formatVND || function (n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
};

// ================= BỘ NHỚ LƯU TRỮ VÀ TỰ ĐỘNG PHỤC HỒI TƯƠNG TÁC (PERSISTENCE KEYS) =================
const CART_STORAGE_KEY = "agriconnect_cart_v1";
const CHECKOUT_DRAFT_KEY = "agriconnect_checkout_draft_v1";
const USER_ORDERS_KEY = "agriconnect_user_orders_v1";

let currentProducts = [];
let cart = {}; // { productId: quantity }
let selectedVariants = {}; // { productId: "GRADE_1" | "GRADE_2" | "GRADE_3" }
let selectedDeliveryType = "HOME"; // "HOME" | "CAMPUS"
let selectedOrderMode = "SINGLE"; // "SINGLE" | "SUBSCRIPTION_WEEKLY" | "PREORDER_FUTURE"
let appliedDiscount = 10000; // Mặc định mã AGRICONNECT giảm 10.000 đ
let currentTraceProduct = null;
let currentTraceSlideIdx = 0;

// Tải giỏ hàng từ LocalStorage
function loadCartState() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        cart = parsed;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc giỏ hàng từ localStorage:", e);
  }
}

// Lưu giỏ hàng vào LocalStorage
function saveCartState() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn("Lỗi lưu giỏ hàng:", e);
  }
}

window.addToCart = function (productId, qty = 1) {
  changeQty(productId, qty);
};

// Lưu nháp form đặt hàng (Auto-Save)
function saveCheckoutDraft() {
  try {
    const val = id => (document.getElementById(id)?.value || "").trim();
    const draft = {
      name: val("cust-name"),
      phone: val("cust-phone"),
      role: val("cust-role"),
      deliveryType: selectedDeliveryType,
      house: val("home-house"),
      street: val("home-street"),
      ward: val("home-ward"),
      district: val("home-district"),
      city: val("home-city"),
      campus: val("campus-location"),
      notes: val("cust-notes"),
      promo: val("promo-code-input"),
      returnBox: !!document.getElementById("return-box-toggle")?.checked,
      carbonOffset: !!document.getElementById("carbon-offset-toggle")?.checked,
      insurance: !!document.getElementById("insurance-toggle")?.checked,
      paymentMethod: document.querySelector('input[name="payment_method"]:checked')?.value || "VIETQR",
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));

    const statusText = document.getElementById("autosave-status-text");
    if (statusText) {
      const d = new Date();
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      statusText.textContent = `Đã tự động lưu (${timeStr})`;
    }
  } catch (e) {
    console.warn("Lỗi lưu nháp đơn hàng:", e);
  }
}

// Khôi phục nháp form đặt hàng khi khách quay lại
function loadCheckoutDraft() {
  try {
    const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object") return;

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el && v !== undefined && v !== null && v !== "") el.value = v;
    };

    setVal("cust-name", draft.name);
    setVal("cust-phone", draft.phone);
    if (draft.role) setVal("cust-role", draft.role);
    setVal("home-house", draft.house);
    setVal("home-street", draft.street);
    setVal("home-ward", draft.ward);
    setVal("home-district", draft.district);
    if (draft.city) setVal("home-city", draft.city);
    if (draft.campus) setVal("campus-location", draft.campus);
    setVal("cust-notes", draft.notes);
    if (draft.promo) setVal("promo-code-input", draft.promo);

    if (draft.deliveryType && typeof setDeliveryType === "function") {
      setDeliveryType(draft.deliveryType);
    }

    if (draft.paymentMethod) {
      const rad = document.querySelector(`input[name="payment_method"][value="${draft.paymentMethod}"]`);
      if (rad) rad.checked = true;
    }

    if (document.getElementById("return-box-toggle") && typeof draft.returnBox === "boolean") {
      document.getElementById("return-box-toggle").checked = draft.returnBox;
    }
    if (document.getElementById("carbon-offset-toggle") && typeof draft.carbonOffset === "boolean") {
      document.getElementById("carbon-offset-toggle").checked = draft.carbonOffset;
    }
    if (document.getElementById("insurance-toggle") && typeof draft.insurance === "boolean") {
      document.getElementById("insurance-toggle").checked = draft.insurance;
    }
  } catch (e) {
    console.warn("Lỗi đọc nháp đơn hàng:", e);
  }
}

// Lắng nghe tự động lưu trường nhập liệu form
function setupCheckoutAutoSave() {
  const form = document.getElementById("preorder-form");
  if (!form) return;
  let timer = null;
  form.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(saveCheckoutDraft, 400);
  });
  form.addEventListener("change", () => {
    saveCheckoutDraft();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

async function initApp() {
  loadCartState();
  initCountdownTimer();
  setupEventListeners();
  setupCheckoutAutoSave();

  try {
    await loadBatchInfo();
  } catch (err) {
    console.warn("Lỗi tải thông tin đợt gom:", err);
  }

  try {
    await loadProducts();
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    showPageError("Không tải được dữ liệu sản phẩm: " + err.message);
  }

  loadCheckoutDraft();
  renderEsgCircularSection();
  syncEditorAuthUI();
  updateOrderSummary();
  initInteractiveGamificationHub();
  startContinuousLiveActivityEngine();
}

function showPageError(message) {
  const el = document.getElementById("product-list");
  if (el) {
    el.innerHTML = `<div class="col-span-full p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">${escapeHTML(message)}</div>`;
  }
}

// ================= ĐỢT GOM HÀNG & FOMO XE LẠNH =================
async function loadBatchInfo() {
  if (!window.db || typeof window.db.getCurrentBatch !== "function") return;
  const batch = await window.db.getCurrentBatch();
  if (!batch) return;

  const titleEl = document.getElementById("batch-title");
  if (titleEl && batch.batch_name) {
    titleEl.innerText = batch.batch_name.replace(/Bình Phước/gi, "Các Vùng Miền");
  }

  // Để tạo hiệu ứng FOMO thực tế cho chuyến xe lạnh 60kg
  const rawKg = Number(batch.current_kg || 0);
  const currentKg = rawKg > 5 ? rawKg : 38.5;
  const targetKg = Number(batch.target_kg || 60);
  const pct = targetKg > 0 ? Math.min(Math.round((currentKg / targetKg) * 100), 100) : 64;

  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const progressNote = document.getElementById("progress-note");

  if (progressText) progressText.innerText = `Đã gom ${currentKg.toFixed(1)} / ${targetKg.toFixed(0)} kg (${pct}%)`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressNote) {
    const remain = Math.max(0, targetKg - currentKg).toFixed(1);
    progressNote.innerText = pct >= 100
      ? "🎉 Đã gom đủ tải chuyến Xe Lạnh từ vùng nguyên liệu về TP.HCM! Đặt thêm để nhận ưu đãi Freeship."
      : `🔥 Cần gom đủ ${targetKg.toFixed(0)}kg đặc sản vùng miền để xuất phát chuyến Xe Lạnh về TP.HCM. Hiện đã có ${currentKg.toFixed(1)}kg (còn thiếu ${remain}kg). Bạn mua thêm 5kg để chốt xe sớm nhé?`;
  }
}

window.quickFomoAdd5Kg = function () {
  if (!currentProducts || currentProducts.length === 0) return;
  // Ưu tiên chọn Combo 5kg hoặc thêm 5kg Sầu riêng/Măng cụt
  const combo5kg = currentProducts.find(p => Number(p.weight_kg) >= 4.5);
  const targetProd = combo5kg || currentProducts[0];
  if (!targetProd) return;

  const addQty = combo5kg ? 1 : 5;
  cart[targetProd.id] = (cart[targetProd.id] || 0) + addQty;
  saveCartState();
  updateCartUI();
  if (typeof pushLiveUserActivity === "function") {
    pushLiveUserActivity(`🔥 Bạn vừa gom nhanh 5kg ${targetProd.name}!`, "cart");
  }

  const preorderEl = document.getElementById("preorder");
  if (preorderEl) preorderEl.scrollIntoView({ behavior: "smooth" });
};

// ================= ĐẾM NGƯỢC & NGÀY GIAO =================
function getNextThursdayDeadline(now = new Date()) {
  const day = now.getDay();
  const diff = (4 - day + 7) % 7;
  const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 23, 59, 59);
  if (deadline.getTime() < now.getTime()) deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

function getExpectedDeliveryDate(now = new Date()) {
  const deadline = getNextThursdayDeadline(now);
  const saturday = new Date(deadline);
  saturday.setDate(deadline.getDate() + 2);
  return saturday;
}

function formatDateVN(d) {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function initCountdownTimer() {
  const pad = n => (n < 10 ? "0" + n : String(n));
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  function updateTimer() {
    const now = new Date();
    const distance = getNextThursdayDeadline(now).getTime() - now.getTime();
    setText("timer-days", pad(Math.floor(distance / 86400000)));
    setText("timer-hours", pad(Math.floor((distance % 86400000) / 3600000)));
    setText("timer-mins", pad(Math.floor((distance % 3600000) / 60000)));
    setText("timer-secs", pad(Math.floor((distance % 60000) / 1000)));
    setText("delivery-date-hint", formatDateVN(getExpectedDeliveryDate(now)));
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ================= BIẾN THỂ QUY CÁCH (LOẠI 1, LOẠI 2, LOẠI 3 & HAPPY HOUR UGLY FOOD) =================
function getProductVariantInfo(p) {
  if (p.is_ugly_food) {
    const uglyVar = {
      code: "GRADE_UGLY",
      label: `Cứu Hộ Nông Sản Happy Hour (-${p.happy_hour_discount_pct || 60}%)`,
      shortLabel: `Happy Hour (-${p.happy_hour_discount_pct || 60}%)`,
      multiplier: 1.0,
      badge: "Cứu hộ nông sản"
    };
    return { variants: [uglyVar], activeVariant: uglyVar, unitPrice: Math.round(Number(p.price_sale || 0)) };
  }
  const variants = Array.isArray(p.variants) && p.variants.length > 0
    ? p.variants
    : [
        { code: "GRADE_1", label: "Loại 1 (Quà biếu VIP - Tuyển chọn)", shortLabel: "Loại 1 (VIP)", multiplier: 1.0, badge: "Chuẩn VIP 100%" },
        { code: "GRADE_2", label: "Loại 2 (Ăn gia đình - Tiết kiệm 15%)", shortLabel: "Loại 2 (-15%)", multiplier: 0.85, badge: "Tiết kiệm 15%" },
        { code: "GRADE_3", label: "Loại 3 (Dạt size / Làm sinh tố, mứt -30%)", shortLabel: "Loại 3 (-30%)", multiplier: 0.70, badge: "Tiết kiệm 30%" }
      ];
  const chosenCode = selectedVariants[p.id] || "GRADE_1";
  const found = variants.find(v => v.code === chosenCode) || variants[0];
  const unitPrice = Math.round(Number(p.price_sale || 0) * Number(found.multiplier || 1));
  return { variants, activeVariant: found, unitPrice };
}

window.changeProductVariant = function (productId, variantCode) {
  selectedVariants[productId] = variantCode;
  updateCartUI();
};

// ================= SẢN PHẨM & BỘ LỌC KIỂM ĐỊNH =================
let selectedCategory = "ALL";

const CATEGORY_CONFIG = {
  SEASON_NOW: {
    name: "🍁 Đang Rộ Vụ Thu – Đông (Đạt Đỉnh Độ Ngọt Brix)",
    icon: "🍁",
    badgeBg: "bg-amber-500",
    desc: "Trái cây đúng vụ chín cây 100%, lượng đường tự nhiên cao nhất và giá tại vườn tốt nhất. Đang rộ: Cam Sành, Hồng Giòn, Bưởi Da Xanh, Quýt Đường, Vú Sữa, Thanh Long.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-md shadow-amber-500/25 flex items-center gap-1.5 scale-[1.02]"
  },
  ALL: {
    name: "🌾 Tất Cả Nông Sản & Đặc Sản Vùng Miền",
    icon: "🌾",
    badgeBg: "bg-[#256314]",
    desc: "Toàn bộ danh mục trái cây đặc sản, rau củ hữu cơ Đà Lạt, nông sản khô OCOP và combo đi chợ tiết kiệm.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-[#389e18] to-[#59c228] text-white ring-2 ring-[#3ba117] shadow-md shadow-[#44a821]/25 flex items-center gap-1.5 scale-[1.02]"
  },
  TraiCay: {
    name: "🍈 Trái Cây Đặc Sản Chín Cây (Miền Tây - Đông Nam Bộ - Tây Nguyên)",
    icon: "🍈",
    badgeBg: "bg-[#256314]",
    desc: "Sầu riêng Ri6, bưởi da xanh, măng cụt, chôm chôm, bơ sáp dẻo, xoài Cát Hòa Lộc, hồng giòn, cam sành, quýt đường, vú sữa Lò Rèn, thanh long ruột đỏ...",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-[#256314] to-[#3ba117] text-white ring-2 ring-[#3ba117] shadow-md shadow-[#44a821]/25 flex items-center gap-1.5 scale-[1.02]"
  },
  RauCuQua: {
    name: "🥬 Rau Củ Quả Sạch Đà Lạt (Hữu Cơ & VietGAP)",
    icon: "🥬",
    badgeBg: "bg-emerald-700",
    desc: "Cà chua bi hữu cơ, khoai lang mật Tà Nung, bông cải xanh, xà lách thủy canh, cà rốt baby, bắp ngọt — Cắt sương sớm, chuyển xe lạnh sâu 2–6°C.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-emerald-600 to-emerald-700 text-white ring-2 ring-emerald-500 shadow-md shadow-emerald-600/25 flex items-center gap-1.5 scale-[1.02]"
  },
  NongSanKho: {
    name: "🌰 Nông Sản Khô & Hạt Dinh Dưỡng OCOP",
    icon: "🌰",
    badgeBg: "bg-amber-800",
    desc: "Hạt điều rang củi Bình Phước còn vỏ lụa & Macca Đắk Lắk OCOP 4 sao, kiểm định độ ẩm <5%, hút chân không giòn thơm không hôi dầu.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-amber-700 to-amber-800 text-white ring-2 ring-amber-600 shadow-md shadow-amber-800/25 flex items-center gap-1.5 scale-[1.02]"
  },
  Combo: {
    name: "🧺 Combo Đi Chợ Tiết Kiệm & Quà Biếu Sang Trọng",
    icon: "🧺",
    badgeBg: "bg-teal-700",
    desc: "Tiết kiệm 15%–25%: Thùng rau củ tuần 5kg, Combo Miệt Vườn, Thầy Cô, Mâm quả ngũ quả Thu - Đông 179k, Hộp quà Tri Ân thượng hạng.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-teal-600 to-teal-700 text-white ring-2 ring-teal-500 shadow-md shadow-teal-600/25 flex items-center gap-1.5 scale-[1.02]"
  },
  VERIFIED: {
    name: "✅ Nông Sản Đã Kiểm Định (VietGAP & OCOP Chuẩn)",
    icon: "✅",
    badgeBg: "bg-emerald-600",
    desc: "100% sản phẩm có mã Dynamic QR truy xuất nguồn gốc 4 chặng: Thụ phấn, Chăm bón sinh học, Đo độ Brix và Đóng gói dán tem niêm phong.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 text-white ring-2 ring-emerald-400 shadow-md shadow-emerald-500/25 flex items-center gap-1.5 scale-[1.02]"
  },
  UglyFood: {
    name: "⚡ Cứu Hộ Nông Sản 'Ugly Food' (-55% đến -65%)",
    icon: "⚡",
    badgeBg: "bg-orange-600",
    desc: "Nông sản rám nắng vỏ ngoài hoặc chín kỹ cuối tuần, chất lượng ruột ngọt ngon 100%, xả kho trợ giá chống lãng phí thực phẩm.",
    btnActive: "cat-tab px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-orange-500 to-amber-600 text-white ring-2 ring-orange-400 shadow-md shadow-orange-500/25 flex items-center gap-1.5 scale-[1.02]"
  }
};

function updateCategoryBadges() {
  const products = Array.isArray(currentProducts) ? currentProducts : [];
  const counts = {
    ALL: products.length,
    SEASON_NOW: products.filter(p => p.season_tag === "SEASON_NOW" || (p.season_badge && (p.season_badge.includes("Rộ Mùa") || p.season_badge.includes("Thu - Đông") || p.season_badge.includes("Chính Vụ")))).length,
    TraiCay: products.filter(p => p.category === "TraiCay").length,
    RauCuQua: products.filter(p => p.category === "RauCuQua").length,
    NongSanKho: products.filter(p => p.category === "NongSanKho").length,
    Combo: products.filter(p => p.category === "Combo").length,
    VERIFIED: products.filter(p => p.verified !== false).length,
    UglyFood: products.filter(p => p.category === "UglyFood").length
  };

  Object.entries(counts).forEach(([catKey, count]) => {
    const tabEl = document.getElementById(`tab-cat-${catKey}`);
    if (tabEl) {
      const badge = tabEl.querySelector(".tab-badge");
      if (badge) badge.textContent = count;
    }
  });

  return counts;
}

window.filterCategory = function (cat, shouldScroll = true) {
  selectedCategory = cat || "ALL";

  // Cập nhật giao diện tab (Active vs Inactive)
  document.querySelectorAll(".cat-tab").forEach(tab => {
    const isUgly = tab.id === "tab-cat-UglyFood";
    tab.className = isUgly
      ? "cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-orange-600 border border-orange-300 hover:bg-orange-50 flex items-center gap-1.5"
      : "cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-[#256314] border border-[#c8edab] hover:bg-[#f1fbe9] flex items-center gap-1.5";
  });

  const meta = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.ALL;
  const activeTab = document.getElementById(`tab-cat-${selectedCategory}`);
  if (activeTab) {
    activeTab.className = meta.btnActive;
  }

  // Khi chọn tab mới, xóa trống từ khóa tìm kiếm để hiển thị trọn vẹn sản phẩm danh mục đó
  const searchInput = document.getElementById("product-search-input");
  if (searchInput && document.activeElement !== searchInput) {
    searchInput.value = "";
  }

  // Cập nhật số lượng trên các badge
  updateCategoryBadges();

  // Render lưới sản phẩm
  renderProductGrid();

  // Cuộn nhẹ nhàng đến đầu danh sách sản phẩm để khách hàng nhìn thấy ngay
  if (shouldScroll) {
    const activeHeader = document.getElementById("active-category-header");
    if (activeHeader) {
      const rect = activeHeader.getBoundingClientRect();
      if (rect.top < 60 || rect.top > 350) {
        activeHeader.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }
};

function renderProductGrid() {
  const productListEl = document.getElementById("product-list");
  if (!productListEl) return;
  productListEl.innerHTML = "";

  let items = [...currentProducts];
  if (selectedCategory === "VERIFIED") {
    items = items.filter(p => p.verified !== false);
  } else if (selectedCategory === "SEASON_NOW") {
    items = items.filter(p => p.season_tag === "SEASON_NOW" || (p.season_badge && (p.season_badge.includes("Rộ Mùa") || p.season_badge.includes("Thu - Đông") || p.season_badge.includes("Chính Vụ"))));
  } else if (selectedCategory !== "ALL") {
    items = items.filter(p => p.category === selectedCategory);
  }

  // Lọc theo từ khóa tìm kiếm tức thì (#product-search-input)
  const searchKw = (document.getElementById("product-search-input")?.value || "").trim().toLowerCase();
  if (searchKw) {
    items = items.filter(p => {
      const text = `${p.name || ""} ${p.description || ""} ${p.certification_badge || ""} ${(p.highlights || []).join(" ")}`.toLowerCase();
      return text.includes(searchKw);
    });
  }

  // Cập nhật thanh Active Category Header phía trên danh sách sản phẩm
  const meta = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.ALL;
  const catNameEl = document.getElementById("active-cat-name");
  const catIconEl = document.getElementById("active-cat-badge-icon");
  const catDescEl = document.getElementById("active-cat-desc");
  const catBadgeEl = document.getElementById("active-cat-count-badge");

  if (catNameEl) catNameEl.textContent = meta.name.replace(/^[^\s]+\s/, "");
  if (catIconEl) catIconEl.textContent = meta.icon;
  if (catDescEl) {
    catDescEl.innerHTML = searchKw
      ? `Đang lọc theo từ khóa: <strong>"${escapeHTML(searchKw)}"</strong> trong danh mục này. Bấm <strong>[+]</strong> hoặc <strong>[🛒 Chọn Mua]</strong> để đặt hàng ngay:`
      : `${meta.desc} Bấm nút <strong>[+]</strong> hoặc <strong>[🛒 Chọn Mua]</strong> ngay bên dưới để chọn mua trực tiếp:`;
  }
  if (catBadgeEl) {
    catBadgeEl.textContent = `${items.length} sản phẩm`;
    catBadgeEl.className = `px-2.5 py-0.5 rounded-full text-xs font-black ${meta.badgeBg || "bg-[#256314]"} text-white shadow-2xs`;
  }

  // Sắp xếp theo lựa chọn (#product-sort-select)
  const sortMode = document.getElementById("product-sort-select")?.value || "DEFAULT";
  if (sortMode === "PRICE_ASC") {
    items.sort((a, b) => Number(a.price_sale || 0) - Number(b.price_sale || 0));
  } else if (sortMode === "PRICE_DESC") {
    items.sort((a, b) => Number(b.price_sale || 0) - Number(a.price_sale || 0));
  } else if (sortMode === "COLD_2_6C") {
    items.sort((a, b) => {
      const za = a.bio_profile?.tempZone === "COLD_DEEP_2_6C" ? 0 : 1;
      const zb = b.bio_profile?.tempZone === "COLD_DEEP_2_6C" ? 0 : 1;
      return za - zb;
    });
  }

  if (items.length === 0) {
    productListEl.innerHTML = `<div class="col-span-full p-8 text-center rounded-3xl bg-[#f2fbdf] border border-[#c8edab] text-[#256314] text-sm font-semibold">
      <div class="text-3xl mb-2">🍃</div>
      <p>Không tìm thấy nông sản phù hợp với danh mục hoặc từ khóa đã chọn.</p>
      <button type="button" onclick="filterCategory('ALL')" class="mt-3 px-4 py-2 bg-[#256314] text-white text-xs font-extrabold rounded-xl hover:bg-[#1a470e] transition">
        Xem Tất Cả 29 Nông Sản
      </button>
    </div>`;
    return;
  }

  const canEdit = Boolean(window.security && typeof window.security.isEditorAuthorized === "function" && window.security.isEditorAuthorized());

  items.forEach(p => {
    try {
      const isCombo = p.category === "Combo";
      const name = escapeHTML(p.name);
      const desc = escapeHTML(p.description);
      const img = escapeHTML(p.image_url);
      const unit = escapeHTML(p.unit);
      const pid = escapeHTML(p.id);
      const qty = cart[p.id] || 0;
      const { variants, activeVariant, unitPrice } = getProductVariantInfo(p);
      const priceFormatted = formatVND(unitPrice);
      const certBadge = escapeHTML(p.certification_badge || "VietGAP • Hữu Cơ");
      const bio = p.bio_profile || {
        tempLabel: p.is_dry ? "🌰 Khoang Khô Chân Không" : "🌡️ Khoang Mát 12–15°C",
        ethyleneRole: "NEUTRAL",
        phiDays: 14,
        qualityMetric: "Đạt chuẩn VietGAP"
      };
      const rawMerkle = p.merkle_root || "0x8a91f4c2b9e08173fa60";
      const merkleHash = escapeHTML(rawMerkle);
      const merkleShort = escapeHTML(rawMerkle.slice(0, 12) + "...");
      const farm = p.farm_info || {
        farmer_name: "Liên Minh Vườn Bác Năm & HTX Vùng Miền",
        farm_region: "Đông Nam Bộ • Đà Lạt • Miền Tây",
        farming_method: "Canh tác VietGAP • Chín tự nhiên 100%"
      };
    const gallery = Array.isArray(p.media_gallery) && p.media_gallery.length > 0
      ? p.media_gallery
      : [{ id: "m0", type: "image", url: p.image_url || "images/hero-fruits.jpg" }];
    const hasVideo = Boolean(p.video_url || gallery.some(m => m.type === "video"));
    const videoUrl = p.video_url || (gallery.find(m => m.type === "video")?.url || "");

    const highlightsHtml = Array.isArray(p.highlights) && p.highlights.length > 0
      ? `<div class="flex flex-wrap gap-1.5 mt-2">
          ${p.highlights.map(h => `<span class="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e6f9d7] text-[#1c560e] px-2.5 py-0.5 rounded-full border border-[#bbf099] shadow-2xs"><i class="fa-solid fa-circle-check text-[#3ba117] text-[10px]"></i>${escapeHTML(h)}</span>`).join("")}
        </div>`
      : "";

    const galleryThumbsHtml = (gallery.length > 1 || hasVideo || canEdit) ? `
      <div class="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
        ${gallery.map((m, idx) => m.type === "video" ? `
          <a href="${escapeHTML(m.url)}" target="_blank" rel="noopener" class="shrink-0 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs" title="Xem Video thực tế của sản phẩm & Nhà vườn">
            <i class="fa-solid fa-circle-play"></i> Video Vườn
          </a>
        ` : `
          <button type="button" onclick="switchCardMainImage('${pid}', '${escapeHTML(m.url)}')" class="shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 border-[#b8ee99] hover:border-[#3ba117] transition" title="Xem ảnh #${idx + 1}">
            <img src="${escapeHTML(m.url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover" alt="Thumb ${idx + 1}" />
          </button>
        `).join("")}
        ${canEdit ? `
          <button type="button" onclick="openProductPostModal('${pid}')" class="shrink-0 px-2 py-1 rounded-lg bg-[#f2fbdf] hover:bg-[#e1f9cf] text-[#256314] border border-[#b8ee99] text-[10px] font-extrabold" title="Thêm/Đổi/Xóa ảnh hoặc video">
            + Ảnh/Video
          </button>
        ` : ""}
      </div>
    ` : "";

    const variantOptionsHtml = variants.map(v => `
      <option value="${escapeHTML(v.code)}" ${v.code === activeVariant.code ? "selected" : ""}>
        ${escapeHTML(v.label)} — ${formatVND(Math.round(p.price_sale * v.multiplier))}/${unit}
      </option>
    `).join("");

    const actionBtnHtml = qty > 0
      ? `<div class="flex items-center gap-1.5 bg-[#f0fae8] p-1 rounded-2xl border-2 border-[#3ba117] shadow-xs">
          <button type="button" data-dec="${pid}" aria-label="Giảm số lượng" class="w-8 h-8 rounded-xl bg-white text-[#256314] font-black hover:bg-[#e1f9cf] flex items-center justify-center border border-[#c8edab] shadow-2xs active:scale-95 text-base transition-transform">-</button>
          <span class="w-7 text-center font-black text-sm text-[#0f240d]">${qty}</span>
          <button type="button" data-inc="${pid}" aria-label="Tăng số lượng" class="w-8 h-8 rounded-xl bg-[#3ba117] text-white font-black hover:bg-[#256314] flex items-center justify-center shadow-xs active:scale-95 text-base transition-transform">+</button>
        </div>`
      : `<button type="button" data-add="${pid}" class="btn-add bg-gradient-to-r from-[#389e18] to-[#59c228] hover:from-[#2e8213] hover:to-[#4aa720] text-white font-extrabold text-xs px-3.5 sm:px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-[#44a821]/20 whitespace-nowrap">
          <i class="fa-solid fa-cart-plus"></i> Chọn Mua
        </button>`;

    const card = document.createElement("div");
    card.className = "bg-white rounded-3xl overflow-hidden border border-[#d2f0b6] shadow-md card-hover flex flex-col";
    card.innerHTML = `
      <div class="relative h-60 overflow-hidden bg-[#f7fdf3] group">
        <img id="card-img-${pid}" src="${img}" alt="${name}" loading="lazy" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover fruit-pop transition-transform duration-500 group-hover:scale-105">
        <div class="absolute top-3 left-3 flex flex-col gap-1">
          <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isCombo ? "bg-amber-500" : "bg-[#3ba117]"} text-white shadow-md inline-flex items-center gap-1">
            <i class="fa-solid fa-certificate"></i> ${certBadge}
          </span>
          ${p.season_badge ? `
          <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-600 text-[#fef08a] shadow-xs inline-flex items-center gap-1 w-fit border border-amber-300">
            ${escapeHTML(p.season_badge)}
          </span>
          ` : ""}
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-900/90 text-sky-100 backdrop-blur-xs inline-flex items-center gap-1 w-fit">
            ${escapeHTML(bio.tempLabel)}
          </span>
        </div>

        <!-- Nút chỉnh sửa nhanh Ảnh / Video / Thông tin Nhà vườn & Nút Xóa ngay trên thẻ sản phẩm (Chỉ hiển thị khi đã được cấp quyền) -->
        ${canEdit ? `
        <div class="absolute top-3 right-3 flex items-center gap-1">
          <button type="button" onclick="openProductPostModal('${pid}')" class="px-2.5 py-1 rounded-full bg-white/95 hover:bg-[#fef08a] text-[#1c560e] text-[10px] font-black shadow-md border border-[#b8ee99] flex items-center gap-1 transition" title="Chỉnh sửa hình ảnh, video & thông tin Nhà vườn">
            <i class="fa-solid fa-camera text-[#3ba117]"></i>
            <span>Sửa Ảnh/Vườn</span>
          </button>
          <button type="button" onclick="handleDeleteProductCard('${pid}')" class="w-6 h-6 rounded-full bg-white/90 hover:bg-rose-600 text-rose-600 hover:text-white text-[10px] font-black shadow-md flex items-center justify-center transition" title="Xóa sản phẩm này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        ` : ""}

        ${qty > 0 ? `<span class="absolute bottom-3 right-3 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#1c560e] text-[#fef08a] shadow-md border border-[#fef08a]/40 animate-pulse">✓ Đã chọn ${qty} ${unit}</span>` : ""}
        <div class="absolute bottom-3 left-3 flex items-center gap-1.5">
          <button type="button" onclick="openTraceabilityModal('${pid}')" class="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-white/95 hover:bg-[#fef08a] text-[#1c560e] shadow-md border border-[#b8ee99] flex items-center gap-1.5 transition-all">
            <i class="fa-solid fa-book-open text-[#3ba117]"></i>
            <span>Nhật ký & Nhà vườn</span>
          </button>
          ${hasVideo ? `
            <a href="${escapeHTML(videoUrl)}" target="_blank" rel="noopener" class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl bg-rose-600/95 hover:bg-rose-700 text-white shadow-md flex items-center gap-1 transition-all" title="Xem Video quay thực tế tại Nhà vườn">
              <i class="fa-solid fa-video"></i>
              <span>Video</span>
            </a>
          ` : ""}
        </div>
      </div>
      <div class="p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          <h3 class="font-black text-base sm:text-lg text-[#0f240d] leading-snug">${name}</h3>

          <!-- Khối Thông Tin Nhà Vườn Minh Bạch -->
          <div class="mt-2 p-2.5 rounded-2xl bg-[#f7fdf3] border border-[#c8edab] text-[11px] space-y-0.5">
            <div class="font-extrabold text-[#1c560e] flex items-center justify-between gap-1">
              <span class="truncate">🏡 ${escapeHTML(farm.farmer_name)}</span>
              ${canEdit ? `<button type="button" onclick="openProductPostModal('${pid}')" class="text-[10px] font-bold text-[#3ba117] hover:underline shrink-0">✏️ Sửa</button>` : ""}
            </div>
            <div class="text-[#4d6b33] font-medium truncate">📍 ${escapeHTML(farm.farm_region)}</div>
          </div>

          ${galleryThumbsHtml}

          <!-- Huy hiệu Sinh lý Nông học & Chứng thực Blockchain Merkle Hash -->
          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <span class="text-[10px] font-extrabold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200" title="Độ ngọt Brix kiểm định bằng khúc xạ kế">
              🍯 Brix: ${bio.brix || (isCombo ? '15.0° - 18.0°' : '16.5° - 18.0°')}
            </span>
            <span class="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200" title="Thời gian cách ly thuốc bảo vệ thực vật an toàn">
              🧪 Cách ly PHI: ${Number(bio.phiDays || 14)} ngày (0% tồn dư)
            </span>
            <button type="button" onclick="openBlockchainHashVerifyModal('${merkleHash}')" class="text-[10px] font-mono font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 px-2 py-0.5 rounded-md border border-slate-200 transition" title="Bấm để đối soát mã băm bất biến trên Blockchain">
              ⛓️ Hash: ${merkleShort} ↗
            </button>
          </div>
          ${highlightsHtml}
          <p class="text-xs text-[#4d6b33] mt-2 leading-relaxed line-clamp-3">${desc}</p>
        </div>

        <div class="space-y-3 pt-2 border-t border-[#edf7e4]">
          <!-- Bộ chọn Biến thể quy cách (Loại 1 / Loại 2 / Loại 3) -->
          <div class="bg-[#f7fdf3] p-2.5 rounded-2xl border border-[#d2f0b6]">
            <label class="block text-[10px] font-extrabold uppercase text-[#256314] mb-1">
              Phân hạng quy cách (Quản lý kỳ vọng chất lượng):
            </label>
            <select onchange="changeProductVariant('${pid}', this.value)" class="w-full text-xs font-bold text-[#0f240d] bg-white px-2.5 py-1.5 rounded-xl border border-[#c8edab] focus:outline-none focus:border-[#3ba117]">
              ${variantOptionsHtml}
            </select>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="text-[11px] text-[#5f7e45] font-semibold block">${escapeHTML(activeVariant.shortLabel)}:</span>
              <div class="flex items-baseline gap-1.5 flex-wrap">
                <span class="text-xl font-black ${p.is_ugly_food ? "text-amber-700" : "text-[#22720d]"}">${priceFormatted}</span>
                ${p.is_ugly_food && p.price_original ? `<span class="text-xs text-slate-400 line-through font-bold">${formatVND(p.price_original)}</span>` : ""}
                <span class="text-xs text-[#5f7e45]"> / ${unit}</span>
              </div>
            </div>
            <div class="shrink-0">
              ${actionBtnHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    productListEl.appendChild(card);
    } catch (cardErr) {
      console.error("[AgriConnect] Lỗi hiển thị thẻ nông sản:", p?.id, cardErr);
    }
  });
}

window.switchCardMainImage = function (productId, newUrl) {
  const imgEl = document.getElementById(`card-img-${productId}`);
  if (imgEl && newUrl) {
    imgEl.src = newUrl;
  }
};

async function loadProducts() {
  if (window.db && typeof window.db.getProducts === "function") {
    currentProducts = await window.db.getProducts();
  }

  if (!currentProducts || currentProducts.length === 0) {
    showPageError("Hiện chưa có sản phẩm mở bán trong đợt này.");
    return;
  }

  // Hỗ trợ tự động lọc từ khóa ?q=... hoặc danh mục ?cat=... khi chuyển từ Menu 3 gạch của trang khác sang
  try {
    const params = new URLSearchParams(window.location.search);
    const qParam = (params.get("q") || "").trim();
    const catParam = (params.get("cat") || "").trim();
    if (qParam) {
      const searchEl = document.getElementById("product-search-input");
      if (searchEl) searchEl.value = qParam;
      const drawerSearchEl = document.getElementById("quick-drawer-search-input");
      if (drawerSearchEl) drawerSearchEl.value = qParam;
    }
    if (catParam) {
      selectedCategory = catParam;
    }
  } catch (e) {}

  updateCategoryBadges();
  filterCategory(selectedCategory, false);
  renderSelectedCartItems();
  updateStickyCartBar();
  renderIndexFarmPostsShowcase();
}

// ================= MODAL NHẬT KÝ CANH TÁC & HỒ SƠ NHÀ VƯỜN (TRACEABILITY TIMELINE) =================
window.openTraceabilityModal = function (productId) {
  const modal = document.getElementById("traceability-modal");
  if (!modal) return;
  currentTraceProduct = currentProducts.find(p => String(p.id) === String(productId)) || currentProducts[0];
  currentTraceSlideIdx = 0;

  const titleEl = document.getElementById("trace-modal-product-name");
  if (titleEl && currentTraceProduct) {
    titleEl.textContent = "Nhật Ký Canh Tác & Nhà Vườn: " + currentTraceProduct.name;
  }
  renderTraceSlide();
  modal.classList.remove("hidden");
};

window.closeTraceabilityModal = function () {
  document.getElementById("traceability-modal")?.classList.add("hidden");
};

window.stepTraceSlide = function (delta) {
  const timeline = (currentTraceProduct && currentTraceProduct.traceability) || [];
  if (timeline.length === 0) return;
  currentTraceSlideIdx = (currentTraceSlideIdx + delta + timeline.length) % timeline.length;
  renderTraceSlide();
};

function renderTraceSlide() {
  const box = document.getElementById("trace-slide-box");
  const dots = document.getElementById("trace-slide-dots");
  if (!box || !currentTraceProduct) return;

  const timeline = currentTraceProduct.traceability || [];
  const item = timeline[currentTraceSlideIdx] || timeline[0];
  if (!item) return;

  const farm = currentTraceProduct.farm_info || {
    farmer_name: "Liên Minh Vườn Bác Năm & HTX Nông Sản Sạch",
    farm_region: "Đông Nam Bộ • Đà Lạt • Miền Tây",
    farming_method: "VietGAP • Hữu cơ vi sinh",
    farmer_phone: "0784 203 424"
  };
  const gallery = Array.isArray(currentTraceProduct.media_gallery) ? currentTraceProduct.media_gallery : [];

  box.innerHTML = `
    <div class="relative h-48 rounded-xl overflow-hidden border border-[#c8edab]">
      <img src="${escapeHTML(item.image || currentTraceProduct.image_url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover" alt="${escapeHTML(item.title)}" />
      <span class="absolute top-3 left-3 bg-[#1c560e] text-[#fef08a] text-[11px] font-black px-3 py-1 rounded-full shadow">
        ${escapeHTML(item.stage)}
      </span>
      <span class="absolute bottom-3 right-3 bg-white/95 text-[#1c560e] text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow">
        📅 ${escapeHTML(item.date)}
      </span>
    </div>
    <div class="space-y-1.5 pt-1">
      <div class="flex items-center justify-between gap-2">
        <h4 class="font-black text-base text-[#0f240d]">${escapeHTML(item.title)}</h4>
        <span class="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
          ✓ ${escapeHTML(item.badge)}
        </span>
      </div>
      <p class="text-xs text-[#3b5726] leading-relaxed">${escapeHTML(item.desc)}</p>
    </div>
    <!-- Hồ sơ Nhà vườn đính kèm -->
    <div class="mt-2 p-3 rounded-xl bg-white border border-[#c8edab] text-xs space-y-1">
      <div class="flex items-center justify-between gap-2">
        <span class="font-black text-[#1c560e]">🏡 ${escapeHTML(farm.farmer_name)}</span>
        ${(window.security && typeof window.security.isEditorAuthorized === "function" && window.security.isEditorAuthorized()) ? `
        <button type="button" onclick="closeTraceabilityModal();openProductPostModal('${escapeHTML(currentTraceProduct.id)}');" class="px-2 py-0.5 rounded bg-[#e1f9cf] text-[#256314] font-extrabold text-[10px]">
          ✏️ Sửa Ảnh/Video & TT Nhà Vườn
        </button>
        ` : ""}
      </div>
      <div class="text-[11px] text-[#3b5726]">📍 <strong>Vùng trồng:</strong> ${escapeHTML(farm.farm_region)}</div>
      <div class="text-[11px] text-[#3b5726] flex flex-wrap items-center justify-between gap-1.5">
        <span>🌱 <strong>Quy trình:</strong> ${escapeHTML(farm.farming_method || "VietGAP")} • 🔒 <strong>SĐT Vườn:</strong> <code class="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">${escapeHTML(window.security ? window.security.maskPhone(farm.farmer_phone || "0784203424", "CONFIRMED") : "078****424")}</code> (Đã ẩn chống cắt cầu)</span>
        <button type="button" onclick="closeTraceabilityModal();openInAppChatModal();" class="px-2.5 py-1 rounded-lg bg-[#3ba117] hover:bg-[#256314] text-white font-extrabold text-[10px] shadow-2xs">
          💬 Chat Nội Bộ Sàn (Bảo vệ Escrow)
        </button>
      </div>
      ${gallery.length > 0 ? `
        <div class="flex items-center gap-1.5 pt-1 overflow-x-auto">
          ${gallery.map(m => m.type === "video" ? `
            <a href="${escapeHTML(m.url)}" target="_blank" rel="noopener" class="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold shrink-0">🎬 Xem Video Vườn</a>
          ` : `
            <img src="${escapeHTML(m.url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-10 h-10 rounded-lg object-cover border border-[#b8ee99] shrink-0" />
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;

  if (dots) {
    dots.innerHTML = timeline.map((_, i) => `
      <button type="button" onclick="currentTraceSlideIdx=${i};renderTraceSlide();" class="h-2.5 rounded-full transition-all ${i === currentTraceSlideIdx ? 'w-7 bg-[#3ba117]' : 'w-2.5 bg-slate-300'}"></button>
    `).join("");
  }
}

// ================= MODAL 6 & 7: PHÂN QUYỀN ĐĂNG BÀI MỚI & CHỈNH SỬA HÌNH ẢNH, VIDEO, THÔNG TIN NHÀ VƯỜN =================
let modalMediaGallery = [];
let modalReplacingIdx = -1;
let pendingEditorAction = null;

window.syncEditorAuthUI = function () {
  const canEdit = Boolean(window.security && typeof window.security.isEditorAuthorized === "function" && window.security.isEditorAuthorized());
  const sessionInfo = (window.security && typeof window.security.getEditorSessionInfo === "function")
    ? window.security.getEditorSessionInfo()
    : { authorized: canEdit, label: canEdit ? "🔓 Đã cấp quyền chỉnh sửa" : "🔒 Chế độ Khách hàng" };

  document.querySelectorAll(".editor-only-control").forEach(el => {
    el.classList.toggle("hidden", !canEdit);
  });

  const unlockBtn1 = document.getElementById("products-unlock-editor-btn");
  const unlockBtn2 = document.getElementById("showcase-unlock-editor-btn");
  if (unlockBtn1) unlockBtn1.classList.toggle("hidden", canEdit);
  if (unlockBtn2) unlockBtn2.classList.toggle("hidden", canEdit);

  const drawerBadge = document.getElementById("drawer-editor-status-badge");
  const drawerIcon = document.getElementById("drawer-editor-auth-icon");
  const drawerTitle = document.getElementById("drawer-editor-auth-title");
  const drawerSub = document.getElementById("drawer-editor-auth-sub");

  if (drawerBadge) {
    drawerBadge.innerHTML = canEdit
      ? `<span class="text-emerald-300">🔓 ${escapeHTML(sessionInfo.label)}</span>`
      : `<span class="text-slate-300">🔒 Chế độ Khách hàng (Đã ẩn nút sửa/xóa)</span>`;
  }
  if (drawerIcon) {
    drawerIcon.className = canEdit
      ? "fa-solid fa-camera text-emerald-400 text-sm shrink-0"
      : "fa-solid fa-lock text-amber-300 text-sm shrink-0";
  }
  if (drawerTitle) {
    drawerTitle.textContent = canEdit
      ? "📝 Đăng Bài / Sửa Ảnh & Video SP"
      : "🔐 Mở Khóa Quyền Đăng / Sửa Bài";
  }
  if (drawerSub) {
    drawerSub.textContent = canEdit
      ? "Đã cấp quyền • Bấm để đăng hoặc sửa ngay"
      : "Chỉ người được cấp quyền mới sửa ảnh/nội dung";
  }
};

window.handleEditorPermissionButtonClick = function () {
  const canEdit = Boolean(window.security && typeof window.security.isEditorAuthorized === "function" && window.security.isEditorAuthorized());
  if (canEdit) {
    openProductPostModal();
  } else {
    openEditorAuthModal(() => openProductPostModal());
  }
};

window.openEditorAuthModal = function (onSuccessCallback = null) {
  pendingEditorAction = typeof onSuccessCallback === "function" ? onSuccessCallback : null;
  const modal = document.getElementById("editor-auth-modal");
  const errEl = document.getElementById("editor-auth-error");
  const pinEl = document.getElementById("editor-auth-pin");
  if (errEl) {
    errEl.classList.add("hidden");
    errEl.textContent = "";
  }
  if (pinEl) pinEl.value = "";
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => pinEl?.focus(), 100);
  }
};

window.closeEditorAuthModal = function () {
  document.getElementById("editor-auth-modal")?.classList.add("hidden");
  pendingEditorAction = null;
};

window.handleEditorAuthSubmit = function (event) {
  event.preventDefault();
  const pin = (document.getElementById("editor-auth-pin")?.value || "").trim();
  const actor = (document.getElementById("editor-auth-actor")?.value || "Quản trị viên Hệ thống").trim();
  const errEl = document.getElementById("editor-auth-error");

  try {
    if (!window.security || typeof window.security.unlockEditorAccess !== "function") {
      throw new Error("Không tìm thấy mô-đun bảo mật.");
    }
    const session = window.security.unlockEditorAccess(pin, actor);
    const cb = pendingEditorAction;
    closeEditorAuthModal();
    syncEditorAuthUI();
    renderProductGrid();
    if (typeof showToast === "function") {
      showToast(`🔓 Đã mở khóa quyền Chỉnh sửa & Đăng bài cho: ${session.actorName}!`);
    }
    if (cb) cb();
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || "Mã PIN cấp quyền không hợp lệ!";
      errEl.classList.remove("hidden");
    } else {
      alert(err.message);
    }
  }
};

window.handleLockEditorAccess = function () {
  if (window.security && typeof window.security.lockEditorAccess === "function") {
    window.security.lockEditorAccess();
  }
  closeProductPostModal();
  syncEditorAuthUI();
  renderProductGrid();
  if (typeof showToast === "function") {
    showToast("🔒 Đã khóa quyền chỉnh sửa & đăng bài (Chuyển về giao diện Khách hàng).");
  }
};

window.openProductPostModal = function (productId = "") {
  if (!window.security || !window.security.isEditorAuthorized()) {
    openEditorAuthModal(() => openProductPostModal(productId));
    return;
  }
  const modal = document.getElementById("product-post-modal");
  if (!modal) return;

  // Cập nhật danh sách chọn nhanh sản phẩm trong Modal
  const quickSelect = document.getElementById("modal-quick-load-product");
  if (quickSelect) {
    quickSelect.innerHTML = `<option value="">➕ Đăng bài sản phẩm mới...</option>` +
      currentProducts.map(item => `<option value="${escapeHTML(item.id)}" ${String(item.id) === String(productId) ? "selected" : ""}>✏️ Sửa: ${escapeHTML(item.name)}</option>`).join("");
  }

  const p = productId ? currentProducts.find(item => String(item.id) === String(productId)) : null;
  const deleteBtn = document.getElementById("mp-delete-btn");
  const titleEl = document.getElementById("modal-post-title");

  if (p) {
    document.getElementById("mp-edit-id").value = p.id;
    document.getElementById("mp-name").value = p.name || "";
    document.getElementById("mp-category").value = p.category || "TraiCay";
    document.getElementById("mp-price").value = p.price_sale || 65000;
    document.getElementById("mp-unit").value = p.unit || "kg";
    document.getElementById("mp-video-url").value = p.video_url || "";
    document.getElementById("mp-description").value = p.description || "";

    const farm = p.farm_info || {};
    document.getElementById("mp-farmer-name").value = farm.farmer_name || "Vườn Bác Năm & Liên Minh HTX";
    document.getElementById("mp-farm-region").value = farm.farm_region || "Đông Nam Bộ • Đà Lạt • Miền Tây";
    document.getElementById("mp-farming-method").value = farm.farming_method || "Canh tác VietGAP • Hữu cơ vi sinh";
    document.getElementById("mp-farmer-phone").value = farm.farmer_phone || "0784 203 424";

    modalMediaGallery = Array.isArray(p.media_gallery) && p.media_gallery.length > 0
      ? p.media_gallery.map(m => ({ ...m }))
      : [{ id: "m-1", type: "image", url: p.image_url || "images/hero-fruits.jpg", caption: p.name }];

    if (titleEl) titleEl.textContent = "✏️ Chỉnh Sửa Ảnh, Video & Thông Tin Nhà Vườn: " + p.name;
    deleteBtn?.classList.remove("hidden");
  } else {
    document.getElementById("mp-edit-id").value = "";
    document.getElementById("mp-name").value = "";
    document.getElementById("mp-category").value = "TraiCay";
    document.getElementById("mp-price").value = 65000;
    document.getElementById("mp-unit").value = "kg";
    document.getElementById("mp-video-url").value = "";
    document.getElementById("mp-description").value = "";
    document.getElementById("mp-farmer-name").value = "Vườn Bác Năm & Liên Minh HTX Nông Sản Sạch";
    document.getElementById("mp-farm-region").value = "Đông Nam Bộ • Đà Lạt (Lâm Đồng) • Miền Tây";
    document.getElementById("mp-farming-method").value = "Canh tác VietGAP • Hữu cơ vi sinh • Chín tự nhiên 100%";
    document.getElementById("mp-farmer-phone").value = "0784 203 424";

    modalMediaGallery = [
      { id: "m-new-1", type: "image", url: "images/durian-open.jpg", caption: "Ảnh đại diện sản phẩm" }
    ];
    if (titleEl) titleEl.textContent = "🚀 Đăng Bài Nông Sản Mới Kèm Hình Ảnh, Video & Nhà Vườn";
    deleteBtn?.classList.add("hidden");
  }

  renderModalMediaGallery();
  modal.classList.remove("hidden");
};

window.closeProductPostModal = function () {
  document.getElementById("product-post-modal")?.classList.add("hidden");
};

function renderModalMediaGallery() {
  const grid = document.getElementById("mp-gallery-grid");
  const badge = document.getElementById("mp-media-badge");
  if (!grid) return;

  if (!Array.isArray(modalMediaGallery) || modalMediaGallery.length === 0) {
    modalMediaGallery = [{ id: "m-default", type: "image", url: "images/hero-fruits.jpg", caption: "Ảnh sản phẩm" }];
  }

  const imgCount = modalMediaGallery.filter(m => m.type !== "video").length;
  const vidCount = modalMediaGallery.filter(m => m.type === "video").length;
  if (badge) badge.textContent = `${imgCount} ảnh • ${vidCount} video`;

  grid.innerHTML = modalMediaGallery.map((m, idx) => {
    const isVideo = m.type === "video";
    const isPrimary = idx === 0 && !isVideo;
    return `
      <div class="bg-white rounded-xl p-2 border ${isPrimary ? "border-2 border-[#3ba117]" : "border-[#c8edab]"} shadow-2xs flex flex-col justify-between gap-1.5">
        <div class="relative h-24 rounded-lg overflow-hidden bg-slate-100">
          ${isVideo ? `
            <div class="w-full h-full bg-slate-900 text-white flex flex-col items-center justify-center p-2 text-center">
              <i class="fa-solid fa-film text-lg text-emerald-400"></i>
              <span class="text-[9px] font-bold text-emerald-200 line-clamp-2 mt-1">${escapeHTML(m.url.startsWith("data:") ? "Video tải từ máy" : m.url)}</span>
            </div>
          ` : `
            <img src="${escapeHTML(m.url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover" alt="Media ${idx + 1}" />
          `}
          <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
            ${isPrimary ? "⭐ Ảnh chính" : (isVideo ? "🎬 Video" : `Ảnh #${idx + 1}`)}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1 text-[10px] font-bold">
          ${!isPrimary && !isVideo ? `
            <button type="button" onclick="setModalPrimaryMedia(${idx})" class="py-1 px-1 rounded bg-[#e1f9cf] hover:bg-[#c8edab] text-[#1c560e] truncate" title="Đặt làm ảnh chính">⭐ Chính</button>
          ` : `<span class="py-1 px-1 rounded bg-slate-100 text-slate-500 text-center truncate">${isVideo ? "Video" : "Chính"}</span>`}
          <button type="button" onclick="triggerModalReplaceMedia(${idx})" class="py-1 px-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 truncate" title="Thay đổi ảnh/video này">🔄 Đổi</button>
          <button type="button" onclick="removeModalMediaItem(${idx})" class="py-1 px-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 truncate" title="Xóa ảnh/video này">🗑️ Xóa</button>
        </div>
      </div>
    `;
  }).join("");
}

window.setModalPrimaryMedia = function (idx) {
  if (idx <= 0 || idx >= modalMediaGallery.length) return;
  const [picked] = modalMediaGallery.splice(idx, 1);
  modalMediaGallery.unshift(picked);
  renderModalMediaGallery();
};

window.removeModalMediaItem = function (idx) {
  if (modalMediaGallery.length <= 1) {
    const replacement = prompt("Sản phẩm cần tối thiểu 1 hình ảnh. Nhập link ảnh mới để thay thế hoặc bấm Hủy:", "images/hero-fruits.jpg");
    if (replacement && replacement.trim()) {
      modalMediaGallery[0] = { id: "m-" + Date.now(), type: "image", url: replacement.trim(), caption: "Ảnh thay thế" };
      renderModalMediaGallery();
    }
    return;
  }
  modalMediaGallery.splice(idx, 1);
  renderModalMediaGallery();
};

window.triggerModalReplaceMedia = function (idx) {
  modalReplacingIdx = idx;
  document.getElementById("mp-replace-single-input")?.click();
};

window.handleModalReplaceSingleMedia = async function (event) {
  const file = event.target.files?.[0];
  if (!file || modalReplacingIdx < 0 || modalReplacingIdx >= modalMediaGallery.length) return;
  try {
    if (file.type.startsWith("video/")) {
      const vData = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      modalMediaGallery[modalReplacingIdx] = { id: "v-" + Date.now(), type: "video", url: vData, caption: file.name };
      document.getElementById("mp-video-url").value = vData;
    } else {
      const imgData = await window.db.compressImageToDataUrl(file);
      modalMediaGallery[modalReplacingIdx] = { id: "i-" + Date.now(), type: "image", url: imgData, caption: file.name };
    }
    renderModalMediaGallery();
  } catch (e) {
    console.warn(e);
  } finally {
    event.target.value = "";
    modalReplacingIdx = -1;
  }
};

window.handleModalMediaUpload = async function (event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  for (const file of files) {
    try {
      if (file.type.startsWith("video/")) {
        const vData = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = e => res(e.target.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        modalMediaGallery.push({ id: "v-" + Date.now(), type: "video", url: vData, caption: file.name });
        document.getElementById("mp-video-url").value = vData;
      } else {
        const imgData = await window.db.compressImageToDataUrl(file);
        modalMediaGallery.unshift({ id: "i-" + Date.now(), type: "image", url: imgData, caption: file.name });
      }
    } catch (e) {
      console.warn(e);
    }
  }
  event.target.value = "";
  renderModalMediaGallery();
};

window.addModalPresetMedia = function (imgUrl) {
  if (!imgUrl) return;
  modalMediaGallery.unshift({ id: "p-" + Date.now(), type: "image", url: imgUrl, caption: "Ảnh nông sản" });
  document.getElementById("mp-preset-select").value = "";
  renderModalMediaGallery();
};

window.addModalUrlMedia = function () {
  const type = document.getElementById("mp-url-type")?.value || "image";
  const url = (document.getElementById("mp-url-input")?.value || "").trim();
  if (!url) return;
  if (type === "video") {
    modalMediaGallery.push({ id: "v-" + Date.now(), type: "video", url, caption: "Video Nhà vườn" });
    document.getElementById("mp-video-url").value = url;
  } else {
    modalMediaGallery.unshift({ id: "i-" + Date.now(), type: "image", url, caption: "Ảnh Nhà vườn" });
  }
  document.getElementById("mp-url-input").value = "";
  renderModalMediaGallery();
};

window.handleSaveModalProductPost = async function (event) {
  event.preventDefault();
  if (!window.security || !window.security.isEditorAuthorized()) {
    openEditorAuthModal();
    return;
  }
  const editId = (document.getElementById("mp-edit-id")?.value || "").trim();
  const name = document.getElementById("mp-name")?.value.trim();
  const category = document.getElementById("mp-category")?.value || "TraiCay";
  const price_sale = Number(document.getElementById("mp-price")?.value || 65000);
  const unit = (document.getElementById("mp-unit")?.value || "kg").trim();
  const video_url = (document.getElementById("mp-video-url")?.value || "").trim();
  const description = document.getElementById("mp-description")?.value.trim();

  const gallery = [...modalMediaGallery];
  if (video_url && !gallery.some(m => m.type === "video" && m.url === video_url)) {
    gallery.push({ id: "v-" + Date.now(), type: "video", url: video_url, caption: "Video thực tế tại Nhà vườn" });
  }
  const primaryImg = gallery.find(m => m.type !== "video")?.url || "images/hero-fruits.jpg";

  const farm_info = {
    farmer_name: document.getElementById("mp-farmer-name")?.value.trim() || "Vườn Bác Năm & HTX Liên Kết",
    farm_region: document.getElementById("mp-farm-region")?.value.trim() || "Đông Nam Bộ • Đà Lạt",
    farming_method: document.getElementById("mp-farming-method")?.value.trim() || "Canh tác VietGAP • Hữu cơ vi sinh",
    farmer_phone: document.getElementById("mp-farmer-phone")?.value.trim() || "0784 203 424",
    farm_story: description
  };

  try {
    await window.db.saveProductPost({
      id: editId || undefined,
      name,
      category,
      unit,
      price_sale,
      description,
      image_url: primaryImg,
      custom_image_url: primaryImg,
      video_url,
      media_gallery: gallery,
      farm_info
    });

    // Đồng thời nếu người dùng đăng bài mới, tự động thêm 1 bản tin vào Nhật ký Nhà vườn để hiển thị nổi bật
    if (!editId) {
      window.db.saveFarmPost({
        farmer_name: farm_info.farmer_name,
        farm_region: farm_info.farm_region,
        farming_method: farm_info.farming_method,
        farmer_phone: farm_info.farmer_phone,
        title: `Lên kệ mới: ${name} (${formatVND(price_sale)}/${unit})`,
        story: description,
        video_url,
        media_gallery: gallery
      });
    }

    closeProductPostModal();
    await loadProducts();
  } catch (err) {
    alert(err.message || "Không có quyền thực hiện thao tác này.");
  }
};

window.handleDeleteFromModal = async function () {
  if (!window.security || !window.security.isEditorAuthorized()) {
    openEditorAuthModal();
    return;
  }
  const editId = (document.getElementById("mp-edit-id")?.value || "").trim();
  if (!editId) return;
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi kệ hàng không?")) return;
  try {
    await window.db.deleteProductPost(editId);
    closeProductPostModal();
    await loadProducts();
  } catch (err) {
    alert(err.message || "Không có quyền xóa.");
  }
};

window.handleDeleteProductCard = async function (productId) {
  if (!window.security || !window.security.isEditorAuthorized()) {
    openEditorAuthModal(() => handleDeleteProductCard(productId));
    return;
  }
  const p = currentProducts.find(item => String(item.id) === String(productId));
  if (!p) return;
  if (!confirm(`Xóa bài đăng sản phẩm "${p.name}" khỏi danh sách?`)) return;
  try {
    await window.db.deleteProductPost(productId);
    await loadProducts();
  } catch (err) {
    alert(err.message || "Không có quyền xóa.");
  }
};

function renderIndexFarmPostsShowcase() {
  const grid = document.getElementById("index-farm-posts-grid");
  if (!grid || !window.db || typeof window.db.getFarmPosts !== "function") return;
  const posts = window.db.getFarmPosts();
  grid.innerHTML = posts.slice(0, 6).map(post => {
    const gallery = Array.isArray(post.media_gallery) ? post.media_gallery : [];
    const coverImg = gallery.find(m => m.type !== "video")?.url || "images/hero-fruits.jpg";
    const videoUrl = post.video_url || (gallery.find(m => m.type === "video")?.url || "");
    return `
      <div class="bg-[#f7fdf3] rounded-2xl p-4 border border-[#c8edab] flex flex-col justify-between gap-3 shadow-2xs">
        <div class="space-y-2">
          <div class="relative h-40 rounded-xl overflow-hidden border border-[#b8ee99]">
            <img src="${escapeHTML(coverImg)}" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover" alt="${escapeHTML(post.title)}" />
            <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#1c560e]/90 text-[#fef08a] text-[10px] font-black">
              🏡 ${escapeHTML(post.farmer_name)}
            </span>
            ${videoUrl ? `
              <a href="${escapeHTML(videoUrl)}" target="_blank" rel="noopener" class="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow">
                <i class="fa-solid fa-circle-play"></i> Xem Video Vườn
              </a>
            ` : ""}
          </div>
          <div class="text-[11px] font-bold text-[#3ba117]">📍 ${escapeHTML(post.farm_region)} • 🌱 ${escapeHTML(post.farming_method || "VietGAP")}</div>
          <h4 class="font-black text-sm text-[#0f240d] leading-snug">${escapeHTML(post.title)}</h4>
          <p class="text-xs text-[#3b5726] leading-relaxed line-clamp-3">${escapeHTML(post.story)}</p>
        </div>
        ${gallery.length > 1 ? `
          <div class="flex items-center gap-1.5 pt-2 border-t border-[#e1f9cf] overflow-x-auto">
            ${gallery.filter(m => m.type !== "video").slice(0, 4).map(m => `
              <img src="${escapeHTML(m.url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-11 h-11 rounded-lg object-cover border border-[#b8ee99] shrink-0" alt="Ảnh vườn" />
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

// ================= MODAL IN-APP CHAT (CHỐNG CẮT CẦU DATA MASKING) =================
window.openInAppChatModal = function () {
  document.getElementById("inapp-chat-modal")?.classList.remove("hidden");
};

window.closeInAppChatModal = function () {
  document.getElementById("inapp-chat-modal")?.classList.add("hidden");
};

window.sendQuickChatMsg = function (text) {
  // Kiểm tra Tường lửa Chống Cắt Cầu & Rò Rỉ SĐT/Zalo (Anti-Disintermediation DLP)
  const leakCheck = (window.security && typeof window.security.evaluateChatAntiLeakage === "function")
    ? window.security.evaluateChatAntiLeakage(text)
    : { blocked: false, sanitizedText: text };

  appendChatMessage("USER", leakCheck.sanitizedText || text);

  setTimeout(() => {
    if (leakCheck.blocked) {
      appendChatMessage("AI_BLOCK", leakCheck.warningReply);
      return;
    }
    if (window.security && typeof window.security.evaluateAiPrompt === "function") {
      const guard = window.security.evaluateAiPrompt(text);
      if (guard.blocked) {
        appendChatMessage("AI_BLOCK", guard.safeReply);
        return;
      }
      if (/chính sách|freeship|escrow|ai|mùa vụ|giá|đổi trả/i.test(text)) {
        appendChatMessage("AI_BOT", guard.safeReply);
        return;
      }
    }
    appendChatMessage(
      "FARMER",
      "Dạ Bác Năm nhận được tin nhắn rồi nha! Bác đã ghi chú chọn kỹ từng trái chuẩn độ chín cho đơn của mình. Nhờ đặt qua Ví Tạm Giữ AgriConnect nên mình vừa được tích 5% AgriPoints cho tuần sau, vừa được bảo hành 1 đổi 1 tận tay trong 12h ạ!"
    );
  }, 450);
};

window.handleSendInAppChat = function (e) {
  e.preventDefault();
  const input = document.getElementById("inapp-chat-input");
  const msg = (input?.value || "").trim();
  if (!msg) return;
  input.value = "";
  sendQuickChatMsg(msg);
};

function appendChatMessage(sender, text) {
  const list = document.getElementById("inapp-chat-messages");
  if (!list) return;
  const div = document.createElement("div");
  if (sender === "USER") {
    div.className = "flex justify-end";
    div.innerHTML = `<div class="bg-[#3ba117] text-white p-3 rounded-2xl rounded-tr-none max-w-[82%] shadow-2xs">${escapeHTML(text)}</div>`;
  } else if (sender === "AI_BLOCK") {
    div.className = "flex items-start gap-2";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">🛡️</div>
      <div class="bg-rose-50 p-3 rounded-2xl rounded-tl-none border-2 border-rose-300 text-rose-900 font-semibold max-w-[85%] shadow-2xs">${escapeHTML(text)}</div>
    `;
  } else if (sender === "AI_BOT") {
    div.className = "flex items-start gap-2";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">AI</div>
      <div class="bg-indigo-50 p-3 rounded-2xl rounded-tl-none border border-indigo-200 text-slate-800 max-w-[85%] shadow-2xs">${escapeHTML(text)}</div>
    `;
  } else {
    div.className = "flex items-start gap-2";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">BN</div>
      <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-[#d2f0b6] text-slate-800 max-w-[82%] shadow-2xs">${escapeHTML(text)}</div>
    `;
  }
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

// ================= CHẾ ĐỘ ĐẶT HÀNG (SINGLE / SUBSCRIPTION / PREORDER FUTURE) =================
window.setOrderMode = function (mode) {
  selectedOrderMode = mode;
  const modes = [
    { code: "SINGLE", id: "btn-mode-single" },
    { code: "SUBSCRIPTION_WEEKLY", id: "btn-mode-sub" },
    { code: "PREORDER_FUTURE", id: "btn-mode-future" }
  ];
  modes.forEach(m => {
    const el = document.getElementById(m.id);
    if (!el) return;
    if (m.code === mode) {
      el.className = "p-3.5 rounded-2xl border-2 text-left transition-all bg-[#f4fceb] border-[#3ba117] shadow-sm";
    } else {
      el.className = "p-3.5 rounded-2xl border-2 text-left transition-all bg-white border-[#d2e7b8] hover:border-[#3ba117]";
    }
  });

  const banner = document.getElementById("order-mode-banner");
  if (banner) {
    if (mode === "SUBSCRIPTION_WEEKLY") {
      banner.classList.remove("hidden");
      banner.innerHTML = `🔄 <strong>Đã bật Đăng ký Định Kỳ Hàng Tuần (Subscriptions):</strong> Bạn được <strong>giảm thêm 8%</strong> trên tổng đơn! Hệ thống sẽ tự động tạo lệnh (Auto-generate order) gửi cho Vườn Bác Năm vào Thứ Năm hàng tuần để giao sáng Thứ Bảy.`;
    } else if (mode === "PREORDER_FUTURE") {
      banner.classList.remove("hidden");
      banner.innerHTML = `🌱 <strong>Đã bật Đặt Trước Lứa Tương Lai (15–30 ngày tới):</strong> Bạn chỉ cần <strong>Đặt cọc trước 30%</strong> hôm nay vào Ví Escrow để giữ mức giá gốc tốt nhất. Nông dân có dòng tiền chăm sóc vườn và hoàn toàn yên tâm sản xuất!`;
    } else {
      banner.classList.add("hidden");
    }
  }
  updateOrderSummary();
};

// ================= THUẬT TOÁN GEO-FENCING & COLD-CHAIN =================
window.checkGeofencingRadius = function () {
  const cityEl = document.getElementById("home-city");
  const warnEl = document.getElementById("geofence-warning");
  if (!cityEl || !warnEl) return;

  if (cityEl.value === "OUTER_OVER_20KM") {
    warnEl.classList.remove("hidden");
    warnEl.innerHTML = `⚠️ <strong>Thuật toán Geo-fencing Cold-Chain:</strong> Giỏ hàng của bạn chứa <strong>Hàng Tươi Sống (is_fresh = true)</strong> và khoảng cách vượt quá bán kính <strong>20km</strong>. Để tránh rau quả héo/sượng khi gửi chuyển phát thường 2–3 ngày, hệ thống tự động chuyển đơn sang nhận tại <strong>Điểm Tập Kết Xe Lạnh Cố Định (Hub-to-Hub)</strong>!`;
    setTimeout(() => {
      setDeliveryType("CAMPUS");
    }, 300);
  } else {
    warnEl.classList.add("hidden");
  }
};

// ================= GIỎ HÀNG =================
function changeQty(productId, delta) {
  const current = cart[productId] || 0;
  const updated = Math.min(50, Math.max(0, current + delta));
  if (updated === 0) {
    delete cart[productId];
  } else {
    cart[productId] = updated;
  }
  saveCartState();
  updateCartUI();
  if (typeof playAgriSound === "function") {
    playAgriSound("tick");
  }

  if (delta > 0) {
    const prod = currentProducts.find(p => String(p.id) === String(productId));
    if (prod && typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity(`🛒 Đã lưu "${prod.name}" vào giỏ hàng của bạn`, "cart");
    }
  }
}

window.clearCart = function () {
  cart = {};
  saveCartState();
  updateCartUI();
};

function updateCartUI() {
  renderProductGrid();
  renderSelectedCartItems();
  updateStickyCartBar();
  updateOrderSummary();
}

function renderSelectedCartItems() {
  const container = document.getElementById("cart-selected-items");
  if (!container) return;

  const selectedEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
  let html = "";

  if (selectedEntries.length > 0) {
    const totalSelectedQty = selectedEntries.reduce((sum, [_, q]) => sum + q, 0);
    html += `
      <div class="p-3 sm:p-3.5 rounded-2xl bg-[#f0fae8] border border-[#bbf099] flex items-center justify-between gap-2 shadow-2xs">
        <span class="text-xs sm:text-sm font-black text-[#1c560e] flex items-center gap-2">
          <i class="fa-solid fa-basket-shopping text-[#3ba117] text-base"></i>
          <span>Bạn đã chọn <span class="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">${totalSelectedQty} món</span></span>
        </span>
        <button type="button" onclick="clearCart()" class="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1">
          <i class="fa-solid fa-rotate-left text-[10px]"></i> Đặt lại
        </button>
      </div>
      <div class="space-y-2.5">
    `;

    selectedEntries.forEach(([id, qty]) => {
      const p = currentProducts.find(x => String(x.id) === String(id));
      if (!p) return;
      const { activeVariant, unitPrice } = getProductVariantInfo(p);
      const lineTotal = unitPrice * qty;

      html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#b8ee99] shadow-xs gap-3">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img src="${escapeHTML(p.image_url)}" onerror="this.src='images/hero-fruits.jpg'" alt="" class="w-12 h-12 rounded-xl object-cover fruit-pop border border-[#c8edab] shrink-0">
            <div class="min-w-0">
              <h4 class="font-black text-xs sm:text-sm text-[#0f240d] truncate">${escapeHTML(p.name)}</h4>
              <p class="text-[11px] sm:text-xs text-[#2e8213] font-bold">
                <span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] mr-1">${escapeHTML(activeVariant.shortLabel)}</span>
                ${formatVND(unitPrice)} / ${escapeHTML(p.unit)}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <div class="flex items-center gap-1 bg-[#f0fae8] p-1 rounded-xl border border-[#c8edab]">
              <button type="button" data-dec="${p.id}" aria-label="Giảm" class="w-7 h-7 rounded-lg bg-white text-[#256314] font-black hover:bg-[#e1f9cf] flex items-center justify-center border border-[#c8edab] shadow-2xs active:scale-95 text-sm">-</button>
              <span class="w-6 text-center font-black text-xs text-[#0f240d]">${qty}</span>
              <button type="button" data-inc="${p.id}" aria-label="Tăng" class="w-7 h-7 rounded-lg bg-[#3ba117] text-white font-black hover:bg-[#256314] flex items-center justify-center shadow-xs active:scale-95 text-sm">+</button>
            </div>
            <div class="text-right min-w-[70px] sm:min-w-[85px]">
              <span class="font-black text-xs sm:text-sm text-[#22720d] block">${formatVND(lineTotal)}</span>
              <span class="text-[10px] text-slate-400 block">${qty} ${escapeHTML(p.unit)}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Menu Đặt Hàng Trực Tiếp Kèm Phân Hạng Loại 1 / Loại 2 / Loại 3 (Thu gọn thông minh <details> khi đã chọn >= 1 món để tối ưu Mobile UX)
  const isCollapsible = selectedEntries.length > 0;
  html += `
    <div class="pt-2">
      ${isCollapsible ? `
        <details class="group rounded-2xl border border-[#c8edab] bg-[#f7fdf3]/70 p-3">
          <summary class="cursor-pointer list-none flex items-center justify-between gap-2 text-xs sm:text-sm font-extrabold text-[#1c560e]">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-circle-plus text-[#3ba117]"></i>
              <span>Bấm để chọn thêm nông sản khác (${currentProducts.length} món trong menu)</span>
            </span>
            <span class="text-[11px] font-bold text-[#256314] bg-white px-2.5 py-1 rounded-xl border border-[#c8edab] group-open:bg-[#e1f9cf]">
              Mở rộng / Thu gọn ▾
            </span>
          </summary>
          <div class="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
      ` : `
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-xs sm:text-sm font-extrabold text-[#0f240d] flex items-center gap-1.5">
            <i class="fa-solid fa-list-check text-[#3ba117]"></i>
            <span>Bấm nút [+] hoặc 'Chọn Mua' để đặt món:</span>
          </span>
          <a href="#products" class="text-xs font-bold text-[#256314] hover:underline flex items-center gap-1">
            <span>Xem ảnh lớn & Phân hạng</span>
            <i class="fa-solid fa-arrow-up text-[10px]"></i>
          </a>
        </div>
        <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
      `}
  `;

  currentProducts.forEach(p => {
    const qty = cart[p.id] || 0;
    const isCombo = p.category === "Combo";
    const pid = escapeHTML(p.id);
    const { activeVariant, unitPrice } = getProductVariantInfo(p);

    html += `
      <div class="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl ${qty > 0 ? 'bg-[#f7fdf3] border-2 border-[#82d648]' : 'bg-white border border-[#d2f0b6]'} hover:border-[#3ba117] transition-all gap-2 shadow-2xs">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img src="${escapeHTML(p.image_url)}" onerror="this.src='images/hero-fruits.jpg'" alt="" class="w-11 h-11 rounded-xl object-cover fruit-pop border border-[#d2f0b6] shrink-0">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h4 class="font-black text-xs sm:text-sm text-[#0f240d] truncate">${escapeHTML(p.name)}</h4>
              <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${isCombo ? 'bg-amber-100 text-amber-800' : 'bg-[#e1f9cf] text-[#256314]'}">${escapeHTML(activeVariant.shortLabel)}</span>
            </div>
            <p class="text-[11px] sm:text-xs text-[#2e8213] font-bold mt-0.5">${formatVND(unitPrice)} <span class="text-[10px] text-slate-400 font-normal">/ ${escapeHTML(p.unit)}</span></p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${qty > 0 ? `
            <div class="flex items-center gap-1 bg-[#f0fae8] p-1 rounded-xl border border-[#3ba117]">
              <button type="button" data-dec="${pid}" class="w-7 h-7 rounded-lg bg-white text-[#256314] font-black hover:bg-[#e1f9cf] flex items-center justify-center border border-[#c8edab] shadow-2xs active:scale-95 text-xs">-</button>
              <span class="w-6 text-center font-black text-xs text-[#0f240d]">${qty}</span>
              <button type="button" data-inc="${pid}" class="w-7 h-7 rounded-lg bg-[#3ba117] text-white font-black hover:bg-[#256314] flex items-center justify-center shadow-xs active:scale-95 text-xs">+</button>
            </div>
          ` : `
            <button type="button" data-add="${pid}" class="bg-[#f0fae8] hover:bg-[#3ba117] text-[#256314] hover:text-white font-extrabold text-xs px-3 sm:px-3.5 py-1.5 rounded-xl border border-[#c8edab] transition-all flex items-center gap-1 active:scale-95 shadow-2xs">
              <i class="fa-solid fa-plus text-[10px]"></i> Chọn Mua
            </button>
          `}
        </div>
      </div>
    `;
  });

  html += isCollapsible ? `
          </div>
        </details>
      </div>
  ` : `
        </div>
      </div>
  `;

  container.innerHTML = html;
}

function updateStickyCartBar() {
  const bar = document.getElementById("sticky-cart-bar");
  if (!bar) return;

  const priced = priceCart();
  const totalCount = priced.items.reduce((sum, item) => sum + item.qty, 0);

  if (totalCount > 0) {
    bar.classList.remove("translate-y-32", "opacity-0", "pointer-events-none");
    bar.classList.add("translate-y-0", "opacity-100", "pointer-events-auto");

    const countEl = document.getElementById("sticky-cart-count");
    const totalEl = document.getElementById("sticky-cart-total");
    const promoEl = document.getElementById("sticky-cart-promo");

    if (countEl) countEl.innerText = `${totalCount} món (${priced.total_kg.toFixed(1)} kg)`;
    if (totalEl) totalEl.innerText = formatVND(priced.total_amount);
    if (promoEl) {
      const freeshipThreshold = Number(window.APP_CONFIG?.SHIPPING?.FREESHIP_THRESHOLD ?? 350000);
      if (priced.is_freeship) {
        promoEl.innerHTML = `<span class="text-[#fef08a] font-bold">🎉 Đã đạt chuẩn FREESHIP (Đơn ≥ 350k) + Bảo vệ Ví Escrow!</span>`;
      } else {
        const lack = Math.max(0, freeshipThreshold - priced.subtotal);
        promoEl.innerText = `Mua thêm ${formatVND(lack)} để được FREESHIP 0đ (Chuẩn AOV ≥ 350k)!`;
      }
    }
  } else {
    bar.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
    bar.classList.remove("translate-y-0", "opacity-100", "pointer-events-auto");
  }
}

window.quickBoostAovCombo = function () {
  // Thêm ngay Combo Đi Chợ Tuần (p9: 389k) hoặc Combo Văn Phòng (p10: 359k) để đạt AOV > 350.000 đ & mở khóa Freeship 0đ
  const combo = currentProducts.find(p => String(p.id) === "p9" || String(p.id) === "p10") || currentProducts[0];
  if (!combo) return;
  const pid = String(combo.id);
  cart[pid] = Math.min(Number(combo.stock || 20), (cart[pid] || 0) + 1);
  updateCartUI();
  showToast(`🎁 Đã thêm "${combo.name}" • Mở khóa ngay FREESHIP 0đ (Đơn ≥ 350.000 đ)!`);
};

window.focusCheckoutForm = function () {
  const form = document.getElementById("preorder");
  if (form) {
    form.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      document.getElementById("cust-name")?.focus();
    }, 400);
  }
};

// ================= HÌNH THỨC GIAO HÀNG =================
window.setDeliveryType = function (type) {
  selectedDeliveryType = type;
  const btnHome = document.getElementById("btn-delivery-home");
  const btnCampus = document.getElementById("btn-delivery-campus");
  const active = ["bg-[#5a8d29]", "text-white", "shadow-md", "border-[#5a8d29]"];
  const inactive = ["bg-white", "text-slate-700", "border-[#d2e7b8]"];

  const [on, off] = type === "HOME" ? [btnHome, btnCampus] : [btnCampus, btnHome];
  on?.classList.add(...active); on?.classList.remove(...inactive);
  off?.classList.remove(...active); off?.classList.add(...inactive);

  document.getElementById("delivery-home-fields")?.classList.toggle("hidden", type !== "HOME");
  document.getElementById("delivery-campus-fields")?.classList.toggle("hidden", type !== "CAMPUS");
  updateOrderSummary();
};

// ================= ÁP DỤNG MÃ GIẢM GIÁ =================
window.applyPromoCode = function () {
  const input = document.getElementById("promo-code-input");
  const msgEl = document.getElementById("promo-code-msg");
  const code = (input?.value || "").trim().toUpperCase();

  if (!msgEl) return;
  msgEl.classList.remove("hidden");

  if (code === "AGRICONNECT") {
    appliedDiscount = 10000;
    msgEl.className = "text-xs font-bold text-[#256314] block mt-1";
    msgEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-[#3ba117]"></i> Áp dụng thành công mã <strong>AGRICONNECT</strong>: Giảm ngay 10.000 đ!`;
  } else if (!code) {
    appliedDiscount = 0;
    msgEl.classList.add("hidden");
  } else {
    appliedDiscount = 0;
    msgEl.className = "text-xs font-bold text-rose-600 block mt-1";
    msgEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Mã ưu đãi "${escapeHTML(code)}" không hợp lệ.`;
  }

  updateOrderSummary();
};

// ================= TÍNH TIỀN (TÍCH HỢP 5 TRỤ CỘT: VARIANT, SUBSCRIPTION, ESCROW VS COD) =================
function priceCart() {
  const items = [];
  let subtotal = 0;
  let totalKg = 0;

  Object.entries(cart).forEach(([id, qty]) => {
    const p = currentProducts.find(x => String(x.id) === String(id));
    if (!p || qty <= 0) return;
    const { activeVariant, unitPrice } = getProductVariantInfo(p);
    const line = unitPrice * qty;
    items.push({
      productId: p.id,
      name: `${p.name} (${activeVariant.shortLabel})`,
      variantCode: activeVariant.code,
      variantLabel: activeVariant.shortLabel,
      unit: p.unit,
      qty,
      price: unitPrice,
      subtotal: line
    });
    subtotal += line;
    totalKg += Number(p.weight_kg || 1) * qty;
  });

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || "VIETQR";
  const freeshipThreshold = Number(window.APP_CONFIG?.SHIPPING?.FREESHIP_THRESHOLD ?? 350000);
  const stdHomeFee = Number(window.APP_CONFIG?.SHIPPING?.HOME_DELIVERY_FEE ?? 25000);
  const codHomeFee = Number(window.APP_CONFIG?.SHIPPING?.COD_DELIVERY_FEE ?? 35000);

  // Logic Tài chính Chuyên gia (Chống đốt biên lợi nhuận vào Logistics):
  // - Freeship có điều kiện: Chỉ miễn phí vận chuyển (0đ) khi đơn hàng đạt chuẩn AOV >= 350.000 đ
  // - Đơn dưới 350.000 đ: Thu đồng giá 25.000 đ (VietQR Escrow) hoặc 35.000 đ (COD hàng tươi sống) để xóa bỏ bù lỗ ship 33k/đơn
  let shippingFee = 0;
  if (items.length > 0 && selectedDeliveryType === "HOME") {
    if (subtotal >= freeshipThreshold) {
      shippingFee = 0;
    } else if (paymentMethod === "VIETQR") {
      shippingFee = stdHomeFee; // 25.000 đ cho đơn dưới 350k thanh toán qua Ví Escrow
    } else {
      shippingFee = codHomeFee; // 35.000 đ cho đơn dưới 350k chọn COD
    }
  }

  // Tính tổng ưu đãi: Mã giảm giá (10k) + Ưu đãi thanh toán trước Ví Escrow (5%) + Ưu đãi Subscription định kỳ hàng tuần (8%) + Thu hồi thùng trống (10k)
  let cashlessDiscount = (paymentMethod === "VIETQR" && subtotal > 0) ? Math.round(subtotal * 0.05) : 0;
  let subscriptionDiscount = (selectedOrderMode === "SUBSCRIPTION_WEEKLY" && subtotal > 0) ? Math.round(subtotal * 0.08) : 0;
  const promoDiscount = (appliedDiscount > 0 && subtotal > 0) ? appliedDiscount : 0;
  const returnBox = document.getElementById("order-return-box-check")?.checked === true;
  const boxReturnVoucher = (returnBox && subtotal > 0) ? Number(window.APP_CONFIG?.SHIPPING?.RETURN_BOX_VOUCHER ?? 10000) : 0;

  const totalDiscount = Math.min(subtotal, promoDiscount + cashlessDiscount + subscriptionDiscount + boxReturnVoucher);
  const wantInsurance = document.getElementById("order-insurance-check")?.checked !== false;
  const insuranceFee = (items.length > 0 && wantInsurance) ? 1000 : 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - totalDiscount + insuranceFee);

  // Tính số tiền cần thanh toán / đặt cọc ngay
  let payableNow = totalAmount;
  let depositLabel = "";
  if (selectedOrderMode === "PREORDER_FUTURE") {
    payableNow = Math.round(totalAmount * 0.30);
    depositLabel = "Đặt cọc trước 30% (Pre-order lứa tương lai 15-30 ngày):";
  } else if (paymentMethod === "COD") {
    payableNow = Math.round(totalAmount * 0.20);
    depositLabel = "Cọc 20% chống boom hàng nông sản tươi (COD):";
  }

  // Tính điểm thưởng giữ chân khách hàng (AgriPoints: Hoàn 5% đơn thường, 8% đơn Subscription vào Ví tích điểm cho tuần sau)
  const loyaltyInfo = (window.security && typeof window.security.calculateLoyaltyBenefits === "function")
    ? window.security.calculateLoyaltyBenefits(subtotal, selectedOrderMode)
    : { pointRatePct: 5, earnedPointsVnd: Math.round(subtotal * 0.05), estimatedOffPlatformExtraCost: 0 };

  return {
    items,
    subtotal,
    shipping_fee: shippingFee,
    discount: totalDiscount,
    cashless_discount: cashlessDiscount,
    subscription_discount: subscriptionDiscount,
    box_return_discount: boxReturnVoucher,
    insurance_fee: insuranceFee,
    total_amount: totalAmount,
    payable_now: payableNow,
    deposit_label: depositLabel,
    total_kg: totalKg,
    payment_method: paymentMethod,
    order_mode: selectedOrderMode,
    freeship_threshold: freeshipThreshold,
    is_freeship: (selectedDeliveryType === "HOME" && shippingFee === 0 && items.length > 0),
    loyalty_points_vnd: loyaltyInfo.earnedPointsVnd,
    loyalty_rate_pct: loyaltyInfo.pointRatePct
  };
}

function updateOrderSummary() {
  const priced = priceCart();
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  setText("summary-subtotal", formatVND(priced.subtotal));

  // Cập nhật Thanh Tiến Trình Upsell AOV 350.000 đ (Freeship có điều kiện)
  const aovTextEl = document.getElementById("aov-upsell-text");
  const aovBarEl = document.getElementById("aov-upsell-bar");
  const aovBtnEl = document.getElementById("aov-upsell-btn");
  const threshold = priced.freeship_threshold || 350000;
  if (aovBarEl) {
    const pct = Math.min(100, Math.round((priced.subtotal / threshold) * 100));
    aovBarEl.style.width = `${pct}%`;
  }
  if (aovTextEl) {
    if (priced.subtotal >= threshold) {
      aovTextEl.innerHTML = `<span class="text-[#1f5610] font-black">🎉 Tuyệt vời! Đơn hàng (${formatVND(priced.subtotal)}) đã đạt chuẩn AOV ≥ 350.000 đ — Mở khóa FREESHIP 0đ tận nhà!</span>`;
      if (aovBtnEl) aovBtnEl.classList.add("hidden");
    } else if (priced.subtotal > 0) {
      const lack = threshold - priced.subtotal;
      aovTextEl.innerHTML = `💡 Mua thêm <strong class="text-rose-700">${formatVND(lack)}</strong> nữa để đạt mốc <strong>350.000 đ</strong> và được <strong>FREESHIP 0đ tận nhà</strong> (Tiết kiệm 25.000 đ phí ship)!`;
      if (aovBtnEl) aovBtnEl.classList.remove("hidden");
    } else {
      aovTextEl.innerHTML = `💡 Chọn <strong>Combo Đi Chợ Tuần (359k - 389k)</strong> hoặc gom đơn từ <strong>350.000 đ</strong> để được <strong>FREESHIP 0đ tận nhà</strong>!`;
      if (aovBtnEl) aovBtnEl.classList.remove("hidden");
    }
  }

  // Cảnh báo Phân Khoang Nhiệt Độ & Tách Khí Ethylene Tự Động (Chuyên gia Nông nghiệp & Sinh thái)
  const coldAlertEl = document.getElementById("coldchain-compartment-alert");
  if (coldAlertEl) {
    const selectedProds = Object.entries(cart)
      .filter(([_, q]) => q > 0)
      .map(([id]) => currentProducts.find(x => String(x.id) === String(id)))
      .filter(Boolean);
    if (selectedProds.length === 0) {
      coldAlertEl.classList.add("hidden");
    } else {
      coldAlertEl.classList.remove("hidden");
      const zones = [...new Set(selectedProds.map(p => p.bio_profile?.tempLabel || "🌡️ Khoang Mát 12–15°C"))];
      const hasProducer = selectedProds.some(p => p.bio_profile?.ethyleneRole === "PRODUCER");
      const hasSensitive = selectedProds.some(p => p.bio_profile?.ethyleneRole === "SENSITIVE");
      if (hasProducer && hasSensitive) {
        coldAlertEl.className = "p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-400 text-xs text-sky-950 space-y-1.5 shadow-2xs";
        coldAlertEl.innerHTML = `
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="font-black text-sky-900 flex items-center gap-1.5">
              <i class="fa-solid fa-snowflake text-sky-600"></i>
              <span>🔬 Tự Động Tách 2 Khoang Sinh Học (Chống Chín Ép & Vàng Lá Do Khí Ethylene)</span>
            </span>
            <span class="text-[10px] font-black bg-sky-700 text-white px-2 py-0.5 rounded-md">Chuẩn Post-Harvest</span>
          </div>
          <p class="text-[11px] text-sky-900 leading-relaxed">
            Giỏ hàng của bạn có cả <strong>Trái cây chín sinh khí Ethylene</strong> (Sầu riêng, Bơ, Xoài, Cà chua...) và <strong>Rau củ nhạy cảm Ethylene</strong> (Xà lách, Bông cải, Củ quả Đà Lạt). Hệ thống Hub AgriConnect tự động đóng thành <strong>2 túi cách ly riêng biệt kèm gói hấp thụ KMnO₄</strong> ở các vùng nhiệt độ: <strong>${zones.map(escapeHTML).join(" + ")}</strong>!
          </p>
        `;
      } else {
        coldAlertEl.className = "p-3 rounded-2xl bg-[#f0fae8] border border-[#bbf099] text-xs text-[#1c560e] flex items-center justify-between gap-2 flex-wrap";
        coldAlertEl.innerHTML = `
          <span class="font-extrabold flex items-center gap-1.5">
            <i class="fa-solid fa-temperature-low text-[#3ba117]"></i>
            <span>Chế độ bảo quản Cold-Chain tự động cho đơn này: <strong>${zones.map(escapeHTML).join(" • ")}</strong></span>
          </span>
          <span class="text-[10px] font-black bg-white text-[#256314] px-2 py-0.5 rounded border border-[#c8edab]">✓ Cách ly PHI Đạt Chuẩn</span>
        `;
      }
    }
  }

  const shipEl = document.getElementById("summary-shipping");
  if (shipEl) {
    if (selectedDeliveryType === "CAMPUS") {
      shipEl.innerText = "Miễn phí 0 đ (Nhận tại Hub Xe Lạnh / Trường)";
    } else if (priced.is_freeship) {
      shipEl.innerText = "Miễn phí 0 đ (Đạt chuẩn AOV ≥ 350.000 đ)";
    } else if (priced.payment_method === "VIETQR") {
      shipEl.innerText = `${formatVND(priced.shipping_fee)} (Đồng giá đơn < 350k • Ví Escrow)`;
    } else {
      shipEl.innerText = `${formatVND(priced.shipping_fee)} (Phí COD hàng tươi đơn < 350k)`;
    }
  }

  const rowDiscount = document.getElementById("row-discount");
  if (rowDiscount) {
    if (priced.discount > 0) {
      rowDiscount.classList.remove("hidden");
      const parts = [];
      if (appliedDiscount > 0) parts.push("Mã 10k");
      if (priced.cashless_discount > 0) parts.push("Ví Escrow -5%");
      if (priced.subscription_discount > 0) parts.push("Định kỳ tuần -8%");
      if (priced.box_return_discount > 0) parts.push("Đổi thùng trống -10k");
      setText("label-discount-type", `Tổng ưu đãi (${parts.join(" + ")}):`);
      setText("summary-discount", `-${formatVND(priced.discount)}`);
    } else {
      rowDiscount.classList.add("hidden");
    }
  }

  const rowDeposit = document.getElementById("row-deposit-info");
  if (rowDeposit) {
    if (priced.deposit_label && priced.subtotal > 0) {
      rowDeposit.classList.remove("hidden");
      setText("label-deposit-title", priced.deposit_label);
      setText("summary-deposit-now", formatVND(priced.payable_now));
    } else {
      rowDeposit.classList.add("hidden");
    }
  }

  const rowInsurance = document.getElementById("row-insurance");
  if (rowInsurance) {
    if (priced.insurance_fee > 0) {
      rowInsurance.classList.remove("hidden");
      setText("summary-insurance", `+${formatVND(priced.insurance_fee)}`);
    } else {
      rowInsurance.classList.add("hidden");
    }
  }

  const rowLoyalty = document.getElementById("row-loyalty-points");
  if (rowLoyalty) {
    if (priced.loyalty_points_vnd > 0) {
      rowLoyalty.classList.remove("hidden");
      setText("label-loyalty-points", `🎁 Tích lũy Ví AgriPoints (+${priced.loyalty_rate_pct}% trừ vào đơn tuần sau):`);
      setText("summary-loyalty-points", `+${formatVND(priced.loyalty_points_vnd)}`);
    } else {
      rowLoyalty.classList.add("hidden");
    }
  }

  setText("summary-kg-badge", `${priced.total_kg.toFixed(1)} kg nông sản chín cây`);
  setText("summary-total", formatVND(priced.total_amount));

  const freeshipBadge = document.getElementById("freeship-badge");
  if (freeshipBadge) {
    freeshipBadge.classList.toggle("hidden", !priced.is_freeship);
  }

  const labelHome = document.getElementById("label-shipping-home");
  if (labelHome) {
    if (priced.is_freeship) {
      labelHome.innerText = "FREESHIP 0 đ (≥350k)";
      labelHome.className = "text-xs bg-[#e1f9cf] text-[#256314] px-2 py-0.5 rounded-md font-extrabold";
    } else {
      labelHome.innerText = `+${formatVND(priced.shipping_fee || 25000)} (<350k)`;
      labelHome.className = "text-xs bg-black/20 text-white px-2 py-0.5 rounded-md font-extrabold";
    }
  }
}

function buildVietQRUrl(amount, memo) {
  const bank = window.APP_CONFIG.BANK;
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.BANK_ID)}-${encodeURIComponent(bank.ACCOUNT_NO)}-${encodeURIComponent(bank.TEMPLATE || "compact2")}.png`
    + `?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;
}

function generateOrderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  return `AC-${ymd}-${rand}`;
}

function normalizePhone(raw) {
  return String(raw || "").replace(/[\s.\-()]/g, "");
}

// ================= SỰ KIỆN =================
function setupEventListeners() {
  document.getElementById("preorder-form")?.addEventListener("submit", handleOrderSubmit);

  const promoInput = document.getElementById("promo-code-input");
  if (promoInput && promoInput.value.trim().toUpperCase() === "AGRICONNECT") {
    const msgEl = document.getElementById("promo-code-msg");
    if (msgEl) {
      msgEl.className = "text-xs font-bold text-[#256314] block mt-1";
      msgEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-[#3ba117]"></i> Đã áp dụng mã <strong>AGRICONNECT</strong>: Giảm ngay 10.000 đ!`;
    }
  }

  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const remove = e.target.closest("[data-remove]");

    if (add) {
      changeQty(add.getAttribute("data-add"), 1);
    } else if (inc) {
      changeQty(inc.getAttribute("data-inc"), 1);
    } else if (dec) {
      changeQty(dec.getAttribute("data-dec"), -1);
    } else if (remove) {
      const pid = remove.getAttribute("data-remove");
      delete cart[pid];
      updateCartUI();
    }
  });
}

function showFormError(message) {
  const box = document.getElementById("form-error");
  if (box) {
    box.innerText = message;
    box.classList.remove("hidden");
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    alert(message);
  }
}

async function handleOrderSubmit(e) {
  e.preventDefault();
  document.getElementById("form-error")?.classList.add("hidden");

  const val = id => (document.getElementById(id)?.value || "").trim();
  const customerName = val("cust-name");
  const customerPhone = normalizePhone(val("cust-phone"));
  const customerRole = val("cust-role") || "Khac";
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || "VIETQR";
  const rawNotes = val("cust-notes").slice(0, 350);
  const consent = document.getElementById("cust-consent")?.checked;

  if (customerName.length < 2) return showFormError("Vui lòng nhập họ tên người nhận.");
  if (!/^(0|\+84)[0-9]{9,10}$/.test(customerPhone)) {
    return showFormError("Số điện thoại chưa đúng định dạng (ví dụ: 0912345678).");
  }

  let deliveryAddress = "";
  let department = "";
  if (selectedDeliveryType === "HOME") {
    const city = val("home-city") || "TP.HCM";
    if (city === "OUTER_OVER_20KM") {
      setDeliveryType("CAMPUS");
      return showFormError("Giỏ hàng có nông sản tươi sống (is_fresh) vượt quá bán kính 20km. Hệ thống đã chuyển sang nhận tại Điểm Hub Xe Lạnh Cố Định, vui lòng điền điểm nhận!");
    }
    const houseNo = val("home-house"), street = val("home-street"), ward = val("home-ward"), district = val("home-district");
    if (!houseNo || !street || !ward || !district) {
      return showFormError("Vui lòng điền đủ Số nhà, Tên đường, Phường/Xã và Quận/Huyện để đối tác Ahamove/Lalamove giao trong 2h.");
    }
    deliveryAddress = `${houseNo}, ${street}, ${ward}, ${district}, ${city}`;
    department = `Giao hỏa tốc 2h (${district})`;
  } else {
    department = val("campus-dept");
    deliveryAddress = val("campus-address");
    if (!department || deliveryAddress.length < 5) return showFormError("Vui lòng nhập Khoa/Đơn vị và Điểm nhận cụ thể tại Hub Xe Lạnh / Trường.");
  }

  const priced = priceCart();
  if (priced.items.length === 0) return showFormError("Vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn hàng.");
  if (!consent) return showFormError("Vui lòng tick đồng ý cho nhóm sử dụng thông tin để giao hàng.");

  const modePrefix = selectedOrderMode === "SUBSCRIPTION_WEEKLY"
    ? "[ĐỊNH KỲ HÀNG TUẦN -8%] "
    : selectedOrderMode === "PREORDER_FUTURE"
      ? `[PRE-ORDER LỨA TƯƠNG LAI - CỌC 30% (${formatVND(priced.payable_now)})] `
      : "[VÍ TẠM GIỮ ESCROW 12H] ";

  const orderInput = {
    order_code: generateOrderCode(),
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_role: customerRole,
    delivery_type: selectedDeliveryType,
    department,
    delivery_address: deliveryAddress,
    items: priced.items,
    payment_method: paymentMethod,
    order_mode: selectedOrderMode,
    deposit_amount: priced.payable_now,
    insurance_fee: priced.insurance_fee,
    notes: (modePrefix + (priced.insurance_fee > 0 ? "[BẢO HIỂM ATVSTP +1K] " : "") + rawNotes).trim()
  };

  const btn = document.getElementById("btn-submit-order");
  const btnHTML = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang khởi tạo Ví Escrow & gửi đơn...`; }

  try {
    const order = await window.db.createOrder(orderInput, priced);
    showSuccessModal(order, priced);
    cart = {};
    saveCartState();
    updateCartUI();
    renderEsgCircularSection();
    try {
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      const orders = JSON.parse(localStorage.getItem(USER_ORDERS_KEY) || "[]");
      orders.unshift({
        code: order.order_code,
        date: new Date().toISOString(),
        total: order.total_amount,
        items: priced.items
      });
      localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(orders.slice(0, 20)));
    } catch (e) {}
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity(`🎉 Khách hàng ${orderInput.customer_name || 'vừa'} đặt đơn ${order.order_code}!`, "order");
    }
    document.getElementById("preorder-form")?.reset();
    setDeliveryType(selectedDeliveryType);
    loadBatchInfo().catch(() => {});
  } catch (err) {
    showFormError("Chưa gửi được đơn: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
  }
}

// ================= MODAL THÀNH CÔNG (VIETQR ESCROW & TRA CỨU) =================
function showSuccessModal(order, priced) {
  const modal = document.getElementById("success-modal");
  if (!modal) return;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  const qrAmount = (priced && priced.payable_now) ? priced.payable_now : order.total_amount;

  setText("modal-order-code", order.order_code);
  setText("modal-total-amount", formatVND(qrAmount));
  setText("modal-total-amount-cod", formatVND(order.total_amount));
  setText("modal-delivery-date", formatDateVN(getExpectedDeliveryDate()));

  const isCOD = order.payment_method === "COD";
  document.getElementById("modal-qr-block")?.classList.toggle("hidden", isCOD);
  document.getElementById("modal-cod-note")?.classList.toggle("hidden", !isCOD);

  if (!isCOD) {
    const bank = window.APP_CONFIG.BANK;
    const qrImg = document.getElementById("modal-vietqr-img");
    if (qrImg) qrImg.src = buildVietQRUrl(qrAmount, order.order_code);
    const bankInfoEl = document.getElementById("modal-bank-info");
    if (bankInfoEl) {
      bankInfoEl.innerHTML = `
        <div class="text-xs space-y-1">
          <p><strong>Ngân hàng:</strong> ${escapeHTML(bank.BANK_ID)} (Ví Tạm Giữ Escrow AgriConnect)</p>
          <p><strong>Số tài khoản:</strong> <span class="font-mono font-bold text-emerald-800">${escapeHTML(bank.ACCOUNT_NO)}</span></p>
          <p><strong>Chủ tài khoản:</strong> ${escapeHTML(bank.ACCOUNT_NAME)}</p>
          <p><strong>Nội dung CK:</strong> <span class="font-mono font-bold text-emerald-800">${escapeHTML(order.order_code)}</span></p>
          <p class="text-[11px] text-emerald-700 font-semibold pt-1">🛡️ Tiền được giữ tại Ví Escrow, chỉ giải ngân cho nhà vườn sau 12h bạn nhận hàng thành công!</p>
        </div>`;
    }
  }
  modal.classList.remove("hidden");
}

window.closeSuccessModal = function () {
  document.getElementById("success-modal")?.classList.add("hidden");
};

window.toggleMobileNav = function () {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("top-right-menu-icon");
  if (!menu) return;
  const isNowHidden = menu.classList.toggle("hidden");
  if (icon) {
    icon.className = isNowHidden
      ? "fa-solid fa-bars text-base text-[#256314]"
      : "fa-solid fa-xmark text-base text-rose-600";
  }
  if (!isNowHidden) {
    setTimeout(() => {
      document.getElementById("quick-drawer-search-input")?.focus();
    }, 100);
  }
};

// Tìm kiếm trực tiếp ngay trong Menu 3 gạch góc phải (Live Instant Search)
window.handleQuickDrawerLiveSearch = function (rawQuery) {
  const box = document.getElementById("quick-drawer-search-results");
  const mainSearch = document.getElementById("product-search-input");
  const kw = String(rawQuery || "").trim().toLowerCase();

  if (mainSearch) {
    mainSearch.value = rawQuery;
    renderProductGrid();
  }

  if (!box) return;
  if (!kw) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const matched = (currentProducts || []).filter(p => {
    const hay = `${p.name || ""} ${p.description || ""} ${p.farm_info?.farmer_name || ""} ${p.farm_info?.farm_region || ""}`.toLowerCase();
    return hay.includes(kw);
  }).slice(0, 6);

  box.classList.remove("hidden");
  if (matched.length === 0) {
    box.innerHTML = `<div class="p-2.5 rounded-xl bg-white border border-[#c8edab] text-xs font-semibold text-slate-500 text-center">Không tìm thấy sản phẩm khớp với "${escapeHTML(rawQuery)}".</div>`;
    return;
  }

  box.innerHTML = matched.map(p => {
    const pid = escapeHTML(p.id);
    const qty = cart[p.id] || 0;
    return `
      <div class="p-2 rounded-xl bg-white border border-[#b8ee99] flex items-center justify-between gap-2 shadow-2xs">
        <div class="flex items-center gap-2 min-w-0 cursor-pointer" onclick="quickJumpSearchKeyword('${escapeHTML(p.name.replace(/'/g, "\\'"))}', 'ALL')">
          <img src="${escapeHTML(p.image_url)}" onerror="this.src='images/hero-fruits.jpg'" class="w-10 h-10 rounded-lg object-cover border border-[#c8edab] shrink-0" alt="" />
          <div class="min-w-0">
            <div class="font-extrabold text-xs text-[#0f240d] truncate">${escapeHTML(p.name)}</div>
            <div class="text-[11px] font-bold text-[#22720d]">${formatVND(p.price_sale)} / ${escapeHTML(p.unit)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" onclick="quickAddFromDrawer('${pid}')" class="px-2.5 py-1.5 rounded-lg bg-[#3ba117] hover:bg-[#256314] text-white font-extrabold text-[11px] whitespace-nowrap">
            + Chọn ${qty > 0 ? `(${qty})` : ""}
          </button>
        </div>
      </div>
    `;
  }).join("");
};

window.quickAddFromDrawer = function (productId) {
  changeQty(productId, 1);
  const inp = document.getElementById("quick-drawer-search-input");
  if (inp && inp.value) {
    handleQuickDrawerLiveSearch(inp.value);
  }
};

window.handleQuickDrawerSearchSubmit = function (e) {
  if (e) e.preventDefault();
  const kw = (document.getElementById("quick-drawer-search-input")?.value || "").trim();
  quickJumpSearchKeyword(kw, "ALL");
};

window.quickJumpSearchKeyword = function (keyword = "", category = "ALL") {
  const mainSearch = document.getElementById("product-search-input");
  const drawerSearch = document.getElementById("quick-drawer-search-input");
  if (mainSearch) mainSearch.value = keyword;
  if (drawerSearch) drawerSearch.value = keyword;

  filterCategory(category || "ALL");

  const menu = document.getElementById("mobile-menu");
  if (menu && !menu.classList.contains("hidden")) {
    toggleMobileNav();
  }

  const productsSec = document.getElementById("products");
  if (productsSec) {
    productsSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// ================= TRỤ CỘT 6 & 8: BẢO HIỂM ATVSTP, PHÁP LÝ & KINH TẾ TUẦN HOÀN ESG =================
function renderEsgCircularSection() {
  if (!window.db) return;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  if (typeof window.db.getEsgMetrics === "function") {
    const m = window.db.getEsgMetrics();
    setText("esg-stat-recycled", `${Number(m.total_waste_recycled_kg || 217).toFixed(0)} kg`);
    setText("esg-stat-co2", `-${Number(m.co2_saved_kg || 412).toFixed(0)} kg`);
    setText("esg-stat-saved", formatVND(m.disposal_cost_saved_vnd || 3250000));
  }

  if (typeof window.db.getInsuranceFund === "function") {
    const f = window.db.getInsuranceFund();
    setText("esg-stat-insurance", formatVND(f.balance || 4850000));
  }

  const grid = document.getElementById("esg-partners-grid");
  if (grid && typeof window.db.getEsgPartners === "function") {
    const partners = window.db.getEsgPartners();
    grid.innerHTML = partners.map(pt => {
      const isBsf = pt.partner_type === "BSF_FARM";
      const badgeLabel = isBsf ? "🪰 Trại Ruồi Lính Đen (BSF)" : pt.partner_type === "ORGANIC_FERTILIZER" ? "🌱 Xưởng Phân Bón Hữu Cơ" : "🐄 Hợp Tác Xã Chăn Nuôi Sinh Học";
      return `
        <div class="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/70 flex flex-col justify-between gap-2.5">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-[#fef08a] border border-emerald-400/40">${badgeLabel}</span>
              <span class="text-[10px] font-bold text-emerald-300">✓ Đã thu gom ${Number(pt.collected_kg || 0)} kg</span>
            </div>
            <h4 class="font-black text-sm text-white">${escapeHTML(pt.org_name)}</h4>
            <p class="text-[11px] text-emerald-100/80 mt-1">📍 ${escapeHTML(pt.address)} • 📞 ${escapeHTML(pt.phone)}</p>
          </div>
          <div class="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px]">
            <span class="text-emerald-200 font-semibold">${escapeHTML(pt.pricing_note || "Thu gom miễn phí")}</span>
            <span class="text-[#fef08a] font-black">ESG Active</span>
          </div>
        </div>
      `;
    }).join("");
  }
}

window.openEsgPartnerModal = function () {
  document.getElementById("esg-partner-modal")?.classList.remove("hidden");
};

window.closeEsgPartnerModal = function () {
  document.getElementById("esg-partner-modal")?.classList.add("hidden");
};

window.handleRegisterEsgPartner = function (e) {
  e.preventDefault();
  const val = id => (document.getElementById(id)?.value || "").trim();
  const org_name = val("esg-org-name");
  const partner_type = val("esg-partner-type") || "BSF_FARM";
  const contact_name = val("esg-contact-name");
  const phone = val("esg-phone");
  const capacity_kg_per_day = Number(val("esg-capacity") || 100);
  const address = val("esg-address");
  const pricing_note = val("esg-pricing-note");

  if (!org_name || !phone) return;
  if (window.db && typeof window.db.registerEsgPartner === "function") {
    window.db.registerEsgPartner({
      org_name,
      partner_type,
      contact_name,
      phone,
      capacity_kg_per_day,
      address,
      pricing_note
    });
  }
  renderEsgCircularSection();
  closeEsgPartnerModal();
  document.getElementById("esg-partner-form")?.reset();
  alert("🎉 Đăng ký Đối tác Kinh tế Tuần hoàn (ESG) thành công! Khi Hub AgriConnect có nông sản dập/quá chín, hệ thống sẽ tự động báo đơn vị của bạn đến thu gom.");
};

window.openTosLegalModal = function () {
  document.getElementById("tos-legal-modal")?.classList.remove("hidden");
};

window.closeTosLegalModal = function () {
  document.getElementById("tos-legal-modal")?.classList.add("hidden");
};

// =========================================================================
// 🎮 KHU TƯƠNG TÁC GAMIFICATION & GIỮ CHÂN KHÁCH HÀNG (VƯỜN ẢO, QUAY THƯỞNG, QUIZ, RECIPES)
// =========================================================================

const GARDEN_STORAGE_KEY = "agri_garden_state_v1";

let userGarden = {
  waterDrops: 1,
  seeds: 40,
  exp: 25,
  level: 1,
  streak: 1,
  lastCheckInDate: null,
  spinsLeft: 1,
  vouchers: [],
  quizAnsweredDate: null,
  quizCorrect: false,
  likedRecipes: {},
  dailyQuests: {}
};

// ================= ASMR SOUND SYNTHESIZER (WEB AUDIO API NATIVE) =================
let agriAudioCtx = null;
let isAgriSoundMuted = localStorage.getItem("agri_sound_muted") === "true";

function initAgriAudio() {
  if (!agriAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    agriAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (agriAudioCtx && agriAudioCtx.state === "suspended") {
    agriAudioCtx.resume();
  }
}

window.toggleAgriSound = function () {
  isAgriSoundMuted = !isAgriSoundMuted;
  localStorage.setItem("agri_sound_muted", isAgriSoundMuted ? "true" : "false");
  updateSoundToggleUI();
  if (!isAgriSoundMuted) playAgriSound("chime");
};

function updateSoundToggleUI() {
  const lbl = document.getElementById("sound-toggle-label");
  if (lbl) {
    lbl.textContent = isAgriSoundMuted ? "🔇 Âm Thanh: Tắt" : "🔊 Âm Thanh: Bật";
  }
}

window.playAgriSound = function (type = "tick") {
  if (isAgriSoundMuted) return;
  try {
    initAgriAudio();
    if (!agriAudioCtx) return;
    const now = agriAudioCtx.currentTime;
    const osc = agriAudioCtx.createOscillator();
    const gain = agriAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(agriAudioCtx.destination);

    if (type === "water") {
      // Giọt nước tưới cây: sweep từ 500Hz lên 1100Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === "tick") {
      // Nhấn nhẹ nút / thêm số lượng / kim quay số
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "chime") {
      // Chuông Solfeggio 528Hz thư giãn
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (type === "heart") {
      // Thả tim công thức món ngon 440Hz -> 554Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(554, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === "win") {
      // Thắng giải / hoàn thành nhiệm vụ: Hợp âm Đô Trưởng (C5-E5-G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const subOsc = agriAudioCtx.createOscillator();
        const subGain = agriAudioCtx.createGain();
        subOsc.connect(subGain);
        subGain.connect(agriAudioCtx.destination);
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
        subGain.gain.setValueAtTime(0.12, now + idx * 0.08);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        subOsc.start(now + idx * 0.08);
        subOsc.stop(now + idx * 0.08 + 0.32);
      });
    }
  } catch (e) {
    // Web audio silent fail
  }
};

const TREE_STAGES = [
  { level: 1, icon: "🌱", label: "Cấp 1: Mầm Xanh Mới Nhú", sub: "Giai đoạn: Cây non đang đâm chồi lá" },
  { level: 2, icon: "🌿", label: "Cấp 2: Cây Non Đang Lớn", sub: "Giai đoạn: Cành lá xum xuê đón nắng" },
  { level: 3, icon: "🌸", label: "Cấp 3: Cây Đơm Hoa Kết Nụ", sub: "Giai đoạn: Hoa thụ phấn chuẩn bị đậu trái" },
  { level: 4, icon: "🍈", label: "Cấp 4: Trái Chín Cây Thu Hoạch!", sub: "Giai đoạn: Trái chín thơm lừng sẵn sàng thu hái" }
];

const WHEEL_SECTORS = [
  { label: "Voucher 50K", color: "#fde047", code: "LUCKY50K", value: 50000, type: "voucher" },
  { label: "Freeship 0đ", color: "#e1f9cf", code: "FREESHIP_SPIN", value: 25000, type: "freeship" },
  { label: "+50 Hạt 🌱", color: "#bbf099", code: null, value: 50, type: "seeds" },
  { label: "1kg Măng Cụt", color: "#fed7aa", code: "FREE_1KG_MC", value: 95000, type: "gift" },
  { label: "Voucher 20K", color: "#fef08a", code: "LUCKY20K", value: 20000, type: "voucher" },
  { label: "Giảm 15% Combo", color: "#c8edab", code: "COMBO15", value: 35000, type: "voucher" },
  { label: "Hộp Quà Bí Mật", color: "#a7f3d0", code: "SECRET_GIFT", value: 30000, type: "gift" },
  { label: "Chúc May Mắn", color: "#f1f5f9", code: null, value: 0, type: "none" }
];

let isWheelSpinning = false;
let wheelCurrentAngle = 0;

window.initInteractiveGamificationHub = function () {
  loadGardenState();
  initDailyQuestsState();
  renderGardenUI();
  initWheelCanvas();
  updatePillStatus();
  updateSoundToggleUI();
};

function getTodayQuestDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function initDailyQuestsState() {
  const todayKey = getTodayQuestDateKey();
  if (!userGarden.dailyQuests || userGarden.dailyQuests.date !== todayKey) {
    userGarden.dailyQuests = {
      date: todayKey,
      checkin: userGarden.lastCheckInDate === todayKey,
      water: false,
      wheel: false,
      heart: false,
      bonusClaimed: false
    };
  }
}

window.checkDailyQuestProgress = function (questKey) {
  initDailyQuestsState();
  if (!userGarden.dailyQuests[questKey]) {
    userGarden.dailyQuests[questKey] = true;
    saveGardenState();
    renderDailyQuestsUI();

    // Kiểm tra nếu hoàn thành cả 4 nhiệm vụ trong ngày
    const q = userGarden.dailyQuests;
    if (q.checkin && q.water && q.wheel && q.heart && !q.bonusClaimed) {
      q.bonusClaimed = true;
      userGarden.seeds = (userGarden.seeds || 0) + 50;
      saveGardenState();
      renderGardenUI();
      playAgriSound("win");
      alert("🏆 CHÚC MỪNG!\nBạn đã hoàn thành trọn bộ 4/4 Nhiệm Vụ Ngày!\nAgriConnect tặng thưởng nóng +50 Hạt Mầm Xanh 🌱 vào kho của bạn!");
      if (typeof pushLiveUserActivity === "function") {
        pushLiveUserActivity("🏆 Bạn vừa hoàn thành 4/4 Nhiệm Vụ Ngày (+50 Hạt Mầm)", "reward");
      }
    }
  }
};

function renderDailyQuestsUI() {
  initDailyQuestsState();
  const q = userGarden.dailyQuests;
  const keys = ["checkin", "water", "wheel", "heart"];
  let completedCount = 0;

  keys.forEach(k => {
    const el = document.getElementById(`quest-check-${k}`);
    if (el) {
      if (q[k]) {
        el.textContent = "✅";
        completedCount++;
      } else {
        el.textContent = "⚪";
      }
    }
  });

  const badge = document.getElementById("quests-progress-badge");
  if (badge) {
    badge.textContent = `${completedCount} / 4 Hoàn thành`;
    if (completedCount === 4) {
      badge.className = "px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black animate-bounce";
      badge.textContent = "🎉 4/4 Đã Nhận +50 Hạt!";
    } else {
      badge.className = "px-2.5 py-0.5 rounded-full bg-[#e1f9cf] text-[#1c560e] text-[10px] font-black";
    }
  }
}

// ================= PWA INSTALLATION & SERVICE WORKER =================
let deferredPwaPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const btn = document.getElementById("pwa-install-banner");
  if (btn) btn.classList.remove("hidden");
});

window.installAgriConnectPWA = async function () {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    const { outcome } = await deferredPwaPrompt.userChoice;
    if (outcome === "accepted") {
      showToast("📱 Cảm ơn bạn đã cài đặt ứng dụng AgriConnect!");
    }
    deferredPwaPrompt = null;
  } else {
    showToast("📱 Chọn 'Thêm vào màn hình chính' trên trình duyệt để cài app!");
  }
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// ================= BLOCKCHAIN MERKLE ROOT HASH MODAL =================
window.openBlockchainHashVerifyModal = function (hash) {
  const modal = document.getElementById("blockchain-verify-modal");
  const display = document.getElementById("verify-hash-display");
  if (display) {
    display.textContent = hash || "0x7f9a2b89c41e88219d30fa14cb72e01149a88e99acb4802bfd97";
  }
  if (modal) modal.classList.remove("hidden");
  playAgriSound("chime");
};

window.closeBlockchainHashVerifyModal = function () {
  const modal = document.getElementById("blockchain-verify-modal");
  if (modal) modal.classList.add("hidden");
};

// ================= LỊCH MÙA VỤ NÔNG SẢN 12 THÁNG (SEASONAL HARVEST CALENDAR) =================
window.openSeasonalCalendarModal = function () {
  const modal = document.getElementById("seasonal-calendar-modal");
  if (modal) modal.classList.remove("hidden");
  if (typeof playAgriSound === "function") playAgriSound("chime");
};

window.closeSeasonalCalendarModal = function () {
  const modal = document.getElementById("seasonal-calendar-modal");
  if (modal) modal.classList.add("hidden");
};

window.selectSeasonFromCalendar = function (seasonKey) {
  closeSeasonalCalendarModal();
  if (typeof filterCategory === "function") {
    filterCategory(seasonKey);
  }
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
};

function loadGardenState() {
  try {
    const raw = localStorage.getItem(GARDEN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      userGarden = { ...userGarden, ...parsed };
      if (!userGarden.likedRecipes || typeof userGarden.likedRecipes !== "object") {
        userGarden.likedRecipes = {};
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc trạng thái vườn ảo:", e);
  }

  // Tự động kiểm tra reset lượt quay miễn phí hằng ngày
  const todayStr = new Date().toISOString().slice(0, 10);
  if (userGarden.lastCheckInDate !== todayStr) {
    userGarden.spinsLeft = Math.max(userGarden.spinsLeft || 0, 1);
  }
}

function saveGardenState() {
  try {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(userGarden));
  } catch (e) {
    console.warn("Lỗi lưu trạng thái vườn ảo:", e);
  }
  updatePillStatus();
}

function updatePillStatus() {
  const pillStatus = document.getElementById("pill-water-status");
  if (!pillStatus) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  if (userGarden.lastCheckInDate === todayStr) {
    pillStatus.textContent = `💧 Còn ${userGarden.waterDrops} giọt | 🌱 ${userGarden.seeds} hạt`;
  } else {
    pillStatus.textContent = "Điểm danh nhận +1 giọt nước & +20 hạt!";
  }
}

window.jumpToInteractiveHub = function () {
  const el = document.getElementById("interactive-hub");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

window.switchInteractiveTab = function (tabId) {
  const tabs = ["farm", "wheel", "community"];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`tab-content-${t}`);
    if (t === tabId) {
      btn?.classList.remove("bg-white", "text-[#1f3813]", "border-[#b8ee99]");
      btn?.classList.add("bg-[#256314]", "text-white", "border-2", "border-[#173f0c]", "shadow-md");
      content?.classList.remove("hidden");
    } else {
      btn?.classList.remove("bg-[#256314]", "text-white", "border-2", "border-[#173f0c]", "shadow-md");
      btn?.classList.add("bg-white", "text-[#1f3813]", "border", "border-[#b8ee99]");
      content?.classList.add("hidden");
    }
  });

  if (tabId === "wheel") {
    setTimeout(drawLuckyWheel, 50);
  }
};

function renderGardenUI() {
  const stage = TREE_STAGES.find(s => s.level === userGarden.level) || TREE_STAGES[0];

  const iconEl = document.getElementById("tree-visual-icon");
  if (iconEl) iconEl.textContent = stage.icon;

  const stageBadge = document.getElementById("tree-stage-badge");
  if (stageBadge) stageBadge.textContent = stage.sub;

  const levelLabel = document.getElementById("tree-level-label");
  if (levelLabel) levelLabel.textContent = stage.label;

  const expText = document.getElementById("tree-exp-text");
  if (expText) expText.textContent = `${userGarden.exp} / 100 EXP`;

  const expBar = document.getElementById("tree-exp-bar");
  if (expBar) expBar.style.width = `${Math.min(userGarden.exp, 100)}%`;

  const dropsNeeded = Math.max(0, Math.ceil((100 - userGarden.exp) / 25));
  const dropsNeededEl = document.getElementById("drops-needed-text");
  if (dropsNeededEl) dropsNeededEl.textContent = `${dropsNeeded} lần tưới`;

  const userDrops = document.getElementById("user-water-drops");
  if (userDrops) userDrops.textContent = userGarden.waterDrops;

  const userSeeds = document.getElementById("user-seeds-display");
  if (userSeeds) userSeeds.textContent = `${userGarden.seeds} Hạt Mầm`;

  const streakDisplay = document.getElementById("streak-days-display");
  if (streakDisplay) streakDisplay.textContent = `Chuỗi: ${userGarden.streak} ngày`;

  const spinsCount = document.getElementById("user-spins-count");
  if (spinsCount) spinsCount.textContent = `${userGarden.spinsLeft} lượt`;

  // Kiểm tra trạng thái nút điểm danh hôm nay
  const todayStr = new Date().toISOString().slice(0, 10);
  const checkInBtn = document.getElementById("btn-daily-checkin");
  const checkInLabel = document.getElementById("checkin-btn-label");
  if (checkInBtn && checkInLabel) {
    if (userGarden.lastCheckInDate === todayStr) {
      checkInBtn.classList.replace("from-[#389e18]", "from-slate-400");
      checkInBtn.classList.replace("to-[#59c228]", "to-slate-500");
      checkInLabel.textContent = "✓ Đã Điểm Danh Hôm Nay";
    } else {
      checkInBtn.classList.replace("from-slate-400", "from-[#389e18]");
      checkInBtn.classList.replace("to-slate-500", "to-[#59c228]");
      checkInLabel.textContent = "Điểm Danh (+1 Giọt & +20 Hạt)";
    }
  }

  // Khôi phục trạng thái Thả Tim món ngon nông sản
  if (userGarden.likedRecipes) {
    Object.keys(userGarden.likedRecipes).forEach(rId => {
      if (userGarden.likedRecipes[rId]) {
        const btn = document.querySelector(`[onclick*="${rId}"]`);
        if (btn) {
          btn.classList.add("bg-rose-50", "text-rose-700", "border-rose-300");
        }
      }
    });
  }

  // Khôi phục trạng thái Đố Vui hôm nay
  if (userGarden.quizAnsweredDate === todayStr && userGarden.quizCorrect) {
    const msgEl = document.getElementById("quiz-result-msg");
    if (msgEl) {
      msgEl.classList.remove("hidden");
      msgEl.className = "p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-[#1c560e] text-xs font-bold space-y-1";
      msgEl.innerHTML = `
        <div>✅ <strong>BẠN ĐÃ HOÀN THÀNH ĐỐ VUI HÔM NAY!</strong></div>
        <div>Mã giảm giá <strong>QUIZ10K</strong> (-10.000 đ) đã sẵn sàng trong kho voucher của bạn để đặt hàng.</div>
      `;
    }
  }

  // Render danh sách voucher đã có
  const voucherListEl = document.getElementById("vouchers-list-display");
  if (voucherListEl) {
    if (Array.isArray(userGarden.vouchers) && userGarden.vouchers.length > 0) {
      voucherListEl.innerHTML = userGarden.vouchers.map(v => `
        <span onclick="applyPromoCodeDirect('${v.code}')" class="cursor-pointer px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1 transition" title="Bấm để áp dụng ngay vào đơn hàng">
          <span>🏷️ ${v.code} (-${formatVND(v.amount)})</span>
          <i class="fa-solid fa-arrow-down text-[9px] text-amber-700"></i>
        </span>
      `).join("");
    } else {
      voucherListEl.innerHTML = `<span class="text-slate-400 italic font-medium">Chưa có voucher nào. Hãy điểm danh tưới cây để đổi nhé!</span>`;
    }
  }

  // Cập nhật giao diện 4 Nhiệm Vụ Ngày
  renderDailyQuestsUI();
}

window.handleDailyCheckIn = function () {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (userGarden.lastCheckInDate === todayStr) {
    showToast("🌿 Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai nhé.");
    return;
  }

  // Kiểm tra chuỗi liên tiếp (nếu hôm qua điểm danh thì streak + 1, ngược lại reset về 1)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (userGarden.lastCheckInDate === yesterday) {
    userGarden.streak = (userGarden.streak || 1) + 1;
  } else {
    userGarden.streak = 1;
  }

  userGarden.lastCheckInDate = todayStr;
  userGarden.waterDrops = (userGarden.waterDrops || 0) + 1;
  userGarden.seeds = (userGarden.seeds || 0) + 20;
  userGarden.spinsLeft = Math.max(userGarden.spinsLeft || 0, 1);

  saveGardenState();
  renderGardenUI();
  playAgriSound("win");
  checkDailyQuestProgress("checkin");
  showToast("🎉 Điểm danh thành công! Bạn nhận được +1 Giọt Nước 💧 và +20 Hạt Mầm Xanh 🌱.");
  if (typeof pushLiveUserActivity === "function") {
    pushLiveUserActivity("🌿 Bạn vừa điểm danh ngày mới (+1 Giọt Nước & +20 Hạt Mầm)", "checkin");
  }
};

window.handleWaterTree = function () {
  if (userGarden.waterDrops <= 0) {
    alert("💧 Bạn đã hết giọt nước tưới! Hãy điểm danh hằng ngày hoặc trả lời câu đố vui bên dưới để nhận thêm nước nhé.");
    return;
  }

  userGarden.waterDrops--;
  userGarden.exp += 25;
  playAgriSound("water");
  checkDailyQuestProgress("water");

  // Hiệu ứng bong bóng +25 EXP
  const splash = document.getElementById("water-splash-anim");
  const treeContainer = document.getElementById("virtual-tree-container");
  if (splash) {
    splash.classList.remove("hidden");
    setTimeout(() => splash.classList.add("hidden"), 1200);
  }
  if (treeContainer) {
    treeContainer.classList.add("scale-110");
    setTimeout(() => treeContainer.classList.remove("scale-110"), 300);
  }

  // Kiểm tra thăng cấp cây
  if (userGarden.exp >= 100) {
    userGarden.exp = 0;
    if (userGarden.level < 4) {
      userGarden.level++;
      showToast(`🌟 Tuyệt vời! Cây của bạn đã thăng lên ${TREE_STAGES[userGarden.level - 1].label}!`);
    } else {
      // Cấp 4 thu hoạch -> Thưởng Voucher lớn và reset về Cấp 1 vụ mới
      userGarden.level = 1;
      const harvestVoucher = {
        code: "HARVEST30K_" + Math.floor(1000 + Math.random() * 9000),
        amount: 30000,
        name: "Quà Thu Hoạch Vườn Ảo 30.000 đ"
      };
      userGarden.vouchers.push(harvestVoucher);
      alert("🏆 CHÚC MỪNG BẠN THU HOẠCH THÀNH CÔNG!\nCây Sầu Riêng của bạn đã chín trĩu cành. AgriConnect tặng bạn 1 Voucher Giảm 30.000 đ (" + harvestVoucher.code + ") cho đợt hàng Thứ Bảy tuần này!\nVụ mùa mới đã bắt đầu nảy mầm!");
    }
  }

  saveGardenState();
  renderGardenUI();
  if (typeof pushLiveUserActivity === "function") {
    pushLiveUserActivity("💧 Bạn vừa tưới nước cho vườn cây (+25 EXP)", "water");
  }
};

window.redeemReward = function (cost, codePrefix, amount) {
  if (userGarden.seeds < cost) {
    alert(`🌱 Bạn chưa đủ Hạt Mầm! Bạn đang có ${userGarden.seeds} hạt, cần thêm ${cost - userGarden.seeds} hạt nữa. Hãy chăm chỉ điểm danh tưới cây mỗi ngày nhé.`);
    return;
  }

  userGarden.seeds -= cost;
  const newVoucher = {
    code: `${codePrefix}_${Math.floor(100 + Math.random() * 900)}`,
    amount: amount,
    name: `Voucher giảm ${formatVND(amount)}`
  };
  userGarden.vouchers.push(newVoucher);

  saveGardenState();
  renderGardenUI();

  // Tự động áp dụng vào ô giảm giá đơn hàng
  applyPromoCodeDirect(newVoucher.code);
  alert(`🎉 Đổi quà thành công! Bạn nhận được mã ${newVoucher.code} (-${formatVND(amount)}). Mã đã được tự động áp dụng vào giỏ hàng của bạn!`);
  if (typeof pushLiveUserActivity === "function") {
    pushLiveUserActivity(`🎁 Bạn vừa đổi thành công Voucher ${formatVND(amount)}!`, "reward");
  }
};

window.applyPromoCodeDirect = function (code) {
  const input = document.getElementById("promo-code-input") || document.getElementById("order-promo-code");
  if (input) {
    input.value = code;
    input.dispatchEvent(new Event("input"));
    document.getElementById("preorder")?.scrollIntoView({ behavior: "smooth" });
    showToast(`🏷️ Đã tự động áp dụng mã ${code} vào đơn hàng!`);
  }
};

// ================= VÒNG QUAY MAY MẮN (CANVAS WHEEL) =================

function initWheelCanvas() {
  drawLuckyWheel();
}

function drawLuckyWheel() {
  const canvas = document.getElementById("wheel-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const numSectors = WHEEL_SECTORS.length;
  const arc = (2 * Math.PI) / numSectors;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSectors; i++) {
    const angle = wheelCurrentAngle + i * arc;
    ctx.beginPath();
    ctx.fillStyle = WHEEL_SECTORS[i].color;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + arc);
    ctx.lineTo(cx, cy);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Vẽ chữ nhãn trên từng ô
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0f240d";
    ctx.font = "bold 12px 'Be Vietnam Pro', sans-serif";
    ctx.fillText(WHEEL_SECTORS[i].label, r - 15, 4);
    ctx.restore();
  }
}

window.spinLuckyWheel = function () {
  if (isWheelSpinning) return;

  if (userGarden.spinsLeft <= 0) {
    if (userGarden.seeds >= 30) {
      if (!confirm(`Bạn đã hết lượt quay miễn phí hôm nay. Bạn có muốn đổi 30 Hạt Mầm (Bạn đang có ${userGarden.seeds} hạt) để quay thêm 1 lượt không?`)) {
        return;
      }
      userGarden.seeds -= 30;
      userGarden.spinsLeft = 1;
      saveGardenState();
      renderGardenUI();
    } else {
      alert("🎡 Bạn đã dùng hết lượt quay hôm nay và không đủ 30 Hạt Mầm để đổi thêm lượt. Hãy quay lại vào ngày mai nhé!");
      return;
    }
  }

  isWheelSpinning = true;
  userGarden.spinsLeft--;
  saveGardenState();
  renderGardenUI();
  playAgriSound("tick");
  checkDailyQuestProgress("wheel");

  const numSectors = WHEEL_SECTORS.length;
  const arc = (2 * Math.PI) / numSectors;

  // Chọn ngẫu nhiên giải thưởng (ưu tiên voucher hoặc hạt mầm)
  const winningIndex = Math.floor(Math.random() * (numSectors - 1)); // trừ ô chúc may mắn
  const prize = WHEEL_SECTORS[winningIndex];

  // Tính góc quay sao cho kim ở trên cùng (3*PI/2) chỉ đúng vào ô trúng thưởng
  const extraRotations = 5 + Math.floor(Math.random() * 3);
  const targetSectorCenter = winningIndex * arc + arc / 2;
  const targetAngle = (3 * Math.PI / 2) - targetSectorCenter;
  const totalRotation = extraRotations * (2 * Math.PI) + (targetAngle - (wheelCurrentAngle % (2 * Math.PI)));

  const startAngle = wheelCurrentAngle;
  const startTime = performance.now();
  const duration = 4000; // 4 giây

  function animateWheel(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Hàm easing xoay chậm dần đều (ease-out cubic)
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    wheelCurrentAngle = startAngle + totalRotation * easeProgress;
    drawLuckyWheel();

    if (progress < 1) {
      requestAnimationFrame(animateWheel);
    } else {
      isWheelSpinning = false;
      handleWheelPrizeWon(prize);
    }
  }

  requestAnimationFrame(animateWheel);
};

function handleWheelPrizeWon(prize) {
  playAgriSound("win");
  if (prize.type === "voucher" || prize.type === "freeship") {
    const won = {
      code: `${prize.code}_${Math.floor(100 + Math.random() * 900)}`,
      amount: prize.value,
      name: prize.label
    };
    userGarden.vouchers.push(won);
    saveGardenState();
    renderGardenUI();
    applyPromoCodeDirect(won.code);
    alert(`🎉 XIN CHÚC MỪNG!\nBạn đã quay trúng: ${prize.label}!\nMã ưu đãi [${won.code}] đã được tự động thêm vào giỏ hàng của bạn!`);
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity(`🎡 Bạn vừa quay trúng ${prize.label}!`, "wheel");
    }
  } else if (prize.type === "seeds") {
    userGarden.seeds += prize.value;
    saveGardenState();
    renderGardenUI();
    showToast(`🎉 Bạn đã quay trúng +${prize.value} Hạt Mầm Xanh 🌱!`);
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity(`🎡 Bạn vừa quay trúng +${prize.value} Hạt Mầm Xanh!`, "wheel");
    }
  } else if (prize.type === "gift") {
    const giftCode = `${prize.code}_${Math.floor(100 + Math.random() * 900)}`;
    userGarden.vouchers.push({ code: giftCode, amount: prize.value, name: prize.label });
    saveGardenState();
    renderGardenUI();
    applyPromoCodeDirect(giftCode);
    alert(`🎁 TUYỆT VỜI!\nBạn đã trúng phần quà: ${prize.label}!\nMã nhận quà [${giftCode}] đã được ghi nhận vào đơn hàng đợt Thứ Bảy tuần này của bạn!`);
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity(`🎁 Bạn vừa quay trúng phần quà ${prize.label}!`, "wheel");
    }
  } else {
    showToast("🍀 Chúc bạn may mắn lần sau! Đừng quên ghé lại mỗi ngày để quay tiếp nhé.");
  }
}

// ================= ĐỐ VUI NÔNG SẢN & GÓC BẾP =================

window.handleQuizAnswer = function (selectedIndex) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const msgEl = document.getElementById("quiz-result-msg");
  if (!msgEl) return;
  msgEl.classList.remove("hidden");

  if (selectedIndex === 2) {
    playAgriSound("chime");
    msgEl.className = "p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-[#1c560e] text-xs font-bold space-y-1";
    msgEl.innerHTML = `
      <div>✅ <strong>HOÀN TOÀN CHÍNH XÁC!</strong></div>
      <div>Sầu riêng già chín cây thật sự có mùi thơm ngát tự nhiên, cuống tươi ứa nhựa và rãnh nở bung đều. Bạn nhận được <strong>+1 Giọt Nước Tưới Cây 💧</strong> và mã giảm giá <strong>QUIZ10K</strong> (-10.000 đ)!</div>
    `;

    if (userGarden.quizAnsweredDate !== todayStr || !userGarden.quizCorrect) {
      userGarden.waterDrops++;
      if (!userGarden.vouchers.some(v => v.code === "QUIZ10K")) {
        userGarden.vouchers.push({ code: "QUIZ10K", amount: 10000, name: "Thưởng Đố Vui Nông Nghiệp" });
      }
    }
    userGarden.quizAnsweredDate = todayStr;
    userGarden.quizCorrect = true;
    saveGardenState();
    renderGardenUI();
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity("🧠 Bạn vừa giải đúng Đố Vui Nông Nghiệp (+1 Giọt Nước & Voucher 10K)", "quiz");
    }
  } else {
    playAgriSound("tick");
    msgEl.className = "p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold space-y-1";
    msgEl.innerHTML = `
      <div>💡 <em>Gần đúng rồi!</em> Cả hai dấu hiệu A và B đều là kinh nghiệm vàng của nhà vườn Bác Năm để nhận biết sầu già chín cây. Đáp án chính xác là <strong>C. Cả A và B đều đúng</strong>. Hãy thử lại để nhận quà nhé!</div>
    `;
  }
};

window.likeRecipe = function (recipeId, btn) {
  if (!btn && typeof recipeId === "object") {
    btn = recipeId;
    recipeId = "recipe_mangcut";
  }
  userGarden.likedRecipes = userGarden.likedRecipes || {};
  const countEl = btn?.querySelector(".like-count") || document.querySelector(`.like-count[data-recipe-id="${recipeId}"]`);

  if (!userGarden.likedRecipes[recipeId]) {
    userGarden.likedRecipes[recipeId] = true;
    if (countEl) {
      let cur = parseInt(countEl.textContent || "0", 10);
      countEl.textContent = cur + 1;
    }
    if (btn) {
      btn.classList.add("bg-rose-50", "text-rose-700", "border-rose-300");
    }
    userGarden.seeds = (userGarden.seeds || 0) + 5;
    saveGardenState();
    renderGardenUI();
    playAgriSound("heart");
    checkDailyQuestProgress("heart");
    showToast("❤️ Cảm ơn bạn đã thả tim! Bạn được cộng +5 Hạt Mầm Xanh 🌱.");
    if (typeof pushLiveUserActivity === "function") {
      pushLiveUserActivity("❤️ Bạn vừa thả tim món ngon nông sản (+5 Hạt Mầm)", "heart");
    }
  } else {
    playAgriSound("tick");
    showToast("❤️ Bạn đã thả tim món ngon này rồi! Hãy thưởng thức và chia sẻ thêm nhé.");
  }
};

window.quickAddRecipeProduct = function (productId) {
  const p = currentProducts.find(item => String(item.id) === String(productId));
  if (p) {
    changeQty(p.id, 1);
    showToast(`🛒 Đã thêm "${p.name}" vào giỏ hàng! Cuộn xuống để xem đơn.`);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  } else {
    showToast("Sản phẩm đã được chọn. Vui lòng kiểm tra giỏ hàng bên dưới!");
  }
};

// =========================================================================
// 🚀 CONTINUOUS REAL-TIME LIVE ACTIVITY & COMMUNITY ENGINE
// =========================================================================

let liveEngineTimer = null;
let liveToastTimer = null;
let currentOnlineCount = 33;

const COMMUNITY_ACTIVITIES = [
  { icon: "🎁", title: "Đổi Voucher Thành Công", text: "Chị Mai Lan (Q.7, TP.HCM) vừa đổi Voucher 50.000đ từ Vườn Ảo!" },
  { icon: "🛒", title: "Đặt Đơn Đợt Thứ Bảy", text: "Anh Quốc Tuấn (Thủ Đức) vừa đặt 5kg Sầu Riêng Ri6 chín cây!" },
  { icon: "🎡", title: "Quay Thưởng May Mắn", text: "Bạn Thảo Vy (Bình Thạnh) vừa quay trúng Miễn Phí Giao Hàng 0đ!" },
  { icon: "🌱", title: "Điểm Danh Chăm Cây", text: "Khách hàng Minh Trí (Tân Bình) vừa điểm danh ngày thứ 5 liên tiếp (+20 hạt)!" },
  { icon: "🍲", title: "Món Ngon Nông Sản", text: "Chị Hoàng Yến (Q.2) vừa thả tim công thức Gỏi Măng Cụt Gà Ta!" },
  { icon: "🧠", title: "Đố Vui Nông Nghiệp", text: "Anh Đức Thắng vừa giải đúng câu đố nông sản nhận voucher QUIZ10K!" },
  { icon: "📦", title: "Sống Xanh Circular", text: "Gia đình chị Ánh (Phú Nhuận) vừa đăng ký trả lại 2 thùng giấy đợt trước!" },
  { icon: "🚚", title: "Xe Lạnh Gom Hàng", text: "Tiến độ gom hàng đạt 78% tải trọng xe lạnh Bình Phước về TP.HCM!" }
];

window.startContinuousLiveActivityEngine = function () {
  if (liveEngineTimer) clearInterval(liveEngineTimer);

  // Lắng nghe đồng bộ đa tab trình duyệt trong thời gian thực
  window.addEventListener("storage", (e) => {
    if (e.key === GARDEN_STORAGE_KEY) {
      loadGardenState();
      renderGardenUI();
    } else if (e.key === CART_STORAGE_KEY) {
      loadCartState();
      updateCartUI();
    } else if (e.key === CHECKOUT_DRAFT_KEY) {
      loadCheckoutDraft();
    }
  });

  // Vòng lặp cập nhật liên tục (Continuous Real-Time Loop)
  let actIndex = 0;
  liveEngineTimer = setInterval(() => {
    // 1. Dao động ngẫu nhiên số người online (27 - 45 người)
    const delta = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
    currentOnlineCount = Math.max(27, Math.min(48, currentOnlineCount + delta));
    const onlineEl = document.getElementById("live-online-users-count");
    if (onlineEl) onlineEl.textContent = currentOnlineCount;

    // 2. Cập nhật dòng ticker cộng đồng
    const act = COMMUNITY_ACTIVITIES[actIndex % COMMUNITY_ACTIVITIES.length];
    actIndex++;
    const tickerEl = document.getElementById("live-community-ticker-text");
    if (tickerEl) {
      tickerEl.style.opacity = "0";
      setTimeout(() => {
        tickerEl.innerHTML = `${act.icon} <strong>${escapeHTML(act.text)}</strong>`;
        tickerEl.style.opacity = "1";
      }, 300);
    }

    // 3. Định kỳ hiển thị nhẹ toast nổi góc dưới
    if (Math.random() > 0.45) {
      showFloatingActivityToast(act.text, act.icon, act.title);
    }
  }, 8500);
};

window.pushLiveUserActivity = function (message, type = "action") {
  // 1. Cập nhật ngay ticker
  const tickerEl = document.getElementById("live-community-ticker-text");
  if (tickerEl) {
    tickerEl.innerHTML = `🌟 <strong>${escapeHTML(message)}</strong>`;
  }

  // 2. Hiện ngay toast nổi góc dưới
  const iconMap = {
    water: "💧",
    wheel: "🎡",
    checkin: "🌿",
    quiz: "🧠",
    heart: "❤️",
    reward: "🎁",
    cart: "🛒",
    order: "🎉"
  };
  const icon = iconMap[type] || "✨";
  showFloatingActivityToast(message, icon, "Tương Tác Của Bạn");
};

function showFloatingActivityToast(message, icon = "🌱", title = "Vừa diễn ra") {
  const toast = document.getElementById("live-activity-floating-toast");
  if (!toast) return;

  const titleEl = document.getElementById("live-toast-title");
  const descEl = document.getElementById("live-toast-desc");
  const iconEl = document.getElementById("live-toast-icon");

  if (titleEl) titleEl.innerHTML = `<span>${escapeHTML(title)}</span> <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>`;
  if (descEl) descEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;

  // Hiển thị toast trượt lên
  toast.classList.remove("translate-y-24", "opacity-0", "pointer-events-none");
  toast.classList.add("translate-y-0", "opacity-100");

  if (liveToastTimer) clearTimeout(liveToastTimer);
  liveToastTimer = setTimeout(() => {
    toast.classList.add("translate-y-24", "opacity-0", "pointer-events-none");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 4200);
}

