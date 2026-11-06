/**
 * LOGIC GIAO DIỆN KHÁCH HÀNG - AGRICONNECT BÌNH PHƯỚC
 */

let currentProducts = [];
let cart = {}; // { productId: quantity }
let selectedDeliveryType = "HOME"; // "HOME" (Giao tận nhà) hoặc "CAMPUS" (Nhận tại trường)

document.addEventListener("DOMContentLoaded", async () => {
  initCountdownTimer();
  await loadBatchInfo();
  await loadProducts();
  setupEventListeners();
  updateOrderSummary();
});

// ================= LOAD THÔNG TIN ĐỢT GOM HÀNG =================
async function loadBatchInfo() {
  const batch = await window.db.getCurrentBatch();
  if (batch) {
    const titleEl = document.getElementById("batch-title");
    if (titleEl && batch.batch_name) titleEl.innerText = batch.batch_name;

    const currentKg = parseFloat(batch.current_kg || 0);
    const targetKg = parseFloat(batch.target_kg || 60);
    const pct = Math.min(Math.round((currentKg / targetKg) * 100), 100);

    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");

    if (progressText) progressText.innerText = `${currentKg} / ${targetKg} kg (${pct}%)`;
    if (progressBar) progressBar.style.width = `${pct}%`;
  }
}

