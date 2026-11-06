/**
 * TRANG QUẢN TRỊ - AGRICONNECT BÌNH PHƯỚC
 * - Đăng nhập: CLOUD = Supabase Auth; DEMO = mã PIN (chỉ để thuyết trình)
 * - Bảng đơn, đổi trạng thái thanh toán, hủy đơn
 * - Gom tuyến giao hàng theo cụm quận/huyện
 * - In tem thùng hàng, xuất CSV
 * - Bảng tính tài chính theo giả định trong config.js
 */

let allOrders = [];
let allProducts = [];
const E = s => window.escapeHTML(s);

document.addEventListener("DOMContentLoaded", async () => {
  setupLoginUI();
  if (await window.db.isAdmin()) {
    showDashboard();
  } else {
    showLogin();
  }
});

// ================= ĐĂNG NHẬP =================
function setupLoginUI() {
  const isCloud = window.db.isCloud;
  document.getElementById("login-cloud-fields")?.classList.toggle("hidden", !isCloud);
  document.getElementById("login-demo-fields")?.classList.toggle("hidden", isCloud);
  const modeBadge = document.getElementById("mode-badge");
  if (modeBadge) {
    modeBadge.innerText = isCloud ? "CLOUD (Supabase)" : "DEMO (dữ liệu trong trình duyệt)";
    modeBadge.className = isCloud
      ? "text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700"
      : "text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700";
  }

  document.getElementById("login-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const errBox = document.getElementById("login-error");
    errBox?.classList.add("hidden");
    const btn = document.getElementById("login-btn");
    if (btn) btn.disabled = true;
    try {
      await window.db.adminLogin({
        email: document.getElementById("login-email")?.value.trim(),
        password: document.getElementById("login-password")?.value,
        pin: document.getElementById("login-pin")?.value.trim()
      });
      showDashboard();
    } catch (err) {
      if (errBox) { errBox.innerText = err.message; errBox.classList.remove("hidden"); }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

function showLogin() {
  document.getElementById("login-screen")?.classList.remove("hidden");
  document.getElementById("admin-dashboard")?.classList.add("hidden");
}

async function showDashboard() {
  document.getElementById("login-screen")?.classList.add("hidden");
  document.getElementById("admin-dashboard")?.classList.remove("hidden");
  await loadData();
}

window.adminLogout = async function () {
  await window.db.adminLogout();
  allOrders = [];
  showLogin();
};

// ================= TẢI DỮ LIỆU =================
async function loadData() {
  try {
    allProducts = await window.db.getAllProducts();
    allOrders = await window.db.getOrders();
  } catch (err) {
    alert("Không tải được dữ liệu: " + err.message);
    return;
  }
  calculateMetrics();
  renderOrdersTable();
}
window.reloadData = loadData;

function activeOrders() {
  return allOrders.filter(o => o.order_status !== "CANCELLED");
}

function orderKg(o) {
  if (o.total_kg != null && Number(o.total_kg) > 0) return Number(o.total_kg);
  return (o.items || []).reduce((s, i) => {
    const p = allProducts.find(x => String(x.id) === String(i.productId));
    return s + Number(p?.weight_kg || 1) * Number(i.qty || 1);
  }, 0);
}

// ================= TÀI CHÍNH (THEO GIẢ ĐỊNH TRONG CONFIG) =================
function calculateMetrics() {
  const F = window.APP_CONFIG.FINANCE || {};
  const orders = activeOrders();

  const costMap = {};
  allProducts.forEach(p => { costMap[String(p.id)] = Number(p.price_original || 0); });

  let goodsRevenue = 0, shippingCollected = 0, farmCost = 0, totalKg = 0, homeDrops = 0;
  orders.forEach(o => {
    const ship = Number(o.shipping_fee || 0);
    shippingCollected += ship;
    goodsRevenue += Number(o.total_amount || 0) - ship;
    totalKg += orderKg(o);
    if (o.delivery_type === "HOME") homeDrops++;
    (o.items || []).forEach(i => {
      const unitCost = costMap[String(i.productId)] ?? Number(i.price || 0) * 0.6;
      farmCost += unitCost * Number(i.qty || 1);
    });
  });

  const busCost = orders.length ? Number(F.BUS_COST_PER_TRIP || 0) : 0;
  const boxCost = orders.length * Number(F.BOX_COST_PER_ORDER || 0);
  const shipperCost = homeDrops * Number(F.SHIPPER_COST_PER_DROP || 0);
  const defectReserve = goodsRevenue * Number(F.DEFECT_RESERVE_PCT || 0);
  const marketing = orders.length ? Number(F.MARKETING_PER_TRIP || 0) : 0;

  const grossProfit = goodsRevenue - farmCost;
  const logistics = busCost + boxCost + (shipperCost - shippingCollected); // phần ship khách trả bù trừ vào chi phí shipper
  const netProfit = grossProfit - logistics - defectReserve - marketing;
  const margin = goodsRevenue > 0 ? (netProfit / goodsRevenue) * 100 : 0;

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
  setText("metric-revenue", formatVND(goodsRevenue));
  setText("metric-order-count", `${orders.length} đơn (không tính đơn hủy) • phí ship thu: ${formatVND(shippingCollected)}`);
  setText("metric-farm-pay", formatVND(farmCost));
  setText("metric-logistics-cost", formatVND(busCost + boxCost + shipperCost));
  setText("metric-logistics-detail", `Xe ${formatVND(busCost)} • Thùng ${formatVND(boxCost)} • Shipper ${formatVND(shipperCost)}`);
  setText("metric-net-profit", formatVND(netProfit));
  setText("metric-margin", `Biên LN ròng: ${margin.toFixed(1)}% (đã trừ dự phòng đổi trả ${formatVND(defectReserve)})`);
  setText("metric-total-kg", `${totalKg.toFixed(1)} kg`);
}

// ================= BẢNG ĐƠN HÀNG =================
const ROLE_NAME = { GiangVien: "Thầy Cô", SinhVien: "Sinh Viên", CanBo: "Cán Bộ", Khac: "Khách Đô Thị" };

window.renderOrdersTable = function () {
  const tbody = document.getElementById("orders-tbody");
  const emptyState = document.getElementById("empty-state");
  const filterStatus = document.getElementById("filter-status")?.value || "ALL";
  const filterRole = document.getElementById("filter-role")?.value || "ALL";
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = allOrders.filter(o =>
    (filterStatus === "ALL" || o.payment_status === filterStatus || (filterStatus === "CANCELLED" && o.order_status === "CANCELLED")) &&
    (filterRole === "ALL" || o.customer_role === filterRole)
  );

  emptyState?.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach(o => {
    const cancelled = o.order_status === "CANCELLED";
    const tr = document.createElement("tr");
    tr.className = `border-b border-slate-100 hover:bg-slate-50 transition-colors ${cancelled ? "opacity-50" : ""}`;

    const itemsHTML = (o.items || [])
      .map(i => `<span class="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] mr-1 mb-1"><strong>${E(i.qty)}x</strong> ${E(i.name)}</span>`)
      .join("");

    const payBadge = cancelled
      ? `<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full">Đã hủy</span>`
      : o.payment_status === "PAID"
        ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-circle-check"></i> Đã nhận tiền</span>`
        : `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-clock"></i> Chưa thu (${E(o.payment_method)})</span>`;

    const deliveryBadge = o.delivery_type === "HOME"
      ? `<span class="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded"><i class="fa-solid fa-truck-fast mr-1"></i>Tận nhà • ${E(detectCluster(o.delivery_address).short)}</span>`
      : `<span class="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded"><i class="fa-solid fa-building-columns mr-1"></i>Tại trường</span>`;

    const id = E(o.id);
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">${E(o.order_code)}</td>
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900">${E(o.customer_name)}</div>
        <div class="text-[11px] text-slate-500"><i class="fa-solid fa-phone text-[9px] mr-1"></i>${E(o.customer_phone)}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap"><span class="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">${E(ROLE_NAME[o.customer_role] || o.customer_role)}</span></td>
      <td class="py-3 px-4 max-w-xs">
        <div class="mb-1">${deliveryBadge}</div>
        <div class="text-[11px] text-slate-600">${E(o.delivery_address)}</div>
        ${o.notes ? `<div class="text-[11px] text-slate-400 italic mt-0.5">Ghi chú: ${E(o.notes)}</div>` : ""}
      </td>
      <td class="py-3 px-4 max-w-xs">${itemsHTML}</td>
      <td class="py-3 px-4 font-black text-emerald-700 whitespace-nowrap">${formatVND(o.total_amount)}</td>
      <td class="py-3 px-4 whitespace-nowrap">${payBadge}</td>
      <td class="py-3 px-4 text-center whitespace-nowrap space-x-1">
        <button data-action="pay" data-id="${id}" title="Đổi trạng thái thanh toán" class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600" ${cancelled ? "disabled" : ""}>
          <i class="fa-solid fa-repeat text-xs"></i>
        </button>
        <button data-action="label" data-id="${id}" title="In tem thùng hàng" class="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700">
          <i class="fa-solid fa-print text-xs"></i>
        </button>
        <button data-action="cancel" data-id="${id}" title="${cancelled ? "Khôi phục đơn" : "Hủy đơn"}" class="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600">
          <i class="fa-solid ${cancelled ? "fa-rotate-left" : "fa-ban"} text-xs"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
};

document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const order = allOrders.find(o => String(o.id) === btn.getAttribute("data-id"));
  if (!order) return;
  const action = btn.getAttribute("data-action");
  try {
    if (action === "pay") {
      const status = order.payment_status === "PAID" ? "UNPAID" : "PAID";
      await window.db.updateOrder(order.id, { payment_status: status });
      order.payment_status = status;
    } else if (action === "cancel") {
      const cancelled = order.order_status === "CANCELLED";
      if (!cancelled && !confirm(`Hủy đơn ${order.order_code}?`)) return;
      const status = cancelled ? "CONFIRMED" : "CANCELLED";
      await window.db.updateOrder(order.id, { order_status: status });
      order.order_status = status;
    } else if (action === "label") {
      printLabels([order]);
      return;
    }
    calculateMetrics();
    renderOrdersTable();
  } catch (err) {
    alert("Không cập nhật được: " + err.message);
  }
});

// ================= GOM TUYẾN GIAO HÀNG THEO CỤM =================
// Bỏ dấu tiếng Việt và chuẩn hóa "Q.7", "Q7", "quận 7" -> "quan 7"
function normalizeAddress(text) {
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\bq\.?\s*(\d{1,2})\b/g, "quan $1")
    .replace(/\s+/g, " ");
}

// Thứ tự cụm & thứ tự quận trong cụm là THỨ TỰ GẦN ĐÚNG tính từ khu vực Bến xe Miền Đông mới (TP. Thủ Đức / Dĩ An).
// Đây không phải lộ trình tối ưu tuyệt đối - cần xem lại trên bản đồ của ứng dụng giao hàng.
const CLUSTERS = [
  { name: "Cụm 1 - Bắc/Đông Bắc (gần bến xe Miền Đông mới)", short: "Cụm 1 Bắc",
    keys: ["di an", "thu duc", "quan 9", "quan 2", "thuan an", "thu dau mot", "binh duong", "quan 12"] },
  { name: "Cụm 2 - Trung tâm", short: "Cụm 2 Trung tâm",
    keys: ["binh thanh", "go vap", "phu nhuan", "tan binh", "quan 1", "quan 3", "quan 10"] },
  { name: "Cụm 3 - Phía Nam", short: "Cụm 3 Nam",
    keys: ["quan 4", "quan 7", "quan 8", "nha be"] },
  { name: "Cụm 4 - Phía Tây", short: "Cụm 4 Tây",
    keys: ["quan 5", "quan 6", "quan 11", "tan phu", "binh tan", "binh chanh", "hoc mon", "cu chi"] }
];

function detectCluster(address) {
  const a = normalizeAddress(address);
  for (let c = 0; c < CLUSTERS.length; c++) {
    for (let k = 0; k < CLUSTERS[c].keys.length; k++) {
      const re = new RegExp("\\b" + CLUSTERS[c].keys[k].replace(/ /g, "\\s") + "\\b");
      if (re.test(a)) return { ...CLUSTERS[c], index: c, keyIndex: k, key: CLUSTERS[c].keys[k] };
    }
  }
  return { name: "Chưa xác định cụm - cần kiểm tra địa chỉ", short: "Cần kiểm tra", index: 99, keyIndex: 0, key: "" };
}

function buildRoutePlan() {
  const maxStops = Number(window.APP_CONFIG.ROUTING?.MAX_STOPS_PER_ROUTE || 8);
  const home = activeOrders().filter(o => o.delivery_type === "HOME");
  const campus = activeOrders().filter(o => o.delivery_type === "CAMPUS");

  const withCluster = home.map(o => ({ o, c: detectCluster(o.delivery_address) }))
    .sort((x, y) => x.c.index - y.c.index || x.c.keyIndex - y.c.keyIndex);

  const groups = {};
  withCluster.forEach(({ o, c }) => { (groups[c.name] = groups[c.name] || []).push(o); });

  const today = new Date().toLocaleDateString("vi-VN");
  let text = `LỘ TRÌNH GIAO HÀNG SÁNG THỨ BẢY - lập ngày ${today}\n`;
  text += `Điểm lấy hàng: văn phòng/bến nhà xe QL13 (TP.HCM)\n`;
  text += `Tổng: ${home.length} điểm giao tận nhà • ${campus.length} đơn nhận tại trường\n`;
  text += `Lưu ý: thứ tự dưới đây là GẦN ĐÚNG theo cụm quận. Hãy kiểm tra lại trên bản đồ và bật tùy chọn tối ưu lộ trình của ứng dụng giao hàng (nếu có).\n`;

  let routeNo = 0;
  Object.entries(groups).forEach(([clusterName, orders]) => {
    for (let i = 0; i < orders.length; i += maxStops) {
      routeNo++;
      const chunk = orders.slice(i, i + maxStops);
      text += `\n==============================\nTUYẾN ${routeNo}: ${clusterName} (${chunk.length} điểm)\n==============================\n`;
      chunk.forEach((o, idx) => {
        const cod = o.payment_status === "PAID" ? "0đ (đã chuyển khoản)" : formatVND(o.total_amount);
        text += `${idx + 1}. [${o.order_code}] ${o.customer_name} - ${o.customer_phone}\n`;
        text += `   Địa chỉ: ${o.delivery_address}\n`;
        text += `   Thu hộ COD: ${cod}\n`;
        if (o.notes) text += `   Ghi chú: ${o.notes}\n`;
      });
    }
  });

  if (campus.length) {
    const byPlace = {};
    campus.forEach(o => { (byPlace[o.delivery_address] = byPlace[o.delivery_address] || []).push(o); });
    text += `\n==============================\nĐƠN NHẬN TẠI TRƯỜNG (giao gộp theo điểm nhận)\n==============================\n`;
    Object.entries(byPlace).forEach(([place, orders]) => {
      text += `• ${place}: ${orders.length} đơn (${orders.map(o => o.order_code).join(", ")})\n`;
    });
  }
  return { text, routes: routeNo, home: home.length };
}

window.exportMultiDropRoute = function () {
  const plan = buildRoutePlan();
  if (plan.home === 0 && !plan.text.includes("NHẬN TẠI TRƯỜNG")) {
    alert("Chưa có đơn nào để lập tuyến.");
    return;
  }
  const area = document.getElementById("route-text");
  const summary = document.getElementById("route-summary");
  if (area) area.value = plan.text;
  if (summary) summary.innerText = `${plan.home} điểm giao tận nhà, chia thành ${plan.routes} tuyến (tối đa ${window.APP_CONFIG.ROUTING?.MAX_STOPS_PER_ROUTE || 8} điểm/tuyến).`;
  document.getElementById("route-modal")?.classList.remove("hidden");
};

window.copyRouteText = async function () {
  const area = document.getElementById("route-text");
  if (!area) return;
  try {
    await navigator.clipboard.writeText(area.value);
    alert("Đã sao chép lộ trình. Bạn có thể dán vào Zalo nhóm hoặc ứng dụng giao hàng.");
  } catch {
    area.select();
    document.execCommand("copy");
  }
};

window.closeRouteModal = function () {
  document.getElementById("route-modal")?.classList.add("hidden");
};

// ================= XUẤT CSV =================
window.exportToCSV = function () {
  if (allOrders.length === 0) return alert("Không có đơn hàng nào để xuất!");
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  let csv = "\uFEFF";
  csv += ["Ma don", "Khach hang", "SDT", "Doi tuong", "Hinh thuc", "Cum giao", "Dia chi", "San pham", "So kg", "Phi ship", "Tong tien", "Thanh toan", "PT thanh toan", "Trang thai don", "Ghi chu", "Ngay dat"].join(",") + "\n";
  allOrders.forEach(o => {
    csv += [
      q(o.order_code), q(o.customer_name), q(o.customer_phone), q(ROLE_NAME[o.customer_role] || o.customer_role),
      q(o.delivery_type === "HOME" ? "Giao tan nha" : "Nhan tai truong"),
      q(o.delivery_type === "HOME" ? detectCluster(o.delivery_address).short : ""),
      q(o.delivery_address), q((o.items || []).map(i => `${i.qty}x ${i.name}`).join("; ")),
      orderKg(o).toFixed(1), Number(o.shipping_fee || 0), Number(o.total_amount || 0),
      q(o.payment_status), q(o.payment_method), q(o.order_status), q(o.notes), q(o.created_at)
    ].join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `AgriConnect_DonHang_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ================= IN TEM THÙNG HÀNG =================
function labelHTML(order, idx) {
  const site = window.getSiteUrl();
  const traceUrl = site ? `${site}/trace.html?code=${encodeURIComponent(order.order_code)}` : "";
  const qr = traceUrl
    ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(traceUrl)}" alt="QR" class="w-full h-full object-contain">`
    : `<span class="text-[9px] text-rose-600 text-center p-1">Chưa có SITE_URL - QR chưa dùng được</span>`;
  const items = (order.items || []).map(i => `• ${E(i.qty)}x ${E(i.name)}`).join("<br>");
  const cod = order.payment_status === "PAID" ? "ĐÃ THANH TOÁN - THU 0đ" : `THU HỘ COD: ${formatVND(order.total_amount)}`;

  return `
    <div class="border-2 border-dashed border-slate-700 p-4 rounded-xl bg-white mb-6 space-y-3" style="break-inside: avoid;">
      <div class="flex items-center justify-between border-b pb-2">
        <div class="text-xs font-bold text-emerald-800">AgriConnect Bình Phước</div>
        <div class="text-right">
          <div class="font-mono text-xs font-bold">${E(order.order_code)}${idx != null ? ` (#${idx + 1})` : ""}</div>
          <div class="text-[10px] font-semibold">${order.delivery_type === "HOME" ? "GIAO TẬN NHÀ • " + E(detectCluster(order.delivery_address).short) : "NHẬN TẠI TRƯỜNG"}</div>
        </div>
      </div>
      <div class="text-xs space-y-1">
        <p><strong>Người nhận:</strong> <span class="text-sm font-bold">${E(order.customer_name)}</span> - ${E(order.customer_phone)}</p>
        <p><strong>Địa chỉ:</strong> ${E(order.delivery_address)}</p>
        <p><strong>Hàng:</strong><br>${items}</p>
        ${order.notes ? `<p class="italic"><strong>Ghi chú:</strong> ${E(order.notes)}</p>` : ""}
      </div>
      <div class="flex items-center justify-between border-t pt-2">
        <div class="w-20 h-20 border rounded flex items-center justify-center p-1">${qr}</div>
        <div class="text-right">
          <div class="text-sm font-black">${cod}</div>
          <div class="text-[9px] text-slate-500">Quét QR để xem thông tin lô hàng</div>
        </div>
      </div>
    </div>`;
}

function printLabels(orders) {
  const printArea = document.getElementById("qr-print-area");
  const container = document.getElementById("qr-labels-container");
  if (!printArea || !container) return;
  if (!window.getSiteUrl()) {
    alert("Lưu ý: chưa có địa chỉ website (SITE_URL trong js/config.js). Tem vẫn in được nhưng mã QR sẽ không hoạt động cho tới khi deploy lên Vercel.");
  }
  container.innerHTML = orders.map((o, i) => labelHTML(o, orders.length > 1 ? i : null)).join("");
  printArea.classList.remove("hidden");
  // Đợi ảnh QR tải xong rồi mới in
  setTimeout(() => window.print(), 800);
}

window.printQRLabels = function () {
  const orders = activeOrders()
    .map(o => ({ o, c: o.delivery_type === "HOME" ? detectCluster(o.delivery_address) : { index: 100, keyIndex: 0 } }))
    .sort((x, y) => x.c.index - y.c.index || x.c.keyIndex - y.c.keyIndex)
    .map(x => x.o);
  if (!orders.length) return alert("Chưa có đơn nào để in tem.");
  printLabels(orders);
};
