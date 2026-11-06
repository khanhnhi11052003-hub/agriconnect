/**
 * LOGIC TRANG KHÁCH HÀNG - AGRICONNECT BÌNH PHƯỚC
 */

let currentProducts = [];
let cart = {}; // { productId: quantity }
let selectedDeliveryType = "HOME"; // "HOME" | "CAMPUS"

document.addEventListener("DOMContentLoaded", async () => {
  initCountdownTimer();
  setupEventListeners();
  try {
    await loadBatchInfo();
    await loadProducts();
  } catch (err) {
    showPageError("Không tải được dữ liệu sản phẩm: " + err.message);
  }
  updateOrderSummary();
});

function showPageError(message) {
  const el = document.getElementById("product-list");
  if (el) {
    el.innerHTML = `<div class="col-span-full p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">${escapeHTML(message)}</div>`;
  }
}

// ================= ĐỢT GOM HÀNG =================
async function loadBatchInfo() {
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
// Hạn chót: 23:59:59 Thứ Năm. Đặt từ Thứ 6 -> Chủ Nhật sẽ vào đợt tuần sau.
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
async function loadProducts() {
  currentProducts = await window.db.getProducts();

  const productListEl = document.getElementById("product-list");
  const cartSelectorsEl = document.getElementById("cart-item-selectors");
  if (!productListEl) return;

  productListEl.innerHTML = "";
  if (cartSelectorsEl) cartSelectorsEl.innerHTML = "";

  if (currentProducts.length === 0) {
    showPageError("Hiện chưa có sản phẩm mở bán trong đợt này.");
    return;
  }

  currentProducts.forEach(p => {
    const isCombo = p.category === "Combo";
    const name = escapeHTML(p.name);
    const desc = escapeHTML(p.description);
    const img = escapeHTML(p.image_url);
    const unit = escapeHTML(p.unit);
    const pid = escapeHTML(p.id);
    const price = formatVND(p.price_sale);

    const card = document.createElement("div");
    card.className = "bg-white rounded-3xl overflow-hidden border border-[#dce9cb] shadow-md card-hover flex flex-col";
    card.innerHTML = `
      <div class="relative h-60 overflow-hidden bg-[#f5f9ee] group">
        <img src="${img}" alt="${name}" loading="lazy" class="w-full h-full object-cover fruit-pop transition-transform duration-500 group-hover:scale-105">
        <span class="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isCombo ? "bg-[#d97706]" : "bg-[#5a8d29]"} text-white shadow-md">
          ${isCombo ? "Combo Tiết Kiệm" : "Trái cây vườn"}
        </span>
        <span class="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md">
          <i class="fa-solid fa-location-dot text-[#a0dc5c] mr-1"></i>Bình Phước
        </span>
      </div>
      <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="font-bold text-lg text-[#243912]">${name}</h3>
          <p class="text-xs text-[#597044] mt-2 leading-relaxed">${desc}</p>
        </div>
        <div class="pt-4 border-t border-[#edf4e3] flex items-center justify-between">
          <div>
            <span class="text-xs text-[#6e8558] block">Giá đặt trước:</span>
            <span class="text-xl font-black text-[#466e20]">${price}</span>
            <span class="text-xs text-[#6e8558]"> / ${unit}</span>
          </div>
          <button type="button" data-add="${pid}" class="btn-add bg-[#f1f7e9] hover:bg-[#5a8d29] text-[#466e20] hover:text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-[#d2e7b8] transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            <i class="fa-solid fa-cart-plus"></i> Chọn mua
          </button>
        </div>
      </div>
    `;
    productListEl.appendChild(card);

    if (cartSelectorsEl) {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#dce9cb]";
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <img src="${img}" alt="" class="w-12 h-12 rounded-xl object-cover fruit-pop border border-[#d2e7b8] shrink-0">
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-[#243912] truncate">${name}</h4>
            <p class="text-xs text-[#5a8d29] font-bold">${price} / ${unit}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" data-dec="${pid}" aria-label="Giảm" class="w-8 h-8 rounded-lg bg-[#f5f9ee] border border-[#d2e7b8] text-[#345517] font-bold hover:bg-[#e7f2da]">-</button>
          <span data-qty="${pid}" class="w-8 text-center font-bold text-sm text-[#243912]">0</span>
          <button type="button" data-inc="${pid}" aria-label="Tăng" class="w-8 h-8 rounded-lg bg-[#5a8d29] text-white font-bold hover:bg-[#466e20]">+</button>
        </div>
      `;
      cartSelectorsEl.appendChild(row);
    }
  });

  updateCartUI();
}

// ================= GIỎ HÀNG =================
function changeQty(productId, delta) {
  const updated = Math.min(50, Math.max(0, (cart[productId] || 0) + delta));
  if (updated === 0) delete cart[productId];
  else cart[productId] = updated;
  updateCartUI();
}

function updateCartUI() {
  document.querySelectorAll("[data-qty]").forEach(el => {
    el.innerText = cart[el.getAttribute("data-qty")] || 0;
  });
  updateOrderSummary();
}

// ================= HÌNH THỨC GIAO HÀNG =================
window.setDeliveryType = function (type) {
  selectedDeliveryType = type;
  const btnHome = document.getElementById("btn-delivery-home");
  const btnCampus = document.getElementById("btn-delivery-campus");
  const active = ["bg-emerald-600", "text-white", "shadow-md", "border-emerald-600"];
  const inactive = ["bg-white", "text-slate-700", "border-slate-200"];

  const [on, off] = type === "HOME" ? [btnHome, btnCampus] : [btnCampus, btnHome];
  on?.classList.add(...active); on?.classList.remove(...inactive);
  off?.classList.remove(...active); off?.classList.add(...inactive);

  document.getElementById("delivery-home-fields")?.classList.toggle("hidden", type !== "HOME");
  document.getElementById("delivery-campus-fields")?.classList.toggle("hidden", type !== "CAMPUS");
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
  const shippingFee = items.length && selectedDeliveryType === "HOME"
    ? Number(window.APP_CONFIG.SHIPPING?.HOME_DELIVERY_FEE ?? 20000) : 0;
  return { items, subtotal, shipping_fee: shippingFee, total_amount: subtotal + shippingFee, total_kg: totalKg };
}

function updateOrderSummary() {
  const priced = priceCart();
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  setText("summary-subtotal", formatVND(priced.subtotal));
  setText("summary-shipping", priced.shipping_fee > 0 ? formatVND(priced.shipping_fee) : "Miễn phí");
  setText("summary-total", formatVND(priced.total_amount));
}

function buildVietQRUrl(amount, memo) {
  const bank = window.APP_CONFIG.BANK;
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.BANK_ID)}-${encodeURIComponent(bank.ACCOUNT_NO)}-${encodeURIComponent(bank.TEMPLATE || "compact2")}.png`
    + `?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;
}

// Mã đơn khó đoán: AC-YYMMDD-XXXXXX (6 ký tự ngẫu nhiên, bỏ các ký tự dễ nhầm 0/O, 1/I)
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

  // Ủy quyền sự kiện cho các nút +/- và "Chọn mua"
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (add) {
      changeQty(add.getAttribute("data-add"), 1);
      document.getElementById("preorder")?.scrollIntoView({ behavior: "smooth" });
    } else if (inc) {
      changeQty(inc.getAttribute("data-inc"), 1);
    } else if (dec) {
      changeQty(dec.getAttribute("data-dec"), -1);
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
  if (priced.items.length === 0) return showFormError("Vui lòng chọn ít nhất 1 sản phẩm.");
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
    // Không xóa giỏ hàng để khách thử lại
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
