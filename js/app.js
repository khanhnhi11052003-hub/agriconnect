/**
 * LOGIC TRANG KHÁCH HÀNG - AGRICONNECT BÌNH PHƯỚC
 * - Menu đặt hàng đầy đủ & chọn số lượng trực tiếp tại hình ảnh nông sản
 * - Đồng bộ giỏ hàng nổi Sticky Bottom Bar & danh sách tóm tắt
 * - Khách chi trả cước 25.000 đ chặng cuối giao tận nhà
 * - Ưu đãi khai trương: Freeship đơn từ 250.000 đ & Giảm 10.000 đ với mã AGRICONNECT
 */

let currentProducts = [];
let cart = {}; // { productId: quantity }
let selectedDeliveryType = "HOME"; // "HOME" | "CAMPUS"
let appliedDiscount = 10000; // Mặc định mã AGRICONNECT giảm 10.000 đ

// Đảm bảo khởi chạy dù script nạp ở bất kỳ thời điểm nào
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

  updateOrderSummary();
}

function showPageError(message) {
  const el = document.getElementById("product-list");
  if (el) {
    el.innerHTML = `<div class="col-span-full p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">${escapeHTML(message)}</div>`;
  }
}

// ================= ĐỢT GOM HÀNG =================
async function loadBatchInfo() {
  if (!window.db || typeof window.db.getCurrentBatch !== "function") return;
  const batch = await window.db.getCurrentBatch();
  if (!batch) return;

  const titleEl = document.getElementById("batch-title");
  if (titleEl && batch.batch_name) titleEl.innerText = batch.batch_name;

  const currentKg = Number(batch.current_kg || 0);
  const targetKg = Number(batch.target_kg || 60);
  const pct = targetKg > 0 ? Math.min(Math.round((currentKg / targetKg) * 100), 100) : 0;

  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const progressNote = document.getElementById("progress-note");

  if (progressText) progressText.innerText = `${currentKg.toFixed(1)} / ${targetKg.toFixed(1)} kg (${pct}%)`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressNote) {
    progressNote.innerText = pct >= 100
      ? "* Đã đủ tải mục tiêu cho chuyến xe tuần này."
      : `* Còn khoảng ${(targetKg - currentKg).toFixed(1)} kg nữa để đủ tải mục tiêu của chuyến xe.`;
  }
}

// ================= ĐẾM NGƯỢC & NGÀY GIAO =================
function getNextThursdayDeadline(now = new Date()) {
  const day = now.getDay(); // 0 CN ... 6 T7
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

// ================= SẢN PHẨM =================
let selectedCategory = "ALL";

window.filterCategory = function (cat) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-tab").forEach(tab => {
    tab.className = "cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-[#256314] border border-[#c8edab] hover:bg-[#f1fbe9]";
  });
  const activeTab = document.getElementById(`tab-cat-${cat}`);
  if (activeTab) {
    activeTab.className = "cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-[#389e18] to-[#59c228] text-white shadow-md shadow-[#44a821]/25";
  }
  renderProductGrid();
};

