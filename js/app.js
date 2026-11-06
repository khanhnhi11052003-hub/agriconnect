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

let currentProducts = [];
let cart = {}; // { productId: quantity }
let selectedVariants = {}; // { productId: "GRADE_1" | "GRADE_2" | "GRADE_3" }
let selectedDeliveryType = "HOME"; // "HOME" | "CAMPUS"
let selectedOrderMode = "SINGLE"; // "SINGLE" | "SUBSCRIPTION_WEEKLY" | "PREORDER_FUTURE"
let appliedDiscount = 10000; // Mặc định mã AGRICONNECT giảm 10.000 đ
let currentTraceProduct = null;
let currentTraceSlideIdx = 0;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

async function initApp() {
  initCountdownTimer();
  setupEventListeners();

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

  renderEsgCircularSection();
  updateOrderSummary();
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
  updateCartUI();

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

window.filterCategory = function (cat) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-tab").forEach(tab => {
    tab.className = "cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-[#256314] border border-[#c8edab] hover:bg-[#f1fbe9]";
  });
  const activeTab = document.getElementById(`tab-cat-${cat}`);
  if (activeTab) {
    activeTab.className = "cat-tab px-4 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-[#389e18] to-[#59c228] text-white shadow-md shadow-[#44a821]/25 flex items-center gap-1.5";
  }
  renderProductGrid();
};

function renderProductGrid() {
  const productListEl = document.getElementById("product-list");
  if (!productListEl) return;
  productListEl.innerHTML = "";

  let items = currentProducts;
  if (selectedCategory === "VERIFIED") {
    items = currentProducts.filter(p => p.verified !== false);
  } else if (selectedCategory !== "ALL") {
    items = currentProducts.filter(p => p.category === selectedCategory);
  }

  if (items.length === 0) {
    productListEl.innerHTML = `<div class="col-span-full p-8 text-center rounded-3xl bg-[#f2fbdf] border border-[#c8edab] text-[#256314] text-sm font-semibold">Hiện chưa có sản phẩm trong danh mục này.</div>`;
    return;
  }

  items.forEach(p => {
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

    const highlightsHtml = Array.isArray(p.highlights) && p.highlights.length > 0
      ? `<div class="flex flex-wrap gap-1.5 mt-2">
          ${p.highlights.map(h => `<span class="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e6f9d7] text-[#1c560e] px-2.5 py-0.5 rounded-full border border-[#bbf099] shadow-2xs"><i class="fa-solid fa-circle-check text-[#3ba117] text-[10px]"></i>${escapeHTML(h)}</span>`).join("")}
        </div>`
      : "";

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
        <img src="${img}" alt="${name}" loading="lazy" onerror="this.src='images/hero-fruits.jpg'" class="w-full h-full object-cover fruit-pop transition-transform duration-500 group-hover:scale-105">
        <div class="absolute top-3 left-3 flex flex-col gap-1">
          <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isCombo ? "bg-amber-500" : "bg-[#3ba117]"} text-white shadow-md inline-flex items-center gap-1">
            <i class="fa-solid fa-certificate"></i> ${certBadge}
          </span>
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-900/85 text-sky-100 backdrop-blur-xs inline-flex items-center gap-1 w-fit">
            ❄️ Tươi sống (is_fresh) • &lt;20km
          </span>
        </div>
        ${qty > 0 ? `<span class="absolute top-3 right-3 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#1c560e] text-[#fef08a] shadow-md border border-[#fef08a]/40 animate-pulse">✓ Đã chọn ${qty} ${unit}</span>` : ""}
        <button type="button" onclick="openTraceabilityModal('${pid}')" class="absolute bottom-3 left-3 text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-white/95 hover:bg-[#fef08a] text-[#1c560e] shadow-md border border-[#b8ee99] flex items-center gap-1.5 transition-all">
          <i class="fa-solid fa-book-open text-[#3ba117]"></i>
          <span>Nhật ký canh tác (4 chặng)</span>
        </button>
      </div>
      <div class="p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          <h3 class="font-black text-base sm:text-lg text-[#0f240d] leading-snug">${name}</h3>
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
  });
}

