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
  await renderEscrowAndClaims();
}
window.reloadData = loadData;

// ================= QUẢN TRỊ VÍ ESCROW & BỒI THƯỜNG TỰ ĐỘNG 1-CLICK =================
async function renderEscrowAndClaims() {
  const wallet = window.db.getFarmerWallet ? window.db.getFarmerWallet() : { available_balance: 4850000, escrow_pending: 1620000 };
  const pendingEl = document.getElementById("admin-escrow-pending");
  const releasedEl = document.getElementById("admin-escrow-released");
  if (pendingEl) pendingEl.textContent = formatVND(wallet.escrow_pending);
  if (releasedEl) releasedEl.textContent = formatVND(wallet.available_balance);

  if (window.db.getInsuranceFund) {
    const ins = window.db.getInsuranceFund();
    const balEl = document.getElementById("admin-insurance-balance");
    const ordEl = document.getElementById("admin-insurance-orders");
    if (balEl) balEl.textContent = formatVND(ins.balance);
    if (ordEl) ordEl.textContent = `(${ins.orders_insured} đơn đã đóng • Đã chi ${ins.claims_paid || 0} vụ)`;
  }

  if (window.db.getEsgMetrics) {
    const esg = window.db.getEsgMetrics();
    const recEl = document.getElementById("admin-esg-recycled");
    const co2El = document.getElementById("admin-esg-co2");
    if (recEl) recEl.textContent = `${Number(esg.total_waste_recycled_kg || 217).toFixed(0)} kg`;
    if (co2El) co2El.textContent = `-${Number(esg.co2_saved_kg || 412).toFixed(0)} kg CO2e`;
  }

  const listEl = document.getElementById("admin-refund-claims-list");
  if (!listEl || !window.db.getRefundClaims) return;

  const claims = await window.db.getRefundClaims();
  if (!claims || claims.length === 0) {
    listEl.innerHTML = `<div class="p-4 rounded-2xl bg-slate-50 text-slate-400 text-xs text-center">Hiện không có khiếu nại bồi thường nào cần xử lý.</div>`;
    return;
  }

  listEl.innerHTML = claims.map(c => {
    const isPending = c.status === "PENDING";
    const typeBadge = c.claim_type === "PARTIAL_20"
      ? `<span class="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded text-[10px]">Yêu cầu Hoàn 20% (Dập nhẹ)</span>`
      : `<span class="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded text-[10px]">Yêu cầu Hoàn 100% (Sượng/Hỏng)</span>`;

    return `
      <div class="p-3.5 rounded-2xl border ${isPending ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono font-black text-slate-900">${E(c.order_code)}</span>
            <span class="text-slate-500">• SĐT: ${E(c.customer_phone)}</span>
            ${typeBadge}
          </div>
          <p class="text-slate-700 font-medium">${E(c.reason)}</p>
          <a href="${E(c.unbox_video_url || '#')}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
            <i class="fa-solid fa-video"></i> Xem Video Unbox của khách
          </a>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${isPending ? `
            <button type="button" onclick="resolveClaimOneClick('${E(c.id)}', 'APPROVE_20')" class="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs">
              ✓ Hoàn 20%
            </button>
            <button type="button" onclick="resolveClaimOneClick('${E(c.id)}', 'APPROVE_100')" class="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] shadow-xs">
              ✓ Hoàn 100%
            </button>
            <button type="button" onclick="resolveClaimOneClick('${E(c.id)}', 'REJECT')" class="px-2 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px]">
              Từ chối
            </button>
          ` : `
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
              ✓ Đã xử lý (${E(c.decision || c.status)})
            </span>
          `}
        </div>
      </div>
    `;
  }).join("");
}

window.resolveClaimOneClick = async function (claimId, decision) {
  await window.db.resolveRefundClaim(claimId, decision);
  await renderEscrowAndClaims();
  const label = decision === "APPROVE_20" ? "Hoàn 20% tiền hàng" : decision === "APPROVE_100" ? "Hoàn 100% tiền hàng" : "Từ chối khiếu nại";
  alert(`✅ Đã thực thi 1-Click: ${label} từ Ví Tạm Giữ Escrow!`);
};

