/**
 * LOGIC QUẢN TRỊ ADMIN & BÁO CÁO TÀI CHÍNH / LOGISTICS
 * DỰ ÁN AGRICONNECT BÌNH PHƯỚC
 */

let allOrders = [];
let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
});

async function loadData() {
  allProducts = await window.db.getProducts();
  allOrders = await window.db.getOrders();
  calculateMetrics();
  renderOrdersTable();
}

// ================= TÍNH TOÁN CÁC CHỈ SỐ TÀI CHÍNH & UNIT ECONOMICS =================
function calculateMetrics() {
  let totalRevenue = 0;
  let totalFarmCost = 0; // Tiền trả cho nhà vườn theo giá vốn
  let totalKg = 0;
  let homeDeliveryCount = 0;

  // Bản đồ giá vốn theo id sản phẩm
  const costMap = {};
  allProducts.forEach(p => {
    costMap[p.id] = p.price_original || 0;
  });

  allOrders.forEach(order => {
    totalRevenue += Number(order.total_amount || 0);
    if (order.delivery_type === "HOME") {
      homeDeliveryCount++;
    }

    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        const qty = Number(item.qty || 1);
        totalKg += (item.unit === "combo" ? qty * 2.5 : qty);
        const originalPrice = costMap[item.productId] || (item.price * 0.6); // Mặc định giá vốn ~60%
        totalFarmCost += originalPrice * qty;
      });
    }
  });

  // Chi phí logistics theo Phương án 2 (Kế hoạch phát triển):
  const busCost = 120000;                      // Cước xe khách QL13 trọn chuyến
  const packagingCostPerBox = 5000;            // Thùng carton + tem QR per đơn
  const totalPackagingCost = allOrders.length * packagingCostPerBox;
  const multiDropShipperFee = homeDeliveryCount * 20000; // Tiền trả tài xế giao đa điểm

  const totalCost = totalFarmCost + busCost + totalPackagingCost + multiDropShipperFee;
  const netProfit = Math.max(0, totalRevenue - totalCost);
  const marginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Cập nhật lên Dashboard
  const revEl = document.getElementById("metric-revenue");
  if (revEl) revEl.innerText = Number(totalRevenue).toLocaleString("vi-VN") + " đ";

  const orderCountEl = document.getElementById("metric-order-count");
  if (orderCountEl) orderCountEl.innerText = `${allOrders.length} đơn đặt trước`;

  const farmEl = document.getElementById("metric-farm-pay");
  if (farmEl) farmEl.innerText = Number(totalFarmCost).toLocaleString("vi-VN") + " đ";

  const profitEl = document.getElementById("metric-net-profit");
  if (profitEl) profitEl.innerText = Number(netProfit).toLocaleString("vi-VN") + " đ";

  const marginEl = document.getElementById("metric-margin");
  if (marginEl) marginEl.innerText = `Biên lợi nhuận: ${marginPct}%`;

  const kgEl = document.getElementById("metric-total-kg");
  if (kgEl) kgEl.innerText = `${totalKg.toFixed(1)} kg`;

  const logisticsEl = document.getElementById("metric-logistics-cost");
  if (logisticsEl) logisticsEl.innerText = Number(busCost + totalPackagingCost + multiDropShipperFee).toLocaleString("vi-VN") + " đ";
}