// ================= BỘ ĐẾM NGƯỢC THỜI HẠN GOM HÀNG =================
function initCountdownTimer() {
  // Đặt hạn chót là 23:59:59 Thứ Năm tuần này
  function getNextThursdayDeadline() {
    const now = new Date();
    const day = now.getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
    let diff = (4 - day + 7) % 7;
    if (diff === 0 && now.getHours() >= 23 && now.getMinutes() >= 59) {
      diff = 7;
    }
    const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 23, 59, 59);
    return deadline.getTime();
  }

  const deadline = getNextThursdayDeadline();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = deadline - now;

    if (distance < 0) {
      const daysEl = document.getElementById("timer-days");
      if (daysEl) daysEl.innerText = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = n => (n < 10 ? "0" + n : n);

    if (document.getElementById("timer-days")) document.getElementById("timer-days").innerText = pad(days);
    if (document.getElementById("timer-hours")) document.getElementById("timer-hours").innerText = pad(hours);
    if (document.getElementById("timer-mins")) document.getElementById("timer-mins").innerText = pad(minutes);
    if (document.getElementById("timer-secs")) document.getElementById("timer-secs").innerText = pad(seconds);
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ================= LOAD SẢN PHẨM =================
async function loadProducts() {
  currentProducts = await window.db.getProducts();

  const productListEl = document.getElementById("product-list");
  const cartSelectorsEl = document.getElementById("cart-item-selectors");

  if (!productListEl) return;

  productListEl.innerHTML = "";
  if (cartSelectorsEl) cartSelectorsEl.innerHTML = "";

  currentProducts.forEach((p, idx) => {
    // 1. Render Card Sản phẩm ở phần Showcase
    const isCombo = p.category === "Combo";
    const badgeText = isCombo ? "Combo Tiết Kiệm" : "Nông sản sạch chín cây";
    const formattedPrice = Number(p.price_sale).toLocaleString("vi-VN") + " đ";

    const card = document.createElement("div");
    card.className = "bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md card-hover flex flex-col";
    card.innerHTML = `
      <div class="relative h-60 overflow-hidden bg-slate-100 group">
        <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
        <span class="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isCombo ? 'bg-amber-500 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'}">
          ${badgeText}
        </span>
        <span class="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md">
          <i class="fa-solid fa-location-dot text-emerald-400 mr-1"></i>Vườn Bình Phước
        </span>
      </div>
      <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">${p.name}</h3>
          <p class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">${p.description}</p>
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-400 block">Giá Pre-order:</span>
            <span class="text-xl font-black text-emerald-700">${formattedPrice}</span>
            <span class="text-xs text-slate-400 font-normal"> / ${p.unit}</span>
          </div>
          <button onclick="addToCart('${p.id}')" class="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            <i class="fa-solid fa-cart-plus"></i> Chọn Mua
          </button>
        </div>
      </div>
    `;
    productListEl.appendChild(card);

    // 2. Render hàng chọn số lượng trong Form Đặt Hàng
    if (cartSelectorsEl) {
      const itemRow = document.createElement("div");
      itemRow.className = "flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-emerald-300 transition-colors";
      itemRow.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${p.image_url}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0">
          <div>
            <h4 class="font-bold text-sm text-slate-800">${p.name}</h4>
            <p class="text-xs text-emerald-700 font-semibold">${formattedPrice} / ${p.unit}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="changeQty('${p.id}', -1)" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-all">-</button>
          <span id="qty-display-${p.id}" class="w-8 text-center font-bold text-sm text-slate-800">0</span>
          <button type="button" onclick="changeQty('${p.id}', 1)" class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center transition-all shadow-sm shadow-emerald-500/20">+</button>
        </div>
      `;
      cartSelectorsEl.appendChild(itemRow);
    }
  });

  // Mặc định cho 1 sản phẩm đầu vào giỏ để khách dễ hình dung
  if (currentProducts.length > 0 && Object.keys(cart).length === 0) {
    cart[currentProducts[0].id] = 1;
    updateCartUI();
  }
}

// ================= THAY ĐỔI SỐ LƯỢNG GIỎ HÀNG =================
window.changeQty = function (productId, delta) {
  const current = cart[productId] || 0;
  const updated = Math.max(0, current + delta);
  if (updated === 0) {
    delete cart[productId];
  } else {
    cart[productId] = updated;
  }
  updateCartUI();
};

window.addToCart = function (productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  updateCartUI();
  // Scroll nhẹ tới form đặt hàng
  document.getElementById("preorder")?.scrollIntoView({ behavior: "smooth" });
};

function updateCartUI() {
  currentProducts.forEach(p => {
    const el = document.getElementById(`qty-display-${p.id}`);
    if (el) el.innerText = cart[p.id] || 0;
  });
  updateOrderSummary();
}

// ================= CHỌN HÌNH THỨC GIAO HÀNG =================
window.setDeliveryType = function (type) {
  selectedDeliveryType = type;

  const btnHome = document.getElementById("btn-delivery-home");
  const btnCampus = document.getElementById("btn-delivery-campus");
  const homeFields = document.getElementById("delivery-home-fields");
  const campusFields = document.getElementById("delivery-campus-fields");

  if (type === "HOME") {
    btnHome?.classList.add("bg-emerald-600", "text-white", "shadow-md");
    btnHome?.classList.remove("bg-white", "text-slate-700");

    btnCampus?.classList.remove("bg-emerald-600", "text-white", "shadow-md");
    btnCampus?.classList.add("bg-white", "text-slate-700");

    homeFields?.classList.remove("hidden");
    campusFields?.classList.add("hidden");
  } else {
    btnCampus?.classList.add("bg-emerald-600", "text-white", "shadow-md");
    btnCampus?.classList.remove("bg-white", "text-slate-700");

    btnHome?.classList.remove("bg-emerald-600", "text-white", "shadow-md");
    btnHome?.classList.add("bg-white", "text-slate-700");

    campusFields?.classList.remove("hidden");
    homeFields?.classList.add("hidden");
  }

  updateOrderSummary();
};

// ================= CẬP NHẬT TỔNG TIỀN VÀ MÃ VIETQR =================
function updateOrderSummary() {
  let subtotal = 0;
  let totalItemsCount = 0;

  Object.entries(cart).forEach(([id, qty]) => {
    const p = currentProducts.find(item => item.id === id);
    if (p && qty > 0) {
      subtotal += p.price_sale * qty;
      totalItemsCount += qty;
    }
  });

  const shippingFee = selectedDeliveryType === "HOME" ? (window.APP_CONFIG.SHIPPING?.HOME_DELIVERY_FEE || 20000) : 0;
  const grandTotal = subtotal > 0 ? (subtotal + shippingFee) : 0;

  const subtotalEl = document.getElementById("summary-subtotal");
  const shippingEl = document.getElementById("summary-shipping");
  const totalEl = document.getElementById("summary-total");

  if (subtotalEl) subtotalEl.innerText = Number(subtotal).toLocaleString("vi-VN") + " đ";
  if (shippingEl) shippingEl.innerText = shippingFee > 0 ? Number(shippingFee).toLocaleString("vi-VN") + " đ" : "Miễn phí";
  if (totalEl) totalEl.innerText = Number(grandTotal).toLocaleString("vi-VN") + " đ";

  // Cập nhật preview VietQR động
  updateVietQRPreview(grandTotal);
}

function updateVietQRPreview(amount) {
  const qrPreview = document.getElementById("vietqr-image-preview");
  if (!qrPreview) return;

  if (amount <= 0) {
    qrPreview.src = "";
    qrPreview.alt = "Vui lòng chọn nông sản để tạo mã thanh toán";
    return;
  }

  const bank = window.APP_CONFIG.BANK || { BANK_ID: "MB", ACCOUNT_NO: "0987654321", ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI" };
  const memo = "AC PREORDER";
  const qrUrl = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-${bank.TEMPLATE || 'compact2'}.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;
  qrPreview.src = qrUrl;
}

// ================= XỬ LÝ ĐẶT HÀNG FORM =================
function setupEventListeners() {
  const form = document.getElementById("preorder-form");
  if (form) {
    form.addEventListener("submit", handleOrderSubmit);
  }
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const customerName = document.getElementById("cust-name")?.value.trim();
  const customerPhone = document.getElementById("cust-phone")?.value.trim();
  const customerRole = document.getElementById("cust-role")?.value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || "VIETQR";
  const notes = document.getElementById("cust-notes")?.value.trim() || "";

  // Địa chỉ nhận hàng tùy theo hình thức
  let deliveryAddress = "";
  let department = "";

  if (selectedDeliveryType === "HOME") {
    const houseNo = document.getElementById("home-house")?.value.trim() || "";
    const street = document.getElementById("home-street")?.value.trim() || "";
    const ward = document.getElementById("home-ward")?.value.trim() || "";
    const district = document.getElementById("home-district")?.value.trim() || "";
    const city = document.getElementById("home-city")?.value.trim() || "TP.HCM";

    if (!houseNo || !street || !ward || !district) {
      alert("Vui lòng điền đầy đủ Số nhà, Tên đường, Phường/Xã và Quận/Huyện để shipper công nghệ giao chính xác!");
      return;
    }
    deliveryAddress = `${houseNo}, ${street}, Phường/Xã ${ward}, ${district}, ${city}`;
    department = `Giao tận nhà (${district})`;
  } else {
    department = document.getElementById("campus-dept")?.value.trim() || "";
    deliveryAddress = document.getElementById("campus-address")?.value.trim() || "";
    if (!department || !deliveryAddress) {
      alert("Vui lòng nhập Khoa / Đơn vị và Điểm nhận cụ thể trong trường!");
      return;
    }
  }

  // Thu thập sản phẩm trong giỏ
  const items = [];
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = currentProducts.find(item => item.id === id);
    if (p && qty > 0) {
      items.push({
        productId: p.id,
        name: p.name,
        qty: qty,
        unit: p.unit,
        price: p.price_sale,
        subtotal: p.price_sale * qty
      });
      subtotal += p.price_sale * qty;
    }
  });

  if (items.length === 0) {
    alert("Vui lòng chọn ít nhất 1 sản phẩm sầu riêng hoặc măng cụt để đặt hàng!");
    return;
  }

  const shippingFee = selectedDeliveryType === "HOME" ? (window.APP_CONFIG.SHIPPING?.HOME_DELIVERY_FEE || 20000) : 0;
  const grandTotal = subtotal + shippingFee;

  // Tạo mã đơn hàng duy nhất
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomStr = Math.floor(100 + Math.random() * 900);
  const orderCode = `AC-BP-${dateStr}-${randomStr}`;

  const orderData = {
    order_code: orderCode,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_role: customerRole,
    delivery_type: selectedDeliveryType,
    department: department,
    delivery_address: deliveryAddress,
    items: items,
    shipping_fee: shippingFee,
    total_amount: grandTotal,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "VIETQR" ? "UNPAID" : "UNPAID",
    order_status: "CONFIRMED",
    notes: notes,
    created_at: new Date().toISOString()
  };

  const btnSubmit = document.getElementById("btn-submit-order");
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang xử lý đơn...`;
  }

  try {
    await window.db.createOrder(orderData);
    showSuccessModal(orderData);
    // Reset giỏ hàng
    cart = {};
    updateCartUI();
    document.getElementById("preorder-form")?.reset();
  } catch (err) {
    alert("Có lỗi xảy ra khi tạo đơn hàng: " + err.message);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i class="fa-solid fa-check-circle mr-2"></i>Xác Nhận Đặt Trước Nông Sản`;
    }
  }
}

// ================= HIỂN THỊ MODAL THÀNH CÔNG & MÃ VIETQR =================
function showSuccessModal(order) {
  const modal = document.getElementById("success-modal");
  if (!modal) return;

  const codeEl = document.getElementById("modal-order-code");
  const totalEl = document.getElementById("modal-total-amount");
  const qrImg = document.getElementById("modal-vietqr-img");
  const bankInfoEl = document.getElementById("modal-bank-info");

  if (codeEl) codeEl.innerText = order.order_code;
  if (totalEl) totalEl.innerText = Number(order.total_amount).toLocaleString("vi-VN") + " đ";

  const bank = window.APP_CONFIG.BANK || { BANK_ID: "MB", ACCOUNT_NO: "0987654321", ACCOUNT_NAME: "NGUYEN PHAM KHANH NHI" };
  const memo = order.order_code;
  const qrUrl = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-${bank.TEMPLATE || 'compact2'}.png?amount=${order.total_amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;

  if (qrImg) qrImg.src = qrUrl;
  if (bankInfoEl) {
    bankInfoEl.innerHTML = `
      <div class="text-xs space-y-1">
        <p><strong>Ngân hàng:</strong> ${bank.BANK_ID}</p>
        <p><strong>Số tài khoản:</strong> <span class="font-mono font-bold text-emerald-800">${bank.ACCOUNT_NO}</span></p>
        <p><strong>Chủ tài khoản:</strong> ${bank.ACCOUNT_NAME}</p>
        <p><strong>Nội dung CK:</strong> <span class="font-mono font-bold text-emerald-800">${memo}</span></p>
      </div>
    `;
  }

  modal.classList.remove("hidden");
}

window.closeSuccessModal = function () {
  document.getElementById("success-modal")?.classList.add("hidden");
};

// ================= MOBILE NAVIGATION TOGGLE =================
window.toggleMobileNav = function () {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.toggle("hidden");
};