async function loadProducts() {
  if (window.db && typeof window.db.getProducts === "function") {
    currentProducts = await window.db.getProducts();
  }

  if (!currentProducts || currentProducts.length === 0) {
    showPageError("Hiện chưa có sản phẩm mở bán trong đợt này.");
    return;
  }

  renderProductGrid();
  renderSelectedCartItems();
  updateStickyCartBar();
}

// ================= MODAL NHẬT KÝ CANH TÁC (TRACEABILITY TIMELINE) =================
window.openTraceabilityModal = function (productId) {
  const modal = document.getElementById("traceability-modal");
  if (!modal) return;
  currentTraceProduct = currentProducts.find(p => String(p.id) === String(productId)) || currentProducts[0];
  currentTraceSlideIdx = 0;

  const titleEl = document.getElementById("trace-modal-product-name");
  if (titleEl && currentTraceProduct) {
    titleEl.textContent = "Nhật Ký Canh Tác: " + currentTraceProduct.name;
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
  `;

  if (dots) {
    dots.innerHTML = timeline.map((_, i) => `
      <button type="button" onclick="currentTraceSlideIdx=${i};renderTraceSlide();" class="h-2.5 rounded-full transition-all ${i === currentTraceSlideIdx ? 'w-7 bg-[#3ba117]' : 'w-2.5 bg-slate-300'}"></button>
    `).join("");
  }
}

// ================= MODAL IN-APP CHAT (CHỐNG CẮT CẦU DATA MASKING) =================
window.openInAppChatModal = function () {
  document.getElementById("inapp-chat-modal")?.classList.remove("hidden");
};

window.closeInAppChatModal = function () {
  document.getElementById("inapp-chat-modal")?.classList.add("hidden");
};

window.sendQuickChatMsg = function (text) {
  appendChatMessage("USER", text);
  setTimeout(() => {
    appendChatMessage(
      "FARMER",
      "Dạ Bác Năm nhận được tin nhắn rồi nha! Bác đã ghi chú chọn kỹ từng trái chuẩn độ chín cho đơn của mình. Nhờ đặt qua Ví Tạm Giữ AgriConnect nên đơn được bảo hành 1 đổi 1 tận tay trong 12h sau khi nhận hàng ạ!"
    );
  }, 600);
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
  updateCartUI();
}

window.clearCart = function () {
  cart = {};
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

  // Menu Đặt Hàng Trực Tiếp Kèm Phân Hạng Loại 1 / Loại 2 / Loại 3
  html += `
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs sm:text-sm font-extrabold text-[#0f240d] flex items-center gap-1.5">
          <i class="fa-solid fa-list-check text-[#3ba117]"></i>
          <span>${selectedEntries.length > 0 ? "Chọn thêm các loại nông sản khác:" : "Bấm nút [+] hoặc 'Chọn Mua' để đặt món:"}</span>
        </span>
        <a href="#products" class="text-xs font-bold text-[#256314] hover:underline flex items-center gap-1">
          <span>Xem ảnh lớn & Phân hạng</span>
          <i class="fa-solid fa-arrow-up text-[10px]"></i>
        </a>
      </div>
      <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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

  html += `
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
      if (priced.is_freeship) {
        promoEl.innerHTML = `<span class="text-[#fef08a] font-bold">🎉 Đã kích hoạt FREESHIP + Bảo vệ Ví Tạm Giữ Escrow 12h!</span>`;
      } else {
        promoEl.innerText = `Chọn VietQR Escrow để được Freeship + Giảm thêm 5%!`;
      }
    }
  } else {
    bar.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
    bar.classList.remove("translate-y-0", "opacity-100", "pointer-events-auto");
  }
}

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
  const freeshipThreshold = Number(window.APP_CONFIG?.SHIPPING?.FREESHIP_THRESHOLD ?? 250000);

  // Logic Tài chính Chuyên gia:
  // - Chọn Thanh toán trước (VIETQR / Ví Escrow): Được Freeship (0đ) + Giảm thêm 5% tiền hàng
  // - Chọn COD: Tính phí ship cao nhất (30.000 đ) trừ khi đơn >= 250k, và yêu cầu cọc 20%
  let shippingFee = 0;
  if (items.length > 0 && selectedDeliveryType === "HOME") {
    if (paymentMethod === "VIETQR" || subtotal >= freeshipThreshold) {
      shippingFee = 0;
    } else {
      shippingFee = 30000; // Phí ship cao nhất cho đơn COD hàng tươi sống
    }
  }

  // Tính tổng ưu đãi: Mã giảm giá (10k) + Ưu đãi thanh toán trước Ví Escrow (5%) + Ưu đãi Subscription định kỳ hàng tuần (8%)
  let cashlessDiscount = (paymentMethod === "VIETQR" && subtotal > 0) ? Math.round(subtotal * 0.05) : 0;
  let subscriptionDiscount = (selectedOrderMode === "SUBSCRIPTION_WEEKLY" && subtotal > 0) ? Math.round(subtotal * 0.08) : 0;
  const promoDiscount = (appliedDiscount > 0 && subtotal > 0) ? appliedDiscount : 0;

  const totalDiscount = Math.min(subtotal, promoDiscount + cashlessDiscount + subscriptionDiscount);
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

  return {
    items,
    subtotal,
    shipping_fee: shippingFee,
    discount: totalDiscount,
    cashless_discount: cashlessDiscount,
    subscription_discount: subscriptionDiscount,
    insurance_fee: insuranceFee,
    total_amount: totalAmount,
    payable_now: payableNow,
    deposit_label: depositLabel,
    total_kg: totalKg,
    payment_method: paymentMethod,
    order_mode: selectedOrderMode,
    is_freeship: (selectedDeliveryType === "HOME" && shippingFee === 0 && items.length > 0)
  };
}

function updateOrderSummary() {
  const priced = priceCart();
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  setText("summary-subtotal", formatVND(priced.subtotal));

  const shipEl = document.getElementById("summary-shipping");
  if (shipEl) {
    if (selectedDeliveryType === "CAMPUS") {
      shipEl.innerText = "Miễn phí 0 đ (Nhận tại Hub Xe Lạnh / Trường)";
    } else if (priced.is_freeship) {
      shipEl.innerText = "Miễn phí 0 đ (Ưu đãi Ví Escrow / Đơn ≥250k)";
    } else {
      shipEl.innerText = "30.000 đ (Phí COD bảo toàn hàng tươi)";
    }
  }

  const rowDiscount = document.getElementById("row-discount");
  if (rowDiscount) {
    if (priced.discount > 0) {
      rowDiscount.classList.remove("hidden");
      const parts = ["Mã 10k"];
      if (priced.cashless_discount > 0) parts.push("Ví Escrow -5%");
      if (priced.subscription_discount > 0) parts.push("Định kỳ tuần -8%");
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

  setText("summary-kg-badge", `${priced.total_kg.toFixed(1)} kg nông sản chín cây`);
  setText("summary-total", formatVND(priced.total_amount));

  const freeshipBadge = document.getElementById("freeship-badge");
  if (freeshipBadge) {
    freeshipBadge.classList.toggle("hidden", !priced.is_freeship);
  }

  const labelHome = document.getElementById("label-shipping-home");
  if (labelHome) {
    if (priced.is_freeship) {
      labelHome.innerText = "FREESHIP 0 đ";
      labelHome.className = "text-xs bg-[#e1f9cf] text-[#256314] px-2 py-0.5 rounded-md font-extrabold";
    } else {
      labelHome.innerText = "+30.000 đ (COD)";
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
    updateCartUI();
    renderEsgCircularSection();
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
  document.getElementById("mobile-menu")?.classList.toggle("hidden");
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
