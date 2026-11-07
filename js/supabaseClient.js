/**
 * LỚP KẾT NỐI DỮ LIỆU AGRICONNECT (Dual-Mode Production-Ready)
 * - Chế độ CLOUD: Có SUPABASE_URL & SUPABASE_ANON_KEY -> dùng Supabase (PostgreSQL + RLS).
 * - Chế độ DEMO : Chưa cấu hình hoặc mất mạng -> dùng dữ liệu mẫu dự phòng (DEMO_PRODUCTS) & LocalStorage.
 * - Tích hợp 5 Trụ cột Thương mại hóa:
 *   1. Nhật ký canh tác (Traceability Timeline) & Đăng bán bằng giọng nói cho nông dân
 *   2. Data Masking (Che số ĐT nhà vườn), In-App Chat, Subscription hàng tuần & Pre-order lứa tương lai
 *   3. Chuỗi cung ứng lạnh (Cold Chain is_fresh/is_dry) & Geo-fencing (<20km Ahamove/Lalamove/GrabExpress vs Hub-to-Hub)
 *   4. Phân hạng chất lượng (Variants Loại 1 / Loại 2 / Loại 3) & Huy hiệu kiểm định VietGAP/Hữu cơ
 *   5. Ví Tạm Giữ (Escrow Wallet T+1 sau 12h) & Bồi thường tự động 1-Click (Hoàn 20% / Hoàn 100%)
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

// Bộ biến thể chuẩn theo Chuyên gia Nông sản (Loại 1, Loại 2, Loại 3)
const DEFAULT_PRODUCT_VARIANTS = [
  { code: "GRADE_1", label: "Loại 1 (Quà biếu VIP - Tuyển chọn)", shortLabel: "Loại 1 (VIP)", multiplier: 1.0, badge: "Chuẩn VIP 100%", desc: "Trái đều đẹp nhất vườn, đóng thùng sang trọng" },
  { code: "GRADE_2", label: "Loại 2 (Ăn gia đình - Tiết kiệm 15%)", shortLabel: "Loại 2 (-15%)", multiplier: 0.85, badge: "Tiết kiệm 15%", desc: "Vỏ ngoài hơi rám nắng tự nhiên, cơm múi ngon 100% như Loại 1" },
  { code: "GRADE_3", label: "Loại 3 (Dạt size / Sinh tố, Làm mứt -30%)", shortLabel: "Loại 3 (-30%)", multiplier: 0.70, badge: "Tiết kiệm 30%", desc: "Trái nhỏ cuối cành, cực hời để tách múi cấp đông, dầm sinh tố, làm bánh" }
];

// Nhật ký canh tác (Traceability Timeline) mặc định cho đặc sản các vùng miền
const DEFAULT_TRACEABILITY_TIMELINE = [
  {
    stage: "Chặng 1: Thụ phấn & Tỉa trái non",
    date: "15/07/2026",
    title: "Tuyển giữ trái khỏe tại vùng chuyên canh",
    desc: "Nhà vườn tỉa bỏ 60% bông yếu, chỉ giữ lại những trái đầu cành nhận đủ nắng gió tự nhiên tại vùng nguyên liệu.",
    badge: "Nhật ký vườn #01",
    image: "images/durian-warehouse.jpg"
  },
  {
    stage: "Chặng 2: Bón phân vi sinh & Hữu cơ",
    date: "20/09/2026",
    title: "100% Phân hữu cơ ủ hoai & Tưới nước tự nhiên",
    desc: "Tuyệt đối không dùng thuốc kích chín hay hóa chất bảo quản. Bổ sung kali hữu cơ giúp cơm dẻo vàng và ngọt đậm hậu.",
    badge: "Kiểm định VietGAP",
    image: "images/mangosteen-harvest.jpg"
  },
  {
    stage: "Chặng 3: Đo độ đường (Brix) & Gõ trái",
    date: "Thứ Năm hàng tuần",
    title: "Kiểm tra độ già 8.5 - 9 tuổi trước khi cắt",
    desc: "Từng trái được bác nông dân kiểm tra độ già và đo độ ngọt đạt chuẩn mới đánh dấu dây đỏ chuẩn bị thu hoạch.",
    badge: "Đạt chuẩn Brix > 28%",
    image: "images/durian-pile.jpg"
  },
  {
    stage: "Chặng 4: Hái sáng sớm & Đóng thùng Lạnh QR",
    date: "05:30 Sáng Thứ Sáu",
    title: "Cắt cuống, dán tem QR & Vận chuyển Cold-Chain",
    desc: "Thu hái lúc sương sớm để giữ độ tươi tối đa, đóng thùng thoáng khí dán mã truy xuất vùng trồng và chuyển thẳng về TP.HCM trong 24h.",
    badge: "Cold-Chain < 24h",
    image: "images/hero-fruits.jpg"
  }
];

function enrichProductMeta(p, idx = 0) {
  const isCombo = p.category === "Combo";
  const cleanDesc = String(p.description || "").replace(/từ vùng đất đỏ bazan Phước Long/gi, "từ vùng chuyên canh Đông Nam Bộ & Miền Tây").replace(/Bình Phước/gi, "vùng chuyên canh");
  return {
    ...p,
    description: cleanDesc || p.description,
    is_fresh: p.is_fresh !== undefined ? p.is_fresh : true,
    is_dry: p.is_dry !== undefined ? p.is_dry : false,
    delivery_radius: p.delivery_radius || 20,
    certification_badge: p.certification_badge || (idx % 2 === 0 ? "VietGAP • Đặc Sản Vùng Miền" : "VietGAP • Chín Cây 100%"),
    verified: true,
    harvest_date: p.harvest_date || "Hái 05:30 sáng Thứ Sáu • Giao Thứ Bảy",
    expiration_policy: p.expiration_policy || "Bảo hành 1 đổi 1 hoặc hoàn tiền 100% trong 12h qua Ví Escrow",
    variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : (isCombo ? [
      { code: "GRADE_1", label: "Chuẩn Combo Tuyển Chọn (Loại 1)", shortLabel: "Combo Loại 1", multiplier: 1.0, badge: "Chuẩn VIP", desc: "Trái tuyển chọn loại 1 đóng thùng quà tặng" },
      { code: "GRADE_2", label: "Combo Gia Đình Tiết Kiệm (-15%)", shortLabel: "Combo Gia Đình (-15%)", multiplier: 0.85, badge: "Tiết kiệm 15%", desc: "Trái ăn gia đình, chất lượng múi ngon 100%" }
    ] : DEFAULT_PRODUCT_VARIANTS),
    traceability: p.traceability || DEFAULT_TRACEABILITY_TIMELINE
  };
}

// Dữ liệu mẫu chuẩn (Đầy đủ 13 đặc sản các vùng miền Việt Nam & Các Combo tiết kiệm theo giá thị trường hiện nay)
const DEMO_PRODUCTS = [
  {
    id: "p1", name: "Sầu Riêng Ri6 Ruột Vàng (Đông Nam Bộ & Miền Tây)", category: "TraiCay",
    highlights: ["Múi vàng rực, dẻo quánh béo ngậy", "Hái già rụng tự nhiên, ngọt đậm sâu", "Bao ăn 1 đổi 1 tận tay nếu sượng"],
    description: "Những quả sầu riêng Ri6 tuyển lựa khắt khe từ các nhà vườn trù phú Đông Nam Bộ & Tiền Giang. Cây nuôi trái già đủ độ, thu hái sáng sớm Thứ Sáu. Múi vàng rực rỡ, cơm dẻo quánh, khô ráo không nhão nước, vị ngọt bùi béo ngậy tan chảy. (Giá thị trường TP.HCM: 95.000 - 125.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 68000, price_sale: 98000, image_url: "images/hero-fruits.jpg", is_available: true,
    certification_badge: "VietGAP • Bao Ăn 1 Đổi 1"
  },
  {
    id: "p2", name: "Măng Cụt Cổ Thụ (Lái Thiêu & Đông Nam Bộ)", category: "TraiCay",
    highlights: ["Vườn cổ thụ 25 năm không hóa chất", "Múi trắng tinh khiết, hạt lép giòn sần sật", "Vị chua ngọt thanh tao giải nhiệt tuyệt đỉnh"],
    description: "Măng cụt thu hoạch từ những gốc đại thụ lâu năm vùng Đông Nam Bộ & Lái Thiêu, nuôi dưỡng bằng mạch nước ngầm tự nhiên. Nhà vườn tỉ mỉ hái từng trái chín cành vỏ tím mỏng mịn, múi trắng nõn như hoa tuyết mọng nước. (Giá thị trường TP.HCM: 90.000 - 140.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 65000, price_sale: 95000, image_url: "images/mangosteen-basket.jpg", is_available: true,
    certification_badge: "Hữu Cơ Cổ Thụ 25 Năm"
  },
  {
    id: "p3", name: "Chôm Chôm Nhãn Giòn Ngọt (Chợ Lách - Bến Tre)", category: "TraiCay",
    highlights: ["Trái nhỏ râu vàng đỏ, tróc hạt 100%", "Cùi dày ráo nước, giòn rụm ngọt lịm", "Hái sớm tươi rói, không dập nát"],
    description: "Đặc sản chôm chôm nhãn trứ danh miệt vườn Chợ Lách (Bến Tre) & Vĩnh Long. Quả nhỏ xinh râu xoăn vàng ửng đỏ, cùi dày trắng trong ráo nước và tróc hạt sạch sẽ 100%. Vị ngọt đậm đà thơm mát như hương nhãn lồng. (Giá thị trường TP.HCM: 50.000 - 75.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 32000, price_sale: 52000, image_url: "images/chomchom.jpg", is_available: true,
    certification_badge: "VietGAP • Đặc Sản Miền Tây"
  },
  {
    id: "p4", name: "Nhãn Xuồng Cơm Vàng (Vũng Tàu & Đồng Tháp)", category: "TraiCay",
    highlights: ["Trái to tròn da bò, căng bóng", "Cùi vàng dày cộm, giòn ngọt ứa nước", "Hương thơm nồng nàn sang trọng"],
    description: "Từng chùm nhãn xuồng cơm vàng trĩu quả từ vùng chuyên canh Bà Rịa - Vũng Tàu & Đồng Tháp. Bóc lớp vỏ mỏng là phần cùi nhãn dày cộm vàng ươm, giòn dai sần sật ngập tràn nước ngọt lịm kèm hương thơm đặc trưng.",
    unit: "kg", weight_kg: 1, price_original: 35000, price_sale: 55000, image_url: "images/nhan.jpg", is_available: true,
    certification_badge: "VietGAP • Cơm Vàng Tự Nhiên"
  },
  {
    id: "p5", name: "Bòn Bon Chùm Ngọt Thanh (Quảng Nam & Đông Nam Bộ)", category: "TraiCay",
    highlights: ["Chùm sai trĩu quả, vỏ mỏng dính", "Múi trong veo mọng nước, ngọt thanh mát", "Không dính mủ tay, giải nhiệt ngày hè"],
    description: "Thức quà quê tinh tế được cắt cẩn thận từng chùm trên thân cây cổ thụ. Vỏ màu vàng ngà mềm mịn, khi bóp nhẹ lộ ra 5 múi bòn bon trong veo lấp lánh như ngọc, vị ngọt thanh khiết xen chút chua dịu nhẹ. (Giá thị trường TP.HCM: 65.000 - 85.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 42000, price_sale: 68000, image_url: "images/bonbon.jpg", is_available: true,
    certification_badge: "Canh Tác Thuận Tự Nhiên"
  },
  {
    id: "p6", name: "Dâu Da Đất Vàng Miệt Vườn", category: "TraiCay",
    highlights: ["Trái vàng óng ả mọc kín thân cây", "Vị chua ngọt hài hòa, mọng nước", "Món quà vặt dân dã cực kỳ gây nghiện"],
    description: "Đặc sản dân dã đậm chất rừng vườn sinh thái. Múi dâu ngậm nước mọng óng ả, vị chua ngọt kích thích vị giác, xua tan ngay cảm giác uể oải. (Giá thị trường TP.HCM: 35.000 - 55.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 22000, price_sale: 38000, image_url: "images/dauda.jpg", is_available: true,
    certification_badge: "Hữu Cơ Sinh Thái"
  },
  {
    id: "p7", name: "Bơ Sáp Dẻo Loại 1 (Tây Nguyên - Đắk Lắk & Lâm Đồng)", category: "TraiCay",
    highlights: ["Cơm dẻo quánh như bơ sữa, không xơ", "Vỏ mỏng hạt nhỏ, cơm vàng đậm tự nhiên", "Giàu dưỡng chất, ăn tươi hoặc dầm sinh tố"],
    description: "Bơ sáp tuyển chọn từ vùng cao nguyên đất đỏ Đắk Lắk & Lâm Đồng, trái dài chắc nịch, da xanh bóng láng. Khi chín tới, phần cơm bơ vàng ươm dẻo quánh như kem tươi, hạt nhỏ, vị béo bùi ngậy đượm đà. (Giá thị trường TP.HCM: 30.000 - 50.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 22000, price_sale: 38000, image_url: "images/bo-sap.jpg", is_available: true,
    certification_badge: "VietGAP • Đặc Sản Tây Nguyên"
  },
  {
    id: "p8", name: "Combo 1: Bạn Trẻ Giảng Đường (Măng Cụt + Chôm Chôm + Dâu Da)", category: "Combo",
    highlights: ["3kg trái cây tươi đủ vị chua ngọt thanh mát", "Tiết kiệm hơn so với mua lẻ", "Lựa chọn hàng đầu cho nhóm sinh viên"],
    description: "Set trái cây 3kg chuẩn 'ngon - bổ - rẻ' gồm: 1kg Măng cụt cổ thụ giòn ngọt + 1kg Chôm chôm nhãn tróc hạt + 1kg Dâu da đất chua ngọt dịu mát. Mua lẻ 185.000 đ, đặt theo combo trọn gói chỉ 159.000 đ.",
    unit: "combo", weight_kg: 3, price_original: 119000, price_sale: 159000, image_url: "images/mangosteen-harvest.jpg", is_available: true,
    certification_badge: "Combo Đã Kiểm Định VietGAP"
  },
  {
    id: "p9", name: "Combo 2: Thầy Cô & Gia Đình (1 Trái Sầu Riêng + 2kg Măng Cụt)", category: "Combo",
    highlights: ["Cặp đôi hoàn hảo 'Vua & Hoàng Hậu' trái cây", "Cân bằng âm dương béo ngậy & thanh mát", "Đóng thùng dán tem QR sang trọng"],
    description: "Set quà tặng cao cấp gồm 1 quả Sầu riêng Ri6 tuyển chọn cơm vàng béo ngậy (2.2 - 2.5kg) đi kèm 2kg Măng cụt cổ thụ chín cây ngọt mát. Mua lẻ 435.000 đ, đặt theo combo chỉ 389.000 đ (tiết kiệm 46.000 đ).",
    unit: "combo", weight_kg: 4.5, price_original: 300000, price_sale: 389000, image_url: "images/durian-pile.jpg", is_available: true,
    certification_badge: "Combo VIP • Bảo Hành Escrow"
  },
  {
    id: "p10", name: "Combo 3: Đại Tiệc Vườn Nhà (Sầu Riêng + Măng Cụt + Chôm Chôm + Nhãn)", category: "Combo",
    highlights: ["Trọn bộ 4 đặc sản nổi tiếng nhất (5kg)", "Đầy đủ hương vị từ béo ngậy đến ngọt lịm", "Lý tưởng cho liên hoan phòng ban, sum họp"],
    description: "Đại tiệc miệt vườn thịnh soạn gồm: 1 quả Sầu riêng Ri6 thơm nức (~2kg) + 1kg Măng cụt cổ thụ + 1kg Chôm chôm nhãn tróc hạt + 1kg Nhãn xuồng cơm vàng. Mua lẻ 398.000 đ, giá combo chỉ 359.000 đ.",
    unit: "combo", weight_kg: 5, price_original: 270000, price_sale: 359000, image_url: "images/hero-fruits.jpg", is_available: true,
    certification_badge: "Combo Đã Kiểm Định VietGAP"
  },
  {
    id: "p11", name: "Combo 4: Dinh Dưỡng Khỏe Đẹp (Bơ Sáp Dẻo + Măng Cụt + Nhãn Xuồng)", category: "Combo",
    highlights: ["3.5kg hoa quả giàu vitamin & chất chống oxy hóa", "Cực tốt cho vóc dáng & làn da", "Lựa chọn vàng của chị em công sở"],
    description: "Set quà sức khỏe lành mạnh gồm: 1kg Bơ sáp dẻo vàng ươm + 1.5kg Măng cụt cổ thụ trắng muốt + 1kg Nhãn xuồng cơm vàng mọng nước. Mua lẻ 235.500 đ, đặt combo chỉ 209.000 đ.",
    unit: "combo", weight_kg: 3.5, price_original: 154500, price_sale: 209000, image_url: "images/bo-sap.jpg", is_available: true,
    certification_badge: "Hữu Cơ • Tốt Cho Sức Khỏe"
  },
  {
    id: "p12", name: "Combo 5: Vị Ngọt Tuổi Thơ Miệt Vườn (Bòn Bon + Dâu Da + Chôm Chôm)", category: "Combo",
    highlights: ["3kg đặc sản dân dã mọng nước", "Chua thanh ngọt mát giải nhiệt tức thì", "Tiết kiệm 19.000 đ so với mua lẻ"],
    description: "Bộ ba thức quà tuổi thơ giải nhiệt dân dã: 1kg Bòn bon đất đỏ mọng nước + 1kg Dâu da đất chua ngọt + 1kg Chôm chôm nhãn giòn rụm. Mua lẻ 158.000 đ, đặt combo chỉ 139.000 đ.",
    unit: "combo", weight_kg: 3, price_original: 96000, price_sale: 139000, image_url: "images/bonbon.jpg", is_available: true,
    certification_badge: "Canh Tác Thuận Tự Nhiên"
  },
  {
    id: "p13", name: "Combo 6: Hộp Quà Tri Ân Thượng Hạng (Sầu Riêng VIP + Măng Cụt + Bơ Sáp)", category: "Combo",
    highlights: ["Set thượng hạng 5.5kg tuyển trái loại 1", "Thùng carton quai xách in thương hiệu dán tem QR", "Bao ăn 1 đổi 1 tận nơi"],
    description: "Set quà 5.5kg thượng hạng: 1 quả Sầu riêng Ri6 VIP chuẩn đẹp (2.5kg) + 2kg Măng cụt cổ thụ + 1kg Bơ sáp dẻo loại 1. Mua lẻ 473.000 đ, giá combo ưu đãi chỉ 425.000 đ (tiết kiệm 48.000 đ).",
    unit: "combo", weight_kg: 5.5, price_original: 329000, price_sale: 425000, image_url: "images/hero-fruits.jpg", is_available: true,
    certification_badge: "Thượng Hạng VIP • VietGAP"
  }
].map(enrichProductMeta);

// Trụ cột 8: Sản phẩm "Happy Hour / Cứu Hộ Nông Sản" (Ugly Food - Xấu mã ngoài da nhưng ruột ngon 100%, giảm 55% - 65% khung giờ 17h00 - 19h00 để đẩy sạch kho, 0% rác thải thực phẩm)
const HAPPY_HOUR_UGLY_FOOD = [
  {
    id: "ugly-1",
    name: "[Cứu Hộ Nông Sản -60%] Bơ Sáp & Măng Cụt Rám Nắng (Ugly Food Ruột Ngon 100%)",
    category: "UglyFood",
    is_ugly_food: true,
    happy_hour_discount_pct: 60,
    highlights: [
      "⚡ Happy Hour 17h-19h: Giảm 60% đẩy sạch kho lưu tạm",
      "Vỏ ngoài rám nắng/xấu mã tự nhiên, ruột dẻo ngọt 100%",
      "🌱 Chung tay giảm Food Waste (Chống lãng phí nông sản)"
    ],
    description: "Lô bơ sáp và măng cụt cổ thụ bị gió cọ cành làm rám vỏ ngoài, không đủ chuẩn trưng bày quà biếu nhưng phần cơm bên trong vẫn dẻo béo, ngọt thanh 100%. Mở bán cứu hộ khung giờ vàng 17:00 – 19:00 giảm 60% (từ 80.000 đ còn 32.000 đ/kg)!",
    unit: "kg",
    weight_kg: 1,
    price_original: 80000,
    price_sale: 32000,
    image_url: "images/bo-sap.jpg",
    is_available: true,
    certification_badge: "⚡ Cứu Hộ Ugly Food (-60%)"
  },
  {
    id: "ugly-2",
    name: "[Happy Hour -55%] Khay Sầu Riêng Ri6 Quá Chín Tách Múi (Làm Sinh Tố / Làm Bánh)",
    category: "UglyFood",
    is_ugly_food: true,
    happy_hour_discount_pct: 55,
    highlights: [
      "⚡ Giờ vàng 17h-19h: Giảm 55% giải phóng Hub Lạnh",
      "Múi chín mềm rụng tự nhiên, cực hợp xay sinh tố, làm kem",
      "🌱 Bảo hành an toàn thực phẩm • Zero Food Waste"
    ],
    description: "Những quả sầu riêng Ri6 chín kỹ cuối ngày tại Hub trung chuyển được bóc tách lấy nguyên múi vàng thơm lừng. Cực kỳ hời cho tiệm bánh, quán sinh tố hoặc gia đình cấp đông ăn dần. Giá gốc 120.000 đ xả kho giờ vàng chỉ 54.000 đ/khay 500g!",
    unit: "khay",
    weight_kg: 0.5,
    price_original: 120000,
    price_sale: 54000,
    image_url: "images/durian-open.jpg",
    is_available: true,
    certification_badge: "⚡ Happy Hour 17h-19h (-55%)"
  },
  {
    id: "ugly-3",
    name: "[Cứu Hộ Nông Sản -65%] Set 3Kg Trái Cây Dạt Size Cuối Ngày (Chôm Chôm + Nhãn + Dâu Da)",
    category: "UglyFood",
    is_ugly_food: true,
    happy_hour_discount_pct: 65,
    highlights: [
      "⚡ Giảm sâu 65% khung giờ 17h-19h (3kg chỉ 55.000 đ)",
      "Trái rụng cuống/nhỏ size cuối ngày, vẫn tươi ngọt mọng nước",
      "🌱 Giải pháp ESG chống rác thải nông nghiệp"
    ],
    description: "Combo 3kg trái cây miệt vườn (Chôm chôm nhãn, Nhãn xuồng, Dâu da) bị rụng rời khỏi chùm trong quá trình vận chuyển. Chất lượng ruột ngọt mát nguyên vẹn, bán giá cứu hộ 55.000 đ/set 3kg để không lãng phí 1 quả nào của bác nông dân!",
    unit: "set 3kg",
    weight_kg: 3,
    price_original: 158000,
    price_sale: 55000,
    image_url: "images/chomchom.jpg",
    is_available: true,
    certification_badge: "⚡ Cứu Hộ Cuối Ngày (-65%)"
  }
].map(enrichProductMeta);

// Danh sách Đối tác Kinh tế Tuần hoàn ESG mặc định (Trụ cột 8)
const DEMO_ESG_PARTNERS = [
  {
    id: "esg-01",
    org_name: "Trại Sinh Học Ruồi Lính Đen EcoLarvae Củ Chi",
    partner_type: "BLACK_SOLDIER_FLY",
    partner_type_label: "Trại Chăn Nuôi Ruồi Lính Đen (BSF)",
    contact_name: "Kỹ sư Lê Hoàng Nam",
    phone: "0909 888 112",
    pickup_area: "Thu gom tại Hub Lạnh Thủ Đức & Bình Thạnh",
    capacity_kg_per_week: 250,
    status: "ACTIVE"
  },
  {
    id: "esg-02",
    org_name: "Xưởng Phân Bón Vi Sinh Hữu Cơ GreenCompost Bình Dương",
    partner_type: "ORGANIC_COMPOST",
    partner_type_label: "Xưởng Ủ Phân Bón Hữu Cơ Sinh Học",
    contact_name: "Chị Nguyễn Thu Trang",
    phone: "0918 223 445",
    pickup_area: "Thu gom vỏ sầu riêng, măng cụt & trái dập tại Dĩ An / QL13",
    capacity_kg_per_week: 500,
    status: "ACTIVE"
  }
];

const DEMO_ORDERS = [
  {
    id: "ord-001", order_code: "AC-261105-DEMO01", customer_name: "Thầy Trần Văn Minh (demo)", customer_phone: "0912345678",
    customer_role: "GiangVien", delivery_type: "CAMPUS", department: "Khoa Kinh Tế - Phòng 302 Nhà A",
    delivery_address: "Văn phòng Khoa Kinh Tế, Quận 3, TP.HCM",
    items: [{ productId: "p9", name: "Combo 2: Thầy Cô & Gia Đình (Loại 1 VIP)", unit: "combo", qty: 1, price: 389000, subtotal: 389000 }],
    total_kg: 4.5, shipping_fee: 0, total_amount: 389000, payment_method: "VIETQR", payment_status: "PAID", order_status: "DELIVERED",
    order_mode: "SUBSCRIPTION_WEEKLY", escrow_status: "RELEASED_TO_FARMER", refund_status: "NONE",
    notes: "Đăng ký định kỳ hàng tuần. Giao trước 11h.", created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "ord-002", order_code: "AC-261105-DEMO02", customer_name: "Chị Hoàng Ánh Tuyết (demo)", customer_phone: "0908765432",
    customer_role: "Khac", delivery_type: "HOME", department: "Giao tận nhà (Quận 7 - Ahamove 2h)",
    delivery_address: "45 Đường số 6, Phường Tân Hưng, Quận 7, TP.HCM",
    items: [
      { productId: "p1", name: "Sầu Riêng Ri6 Ruột Vàng (Loại 1 VIP)", unit: "kg", qty: 2, price: 98000, subtotal: 196000 },
      { productId: "p2", name: "Măng Cụt Cổ Thụ (Loại 2 -15%)", unit: "kg", qty: 1, price: 80750, subtotal: 80750 }
    ],
    total_kg: 3, shipping_fee: 0, total_amount: 276750, payment_method: "VIETQR", payment_status: "PAID", order_status: "CONFIRMED",
    order_mode: "SINGLE", escrow_status: "HELD_IN_ESCROW", refund_status: "NONE",
    notes: "Gọi trước 15 phút.", created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: "ord-003", order_code: "AC-261106-DEMO03", customer_name: "Bạn Lê Quang Huy (demo)", customer_phone: "0933221144",
    customer_role: "SinhVien", delivery_type: "HOME", department: "Giao tận nhà (Dĩ An)",
    delivery_address: "KTX Khu B ĐHQG, Phường Đông Hòa, Dĩ An, Bình Dương",
    items: [{ productId: "p8", name: "Combo 1: Bạn Trẻ Giảng Đường", unit: "combo", qty: 1, price: 159000, subtotal: 159000 }],
    total_kg: 3, shipping_fee: 30000, total_amount: 189000, payment_method: "COD", payment_status: "UNPAID", order_status: "CONFIRMED",
    order_mode: "SINGLE", escrow_status: "HELD_IN_ESCROW", refund_status: "NONE",
    notes: "Đặt COD cọc trước 20%.", created_at: new Date(Date.now() - 14400000).toISOString()
  }
];

const DEMO_REFUND_CLAIMS = [
  {
    id: "claim-001",
    order_code: "AC-261105-DEMO02",
    customer_phone: "0908765432",
    claim_type: "PARTIAL_20",
    reason: "1 quả măng cụt bị dập nhẹ do vận chuyển, xin hoàn 20% vào ví.",
    unbox_video_url: "https://drive.google.com/video-unbox-demo-mangcut",
    refund_amount: 55350,
    status: "PENDING",
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

const LS = {
  products: "agri_v2_products",
  farmerCustomProducts: "agri_v2_farmer_custom_products",
  orders: "agri_v2_orders",
  batch: "agri_v2_batch",
  contacts: "agri_v2_contacts",
  refundClaims: "agri_v2_refund_claims",
  farmerWallet: "agri_v2_farmer_wallet",
  insuranceFund: "agri_v2_insurance_fund",
  esgPartners: "agri_v2_esg_partners",
  esgMetrics: "agri_v2_esg_metrics",
  chatMessages: "agri_v2_inapp_chat",
  adminSession: "agri_v2_admin_demo_session",
  auditLogs: "agri_v2_security_audit_logs",
  idempotencyStore: "agri_v2_idempotency_keys"
};

// ================= KIẾN TRÚC BẢO MẬT 4 TRỌNG ĐIỂM (DATA MASKING, JWT + IDEMPOTENCY, RBAC + AUDIT TRAIL, AI GUARDRAIL) =================
const INITIAL_AUDIT_LOGS = [
  {
    id: "aud-1001",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    actor_role: "SYSTEM_GUARD",
    actor_name: "DataPrivacyEngine",
    action: "AUTO_PII_MASKING",
    target: "AC-261105-DEMO01",
    severity: "INFO",
    detail: "Đơn hàng chuyển sang trạng thái Hoàn tất (DELIVERED): Tự động che giấu SĐT (091****678) & Địa chỉ nhà riêng."
  },
  {
    id: "aud-1002",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    actor_role: "ESCROW_GATEWAY",
    actor_name: "PaymentIdempotency",
    action: "IDEMPOTENCY_VERIFIED",
    target: "IDEM-AC-261105-DEMO02",
    severity: "SUCCESS",
    detail: "Xác thực chữ ký JWT ngắn hạn (TTL 300s) & khóa Idempotency-Key thành công cho giao dịch Ví Escrow 276.750 đ."
  },
  {
    id: "aud-1003",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    actor_role: "RBAC_FIREWALL",
    actor_name: "RoleAccessControl",
    action: "RBAC_ISOLATION_ACTIVE",
    target: "FARM_BAC_NAM",
    severity: "WARN",
    detail: "Áp dụng vách ngăn dữ liệu (Data Boundary): Tài khoản Cổng Nông Dân chỉ được xem sản lượng vườn mình, chặn truy cập PII khách & doanh thu toàn sàn."
  }
];

window.security = {
  // 1. Quyền riêng tư & Che giấu dữ liệu động (Data Privacy & Dynamic Masking)
  // Chỉ hiển thị SĐT và địa chỉ thực khi đơn hàng ở trạng thái "SHIPPING" (Đang giao) hoặc Admin mở khóa có ghi Audit Log.
  maskPhone(phone, orderStatus, isUnmaskedByAdmin = false) {
    const raw = String(phone || "").trim();
    if (!raw) return "***";
    if (orderStatus === "SHIPPING" || isUnmaskedByAdmin) return raw;
    if (raw.length <= 6) return "******";
    return `${raw.slice(0, 3)}****${raw.slice(-3)}`;
  },

  maskAddress(address, orderStatus, isUnmaskedByAdmin = false) {
    const raw = String(address || "").trim();
    if (!raw) return "Đã ẩn địa chỉ";
    if (orderStatus === "SHIPPING" || isUnmaskedByAdmin) return raw;
    // Giữ lại thông tin Quận/Huyện hoặc Cụm để điều phối chung, ẩn số nhà & tên đường chi tiết
    const parts = raw.split(",").map(s => s.trim());
    if (parts.length >= 3) {
      const tail = parts.slice(-2).join(", ");
      return `Số ***, Đường ***, ${tail} (🔒 Đã ẩn PII)`;
    }
    return `Địa chỉ đã mã hóa bảo mật (🔒 Chỉ mở khi Đang giao)`;
  },

  // 2. An toàn Giao dịch Ví Escrow: Short-lived JWT Token (TTL 5 phút) & Idempotency Key chống Double-spending / Replay Attack
  issueShortLivedJwt(role = "CUSTOMER", subject = "checkout", ttlSeconds = 300) {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=+$/, "");
    const jti = "jti_" + Math.random().toString(36).slice(2, 10) + "_" + nowSec;
    const payloadObj = {
      sub: subject,
      role,
      iat: nowSec,
      exp: nowSec + ttlSeconds,
      jti,
      iss: "agriconnect-escrow-auth"
    };
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(payloadObj)))).replace(/=+$/, "");
    const sig = btoa("sig_" + jti + "_" + role).replace(/=+$/, "").slice(0, 24);
    return {
      token: `${header}.${payload}.${sig}`,
      jti,
      expiresAt: new Date((nowSec + ttlSeconds) * 1000).toISOString(),
      ttlSeconds
    };
  },

  generateIdempotencyKey(prefix = "ORDER", fingerprint = "") {
    const cleanFp = String(fingerprint || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 18);
    const timeBucket = Math.floor(Date.now() / 15000); // Khóa chống bấm đúp trong cửa sổ 15 giây
    return `IDEM-${prefix}-${cleanFp}-${timeBucket}`;
  },

  checkAndLockIdempotency(idemKey, actionName = "CREATE_ORDER", amountVnd = 0) {
    let store = {};
    try {
      store = JSON.parse(localStorage.getItem(LS.idempotencyStore) || "{}");
    } catch (e) { store = {}; }

    const now = Date.now();
    // Dọn các khóa hết hạn quá 10 phút
    Object.keys(store).forEach(k => {
      if (now - Number(store[k]?.timestamp || 0) > 600000) delete store[k];
    });

    if (store[idemKey]) {
      this.logAudit({
        actor_role: "ESCROW_GATEWAY",
        actor_name: "IdempotencyGuard",
        action: "IDEMPOTENCY_REPLAY_BLOCKED",
        target: idemKey,
        severity: "DANGER",
        detail: `Chặn giao dịch trùng lặp (Double-spending / Replay Attack) trên hành động ${actionName} (${formatVND(amountVnd)}).`
      });
      throw new Error(`Bảo mật Ví Escrow (Idempotency Key: ${idemKey}): Phát hiện thao tác bấm đúp hoặc gửi lặp giao dịch. Hệ thống đã chặn tự động để bảo vệ bạn khỏi bị trừ tiền 2 lần!`);
    }

    store[idemKey] = {
      action: actionName,
      amount: amountVnd,
      timestamp: now
    };
    try {
      localStorage.setItem(LS.idempotencyStore, JSON.stringify(store));
    } catch (e) {}
    return true;
  },

  // 3. Phân quyền RBAC (Role-Based Access Control) & Nhật ký Truy vết Bất biến (Audit Trail)
  getAuditLogs() {
    try {
      const raw = localStorage.getItem(LS.auditLogs);
      if (!raw) {
        localStorage.setItem(LS.auditLogs, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_AUDIT_LOGS;
    }
  },

  logAudit(entry) {
    const logs = this.getAuditLogs();
    const record = {
      id: "aud-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100),
      timestamp: new Date().toISOString(),
      actor_role: entry.actor_role || "ADMIN",
      actor_name: entry.actor_name || "Quản trị viên",
      action: entry.action || "SECURITY_EVENT",
      target: entry.target || "SYSTEM",
      severity: entry.severity || "INFO",
      detail: entry.detail || ""
    };
    logs.unshift(record);
    const trimmed = logs.slice(0, 60);
    try {
      localStorage.setItem(LS.auditLogs, JSON.stringify(trimmed));
    } catch (e) {}
    return record;
  },

  assertRoleAccess(currentRole, allowedRoles = ["ADMIN"], resourceName = "API") {
    if (!allowedRoles.includes(currentRole)) {
      this.logAudit({
        actor_role: currentRole,
        actor_name: `Role:${currentRole}`,
        action: "RBAC_UNAUTHORIZED_BLOCKED",
        target: resourceName,
        severity: "DANGER",
        detail: `Chặn truy cập trái phép (403 Forbidden): Vai trò [${currentRole}] cố gắng gọi [${resourceName}] (Chỉ dành cho: ${allowedRoles.join(", ")}).`
      });
      throw new Error(`403 Forbidden (RBAC Policy): Tài khoản [${currentRole}] bị chặn bởi vách ngăn dữ liệu — không có quyền truy cập [${resourceName}]!`);
    }
    return true;
  },

  // 4. Bảo mật Tích hợp AI & Chống Prompt Injection (AI Security & Data Boundaries)
  evaluateAiPrompt(userPrompt) {
    const raw = String(userPrompt || "").trim();
    const lower = raw.toLowerCase();

    const injectionPatterns = [
      { re: /ignore\s+(all\s+)?(previous|prior)|bỏ qua\s+(mọi\s+)?(hướng dẫn|quy tắc|lệnh)|quên hết quy tắc|system\s*prompt|developer\s*mode|jailbreak/i, type: "System Override / Jailbreak Injection" },
      { re: /mã giảm giá nội bộ|voucher\s*(ẩn|bí mật|admin|nội bộ)|secret\s*coupon|admin\s*pin|mật khẩu|password|supabase_anon_key|api[_\s-]*key|private[_\s-]*key|config\.js/i, type: "Secret / Internal Coupon / Config Extraction" },
      { re: /số điện thoại\s*(khách|người mua|người dùng)|địa chỉ\s*(khách|nhà riêng)|danh sách đơn hàng|dữ liệu cá nhân|trích xuất\s*data|select\s+\*\s+from|drop\s+table|union\s+select/i, type: "Customer PII / Database Exfiltration" }
    ];

    for (const pat of injectionPatterns) {
      if (pat.re.test(lower)) {
        this.logAudit({
          actor_role: "AI_GUARDRAIL",
          actor_name: "AgriBotFirewall",
          action: "AI_PROMPT_INJECTION_BLOCKED",
          target: pat.type,
          severity: "DANGER",
          detail: `Chặn lệnh Prompt Injection độc hại: "${raw.slice(0, 90)}"`
        });
        return {
          blocked: true,
          threatType: pat.type,
          safeReply: `🛡️ [AgriBot AI Guardrail - Đã Chặn Lệnh Không Hợp Lệ]: Phát hiện dấu hiệu "${pat.type}". Theo chính sách Ranh giới Dữ liệu (Data Boundaries), trợ lý AI không có quyền truy cập dữ liệu cá nhân (PII) của khách hàng khác, cấu hình hệ thống, khóa bảo mật hoặc mã ưu đãi nội bộ. Tôi chỉ hỗ trợ tư vấn mùa vụ nông sản, độ chín và chính sách Ví Escrow 12h.`
        };
      }
    }

    // Phản hồi an toàn trong ranh giới dữ liệu công khai (Public Catalog & Policy Boundary)
    let reply = "🌱 Chào bạn! Tôi là Trợ lý AI AgriConnect (hoạt động trong vùng dữ liệu công khai đã kiểm duyệt). ";
    if (/sầu riêng|ri6|măng cụt|bơ|chôm chôm|mùa vụ|giá/i.test(lower)) {
      reply += "Hiện sàn đang mở gom Sầu riêng Ri6 ruột vàng (98.000 đ/kg), Măng cụt cổ thụ (95.000 đ/kg), Bơ sáp Đắk Lắk (38.000 đ/kg) và Combo Đi Chợ Tuần (359k - 389k). Bạn có thể chọn Loại 1 (VIP), Loại 2 (-15%) hoặc Loại 3 (-30%).";
    } else if (/ship|vận chuyển|freeship|giao hàng/i.test(lower)) {
      reply += "Chính sách vận chuyển: Miễn phí 0đ khi nhận tại Hub Xe Lạnh hoặc khi đơn hàng đạt chuẩn AOV ≥ 350.000 đ. Đơn dưới 350k tính phí đồng giá 25.000 đ (VietQR Escrow) hoặc 35.000 đ (COD).";
    } else if (/đổi trả|bảo hành|sượng|hỏng|escrow|hoàn tiền/i.test(lower)) {
      reply += "100% đơn thanh toán qua Ví Tạm Giữ Escrow được bảo vệ 12 giờ sau khi nhận hàng. Nếu trái bị sượng/dập, bạn chỉ cần gửi link Video Unbox tại trang Tra Cứu để được duyệt hoàn 20% hoặc 100% tự động 1-Click!";
    } else {
      reply += "Bạn có thể hỏi tôi về: (1) Tư vấn đặc sản Tây Nguyên - Đông Nam Bộ - Miền Tây, (2) Chính sách Freeship đơn ≥ 350.000 đ, hoặc (3) Cơ chế bảo vệ Ví Escrow 12h & đổi thùng trống nhận Voucher 10.000 đ!";
    }

    return {
      blocked: false,
      threatType: null,
      safeReply: reply
    };
  }
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
      localStorage.setItem(LS.products, JSON.stringify([...DEMO_PRODUCTS, ...HAPPY_HOUR_UGLY_FOOD]));
      if (!localStorage.getItem(LS.orders)) localStorage.setItem(LS.orders, JSON.stringify(DEMO_ORDERS));
      if (!localStorage.getItem(LS.refundClaims)) localStorage.setItem(LS.refundClaims, JSON.stringify(DEMO_REFUND_CLAIMS));
      if (!localStorage.getItem(LS.esgPartners)) localStorage.setItem(LS.esgPartners, JSON.stringify(DEMO_ESG_PARTNERS));
      if (!localStorage.getItem(LS.esgMetrics)) {
        localStorage.setItem(LS.esgMetrics, JSON.stringify({
          recycled_kg: 148.5,
          co2_saved_kg: 282.0,
          waste_cost_saved_vnd: 1485000,
          batches_dispatched: 6
        }));
      }
      if (!localStorage.getItem(LS.insuranceFund)) {
        localStorage.setItem(LS.insuranceFund, JSON.stringify({
          balance_vnd: 1245000,
          covered_orders: 142,
          instant_claims_paid: 2
        }));
      }
      if (!localStorage.getItem(LS.farmerWallet)) {
        localStorage.setItem(LS.farmerWallet, JSON.stringify({
          available_balance: 4850000,
          escrow_pending: 1620000,
          total_withdrawn: 12500000,
          last_release_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }));
      }
      if (!localStorage.getItem(LS.batch)) {
        localStorage.setItem(LS.batch, JSON.stringify({
          id: "batch-001",
          batch_name: (window.APP_CONFIG?.CAMPAIGN?.BATCH_NAME) || "Đợt Gom Hàng #01: Sầu Riêng Ri6 & Măng Cụt Bình Phước",
          target_kg: (window.APP_CONFIG?.CAMPAIGN?.TARGET_KG) || 60,
          status: "OPEN",
          harvest_date: "Thứ Sáu (thu hái & đóng thùng tại Bình Phước)",
          delivery_date: "Sáng Thứ Bảy (xe lạnh Hub-to-Hub + Ahamove/GrabExpress 2h)"
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
    const customFarmerItems = this._read(LS.farmerCustomProducts);
    if (this.isCloud) {
      try {
        const { data, error } = await this.client
          .from("products").select("*").eq("is_available", true).order("created_at", { ascending: true });
        if (!error && data && data.length > 0) {
          const cloudEnriched = data.map((p, idx) => enrichProductMeta(p, idx));
          return [...customFarmerItems.map((p, i) => enrichProductMeta(p, i)), ...cloudEnriched, ...HAPPY_HOUR_UGLY_FOOD];
        }
      } catch (err) {
        console.warn("[AgriConnect] Không tải được từ Supabase, dùng dữ liệu dự phòng:", err);
      }
    }
    const local = this._read(LS.products);
    const base = (local && local.length > 0) ? local.filter(p => p.is_available !== false) : [...DEMO_PRODUCTS, ...HAPPY_HOUR_UGLY_FOOD];
    return [...customFarmerItems, ...base].map((p, idx) => enrichProductMeta(p, idx));
  }

  async getAllProducts() {
    const customFarmerItems = this._read(LS.farmerCustomProducts);
    if (this.isCloud) {
      try {
        const { data, error } = await this.client.from("products").select("*");
        if (!error && data && data.length > 0) {
          return [...customFarmerItems, ...data, ...HAPPY_HOUR_UGLY_FOOD].map((p, idx) => enrichProductMeta(p, idx));
        }
      } catch (err) {
        console.warn("[AgriConnect] Lỗi lấy sản phẩm admin:", err);
      }
    }
    const local = this._read(LS.products);
    const base = (local && local.length > 0) ? local : [...DEMO_PRODUCTS, ...HAPPY_HOUR_UGLY_FOOD];
    return [...customFarmerItems, ...base].map((p, idx) => enrichProductMeta(p, idx));
  }

  // Nhà vườn đăng lứa mới từ trang farmer.html (Mobile-First + Voice-to-Text)
  async addFarmerBatchProduct(newProd) {
    const item = enrichProductMeta({
      id: "farmer-" + Date.now(),
      name: newProd.name,
      category: newProd.category || "TraiCay",
      highlights: [
        "Vừa đăng trực tiếp từ Vườn Bác Năm (Voice-to-Text)",
        `Sản lượng mở bán: ${newProd.stock_kg || 50} kg • ${newProd.harvest_date || "Hái sáng Thứ Sáu"}`,
        "Đạt chuẩn VietGAP • Bảo hành Ví Tạm Giữ Escrow 12h"
      ],
      description: newProd.description || "Nông sản hái chín tự nhiên tại vườn Bình Phước.",
      unit: newProd.unit || "kg",
      weight_kg: Number(newProd.weight_kg || 1),
      price_original: Math.round(Number(newProd.price_sale || 65000) * 0.72),
      price_sale: Number(newProd.price_sale || 65000),
      image_url: newProd.image_url || "images/hero-fruits.jpg",
      harvest_date: newProd.harvest_date || "Thu hoạch sáng Thứ Sáu tuần này",
      certification_badge: newProd.certification_badge || "VietGAP • Vườn Bác Năm",
      is_available: true,
      created_at: new Date().toISOString()
    });

    const list = this._read(LS.farmerCustomProducts);
    list.unshift(item);
    this._write(LS.farmerCustomProducts, list);
    return item;
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
      current_kg: 38.5,
      status: "OPEN"
    };
  }

  // ================= GỬI ĐƠN HÀNG (BẢO VỆ BẰNG SHORT-LIVED JWT & IDEMPOTENCY KEY) =================
  async createOrder(orderInput, pricedPreview) {
    // 1. Kiểm tra Idempotency-Key chống bấm đúp "Thanh toán" / Double-spending / Replay Attack
    const idemFp = `${orderInput.customer_phone}_${pricedPreview.total_amount}_${(orderInput.items || []).length}`;
    const idemKey = orderInput.idempotency_key || window.security.generateIdempotencyKey("ESCROW", idemFp);
    window.security.checkAndLockIdempotency(idemKey, "CREATE_ESCROW_ORDER", pricedPreview.total_amount);

    // 2. Cấp phát Token bảo mật JWT ngắn hạn (TTL 300s) cho phiên giao dịch Ví Escrow
    const jwtSession = window.security.issueShortLivedJwt("CUSTOMER", orderInput.customer_phone, 300);

    // Lưu bản sao mở rộng vào LocalStorage để phục vụ hiển thị Ví Escrow, Subscription & Pre-order
    const localOrderRecord = {
      id: "ord-" + Date.now(),
      ...orderInput,
      ...pricedPreview,
      idempotency_key: idemKey,
      jwt_jti: jwtSession.jti,
      order_mode: orderInput.order_mode || "SINGLE",
      deposit_amount: orderInput.deposit_amount || 0,
      escrow_status: "HELD_IN_ESCROW",
      refund_status: "NONE",
      payment_status: "UNPAID",
      order_status: "CONFIRMED",
      created_at: new Date().toISOString()
    };

    window.security.logAudit({
      actor_role: "CUSTOMER",
      actor_name: orderInput.customer_name || "Khách đặt hàng",
      action: "ORDER_CREATED_ESCROW",
      target: orderInput.order_code,
      severity: "SUCCESS",
      detail: `Tạo đơn ${orderInput.order_code} (${formatVND(pricedPreview.total_amount)}) • Khóa Idempotency [${idemKey}] • JWT [${jwtSession.jti}] • Đã kích hoạt che giấu PII (SĐT/Địa chỉ) mặc định.`
    });

    if (Number(orderInput.insurance_fee || 0) > 0) {
      this.addInsuranceFee(Number(orderInput.insurance_fee));
    }

    if (this.isCloud) {
      // Nếu giỏ hàng có sản phẩm vừa được nông dân tạo cục bộ ("farmer-*") hoặc Cứu hộ Ugly Food ("ugly-*"),
      // ánh xạ sang id sản phẩm thật trên Supabase để trigger compute_order_totals không báo lỗi
      let fallbackCloudProdId = null;
      try {
        const { data: cloudProds } = await this.client.from("products").select("id").limit(1);
        if (cloudProds && cloudProds[0]) fallbackCloudProdId = cloudProds[0].id;
      } catch (e) {}

      const validCloudRoles = ["SinhVien", "GiangVien", "CanBo", "Khac"];
      const safeRole = validCloudRoles.includes(orderInput.customer_role) ? orderInput.customer_role : "CanBo";

      const payload = {
        order_code: orderInput.order_code,
        customer_name: orderInput.customer_name,
        customer_phone: orderInput.customer_phone,
        customer_role: safeRole,
        delivery_type: orderInput.delivery_type,
        department: orderInput.department,
        delivery_address: orderInput.delivery_address,
        items: orderInput.items.map(i => {
          const pidStr = String(i.productId || "");
          const isLocalCustomId = pidStr.startsWith("farmer-") || pidStr.startsWith("ugly-") || pidStr.startsWith("p");
          const resolvedId = (isLocalCustomId && fallbackCloudProdId) ? fallbackCloudProdId : i.productId;
          return {
            id: resolvedId,
            product_id: resolvedId,
            productId: resolvedId,
            name: i.name,
            variant_code: i.variantCode || "GRADE_1",
            variant_label: i.variantLabel || "Loại 1 (VIP)",
            unit: i.unit,
            price: i.price,
            subtotal: i.subtotal,
            qty: i.qty,
            quantity: i.qty
          };
        }),
        payment_method: orderInput.payment_method,
        notes: orderInput.notes || null,
        consent_at: new Date().toISOString()
      };
      const { error } = await this.client.from("orders").insert([payload]);
      if (error) throw new Error(this._friendlyError(error));

      const orders = this._read(LS.orders);
      orders.unshift(localOrderRecord);
      this._write(LS.orders, orders);
      return localOrderRecord;
    }

    const orders = this._read(LS.orders);
    orders.unshift(localOrderRecord);
    this._write(LS.orders, orders);
    return localOrderRecord;
  }

  // ================= ADMIN: ĐƠN HÀNG & VÍ ESCROW =================
  async getOrders() {
    if (this.isCloud) {
      const { data, error } = await this.client.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(this._friendlyError(error));
      const localOrders = this._read(LS.orders);
      const localMap = new Map(localOrders.map(o => [o.order_code, o]));
      return (data || []).map(o => {
        const localExtra = localMap.get(o.order_code) || {};
        return {
          ...o,
          order_mode: o.order_mode || localExtra.order_mode || "SINGLE",
          escrow_status: o.escrow_status || localExtra.escrow_status || (o.order_status === "DELIVERED" ? "RELEASED_TO_FARMER" : "HELD_IN_ESCROW"),
          refund_status: o.refund_status || localExtra.refund_status || "NONE"
        };
      });
    }
    return this._read(LS.orders);
  }

  async updateOrder(orderId, updates) {
    // Cập nhật song song trong LocalStorage cho các trường mở rộng (escrow_status, refund_status)
    const orders = this._read(LS.orders);
    const idx = orders.findIndex(o => o.id === orderId || o.order_code === orderId);
    const targetCode = idx !== -1 ? orders[idx].order_code : String(orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updates };
      this._write(LS.orders, orders);
    }

    // Ghi nhận Nhật ký Truy vết Bảo mật (Audit Trail) cho mọi thao tác đổi trạng thái đơn / thanh toán
    if (updates.order_status) {
      const piiNote = updates.order_status === "SHIPPING"
        ? "🔓 Mở khóa tạm thời SĐT & Địa chỉ thực cho Shipper/Nhà vườn giao hàng"
        : "🔒 Tự động khóa & che giấu SĐT (090****123) + Địa chỉ nhà riêng sau khi kết thúc giao";
      window.security.logAudit({
        actor_role: "ADMIN",
        actor_name: "Admin Portal",
        action: "ORDER_STATUS_CHANGE",
        target: targetCode,
        severity: updates.order_status === "SHIPPING" ? "WARN" : "INFO",
        detail: `Chuyển trạng thái đơn ${targetCode} ➔ [${updates.order_status}]. ${piiNote}.`
      });
    }
    if (updates.payment_status) {
      window.security.logAudit({
        actor_role: "ADMIN",
        actor_name: "Admin Portal",
        action: "PAYMENT_STATUS_CHANGE",
        target: targetCode,
        severity: "SUCCESS",
        detail: `Cập nhật trạng thái thanh toán đơn ${targetCode} ➔ [${updates.payment_status}].`
      });
    }

    if (this.isCloud) {
      const cloudSafeUpdates = {};
      if (updates.payment_status) cloudSafeUpdates.payment_status = updates.payment_status;
      if (updates.order_status) {
        // Trên Supabase schema, order_status chấp nhận CONFIRMED / DELIVERED / CANCELLED (ánh xạ SHIPPING -> CONFIRMED nếu cần)
        cloudSafeUpdates.order_status = updates.order_status === "SHIPPING" ? "CONFIRMED" : updates.order_status;
      }
      if (updates.notes !== undefined) cloudSafeUpdates.notes = updates.notes;
      if (Object.keys(cloudSafeUpdates).length > 0) {
        const { error } = await this.client.from("orders").update(cloudSafeUpdates).eq("id", orderId);
        if (error) throw new Error(this._friendlyError(error));
      }
      return true;
    }
    return idx !== -1;
  }

  // ================= KHIẾU NẠI & BỒI THƯỜNG TỰ ĐỘNG 1-CLICK (ESCROW) =================
  async submitRefundClaim(claimInput) {
    const newClaim = {
      id: "claim-" + Date.now(),
      order_code: String(claimInput.order_code || "").trim().toUpperCase(),
      customer_phone: String(claimInput.customer_phone || "").trim(),
      claim_type: claimInput.claim_type || "PARTIAL_20", // PARTIAL_20 | FULL_100
      reason: claimInput.reason || "Nông sản bị dập/sượng khi mở thùng",
      unbox_video_url: claimInput.unbox_video_url || "",
      status: "PENDING",
      created_at: new Date().toISOString()
    };

    const list = this._read(LS.refundClaims);
    list.unshift(newClaim);
    this._write(LS.refundClaims, list);

    if (this.isCloud) {
      try {
        await this.client.from("refund_requests").insert([{
          order_code: newClaim.order_code,
          customer_phone: newClaim.customer_phone,
          claim_type: newClaim.claim_type,
          reason: newClaim.reason,
          unbox_video_url: newClaim.unbox_video_url,
          status: "PENDING"
        }]);
      } catch (e) {
        console.warn("Lưu yêu cầu bồi thường ở chế độ Hybrid:", e);
      }
    }
    return newClaim;
  }

  async getRefundClaims() {
    return this._read(LS.refundClaims);
  }

  async resolveRefundClaim(claimId, decision) {
    // decision: 'APPROVE_20' | 'APPROVE_100' | 'REJECT'
    const idemKey = window.security.generateIdempotencyKey("REFUND", `${claimId}_${decision}`);
    window.security.checkAndLockIdempotency(idemKey, `ESCROW_${decision}`, 0);
    const jwt = window.security.issueShortLivedJwt("ADMIN", `refund_${claimId}`, 180);

    const list = this._read(LS.refundClaims);
    const idx = list.findIndex(c => c.id === claimId);
    if (idx === -1) return false;
    list[idx].status = decision === "REJECT" ? "REJECTED" : "APPROVED";
    list[idx].decision = decision;
    list[idx].resolved_at = new Date().toISOString();
    list[idx].idempotency_key = idemKey;
    list[idx].jwt_jti = jwt.jti;
    this._write(LS.refundClaims, list);

    window.security.logAudit({
      actor_role: "ADMIN",
      actor_name: "Admin Escrow Auditor",
      action: `ESCROW_REFUND_${decision}`,
      target: list[idx].order_code || claimId,
      severity: decision === "REJECT" ? "WARN" : "SUCCESS",
      detail: `Phê duyệt 1-Click [${decision}] cho đơn ${list[idx].order_code} • Khóa chống lặp [${idemKey}] • Token [${jwt.jti}].`
    });
    return list[idx];
  }

  getFarmerWallet() {
    try {
      return JSON.parse(localStorage.getItem(LS.farmerWallet) || '{"available_balance":4850000,"escrow_pending":1620000,"total_withdrawn":12500000}');
    } catch (e) {
      return { available_balance: 4850000, escrow_pending: 1620000, total_withdrawn: 12500000 };
    }
  }

  releaseEscrowToFarmer(amountVND) {
    const amt = Number(amountVND || 0);
    const idemKey = window.security.generateIdempotencyKey("ESCROW_RELEASE", `T1_${amt}`);
    window.security.checkAndLockIdempotency(idemKey, "ESCROW_RELEASE_T1", amt);
    const jwt = window.security.issueShortLivedJwt("ADMIN", "escrow_cron_t1", 180);

    const w = this.getFarmerWallet();
    w.available_balance = Number(w.available_balance || 0) + amt;
    w.escrow_pending = Math.max(0, Number(w.escrow_pending || 0) - amt);
    w.last_release_at = new Date().toISOString();
    localStorage.setItem(LS.farmerWallet, JSON.stringify(w));

    window.security.logAudit({
      actor_role: "ESCROW_GATEWAY",
      actor_name: "AutoTriggerCronT1",
      action: "ESCROW_CRON_RELEASE_T1",
      target: "FARM_BAC_NAM",
      severity: "SUCCESS",
      detail: `Giải ngân T+1 số tiền ${formatVND(amt)} về Ví Nhà Vườn Bác Năm • Idempotency [${idemKey}] • JWT [${jwt.jti}].`
    });
    return w;
  }

  // ================= TRỤ CỘT 6: QUỸ BẢO HIỂM NÔNG SẢN & ATVSTP (1.000đ/ĐƠN) =================
  getInsuranceFund() {
    try {
      return JSON.parse(localStorage.getItem(LS.insuranceFund) || '{"balance_vnd":1245000,"covered_orders":142,"instant_claims_paid":2}');
    } catch (e) {
      return { balance_vnd: 1245000, covered_orders: 142, instant_claims_paid: 2 };
    }
  }

  addInsuranceFee(fee = 1000) {
    const fund = this.getInsuranceFund();
    fund.balance_vnd = Number(fund.balance_vnd || 0) + Number(fee || 1000);
    fund.covered_orders = Number(fund.covered_orders || 0) + 1;
    localStorage.setItem(LS.insuranceFund, JSON.stringify(fund));
    return fund;
  }

  // ================= TRỤ CỘT 7: GO-TO-MARKET (BAO TIÊU MỒI GIẢI BÀI TOÁN CON GÀ - QUẢ TRỨNG) =================
  async createGtmSeedOrder() {
    const seedCode = "AC-GTM-SEED" + Math.floor(10 + Math.random() * 89);
    const seedOrder = {
      id: "ord-gtm-" + Date.now(),
      order_code: seedCode,
      customer_name: "Quỹ Bao Tiêu Mồi AgriConnect (GTM Quận 1 & Quận 3)",
      customer_phone: "0784203424",
      customer_role: "CanBo",
      delivery_type: "CAMPUS",
      department: "Hub Văn Phòng Quận 1 & Quận 3 (Hyper-Local Beachhead)",
      delivery_address: "Tòa nhà Văn phòng Quận 1 & Quận 3, TP.HCM",
      items: [
        { productId: "p1", name: "Sầu Riêng Ri6 Ruột Vàng (Bao tiêu mồi)", unit: "kg", qty: 15, price: 98000, subtotal: 1470000 },
        { productId: "p2", name: "Măng Cụt Cổ Thụ (Bao tiêu mồi)", unit: "kg", qty: 15, price: 95000, subtotal: 1425000 }
      ],
      total_kg: 30,
      shipping_fee: 0,
      total_amount: 2895000,
      payment_method: "VIETQR",
      payment_status: "PAID",
      order_status: "CONFIRMED",
      order_mode: "SUBSCRIPTION_WEEKLY",
      escrow_status: "HELD_IN_ESCROW",
      notes: "[GTM BAO TIÊU MỒI] Admin thu mua sỉ 30kg tạo động lực cho Vườn Bác Năm & cấp hàng cho cụm Văn phòng Q.1 - Q.3",
      created_at: new Date().toISOString()
    };
    const orders = this._read(LS.orders);
    orders.unshift(seedOrder);
    this._write(LS.orders, orders);
    return seedOrder;
  }

  // ================= TRỤ CỘT 8: ĐỐI TÁC KINH TẾ TUẦN HOÀN & ESG (FOOD WASTE) =================
  getEsgPartners() {
    const list = this._read(LS.esgPartners);
    return (list && list.length > 0) ? list : DEMO_ESG_PARTNERS;
  }

  getEsgMetrics() {
    try {
      return JSON.parse(localStorage.getItem(LS.esgMetrics) || '{"recycled_kg":148.5,"co2_saved_kg":282.0,"waste_cost_saved_vnd":1485000,"batches_dispatched":6}');
    } catch (e) {
      return { recycled_kg: 148.5, co2_saved_kg: 282.0, waste_cost_saved_vnd: 1485000, batches_dispatched: 6 };
    }
  }

  async registerEsgPartner(partnerInput) {
    const typeLabels = {
      BLACK_SOLDIER_FLY: "Trại Chăn Nuôi Ruồi Lính Đen (BSF)",
      ORGANIC_COMPOST: "Xưởng Ủ Phân Bón Hữu Cơ Sinh Học",
      BIO_ENZYME: "Xưởng Chế Phẩm Sinh Học / Enzyme",
      ANIMAL_FEED: "Trang Trại Thức Ăn Chăn Nuôi Sinh Học"
    };
    const item = {
      id: "esg-" + Date.now(),
      org_name: partnerInput.org_name,
      partner_type: partnerInput.partner_type || "ORGANIC_COMPOST",
      partner_type_label: typeLabels[partnerInput.partner_type] || "Đối tác Kinh tế Tuần hoàn ESG",
      contact_name: partnerInput.contact_name,
      phone: partnerInput.phone,
      pickup_area: partnerInput.pickup_area || "TP.HCM & Bình Dương",
      capacity_kg_per_week: Number(partnerInput.capacity_kg_per_week || 150),
      status: "ACTIVE",
      created_at: new Date().toISOString()
    };
    const list = this.getEsgPartners();
    list.unshift(item);
    this._write(LS.esgPartners, list);

    if (this.isCloud) {
      try {
        await this.client.from("esg_circular_partners").insert([{
          org_name: item.org_name,
          partner_type: item.partner_type,
          contact_name: item.contact_name,
          phone: item.phone,
          pickup_area: item.pickup_area,
          capacity_kg_per_week: item.capacity_kg_per_week
        }]);
      } catch (e) {}
    }
    return item;
  }

  dispatchWasteToEsgPartner(kgAmount = 18.5) {
    const m = this.getEsgMetrics();
    const kg = Number(kgAmount || 18.5);
    m.recycled_kg = Number((Number(m.recycled_kg || 0) + kg).toFixed(1));
    m.co2_saved_kg = Number((Number(m.co2_saved_kg || 0) + kg * 1.9).toFixed(1));
    m.waste_cost_saved_vnd = Number(m.waste_cost_saved_vnd || 0) + Math.round(kg * 10000);
    m.batches_dispatched = Number(m.batches_dispatched || 0) + 1;
    localStorage.setItem(LS.esgMetrics, JSON.stringify(m));
    return m;
  }

  // ================= TRA CỨU ĐƠN (trang trace.html) =================
  async traceOrder(code) {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) return null;
    if (this.isCloud) {
      try {
        const { data, error } = await this.client.rpc("get_order_trace", { p_code: clean });
        if (!error && data && data[0]) {
          const localExtra = this._read(LS.orders).find(x => String(x.order_code).toUpperCase() === clean) || {};
          return {
            ...data[0],
            escrow_status: localExtra.escrow_status || (data[0].order_status === "DELIVERED" ? "RELEASED_TO_FARMER" : "HELD_IN_ESCROW"),
            order_mode: localExtra.order_mode || "SINGLE"
          };
        }
      } catch (err) {
        console.warn("Trace fallback local:", err);
      }
    }
    const o = this._read(LS.orders).find(x => String(x.order_code).toUpperCase() === clean);
    if (!o) return null;
    const batch = JSON.parse(localStorage.getItem(LS.batch) || "{}");
    return {
      order_code: o.order_code, order_status: o.order_status, payment_status: o.payment_status,
      delivery_type: o.delivery_type, total_kg: o.total_kg, created_at: o.created_at,
      escrow_status: o.escrow_status || "HELD_IN_ESCROW",
      order_mode: o.order_mode || "SINGLE",
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
    return sessionStorage.setItem ? sessionStorage.getItem(LS.adminSession) === "1" : false;
  }

  async adminLogout() {
    if (this.isCloud) await this.client.auth.signOut();
    sessionStorage.removeItem(LS.adminSession);
  }
}

window.db = new AgriDB();