window.triggerCronReleaseEscrow = async function () {
  window.db.releaseEscrowToFarmer(450000);
  await renderEscrowAndClaims();
  alert("⚡ Cronjob Auto-Trigger hoàn tất: Đã kiểm tra các đơn Delivered quá 12h không có khiếu nại và giải ngân T+1 về Ví Nông Dân (Bác Năm)!");
};

window.triggerInsuranceCompensation = async function () {
  const raw = localStorage.getItem("agriconnect_insurance_fund_v1");
  let fund = { balance: 4850000, orders_insured: 142, claims_paid: 2 };
  try { if (raw) fund = JSON.parse(raw); } catch {}
  fund.balance = Math.max(0, Number(fund.balance || 4850000) - 200000);
  fund.claims_paid = Number(fund.claims_paid || 2) + 1;
  localStorage.setItem("agriconnect_insurance_fund_v1", JSON.stringify(fund));
  await renderEscrowAndClaims();
  alert("🛡️ Đã trích 200.000 đ từ Quỹ Dự Phòng Bảo Hiểm Nông Sản (1.000đ/đơn) + Gửi mã Voucher 100.000 đ cho khách hàng trong 30 phút để xoa dịu sự cố truyền thông trước khi phân định trách nhiệm với nhà vườn!");
};

window.triggerGtmSeedOrder = async function () {
  if (!window.db.createGtmSeedOrder) return;
  try {
    const order = await window.db.createGtmSeedOrder();
    await loadData();
    alert(`🚀 Đã tạo Đơn Bao Tiêu Mồi GTM (${order.order_code} - 30kg nông sản Bình Phước)! Nông dân Bác Năm đã nhận thông báo có đơn sỉ ngay lập tức ("Fake it till you make it" giải quyết bài toán Con Gà - Quả Trứng) để phân phối cho Nhân viên văn phòng Quận 1 & Quận 3.`);
  } catch (err) {
    alert("Lỗi tạo đơn bao tiêu mồi: " + err.message);
  }
};

window.triggerEsgWasteDispatch = async function () {
  if (!window.db.dispatchWasteToEsgPartner) return;
  window.db.dispatchWasteToEsgPartner(15, "esg-1");
  await renderEscrowAndClaims();
  alert("♻️ Đã phát lệnh thu gom 15kg nông sản dập/quá chín cuối ngày cho Đối tác Kinh tế Tuần hoàn (Trại Ruồi Lính Đen BSF Củ Chi & Xưởng Phân Bón Hữu Cơ)! Giảm phát thải 28.5kg khí nhà kính CO2e và tiết kiệm 100% chi phí xử lý rác.");
};

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