// ================= RENDER BẢNG ĐƠN HÀNG =================
window.renderOrdersTable = function () {
  const tbody = document.getElementById("orders-tbody");
  const emptyState = document.getElementById("empty-state");
  const filterStatus = document.getElementById("filter-status")?.value || "ALL";
  const filterRole = document.getElementById("filter-role")?.value || "ALL";

  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = allOrders.filter(o => {
    const matchStatus = filterStatus === "ALL" || o.payment_status === filterStatus;
    const matchRole = filterRole === "ALL" || o.customer_role === filterRole;
    return matchStatus && matchRole;
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  } else {
    if (emptyState) emptyState.classList.add("hidden");
  }

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-100";

    const itemsText = (o.items || [])
      .map(i => `<span class="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] mr-1 mb-1 font-medium"><strong>${i.qty}x</strong> ${i.name}</span>`)
      .join("");

    const isPaid = o.payment_status === "PAID";
    const statusBadge = isPaid
      ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-circle-check text-[9px]"></i> Đã CK VietQR</span>`
      : `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i> Chưa Trả / COD</span>`;

    const deliveryBadge = o.delivery_type === "HOME"
      ? `<span class="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded"><i class="fa-solid fa-truck-fast mr-1"></i>Tận Nhà</span>`
      : `<span class="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded"><i class="fa-solid fa-building-columns mr-1"></i>Tại Trường</span>`;

    const roleName = {
      GiangVien: "Thầy Cô",
      SinhVien: "Sinh Viên",
      CanBo: "Cán Bộ",
      Khac: "Khách Đô Thị"
    }[o.customer_role] || o.customer_role;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">${o.order_code}</td>
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900">${o.customer_name}</div>
        <div class="text-[11px] text-slate-500"><i class="fa-solid fa-phone text-[9px] mr-1"></i>${o.customer_phone}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <span class="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">${roleName}</span>
      </td>
      <td class="py-3 px-4 max-w-xs">
        <div class="mb-1">${deliveryBadge}</div>
        <div class="text-[11px] text-slate-600 line-clamp-2" title="${o.delivery_address}">${o.delivery_address}</div>
      </td>
      <td class="py-3 px-4 max-w-xs">${itemsText}</td>
      <td class="py-3 px-4 font-black text-emerald-700 whitespace-nowrap">${Number(o.total_amount).toLocaleString("vi-VN")} đ</td>
      <td class="py-3 px-4 whitespace-nowrap">${statusBadge}</td>
      <td class="py-3 px-4 text-center whitespace-nowrap space-x-1">
        <button onclick="togglePaymentStatus('${o.id}')" title="Đổi trạng thái thanh toán" class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors">
          <i class="fa-solid fa-repeat text-xs"></i>
        </button>
        <button onclick="printSingleLabel('${o.id}')" title="In nhãn kiện hàng" class="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-colors">
          <i class="fa-solid fa-print text-xs"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// ================= ĐỔI TRẠNG THÁI THANH TOÁN =================
window.togglePaymentStatus = async function (orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const newStatus = order.payment_status === "PAID" ? "UNPAID" : "PAID";
  await window.db.updateOrderStatus(orderId, { payment_status: newStatus });
  order.payment_status = newStatus;
  calculateMetrics();
  renderOrdersTable();
};

// ================= XUẤT LỘ TRÌNH GIAO HÀNG ĐA ĐIỂM (CHO AHAMOVE / LALAMOVE) =================
window.exportMultiDropRoute = function () {
  const homeOrders = allOrders.filter(o => o.delivery_type === "HOME");
  if (homeOrders.length === 0) {
    alert("Hiện chưa có đơn nào chọn hình thức Giao tận nhà!");
    return;
  }

  let text = `📦 LỘ TRÌNH GIAO HÀNG ĐA ĐIỂM (AHAMOVE / LALAMOVE) - CHUYẾN SÁNG THỨ BẢY\n`;
  text += `Tổng số điểm giao: ${homeOrders.length} điểm\n`;
  text += `Điểm xuất phát: Bến xe / Văn phòng Nhà xe QL13 (TP.HCM)\n`;
  text += `--------------------------------------------------------\n`;

  homeOrders.forEach((o, idx) => {
    const codAmount = o.payment_status === "PAID" ? "0 đ (Đã thanh toán)" : `${Number(o.total_amount).toLocaleString("vi-VN")} đ`;
    text += `Điểm ${idx + 1}: [${o.order_code}] ${o.customer_name} - SĐT: ${o.customer_phone}\n`;
    text += `  Địa chỉ: ${o.delivery_address}\n`;
    text += `  Tiền thu hộ COD: ${codAmount}\n`;
    text += `  Ghi chú: ${o.notes || "Không có"}\n\n`;
  });

  // Hiển thị modal hoặc copy vào clipboard
  navigator.clipboard.writeText(text).then(() => {
    alert("Đã sao chép toàn bộ danh sách lộ trình giao hàng đa điểm vào bộ nhớ tạm (Clipboard)! Bạn có thể dán vào nhóm Zalo hoặc ứng dụng đặt xe.");
  }).catch(() => {
    prompt("Sao chép nội dung lộ trình bên dưới:", text);
  });
};

// ================= XUẤT BÁO CÁO FILE CSV (EXCEL) =================
window.exportToCSV = function () {
  if (allOrders.length === 0) {
    alert("Không có đơn hàng nào để xuất!");
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM để Excel không lỗi font tiếng Việt
  csvContent += "Ma Don,Khach Hang,So Dien Thoai,Doi Tuong,Hinh Thuc,Dia Chi Nhan,San Pham,Tong Tien (VND),Trang Thai Thanh Toan,Ghi Chu,Ngay Dat\n";

  allOrders.forEach(o => {
    const itemsStr = (o.items || []).map(i => `${i.qty}x ${i.name}`).join("; ");
    const row = [
      `"${o.order_code}"`,
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      `"${o.customer_role}"`,
      `"${o.delivery_type === 'HOME' ? 'Giao Tan Nha' : 'Nhan Tai Truong'}"`,
      `"${o.delivery_address}"`,
      `"${itemsStr}"`,
      o.total_amount,
      `"${o.payment_status}"`,
      `"${o.notes || ''}"`,
      `"${o.created_at || ''}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `AgriConnect_DanhSach_DonHang_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ================= IN PHIẾU GIAO HÀNG TỪNG ĐƠN =================
window.printSingleLabel = function (orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const printArea = document.getElementById("qr-print-area");
  const container = document.getElementById("qr-labels-container");
  if (!printArea || !container) return;

  container.innerHTML = "";
  printArea.classList.remove("hidden");

  const itemsList = (order.items || []).map(i => `• ${i.qty}x ${i.name}`).join("<br>");
  const codText = order.payment_status === "PAID" ? "ĐÃ THANH TOÁN (0 đ)" : `THU HỘ COD: ${Number(order.total_amount).toLocaleString("vi-VN")} đ`;

  const label = document.createElement("div");
  label.className = "border-2 border-slate-800 p-6 rounded-2xl bg-white max-w-md mx-auto my-4 space-y-4 shadow-sm";
  label.innerHTML = `
    <div class="flex items-center justify-between border-b pb-3">
      <div>
        <h2 class="text-base font-extrabold text-emerald-800 uppercase tracking-tight">AgriConnect Bình Phước</h2>
        <p class="text-[10px] text-slate-500">Mô hình xe khách QL13 & Shipper đa điểm</p>
      </div>
      <div class="text-right">
        <span class="font-mono font-bold text-sm text-slate-900">${order.order_code}</span>
        <p class="text-[10px] font-semibold text-emerald-700">${order.delivery_type === 'HOME' ? 'GIAO TẬN CỬA' : 'NHẬN TẠI TRƯỜNG'}</p>
      </div>
    </div>

    <div class="space-y-1.5 text-xs text-slate-800">
      <p><strong>Người nhận:</strong> <span class="text-sm font-bold">${order.customer_name}</span> - <strong>SĐT:</strong> ${order.customer_phone}</p>
      <p><strong>Địa chỉ:</strong> ${order.delivery_address}</p>
      <p><strong>Nông sản:</strong><br>${itemsList}</p>
      ${order.notes ? `<p class="italic text-slate-500"><strong>Ghi chú:</strong> ${order.notes}</p>` : ''}
    </div>

    <div class="border-t pt-3 flex items-center justify-between">
      <div class="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 border">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/trace.html?code=' + order.order_code)}" class="w-full h-full object-contain">
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold text-slate-500">Tiền thu khi giao:</p>
        <p class="text-base font-black text-emerald-800">${codText}</p>
        <p class="text-[9px] text-slate-400 mt-1">Quét QR tra cứu nguồn gốc vườn</p>
      </div>
    </div>
  `;

  container.appendChild(label);
  window.print();
};

// ================= IN TOÀN BỘ TEM NHÃN DÁN THÙNG CHUYẾN HÀNG =================
window.printQRLabels = function () {
  const printArea = document.getElementById("qr-print-area");
  const container = document.getElementById("qr-labels-container");
  if (!printArea || !container) return;

  container.innerHTML = "";
  printArea.classList.remove("hidden");

  // In toàn bộ nhãn của danh sách đơn hiện tại
  allOrders.forEach((order, idx) => {
    const itemsList = (order.items || []).map(i => `• ${i.qty}x ${i.name}`).join("<br>");
    const codText = order.payment_status === "PAID" ? "ĐÃ THANH TOÁN (0 đ)" : `THU HỘ COD: ${Number(order.total_amount).toLocaleString("vi-VN")} đ`;

    const label = document.createElement("div");
    label.className = "border-2 border-dashed border-slate-700 p-4 rounded-xl bg-white mb-6 space-y-3 break-inside-avoid";
    label.innerHTML = `
      <div class="flex items-center justify-between border-b pb-2">
        <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
          <i class="fa-solid fa-seedling"></i> AgriConnect Bình Phước
        </div>
        <span class="font-mono text-xs font-bold">${order.order_code} (#${idx + 1})</span>
      </div>

      <div class="text-xs space-y-1">
        <p><strong>Khách hàng:</strong> <span class="font-bold">${order.customer_name}</span> (${order.customer_phone})</p>
        <p><strong>Nơi nhận:</strong> ${order.delivery_address}</p>
        <p><strong>Hàng:</strong> ${itemsList}</p>
      </div>

      <div class="flex items-center justify-between border-t pt-2">
        <div class="w-16 h-16 bg-slate-50 p-1 border rounded">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/trace.html?code=' + order.order_code)}" class="w-full h-full object-contain">
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-emerald-700">${codText}</span>
          <p class="text-[8px] text-slate-400">Kiện hàng xe khách QL13</p>
        </div>
      </div>
    `;
    container.appendChild(label);
  });

  window.print();
};