function renderProductGrid() {
  const productListEl = document.getElementById("product-list");
  if (!productListEl) return;
  productListEl.innerHTML = "";

  const items = selectedCategory === "ALL"
    ? currentProducts
    : currentProducts.filter(p => p.category === selectedCategory);

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
    const price = formatVND(p.price_sale);
    const qty = cart[p.id] || 0;

    const highlightsHtml = Array.isArray(p.highlights) && p.highlights.length > 0
      ? `<div class="flex flex-wrap gap-1.5 mt-2.5">
          ${p.highlights.map(h => `<span class="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e6f9d7] text-[#1c560e] px-2.5 py-0.5 rounded-full border border-[#bbf099] shadow-2xs"><i class="fa-solid fa-circle-check text-[#3ba117] text-[10px]"></i>${escapeHTML(h)}</span>`).join("")}
        </div>`
      : "";

    // Nút chọn mua hoặc bộ tăng giảm số lượng ngay tại ảnh sản phẩm
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
      <div class="relative h-64 overflow-hidden bg-[#f7fdf3] group">
        <img src="${img}" alt="${name}" loading="lazy" class="w-full h-full object-cover fruit-pop transition-transform duration-500 group-hover:scale-105">
        <span class="absolute top-3 left-3 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${isCombo ? "bg-amber-500" : "bg-[#3ba117]"} text-white shadow-md">
          ${isCombo ? "Combo Tiết Kiệm" : "Trái cây vườn"}
        </span>
        ${qty > 0 ? `<span class="absolute top-3 right-3 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#1c560e] text-[#fef08a] shadow-md border border-[#fef08a]/40 animate-pulse">✓ Đã chọn ${qty} ${unit}</span>` : ""}
        <span class="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-black/65 text-white backdrop-blur-md">
          <i class="fa-solid fa-location-dot text-[#7be038] mr-1"></i>Bình Phước
        </span>
      </div>
      <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="font-black text-lg text-[#0f240d] leading-snug">${name}</h3>
          ${highlightsHtml}
          <p class="text-xs text-[#4d6b33] mt-2.5 leading-relaxed">${desc}</p>
        </div>
        <div class="pt-3.5 border-t border-[#edf7e4] flex items-center justify-between gap-2">
          <div>
            <span class="text-xs text-[#5f7e45] font-medium block">Giá đặt trước:</span>
            <span class="text-xl font-black text-[#22720d]">${price}</span>
            <span class="text-xs text-[#5f7e45]"> / ${unit}</span>
          </div>
          <div class="shrink-0">
            ${actionBtnHtml}
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
  // 1. Cập nhật số lượng trên các thẻ ảnh sản phẩm trong mục Trái Cây Vườn
  renderProductGrid();

  // 2. Cập nhật thực đơn đặt hàng (Menu) trong Pre-order Form
  renderSelectedCartItems();

  // 3. Cập nhật thanh giỏ hàng nổi Sticky Cart Bar
  updateStickyCartBar();

  // 4. Tính toán lại tổng tiền, phí ship và ưu đãi
  updateOrderSummary();
}

// Render Menu Đặt Hàng & Sản phẩm đã chọn ngay trong Form đặt hàng
function renderSelectedCartItems() {
  const container = document.getElementById("cart-selected-items");
  if (!container) return;

  const selectedEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
  let html = "";

  // 1. Nếu đã chọn món: Hiển thị tóm tắt các món đã chọn nổi bật ở trên
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
      const lineTotal = Number(p.price_sale) * qty;

      html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#b8ee99] shadow-xs gap-3">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img src="${escapeHTML(p.image_url)}" alt="" class="w-12 h-12 rounded-xl object-cover fruit-pop border border-[#c8edab] shrink-0">
            <div class="min-w-0">
              <h4 class="font-black text-xs sm:text-sm text-[#0f240d] truncate">${escapeHTML(p.name)}</h4>
              <p class="text-[11px] sm:text-xs text-[#2e8213] font-bold">${formatVND(p.price_sale)} / ${escapeHTML(p.unit)}</p>
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

  // 2. Menu Đặt Hàng Trực Tiếp (Danh Sách Toàn Bộ Nông Sản Kèm Nút Thêm/Bớt)
  html += `
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs sm:text-sm font-extrabold text-[#0f240d] flex items-center gap-1.5">
          <i class="fa-solid fa-list-check text-[#3ba117]"></i>
          <span>${selectedEntries.length > 0 ? "Chọn thêm các loại nông sản khác:" : "Bấm nút [+] hoặc 'Chọn Mua' để đặt món:"}</span>
        </span>
        <a href="#products" class="text-xs font-bold text-[#256314] hover:underline flex items-center gap-1">
          <span>Xem ảnh lớn</span>
          <i class="fa-solid fa-arrow-up text-[10px]"></i>
        </a>
      </div>
      <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
  `;

  currentProducts.forEach(p => {
    const qty = cart[p.id] || 0;
    const isCombo = p.category === "Combo";
    const pid = escapeHTML(p.id);

    html += `
      <div class="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl ${qty > 0 ? 'bg-[#f7fdf3] border-2 border-[#82d648]' : 'bg-white border border-[#d2f0b6]'} hover:border-[#3ba117] transition-all gap-2 shadow-2xs">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img src="${escapeHTML(p.image_url)}" alt="" class="w-11 h-11 rounded-xl object-cover fruit-pop border border-[#d2f0b6] shrink-0">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h4 class="font-black text-xs sm:text-sm text-[#0f240d] truncate">${escapeHTML(p.name)}</h4>
              <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${isCombo ? 'bg-amber-100 text-amber-800' : 'bg-[#e1f9cf] text-[#256314]'}">${isCombo ? 'Combo' : 'Trái cây'}</span>
            </div>
            <p class="text-[11px] sm:text-xs text-[#2e8213] font-bold mt-0.5">${formatVND(p.price_sale)} <span class="text-[10px] text-slate-400 font-normal">/ ${escapeHTML(p.unit)}</span></p>
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

// Cập nhật thanh giỏ hàng nổi Sticky Bottom Bar
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
    if (totalEl) totalEl.innerText = formatVND(priced.subtotal);
    if (promoEl) {
      if (priced.subtotal >= 250000) {
        promoEl.innerHTML = `<span class="text-[#fef08a] font-bold">🎉 Bạn được MIỄN PHÍ SHIP 100% tận nhà!</span>`;
      } else {
        const needed = 250000 - priced.subtotal;
        promoEl.innerText = `Chọn thêm ${formatVND(needed)} để được FREESHIP!`;
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

// ================= ÁP DỤNG MÃ GIẢM GIÁ RA MẮT =================
window.applyPromoCode = function () {
  const input = document.getElementById("promo-code-input");
  const msgEl = document.getElementById("promo-code-msg");
  const code = (input?.value || "").trim().toUpperCase();

  if (!msgEl) return;
  msgEl.classList.remove("hidden");

  if (code === "AGRICONNECT") {
    appliedDiscount = 10000;
    msgEl.className = "text-xs font-bold text-[#256314] block mt-1";
    msgEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-[#3ba117]"></i> Áp dụng thành công mã <strong>AGRICONNECT</strong>: Giảm ngay 10.000 đ cho đơn hàng khai trương!`;
  } else if (!code) {
    appliedDiscount = 0;
    msgEl.classList.add("hidden");
  } else {
    appliedDiscount = 0;
    msgEl.className = "text-xs font-bold text-rose-600 block mt-1";
    msgEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Mã ưu đãi "${escapeHTML(code)}" không hợp lệ hoặc đã hết lượt áp dụng.`;
  }

  updateOrderSummary();
};

// ================= TÍNH TIỀN =================
function priceCart() {
  const items = [];
  let subtotal = 0;
  let totalKg = 0;

  Object.entries(cart).forEach(([id, qty]) => {
    const p = currentProducts.find(x => String(x.id) === String(id));
    if (!p || qty <= 0) return;
    const line = Number(p.price_sale) * qty;
    items.push({ productId: p.id, name: p.name, unit: p.unit, qty, price: Number(p.price_sale), subtotal: line });
    subtotal += line;
    totalKg += Number(p.weight_kg || 1) * qty;
  });

  const homeFee = Number(window.APP_CONFIG?.SHIPPING?.HOME_DELIVERY_FEE ?? 25000);
  const freeshipThreshold = Number(window.APP_CONFIG?.SHIPPING?.FREESHIP_THRESHOLD ?? 250000);

  // Phí ship: Campus Hub = 0đ; Giao tận nhà: 25.000 đ (nếu >= 250k thì FREESHIP 0đ)
  let shippingFee = 0;
  if (items.length > 0 && selectedDeliveryType === "HOME") {
    shippingFee = subtotal >= freeshipThreshold ? 0 : homeFee;
  }

  // Giảm giá ưu đãi khai trương
  const discount = (appliedDiscount > 0 && subtotal > 0) ? Math.min(appliedDiscount, subtotal) : 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - discount);

  return {
    items,
    subtotal,
    shipping_fee: shippingFee,
    discount,
    total_amount: totalAmount,
    total_kg: totalKg,
    is_freeship: (selectedDeliveryType === "HOME" && subtotal >= freeshipThreshold && items.length > 0)
  };
}

function updateOrderSummary() {
  const priced = priceCart();
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  setText("summary-subtotal", formatVND(priced.subtotal));

  // Hiển thị phí ship
  const shipEl = document.getElementById("summary-shipping");
  if (shipEl) {
    if (selectedDeliveryType === "CAMPUS") {
      shipEl.innerText = "Miễn phí (Tại trường)";
    } else if (priced.is_freeship) {
      shipEl.innerText = "Miễn phí 0 đ (Tặng Freeship ≥250k)";
    } else {
      shipEl.innerText = "25.000 đ (Khách chi trả)";
    }
  }

  // Hiển thị dòng giảm giá
  const rowDiscount = document.getElementById("row-discount");
  if (rowDiscount) {
    if (priced.discount > 0) {
      rowDiscount.classList.remove("hidden");
      setText("summary-discount", `-${formatVND(priced.discount)}`);
    } else {
      rowDiscount.classList.add("hidden");
    }
  }

  // Khối lượng & Tổng thanh toán
  setText("summary-kg-badge", `${priced.total_kg.toFixed(1)} kg nông sản chín cây`);
  setText("summary-total", formatVND(priced.total_amount));

  // Cập nhật badge Freeship trên form
  const freeshipBadge = document.getElementById("freeship-badge");
  if (freeshipBadge) {
    freeshipBadge.classList.toggle("hidden", !priced.is_freeship);
  }

  // Cập nhật nhãn phí trên nút Home Delivery
  const labelHome = document.getElementById("label-shipping-home");
  if (labelHome) {
    if (priced.is_freeship) {
      labelHome.innerText = "FREESHIP 0 đ";
      labelHome.className = "text-xs bg-[#e1f9cf] text-[#256314] px-2 py-0.5 rounded-md font-extrabold";
    } else {
      labelHome.innerText = "+25.000 đ (Khách trả)";
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

  // Tự động kiểm tra mã ưu đãi nếu đã có sẵn trong input
  const promoInput = document.getElementById("promo-code-input");
  if (promoInput && promoInput.value.trim().toUpperCase() === "AGRICONNECT") {
    const msgEl = document.getElementById("promo-code-msg");
    if (msgEl) {
      msgEl.className = "text-xs font-bold text-[#256314] block mt-1";
      msgEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-[#3ba117]"></i> Đã áp dụng mã <strong>AGRICONNECT</strong>: Giảm ngay 10.000 đ!`;
    }
  }

  // Ủy quyền sự kiện cho các nút Chọn mua, Tăng, Giảm và Xóa món
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
  const notes = val("cust-notes").slice(0, 500);
  const consent = document.getElementById("cust-consent")?.checked;

  if (customerName.length < 2) return showFormError("Vui lòng nhập họ tên người nhận.");
  if (!/^(0|\+84)[0-9]{9,10}$/.test(customerPhone)) {
    return showFormError("Số điện thoại chưa đúng định dạng (ví dụ: 0912345678).");
  }

  let deliveryAddress = "";
  let department = "";
  if (selectedDeliveryType === "HOME") {
    const houseNo = val("home-house"), street = val("home-street"), ward = val("home-ward"), district = val("home-district");
    const city = val("home-city") || "TP.HCM";
    if (!houseNo || !street || !ward || !district) {
      return showFormError("Vui lòng điền đủ Số nhà, Tên đường, Phường/Xã và Quận/Huyện để shipper giao đúng địa chỉ.");
    }
    deliveryAddress = `${houseNo}, ${street}, ${ward}, ${district}, ${city}`;
    department = `Giao tận nhà (${district})`;
  } else {
    department = val("campus-dept");
    deliveryAddress = val("campus-address");
    if (!department || deliveryAddress.length < 5) return showFormError("Vui lòng nhập Khoa/Đơn vị và Điểm nhận cụ thể trong trường.");
  }

  const priced = priceCart();
  if (priced.items.length === 0) return showFormError("Vui lòng chọn ít nhất 1 sản phẩm trước khi gửi đơn hàng.");
  if (!consent) return showFormError("Vui lòng tick đồng ý cho nhóm sử dụng thông tin để giao hàng.");

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
    notes
  };

  const btn = document.getElementById("btn-submit-order");
  const btnHTML = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang gửi đơn...`; }

  try {
    const order = await window.db.createOrder(orderInput, priced);
    showSuccessModal(order);
    cart = {};
    updateCartUI();
    document.getElementById("preorder-form")?.reset();
    setDeliveryType(selectedDeliveryType);
    loadBatchInfo().catch(() => {});
  } catch (err) {
    showFormError("Chưa gửi được đơn: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
  }
}

// ================= MODAL THÀNH CÔNG =================
function showSuccessModal(order) {
  const modal = document.getElementById("success-modal");
  if (!modal) return;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  setText("modal-order-code", order.order_code);
  setText("modal-total-amount", formatVND(order.total_amount));
  setText("modal-total-amount-cod", formatVND(order.total_amount));
  setText("modal-delivery-date", formatDateVN(getExpectedDeliveryDate()));

  const isCOD = order.payment_method === "COD";
  document.getElementById("modal-qr-block")?.classList.toggle("hidden", isCOD);
  document.getElementById("modal-cod-note")?.classList.toggle("hidden", !isCOD);

  if (!isCOD) {
    const bank = window.APP_CONFIG.BANK;
    const qrImg = document.getElementById("modal-vietqr-img");
    if (qrImg) qrImg.src = buildVietQRUrl(order.total_amount, order.order_code);
    const bankInfoEl = document.getElementById("modal-bank-info");
    if (bankInfoEl) {
      bankInfoEl.innerHTML = `
        <div class="text-xs space-y-1">
          <p><strong>Ngân hàng:</strong> ${escapeHTML(bank.BANK_ID)}</p>
          <p><strong>Số tài khoản:</strong> <span class="font-mono font-bold text-emerald-800">${escapeHTML(bank.ACCOUNT_NO)}</span></p>
          <p><strong>Chủ tài khoản:</strong> ${escapeHTML(bank.ACCOUNT_NAME)}</p>
          <p><strong>Nội dung CK:</strong> <span class="font-mono font-bold text-emerald-800">${escapeHTML(order.order_code)}</span></p>
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