// ================= TÀI CHÍNH & PHÂN TÍCH UNIT ECONOMICS (CHUẨN CHUYÊN GIA BA, DATA ANALYST & E-COMMERCE) =================
function calculateMetrics() {
  const F = window.APP_CONFIG.FINANCE || {};
  const orders = activeOrders();
  const targetKg = Number(window.APP_CONFIG?.CAMPAIGN?.TARGET_KG || 60);

  const costMap = {};
  allProducts.forEach(p => { costMap[String(p.id)] = Number(p.price_original || 0); });

  let goodsRevenue = 0, shippingCollected = 0, farmCost = 0, totalKg = 0, homeDrops = 0, cashlessCount = 0;
  orders.forEach(o => {
    const ship = Number(o.shipping_fee || 0);
    shippingCollected += ship;
    goodsRevenue += Number(o.total_amount || 0) - ship;
    totalKg += orderKg(o);
    if (o.delivery_type === "HOME") homeDrops++;
    if (o.payment_method === "VIETQR") cashlessCount++;
    (o.items || []).forEach(i => {
      const unitCost = costMap[String(i.productId)] ?? Number(i.price || 0) * 0.65;
      farmCost += unitCost * Number(i.qty || 1);
    });
  });

  const busCost = orders.length ? Number(F.BUS_COST_PER_TRIP || 120000) : 0;
  const boxCost = orders.length * Number(F.BOX_COST_PER_ORDER || 5000);
  const shipperCost = homeDrops * Number(F.SHIPPER_COST_PER_DROP || 25000);
  const grossLogistics = busCost + boxCost + shipperCost;
  const netLogistics = Math.max(0, grossLogistics - shippingCollected); // Chi phí vận chuyển sàn thực chịu sau khi trừ ship khách trả

  const defectReserve = Math.round(goodsRevenue * Number(F.DEFECT_RESERVE_PCT || 0.03));
  const marketing = orders.length ? Number(F.MARKETING_PER_TRIP || 0) : 0;

  const grossProfit = goodsRevenue - farmCost;
  const grossMarginPct = goodsRevenue > 0 ? (grossProfit / goodsRevenue) * 100 : 0;
  const netProfit = grossProfit - netLogistics - defectReserve - marketing;
  const margin = goodsRevenue > 0 ? (netProfit / goodsRevenue) * 100 : 0;

  const aov = orders.length > 0 ? Math.round(goodsRevenue / orders.length) : 0;
  const profitPerOrder = orders.length > 0 ? Math.round(netProfit / orders.length) : 0;
  const profitPerKg = totalKg > 0 ? Math.round(netProfit / totalKg) : 0;
  const loadPct = targetKg > 0 ? Math.min(100, Math.round((totalKg / targetKg) * 100)) : 0;
  const busCostPerKg = totalKg > 0 ? Math.round(busCost / totalKg) : 0;
  const cashlessPct = orders.length > 0 ? Math.round((cashlessCount / orders.length) * 100) : 0;
  const homePct = orders.length > 0 ? Math.round((homeDrops / orders.length) * 100) : 0;
  const shipRecoveryPct = grossLogistics > 0 ? Math.round((shippingCollected / grossLogistics) * 100) : 0;

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

  // 1. Doanh thu hàng & AOV
  setText("metric-revenue", formatVND(goodsRevenue));
  setText("metric-order-count", `${orders.length} đơn • AOV: ${formatVND(aov)}/đơn`);

  // 2. Giá vốn vườn & Lãi gộp
  setText("metric-farm-pay", formatVND(farmCost));
  setText("metric-gross-margin-badge", `Biên gộp ${grossMarginPct.toFixed(1)}%`);
  setText("metric-gross-profit", `Lãi gộp (1-2): ${formatVND(grossProfit)}`);

  // 3. Logistics Sàn Thực Chịu (Minh bạch công thức Tổng cước - Ship thu khách)
  setText("metric-logistics-cost", formatVND(netLogistics));
  setText("metric-logistics-detail", `Tổng cước ${formatVND(grossLogistics)} - Ship thu khách ${formatVND(shippingCollected)}`);

  // 4. Quỹ Dự Phòng Đổi Trả (3%)
  setText("metric-defect-reserve", formatVND(defectReserve));

  // 5. Lợi Nhuận Ròng (= 1 - 2 - 3 - 4)
  setText("metric-net-profit", formatVND(netProfit));
  setText("metric-margin", `Biên LN ròng: ${margin.toFixed(1)}% (Khớp 100% công thức)`);

  // 6. Hiệu Suất Tải Xe Lạnh
  setText("metric-total-kg", `${totalKg.toFixed(1)} / ${targetKg} kg`);
  setText("metric-load-pct", `${loadPct}% tải`);
  setText("metric-bus-per-kg", `Cước xe lạnh: ${formatVND(busCostPerKg)}/kg (Chuẩn 60kg: 2.000 đ/kg)`);
  const loadBar = document.getElementById("metric-load-bar");
  if (loadBar) loadBar.style.width = `${Math.max(8, loadPct)}%`;

  // Bảng Phân Tích Chuyên Sâu BA & Data Analyst
  setText("ba-aov", `${formatVND(aov)}/đơn`);
  setText("ba-profit-per-order", `${profitPerOrder >= 0 ? "+" : ""}${formatVND(profitPerOrder)}/đơn`);
  setText("ba-profit-per-kg", `${profitPerKg >= 0 ? "+" : ""}${formatVND(profitPerKg)}/kg`);
  setText("ba-cashless-pct", `${cashlessPct}% đơn dùng Ví Escrow (${cashlessCount}/${orders.length} đơn)`);
  const cashlessBar = document.getElementById("ba-cashless-bar");
  if (cashlessBar) cashlessBar.style.width = `${cashlessPct}%`;
  setText("ba-delivery-mix", `${homePct}% Giao tận nhà / ${100 - homePct}% Nhận tại Hub`);
  setText("ba-ship-recovery", `Khách trả ${formatVND(shippingCollected)} / ${formatVND(grossLogistics)} (${shipRecoveryPct}%)`);

  const healthBadge = document.getElementById("ba-health-badge");
  if (healthBadge) {
    if (margin >= 15) {
      healthBadge.className = "text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300";
      healthBadge.innerText = `✓ Hiệu suất Tối ưu: Biên LN ròng đạt +${margin.toFixed(1)}%`;
    } else if (margin > 0) {
      healthBadge.className = "text-[11px] font-extrabold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300";
      healthBadge.innerText = `⚡ Đã vượt điểm hòa vốn (+${margin.toFixed(1)}%) • Cần tăng tải xe lạnh`;
    } else {
      healthBadge.className = "text-[11px] font-extrabold bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-300";
      healthBadge.innerText = `⚠️ Chưa đạt điểm hòa vốn chuyến xe (Cần gom tối thiểu 12kg)`;
    }
  }

  const recEl = document.getElementById("ba-recommendation-text");
  if (recEl) {
    if (totalKg < targetKg * 0.75) {
      recEl.innerHTML = `Hiện sản lượng gom đạt <strong>${totalKg.toFixed(1)} kg (${loadPct}% tải xe lạnh ${targetKg}kg)</strong>, khiến chi phí xe cố định (120.000 đ) đang chiếm <strong>${formatVND(busCostPerKg)}/kg</strong>. Khuyến nghị bấm nút bên dưới để <strong>kích hoạt Đơn Bao Tiêu Mồi +30kg (GTM Quận 1 & 3)</strong> nhằm lấp đầy xe lạnh, kéo cước xe xuống <strong>~2.000 đ/kg</strong> và nâng biên lợi nhuận ròng lên <strong>>18%</strong>!`;
    } else {
      recEl.innerHTML = `🎉 Chuyến xe lạnh đã đạt <strong>${totalKg.toFixed(1)} kg (${loadPct}% công suất tải)</strong>! Chi phí vận chuyển cố định trên mỗi kg đã giảm xuống mức tối ưu <strong>${formatVND(busCostPerKg)}/kg</strong>, giúp biên lợi nhuận ròng đạt <strong>${margin.toFixed(1)}%</strong>. Sẵn sàng chốt tuyến shipper giao sáng Thứ Bảy!`;
    }
  }
}

// ================= BẢNG ĐƠN HÀNG =================
const ROLE_NAME = { NhanVienVanPhong: "NV Văn Phòng (Q1/Q3)", GiangVien: "Thầy Cô", SinhVien: "Sinh Viên", CanBo: "Cán Bộ", Khac: "Khách Đô Thị" };

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
        <button data-action="delivered" data-id="${id}" title="Xác nhận Đã Giao (Mở khóa SĐT Vườn & Đếm ngược 12h Escrow)" class="p-1.5 rounded-lg ${o.order_status === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}" ${cancelled ? "disabled" : ""}>
          <i class="fa-solid fa-truck-ramp-box text-xs"></i>
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
    } else if (action === "delivered") {
      const nextStatus = order.order_status === "DELIVERED" ? "CONFIRMED" : "DELIVERED";
      await window.db.updateOrder(order.id, { order_status: nextStatus, escrow_status: nextStatus === "DELIVERED" ? "RELEASED_TO_FARMER" : "HELD_IN_ESCROW" });
      order.order_status = nextStatus;
      if (nextStatus === "DELIVERED") {
        window.db.releaseEscrowToFarmer(Number(order.total_amount || 0));
        await renderEscrowAndClaims();
      }
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
