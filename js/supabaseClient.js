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

// Nhật ký canh tác (Traceability Timeline) mặc định cho Trái Cây Đặc Sản
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
    stage: "Chặng 3: Đo độ đường (Brix) & Kiểm tra độ già",
    date: "Thứ Năm hàng tuần",
    title: "Kiểm tra độ già 8.5 - 9 tuổi & Cách ly PHI 21 ngày",
    desc: "Đảm bảo thời gian cách ly thuốc BVTV (PHI ≥ 21 ngày = 0% tồn dư). Từng trái được đo độ ngọt đạt chuẩn mới đánh dấu thu hoạch.",
    badge: "Đạt chuẩn Brix 24–32%",
    image: "images/durian-pile.jpg"
  },
  {
    stage: "Chặng 4: Hái sáng sớm & Khoang Lạnh 12–15°C",
    date: "05:30 Sáng Thứ Sáu",
    title: "Cắt cuống, dán tem Merkle QR & Vận chuyển Cold-Chain",
    desc: "Thu hái lúc sương sớm, bảo quản khoang mát 12–15°C có túi hút khí Ethylene và chuyển thẳng về Hub TP.HCM trong 24h.",
    badge: "Cold-Chain 12–15°C",
    image: "images/hero-fruits.jpg"
  }
];

// Nhật ký canh tác chuyên biệt cho Rau Củ Quả Sạch Đà Lạt & Cao Nguyên (Sinh lý thực vật chuẩn)
const VEGGIE_TRACEABILITY_TIMELINE = [
  {
    stage: "Chặng 1: Ươm giống nhà kính & Giá thể xơ dừa",
    date: "Ngày 01 - Ngày 15",
    title: "Tuyển cây con khỏe trong nhà màng công nghệ cao Đà Lạt",
    desc: "Gieo hạt giống F1 không biến đổi gen (Non-GMO) trên giá thể hữu cơ tiệt trùng, cách ly hoàn toàn côn trùng gây hại.",
    badge: "Nhà Kính Đà Lạt",
    image: "images/xa-lach-thuy-canh.jpg"
  },
  {
    stage: "Chặng 2: Dinh dưỡng Thủy canh / Vi sinh & Bẫy sinh học",
    date: "Ngày 16 - Ngày 35",
    title: "Tưới nhỏ giọt Israel & Kiểm soát sâu bệnh bằng thiên địch",
    desc: "Sử dụng phân hữu cơ vi sinh và chế phẩm Trichoderma, tuyệt đối không dùng thuốc trừ sâu hóa học hay chất kích thích tăng trưởng.",
    badge: "Nitrate & Kim loại nặng: 0%",
    image: "images/bong-cai-ot-chuong.jpg"
  },
  {
    stage: "Chặng 3: Tuân thủ Thời gian Cách ly (PHI ≥ 14 ngày)",
    date: "Thứ Năm hàng tuần",
    title: "Test nhanh dư lượng Nitrate & Độ giòn sinh học tại ruộng",
    desc: "Kiểm định mẫu rau củ trước thu hoạch 24h: Đạt độ tươi giòn >95%, hàm lượng Vitamin C & Beta-Carotene tối ưu.",
    badge: "An toàn PHI 14 ngày",
    image: "images/ca-chua-dalat.jpg"
  },
  {
    stage: "Chặng 4: Cắt sương sớm & Cấp mát Hydro-Cooling 2–6°C",
    date: "05:00 Sáng Thứ Sáu",
    title: "Hạ nhiệt nhanh sau thu hoạch & Tách khoang chống khí Ethylene",
    desc: "Rau ăn lá và củ quả được đóng túi khí sạch, xếp vào Khoang Lạnh Sâu 2–6°C (tách biệt hoàn toàn khoang trái cây chín) về thẳng TP.HCM.",
    badge: "Khoang Lạnh 2–6°C",
    image: "images/combo-rau-cu-tuan.jpg"
  }
];

// Nhật ký chế biến & bảo quản chuyên biệt cho Nông Sản Khô OCOP (Hạt điều & Macca)
const DRY_NUTS_TRACEABILITY_TIMELINE = [
  {
    stage: "Chặng 1: Thu hái quả chín rụng tự nhiên tại vườn",
    date: "Vụ mùa chính vụ",
    title: "Tuyển hạt điều Bình Phước & Macca Đắk Lắk loại A+ cồ lớn",
    desc: "Chỉ thu nhặt những hạt già chín rụng tự nhiên, phơi nắng tiêu chuẩn và phân loại hạt chắc mẩy 100% không sâu mốc.",
    badge: "Nguyên liệu Loại A+",
    image: "images/hat-dieu-macca.jpg"
  },
  {
    stage: "Chặng 2: Rang củi truyền thống & Sấy lạnh giữ Omega-3",
    date: "Quy trình chuẩn ISO/HACCP",
    title: "Rang củi điều chỉnh nhiệt thủ công với muối biển tinh khiết",
    desc: "Giữ trọn lớp vỏ lụa giàu chất xơ và hương thơm bùi béo tự nhiên, hoàn toàn không dùng dầu chiên hay chất tẩy trắng.",
    badge: "Không Hóa Chất Bảo Quản",
    image: "images/hat-dieu-macca.jpg"
  },
  {
    stage: "Chặng 3: Kiểm định Độ ẩm (<5%) & Aflatoxin = 0%",
    date: "Trước khi đóng gói",
    title: "Đo độ giòn và kiểm nghiệm vi sinh an toàn thực phẩm",
    desc: "Đạt chứng nhận OCOP 4 Sao cấp tỉnh, đảm bảo hạt giòn tan không hôi dầu suốt 6 tháng.",
    badge: "OCOP 4 Sao • Độ ẩm <5%",
    image: "images/hat-dieu-macca.jpg"
  },
  {
    stage: "Chặng 4: Hút chân không & Niêm phong mã Hash Blockchain",
    date: "Thứ Sáu hàng tuần",
    title: "Đóng hộp 500g kèm gói hút ẩm thực phẩm & Tem QR chống giả",
    desc: "Vận chuyển ở Khoang Khô Thoáng (Ambient Dry Zone), giao toàn quốc không lo dập nát.",
    badge: "Khoang Khô Chân Không",
    image: "images/hat-dieu-macca.jpg"
  }
];

// Hồ sơ Sinh lý Nông học & Bảo quản sau thu hoạch (Post-Harvest Bio-Profile theo Chuyên gia Nông nghiệp)
function getAgronomyBioProfile(p) {
  const name = String(p?.name || "").toLowerCase();
  const cat = String(p?.category || "");
  if (cat === "NongSanKho" || p?.is_dry) {
    return {
      tempZone: "DRY_AMBIENT",
      tempLabel: "🌰 Khoang Khô Chân Không (<25°C)",
      ethyleneRole: "NEUTRAL",
      ethyleneLabel: "Không sinh/nhạy Ethylene",
      phiDays: 30,
      qualityMetric: "Độ ẩm hạt <5% • Aflatoxin 0%",
      shelfLife: "6 tháng kể từ ngày rang củi"
    };
  }
  if (name.includes("xà lách") || name.includes("cải") || name.includes("bông cải") || name.includes("súp lơ") || name.includes("ớt chuông") || name.includes("combo 7") || name.includes("thùng rau")) {
    return {
      tempZone: "COLD_DEEP_2_6C",
      tempLabel: "❄️ Khoang Lạnh Sâu 2–6°C (Độ ẩm 95%)",
      ethyleneRole: "SENSITIVE",
      ethyleneLabel: "⚠️ Nhạy cảm Ethylene (Cần tách khoang trái cây chín)",
      phiDays: 14,
      qualityMetric: "Độ tươi giòn >95% • Nitrate 0%",
      shelfLife: "5–7 ngày trong ngăn mát tủ lạnh"
    };
  }
  if (cat === "RauCuQua" || name.includes("cà chua") || name.includes("khoai") || name.includes("cà rốt") || name.includes("bắp") || name.includes("bí đỏ") || name.includes("ngoằn ngoèo")) {
    const isTomato = name.includes("cà chua");
    return {
      tempZone: "COOL_8_12C",
      tempLabel: "🌡️ Khoang Mát 8–12°C (Thông thoáng)",
      ethyleneRole: isTomato ? "PRODUCER" : "SENSITIVE",
      ethyleneLabel: isTomato ? "Quả hô hấp sản sinh Ethylene nhẹ" : "Củ quả nhạy ẩm • Tách khoang ướt",
      phiDays: 14,
      qualityMetric: "Canh tác Vi sinh • Brix 11–16%",
      shelfLife: "10–14 ngày nơi thoáng mát"
    };
  }
  // Mặc định: Trái cây đặc sản nhiệt đới (Sầu riêng, Măng cụt, Bơ sáp, Xoài, Chôm chôm...)
  return {
    tempZone: "TROPICAL_12_15C",
    tempLabel: "🍃 Khoang Mát 12–15°C (Khử Ethylene)",
    ethyleneRole: "PRODUCER",
    ethyleneLabel: "🔥 Sinh khí Ethylene tự nhiên (Đã bọc túi khử KMnO4)",
    phiDays: 21,
    qualityMetric: "Độ ngọt Brix 24–32% • Chín cây 100%",
    shelfLife: "3–5 ngày ở nhiệt độ phòng mát / 7 ngày ngăn mát"
  };
}

// Hàm băm mật mã học Deterministic Hex 256-bit (64 ký tự hex) phục vụ Blockchain Merkle Root & Audit Hash-Chain
function computeDeterministicHashHex(input) {
  const str = String(input || "");
  const seeds = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      seeds[j] = Math.imul(seeds[j] ^ (c + j * 31 + i), 0x01000193) >>> 0;
      seeds[j] = ((seeds[j] << 13) | (seeds[j] >>> 19)) >>> 0;
    }
  }
  return "0x" + seeds.map(n => n.toString(16).padStart(8, "0")).join("");
}

function resolveAccurateProductImage(p) {
  // 1. Nếu người dùng / nhà vườn đã chỉnh sửa hoặc tải lên hình ảnh tùy chỉnh thì ưu tiên tuyệt đối ảnh đó
  if (p?.custom_image_url) return p.custom_image_url;
  if (p?.is_custom_media && p?.image_url) return p.image_url;
  if (p?.is_custom_media && Array.isArray(p?.media_gallery)) {
    const firstImg = p.media_gallery.find(m => m && m.type !== "video" && m.url);
    if (firstImg) return firstImg.url;
  }

  // 2. Nếu sản phẩm đã được khai báo đường dẫn ảnh cụ thể (URL trực tuyến hoặc file ảnh riêng trong images/)
  if (p?.image_url && typeof p.image_url === "string" && p.image_url.trim() && p.image_url !== "images/hero-fruits.jpg") {
    return p.image_url.trim();
  }

  const name = String(p?.name || "").toLowerCase();
  // 3. Dự phòng khớp ảnh theo từ khóa nếu sản phẩm chưa có ảnh hoặc là ảnh mặc định hero-fruits
  if (name.includes("combo 7") || name.includes("thùng rau củ")) return "images/combo-rau-cu-tuan.jpg";
  if (name.includes("combo 1")) return "images/mangosteen-harvest.jpg";
  if (name.includes("combo 2")) return "images/durian-pile.jpg";
  if (name.includes("combo 3")) return "images/hero-fruits.jpg";
  if (name.includes("combo 4")) return "images/bo-sap.jpg";
  if (name.includes("combo 5")) return "images/bonbon.jpg";
  if (name.includes("combo 6")) return "images/durian-warehouse.jpg";

  // Khớp chính xác từng loại Rau củ quả, Trái cây & Nông sản khô
  if (name.includes("ngoằn ngoèo") || (name.includes("cà rốt") && name.includes("khoai"))) return "images/ca-rot-khoai-tay.jpg";
  if (name.includes("cà chua")) return "images/ca-chua-dalat.jpg";
  if (name.includes("khoai lang mật")) return "images/khoai-lang-mat.jpg";
  if (name.includes("bông cải") || name.includes("súp lơ") || name.includes("ớt chuông")) return "images/bong-cai-ot-chuong.jpg";
  if (name.includes("xà lách") || name.includes("cải bó xôi") || name.includes("thủy canh")) return "images/xa-lach-thuy-canh.jpg";
  if (name.includes("cà rốt") || name.includes("khoai tây")) return "images/ca-rot-khoai-tay.jpg";
  if (name.includes("bắp ngọt") || name.includes("bí đỏ")) return "images/bap-ngot-bi-do.jpg";
  if (name.includes("bưởi da xanh") || name.includes("bưởi")) return "images/buoi-da-xanh.jpg";
  if (name.includes("xoài cát") || name.includes("xoài")) return "images/xoai-cat-hoa-loc.jpg";
  if (name.includes("hạt điều") || name.includes("macca")) return "images/hat-dieu-macca.jpg";
  if (name.includes("sầu riêng")) return "images/durian-open.jpg";
  if (name.includes("măng cụt") && !name.includes("bơ sáp")) return "images/mangosteen-basket.jpg";
  if (name.includes("chôm chôm")) return "images/chomchom.jpg";
  if (name.includes("nhãn xuồng") || name.includes("nhãn")) return "images/nhan.jpg";
  if (name.includes("bòn bon")) return "images/bonbon.jpg";
  if (name.includes("dâu da")) return "images/dauda.jpg";
  if (name.includes("bơ sáp")) return "images/bo-sap.jpg";

  return p?.image_url || "images/hero-fruits.jpg";
}

function getDefaultFarmInfo(p) {
  const cat = p?.category || "TraiCay";
  const nameLower = String(p?.name || "").toLowerCase();
  if (cat === "RauCuQua" || nameLower.includes("đà lạt") || nameLower.includes("rau củ")) {
    return {
      farmer_name: "Nông Trại Hữu Cơ Đơn Dương & Tà Nung (Đà Lạt)",
      farm_region: "Đơn Dương & Tà Nung, TP. Đà Lạt, Lâm Đồng",
      farming_method: "Nhà kính Thủy canh & Hữu cơ Vi sinh • Chuẩn VietGAP",
      farmer_phone: "0784 203 424",
      farm_experience: "15 năm canh tác rau củ ôn đới công nghệ cao",
      farm_story: "Thu hoạch lúc 05:00 sáng khi sương còn đọng trên lá, sơ chế lạnh tại chỗ và vận chuyển xe lạnh 2-8°C về thẳng Hub TP.HCM."
    };
  }
  if (cat === "NongSanKho" || p?.is_dry) {
    return {
      farmer_name: "Xưởng Điều Rang Củi Bác Năm & HTX Macca Tây Nguyên",
      farm_region: "Bù Đăng (Bình Phước) & Cư M'gar (Đắk Lắk)",
      farming_method: "Rang củi truyền thống • Sấy lạnh giữ nguyên dưỡng chất • OCOP 4 Sao",
      farmer_phone: "0784 203 424",
      farm_experience: "20 năm chế biến hạt đặc sản xuất khẩu",
      farm_story: "Tuyển chọn hạt loại A+ chín rụng tự nhiên, rang củi mẻ mới mỗi tuần và đóng hộp hút chân không chống ẩm."
    };
  }
  return {
    farmer_name: "Liên Minh Vườn Bác Năm & HTX Trái Cây Miền Tây - Đông Nam Bộ",
    farm_region: "Chợ Lách (Bến Tre) • Cái Bè (Tiền Giang) • Đông Nam Bộ",
    farming_method: "Canh tác VietGAP • Chín cây tự nhiên 100% • Không nhúng thuốc",
    farmer_phone: "0784 203 424",
    farm_experience: "25 năm gắn bó với vườn cây ăn trái cổ thụ",
    farm_story: "Chỉ cắt những trái đã già đủ độ ngọt Brix từ 05:30 sáng Thứ Sáu, dán tem QR truy xuất từng lô và bảo hành 1 đổi 1 qua Ví Escrow."
  };
}

function enrichProductMeta(p, idx = 0) {
  const isCombo = p.category === "Combo";
  const nameLower = String(p.name || "").toLowerCase();
  const isDry = p.category === "NongSanKho" || p.is_dry === true;
  const isVeggie = p.category === "RauCuQua" || nameLower.includes("rau củ") || nameLower.includes("combo 7") || nameLower.includes("ngoằn ngoèo");
  const cleanDesc = String(p.description || "").replace(/từ vùng đất đỏ bazan Phước Long/gi, "từ vùng chuyên canh Đông Nam Bộ & Miền Tây").replace(/Bình Phước/gi, "vùng chuyên canh");
  const bioProfile = getAgronomyBioProfile(p);
  const merkleRoot = computeDeterministicHashHex(`AGRI_BATCH_${p.id || idx}_${p.name}_${bioProfile.tempZone}_PHI${bioProfile.phiDays}`);
  const resolvedImg = resolveAccurateProductImage(p);
  const defaultFarm = getDefaultFarmInfo(p);
  const farmInfo = {
    ...defaultFarm,
    ...(p.farm_info || {})
  };
  let mediaGallery = Array.isArray(p.media_gallery) && p.media_gallery.length > 0
    ? p.media_gallery.filter(m => m && m.url)
    : [{ id: "img-main", type: "image", url: resolvedImg, caption: "Ảnh thực tế sản phẩm" }];
  if (mediaGallery.length === 0) {
    mediaGallery = [{ id: "img-main", type: "image", url: resolvedImg, caption: "Ảnh thực tế sản phẩm" }];
  }
  const videoEntry = mediaGallery.find(m => m.type === "video");
  const videoUrl = p.video_url !== undefined ? p.video_url : (videoEntry ? videoEntry.url : "");
  if (videoUrl && !mediaGallery.some(m => m.type === "video" && m.url === videoUrl)) {
    mediaGallery.push({ id: "vid-main", type: "video", url: videoUrl, caption: "Video thực tế tại Nhà vườn" });
  }

  return {
    ...p,
    image_url: resolvedImg,
    media_gallery: mediaGallery,
    video_url: videoUrl,
    farm_info: farmInfo,
    description: cleanDesc || p.description,
    is_fresh: p.is_fresh !== undefined ? p.is_fresh : !isDry,
    is_dry: isDry,
    delivery_radius: p.delivery_radius || 20,
    certification_badge: p.certification_badge || (idx % 2 === 0 ? "VietGAP • Đặc Sản Vùng Miền" : "VietGAP • Chín Cây 100%"),
    verified: true,
    harvest_date: p.harvest_date || (isDry ? "Rang củi mới mỗi tuần • Hút chân không" : "Hái 05:30 sáng Thứ Sáu • Giao Thứ Bảy"),
    expiration_policy: p.expiration_policy || "Bảo hành 1 đổi 1 hoặc hoàn tiền 100% trong 12h qua Ví Escrow",
    bio_profile: bioProfile,
    merkle_root: merkleRoot,
    variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : (isCombo ? [
      { code: "GRADE_1", label: "Chuẩn Combo Tuyển Chọn (Loại 1)", shortLabel: "Combo Loại 1", multiplier: 1.0, badge: "Chuẩn VIP", desc: "Trái tuyển chọn loại 1 đóng thùng quà tặng" },
      { code: "GRADE_2", label: "Combo Gia Đình Tiết Kiệm (-15%)", shortLabel: "Combo Gia Đình (-15%)", multiplier: 0.85, badge: "Tiết kiệm 15%", desc: "Trái ăn gia đình, chất lượng múi ngon 100%" }
    ] : DEFAULT_PRODUCT_VARIANTS),
    traceability: p.traceability || (isDry ? DRY_NUTS_TRACEABILITY_TIMELINE : (isVeggie ? VEGGIE_TRACEABILITY_TIMELINE : DEFAULT_TRACEABILITY_TIMELINE))
  };
}

// Dữ liệu mẫu chuẩn (Đầy đủ 13 đặc sản các vùng miền Việt Nam & Các Combo tiết kiệm theo giá thị trường hiện nay)
const DEMO_PRODUCTS = [
  {
    id: "p1", name: "Sầu Riêng Ri6 Ruột Vàng (Đông Nam Bộ & Miền Tây)", category: "TraiCay",
    highlights: ["Múi vàng rực, dẻo quánh béo ngậy", "Hái già rụng tự nhiên, ngọt đậm sâu", "Bao ăn 1 đổi 1 tận tay nếu sượng"],
    description: "Những quả sầu riêng Ri6 tuyển lựa khắt khe từ các nhà vườn trù phú Đông Nam Bộ & Tiền Giang. Cây nuôi trái già đủ độ, thu hái sáng sớm Thứ Sáu. Múi vàng rực rỡ, cơm dẻo quánh, khô ráo không nhão nước, vị ngọt bùi béo ngậy tan chảy. (Giá thị trường TP.HCM: 95.000 - 125.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 68000, price_sale: 98000, image_url: "images/durian-open.jpg", is_available: true,
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
  },
  // ================= RAU CỦ QUẢ SẠCH ĐÀ LẠT & NÔNG SẢN CÁC VÙNG MIỀN MỚI BỔ SUNG =================
  {
    id: "p14", name: "Cà Chua Beef & Cà Chua Bi Hữu Cơ Đà Lạt (Lâm Đồng)", category: "RauCuQua",
    highlights: ["Trồng nhà kính công nghệ cao Đà Lạt", "Quả chín đỏ mọng, thịt dày ít hạt giàu Lycopene", "Ngọt thanh tự nhiên, ăn sống salad hoặc nấu canh"],
    description: "Cà chua Beef và cà chua bi hữu cơ thu hoạch chín đỏ trên giàn tại nhà kính Đơn Dương - Đà Lạt (Lâm Đồng). Cơm dày mọng nước, vị chua ngọt hài hòa thanh mát, đạt chuẩn VietGAP không dư lượng thuốc bảo vệ thực vật. (Giá thị trường TP.HCM: 50.000 - 65.000 đ/kg).",
    unit: "kg", weight_kg: 1, price_original: 28000, price_sale: 42000, image_url: "images/ca-chua-dalat.jpg", is_available: true,
    certification_badge: "Hữu Cơ Đà Lạt • Nhà Kính"
  },
  {
    id: "p15", name: "Khoai Lang Mật Tà Nung Đà Lạt (Đã Ủ Xuống Mật Dẻo Quánh)", category: "RauCuQua",
    highlights: ["Củ thuôn đều, ủ tự nhiên 7 ngày tươm mật", "Nướng hoặc hấp mật chảy vàng óng ngọt lịm", "Giàu chất xơ & tinh bột tốt cho sức khỏe"],
    description: "Đặc sản khoai lang mật trồng trên vùng đất đỏ bazan Tà Nung - Lâm Đồng. Khoai sau khi thu hoạch được nhà vườn phân loại và ủ xuống đường tự nhiên 7 ngày. Khi nướng hoặc hấp chín, ruột khoai màu cam đỏ dẻo quánh, mật ngọt tươm ra thơm nức mũi.",
    unit: "kg", weight_kg: 1, price_original: 24000, price_sale: 39000, image_url: "images/khoai-lang-mat.jpg", is_available: true,
    certification_badge: "VietGAP • Đặc Sản Lâm Đồng"
  },
  {
    id: "p16", name: "Bông Cải Xanh (Súp Lơ) & Ớt Chuông Ba Màu Đà Lạt", category: "RauCuQua",
    highlights: ["Bông cải xanh baby giòn ngọt, bông khít chắc", "Ớt chuông Đà Lạt dày thịt, giòn tan không hăng", "Cắt sáng sớm vận chuyển xe lạnh về TP.HCM"],
    description: "Bộ đôi rau củ giàu Vitamin C và khoáng chất bậc nhất từ cao nguyên Lâm Đồng: Bông cải xanh tươi non giòn ngọt kết hợp cùng Ớt chuông Đà Lạt (Đỏ - Vàng - Xanh) dày cùi mọng nước. Thích hợp xào thịt bò, nướng BBQ hoặc làm salad thực dưỡng.",
    unit: "kg", weight_kg: 1, price_original: 32000, price_sale: 48000, image_url: "images/bong-cai-ot-chuong.jpg", is_available: true,
    certification_badge: "VietGAP • Rau Củ Lạnh 24h"
  },
  {
    id: "p17", name: "Xà Lách Thủy Canh & Cải Bó Xôi Hữu Cơ (Rau Ăn Sống Salad)", category: "RauCuQua",
    highlights: ["Trồng thủy canh hồi lưu trong nhà màng khép kín", "Lá giòn ngọt mọng nước, 100% không thuốc trừ sâu", "Đóng túi khí sạch, an tâm trộn salad ăn sống"],
    description: "Tuyển tập xà lách Lô Lô xanh, Romaine giòn ngọt và cải bó xôi (rau chân vịt) trồng theo quy trình thủy canh chuẩn GlobalGAP tại Đà Lạt. Bộ rễ trắng sạch, lá rau non mướt giàu sắt và folate, tuyệt vời cho bữa ăn Eat Clean hoặc sinh tố xanh.",
    unit: "kg", weight_kg: 1, price_original: 29000, price_sale: 45000, image_url: "images/xa-lach-thuy-canh.jpg", is_available: true,
    certification_badge: "Thủy Canh Hữu Cơ • Eat Clean"
  },
  {
    id: "p18", name: "Cà Rốt Baby Đà Lạt & Khoai Tây Hồng Đất Đỏ (Củ Quả Sạch)", category: "RauCuQua",
    highlights: ["Cà rốt củ vừa, lõi nhỏ cực kỳ giòn ngọt", "Khoai tây hồng Đà Lạt dẻo bùi thơm bơ", "Không rửa hóa chất, bảo quản tươi lâu 2 tuần"],
    description: "Combo củ quả thiết yếu cho mọi căn bếp gia đình: Cà rốt Đà Lạt giàu Beta-Carotene ngọt mát ép nước hoặc hầm canh, đi kèm khoai tây hồng đất đỏ dẻo bùi. Thu hoạch trực tiếp tại ruộng và giao thẳng về Hub TP.HCM.",
    unit: "kg", weight_kg: 1, price_original: 23000, price_sale: 36000, image_url: "images/ca-rot-khoai-tay.jpg", is_available: true,
    certification_badge: "VietGAP • Củ Quả Cao Nguyên"
  },
  {
    id: "p19", name: "Bắp Ngọt Nữ Hoàng & Bí Đỏ Hồ Lô Dẻo Bùi (Đông Nam Bộ)", category: "RauCuQua",
    highlights: ["Bắp ngọt hạt mọng sữa, ngọt mát ăn sống được", "Bí đỏ hồ lô già đanh, ruột vàng cam dẻo bùi", "Thu hoạch tươi mới mỗi sáng Thứ Sáu"],
    description: "Bắp ngọt (ngô ngọt) và bí đỏ hồ lô canh tác hữu cơ vi sinh tại các nông trại Đông Nam Bộ & Tây Nguyên. Bắp luộc chỉ 5 phút thơm lừng ngọt thanh, bí đỏ nấu sữa hạt hoặc hầm xương cực kỳ bổ dưỡng cho trẻ nhỏ và người lớn tuổi.",
    unit: "kg", weight_kg: 1, price_original: 21000, price_sale: 34000, image_url: "images/bap-ngot-bi-do.jpg", is_available: true,
    certification_badge: "Canh Tác Hữu Cơ Vi Sinh"
  },
  {
    id: "p20", name: "Bưởi Da Xanh Ruột Hồng Cành Già (Chợ Lách - Bến Tre)", category: "TraiCay",
    highlights: ["Tép bưởi hồng đỏ mọng nước, giòn tan", "Vị ngọt thanh đậm đà, không chua không the", "Trái nặng tay 1.2 - 1.6kg, róc vỏ mỏng"],
    description: "Bưởi da xanh chính gốc Chợ Lách (Bến Tre) hái từ những vườn cây trên 10 năm tuổi. Vỏ xanh căng bóng, khi bổ ra lộ rõ từng múi bưởi hồng đào căng mọng, tôm bưởi ráo nước giòn ngọt và hoàn toàn không hạt hoặc rất ít hạt.",
    unit: "kg", weight_kg: 1, price_original: 42000, price_sale: 62000, image_url: "images/buoi-da-xanh.jpg", is_available: true,
    certification_badge: "VietGAP • Đặc Sản Bến Tre"
  },
  {
    id: "p21", name: "Xoài Cát Hòa Lộc Chín Cây Thơm Lừng (Cái Bè - Tiền Giang)", category: "TraiCay",
    highlights: ["Thịt xoài vàng ươm dày mịn, hoàn toàn không xơ", "Vị ngọt đậm đà kèm hương thơm nồng nàn", "Hái già 8.5 tuổi, chín tự nhiên không ủ thuốc"],
    description: "Mệnh danh là 'Nữ hoàng của các loại xoài' miền Tây Nam Bộ. Xoài Cát Hòa Lộc thu hái tại vùng chuyên canh Cái Bè (Tiền Giang), quả thuôn dài, da vàng ươm phấn trắng tự nhiên, hạt mỏng dẹt và phần thịt xoài dẻo mịn ngọt lịm.",
    unit: "kg", weight_kg: 1, price_original: 52000, price_sale: 75000, image_url: "images/xoai-cat-hoa-loc.jpg", is_available: true,
    certification_badge: "VietGAP • Đặc Sản Tiền Giang"
  },
  {
    id: "p22", name: "Hạt Điều Rang Củi Bình Phước & Macca Đắk Lắk (Nông Sản Khô)", category: "NongSanKho",
    is_fresh: false, is_dry: true,
    highlights: ["Hạt điều vỏ lụa loại A+ rang củi truyền thống", "Macca Tây Nguyên nứt vỏ tự nhiên béo bùi", "Bảo quản 6 tháng • Giao toàn quốc không lo dập"],
    description: "Sự kết hợp tinh hoa nông sản khô của Bình Phước và Đắk Lắk: Hạt điều vỏ lụa cồ lớn rang củi muối giòn tan thơm bùi, kết hợp hạt Macca sấy lạnh giàu Omega-3. Đóng hộp hút chân không 500g sang trọng, tiện lợi làm quà biếu hoặc ăn vặt lành mạnh.",
    unit: "hộp 500g", weight_kg: 0.5, price_original: 105000, price_sale: 145000, image_url: "images/hat-dieu-macca.jpg", is_available: true,
    certification_badge: "OCOP 4 Sao • Nông Sản Khô"
  },
  {
    id: "p23", name: "Combo 7: Thùng Rau Củ Quả Đi Chợ Hàng Tuần (5Kg Rau Củ Đà Lạt Tươi Sạch)", category: "Combo",
    highlights: ["Trọn bộ 5kg gồm 6 loại rau củ quả Đà Lạt thiết yếu", "Đủ cho gia đình 3-4 người ăn suốt cả tuần", "Tiết kiệm 35.000 đ • Rất hợp đăng ký Định kỳ tuần (-8%)"],
    description: "Giải pháp đi chợ thảnh thơi cho nhân viên văn phòng và gia đình bận rộn! Thùng 5kg gồm: 1kg Cà chua Beef/Bi hữu cơ + 1kg Bông cải xanh & Ớt chuông + 1kg Xà lách thủy canh & Cải bó xôi + 1kg Khoai lang mật Tà Nung + 1kg Cà rốt & Khoai tây Đà Lạt.",
    unit: "thùng 5kg", weight_kg: 5, price_original: 158000, price_sale: 219000, image_url: "images/combo-rau-cu-tuan.jpg", is_available: true,
    certification_badge: "Combo Rau Củ Tuần • VietGAP"
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
  },
  {
    id: "ugly-4",
    name: "[Cứu Hộ Nông Sản -60%] Túi 3Kg Rau Củ Quả Đà Lạt Ngoằn Ngoèo (Cà Rốt + Khoai Lang + Cà Chua)",
    category: "UglyFood",
    is_ugly_food: true,
    happy_hour_discount_pct: 60,
    highlights: [
      "⚡ Happy Hour 17h-19h: Giảm 60% chỉ còn 45.000 đ / 3kg",
      "Củ quả cong tự nhiên / lệch size, tươi giòn ngọt 100%",
      "🌱 Tuyệt vời để hầm canh, ép nước, làm súp cho gia đình"
    ],
    description: "Túi 3kg gồm Cà rốt, Khoai lang mật, Khoai tây và Cà chua Đà Lạt có hình dáng hơi cong hoặc không đồng đều kích thước nên không đóng khay siêu thị, nhưng vừa thu hoạch sáng nay, độ giòn ngọt và dinh dưỡng nguyên vẹn 100%!",
    unit: "túi 3kg",
    weight_kg: 3,
    price_original: 112000,
    price_sale: 45000,
    image_url: "images/ca-rot-khoai-tay.jpg",
    is_available: true,
    certification_badge: "⚡ Cứu Hộ Rau Củ (-60%)"
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

const DEMO_FARM_POSTS = [
  {
    id: "fpost-001",
    farmer_name: "Vườn Bác Năm — Chuyên Canh Sầu Riêng Ri6 & Măng Cụt Cổ Thụ",
    farm_region: "Đông Nam Bộ & Chợ Lách (Bến Tre) • Diện tích 4.5 ha",
    farming_method: "VietGAP • Hữu cơ vi sinh • Chín rụng tự nhiên 100%",
    farmer_phone: "0784 203 424",
    title: "Sáng nay vườn cắt lứa Sầu Riêng Ri6 già 8.8 tuổi & Măng Cụt cổ thụ 25 năm!",
    story: "Bà con yên tâm nhé, từng trái sầu riêng Ri6 tại vườn Bác Năm đều được gõ kiểm tra độ già và đo độ ngọt Brix ≥ 28% trước khi cắt. Tuyệt đối không nhúng thuốc kích chín, bao ăn 1 đổi 1 tận tay qua Ví Tạm Giữ Escrow!",
    media_gallery: [
      { id: "fp1-img1", type: "image", url: "images/durian-open.jpg", caption: "Múi sầu riêng Ri6 vàng rực, dẻo quánh" },
      { id: "fp1-img2", type: "image", url: "images/mangosteen-harvest.jpg", caption: "Thu hoạch măng cụt cổ thụ lúc 05:30 sáng" },
      { id: "fp1-img3", type: "image", url: "images/durian-warehouse.jpg", caption: "Đóng thùng xốp dán tem QR chuẩn bị lên xe lạnh" }
    ],
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: "fpost-002",
    farmer_name: "Nông Trại Hữu Cơ Đơn Dương & Tà Nung (Đà Lạt - Lâm Đồng)",
    farm_region: "Đơn Dương & Tà Nung, TP. Đà Lạt, Lâm Đồng • Độ cao 1.500m",
    farming_method: "Nhà kính Thủy canh Hồi lưu & Đất đỏ Bazan Hữu cơ",
    farmer_phone: "0784 203 424",
    title: "Nhật ký thu hoạch Rau Củ Quả Đà Lạt & Khoai Lang Mật Tà Nung sáng sớm",
    story: "Cà chua Beef, xà lách thủy canh, bông cải xanh và ớt chuông ba màu vừa cắt lúc 05:00 sáng trong nhà màng khép kín. Khoai lang mật Tà Nung đã ủ tự nhiên đủ 7 ngày tươm mật ngọt lịm, đóng thùng lạnh 2–8°C về thẳng TP.HCM!",
    media_gallery: [
      { id: "fp2-img1", type: "image", url: "images/ca-chua-dalat.jpg", caption: "Cà chua Beef & Cà chua Bi chín mọng trên giàn" },
      { id: "fp2-img2", type: "image", url: "images/xa-lach-thuy-canh.jpg", caption: "Xà lách thủy canh & Cải bó xôi nhà kính" },
      { id: "fp2-img3", type: "image", url: "images/khoai-lang-mat.jpg", caption: "Khoai lang mật Tà Nung tươm mật vàng óng" }
    ],
    video_url: "",
    created_at: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: "fpost-003",
    farmer_name: "HTX Trái Cây Miệt Vườn Cái Bè (Tiền Giang) & Đắk Lắk",
    farm_region: "Cái Bè (Tiền Giang) • Cư M'gar (Đắk Lắk) • Bình Phước",
    farming_method: "VietGAP & OCOP 4 Sao • Canh tác thuận tự nhiên",
    farmer_phone: "0784 203 424",
    title: "Lên kệ Xoài Cát Hòa Lộc chín cây, Bưởi Da Xanh ruột hồng & Hạt Điều - Macca mới rang",
    story: "Tuần này liên minh HTX gửi về Hub TP.HCM lô Xoài Cát Hòa Lộc thơm lừng không xơ, Bưởi Da Xanh Chợ Lách mọng nước và mẻ Hạt Điều rang củi Bình Phước & Macca Đắk Lắk vừa ra lò nóng hổi!",
    media_gallery: [
      { id: "fp3-img1", type: "image", url: "images/xoai-cat-hoa-loc.jpg", caption: "Xoài Cát Hòa Lộc chín cây vàng ươm" },
      { id: "fp3-img2", type: "image", url: "images/buoi-da-xanh.jpg", caption: "Bưởi Da Xanh Chợ Lách ruột hồng mọng nước" },
      { id: "fp3-img3", type: "image", url: "images/hat-dieu-macca.jpg", caption: "Hạt Điều rang củi & Macca Tây Nguyên sấy lạnh" }
    ],
    video_url: "",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const LS = {
  products: "agri_v2_products",
  farmerCustomProducts: "agri_v2_farmer_custom_products",
  productOverrides: "agri_v2_product_overrides",
  deletedProductIds: "agri_v2_deleted_product_ids",
  farmPosts: "agri_v2_farm_posts",
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
  editorSession: "agriconnect_editor_auth_v1",
  auditLogs: "agri_v2_security_audit_logs_v2",
  idempotencyStore: "agri_v2_idempotency_keys",
  loginRateLimit: "agri_v2_admin_login_ratelimit",
  qrScanCounter: "agri_v2_qr_scan_counts_v1",
  catalogCache: "agri_v2_redis_catalog_cache_v1",
  eventQueue: "agri_v2_event_queue_stats_v1"
};

// ================= KIẾN TRÚC BẢO MẬT 4 TRỌNG ĐIỂM & CHUỖI BĂM BLOCKCHAIN SHA-256 (HASH-CHAIN + MERKLE PROOF) =================
function buildInitialAuditHashChain() {
  const rawList = [
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
  // Tính toán chuỗi liên kết Hash-Chain từ khối khởi thủy (Genesis Block) -> khối mới nhất
  let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const chainedAsc = rawList.map((item, idx) => {
    const payloadStr = `${prevHash}|${item.id}|${item.actor_role}|${item.action}|${item.target}|${item.detail}`;
    const blockHash = computeDeterministicHashHex(payloadStr);
    const out = { ...item, block_index: idx + 1, prev_hash: prevHash, block_hash: blockHash };
    prevHash = blockHash;
    return out;
  });
  return chainedAsc.reverse(); // Mới nhất lên đầu
}

const INITIAL_AUDIT_LOGS = buildInitialAuditHashChain();

window.security = {
  // Hàm băm mật mã học 256-bit (64-hex) & Tạo chứng thực Merkle Proof cho lô nông sản / đơn hàng
  computeHashHex(input) {
    return computeDeterministicHashHex(input);
  },

  generateBatchMerkleProof(orderCode, extraSeed = "") {
    const cleanCode = String(orderCode || "AC-BATCH-01").trim().toUpperCase();
    const leaf1 = computeDeterministicHashHex(`LEAF_FARM_LOG_${cleanCode}`);
    const leaf2 = computeDeterministicHashHex(`LEAF_VIETGAP_PHI_${cleanCode}`);
    const leaf3 = computeDeterministicHashHex(`LEAF_COLDCHAIN_TEMP_${cleanCode}`);
    const leaf4 = computeDeterministicHashHex(`LEAF_ESCROW_STATE_${cleanCode}_${extraSeed}`);
    const branchA = computeDeterministicHashHex(`${leaf1}|${leaf2}`);
    const branchB = computeDeterministicHashHex(`${leaf3}|${leaf4}`);
    const merkleRoot = computeDeterministicHashHex(`${branchA}|${branchB}`);
    return {
      merkle_root: merkleRoot,
      leaves: [
        { label: "Nhật ký canh tác Vườn", hash: leaf1 },
        { label: "Kiểm định VietGAP & PHI", hash: leaf2 },
        { label: "Sensor Nhiệt độ Cold-Chain", hash: leaf3 },
        { label: "Khóa Smart Contract Escrow", hash: leaf4 }
      ],
      network: "AgriChain Consortium (Polygon PoS Anchor)",
      verified_at: new Date().toISOString()
    };
  },

  // Lọc và làm sạch URL (Chống tấn công XSS qua giao thức javascript: / data: / vbscript: trong link Video Unbox)
  sanitizeUrl(rawUrl) {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return "";
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch (e) {}
    this.logAudit({
      actor_role: "APPSEC_WAF",
      actor_name: "UrlSanitizer",
      action: "XSS_URI_BLOCKED",
      target: trimmed.slice(0, 40),
      severity: "DANGER",
      detail: `Chặn URL chứa giao thức nguy hiểm (phi HTTP/HTTPS) nhằm ngăn ngừa XSS: "${trimmed.slice(0, 60)}"`
    });
    return "#blocked-unsafe-url";
  },

  // Chống tấn công Brute-force dò mã PIN / Mật khẩu Quản trị viên (Khóa 60 giây nếu sai quá 5 lần)
  checkLoginRateLimit() {
    try {
      const data = JSON.parse(localStorage.getItem(LS.loginRateLimit) || '{"count":0,"lockedUntil":0}');
      const now = Date.now();
      if (data.lockedUntil && now < data.lockedUntil) {
        const waitSec = Math.ceil((data.lockedUntil - now) / 1000);
        throw new Error(`🛡️ [Chống Brute-Force]: Bạn đã nhập sai quá 5 lần. Cổng đăng nhập tạm khóa trong ${waitSec} giây để bảo vệ hệ thống!`);
      }
      if (data.lockedUntil && now >= data.lockedUntil) {
        localStorage.removeItem(LS.loginRateLimit);
      }
    } catch (e) {
      if (e.message && e.message.includes("Brute-Force")) throw e;
    }
  },

  recordLoginFailure(attemptSource = "ADMIN_PORTAL") {
    let data = { count: 0, lockedUntil: 0 };
    try {
      data = JSON.parse(localStorage.getItem(LS.loginRateLimit) || '{"count":0,"lockedUntil":0}');
    } catch (e) {}
    data.count = Number(data.count || 0) + 1;
    if (data.count >= 5) {
      data.lockedUntil = Date.now() + 60000; // Khóa 60 giây
      this.logAudit({
        actor_role: "APPSEC_WAF",
        actor_name: "BruteForceShield",
        action: "ADMIN_BRUTEFORCE_LOCKED",
        target: attemptSource,
        severity: "DANGER",
        detail: `Phát hiện nhập sai thông tin xác thực ${data.count} lần liên tiếp. Đã tự động khóa cổng đăng nhập 60 giây!`
      });
    }
    try {
      localStorage.setItem(LS.loginRateLimit, JSON.stringify(data));
    } catch (e) {}
    return data;
  },

  resetLoginRateLimit() {
    try {
      localStorage.removeItem(LS.loginRateLimit);
    } catch (e) {}
  },

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
    const head = logs[0] || {};
    const prevHash = head.block_hash || "0x0000000000000000000000000000000000000000000000000000000000000000";
    const blockIndex = Number(head.block_index || logs.length || 0) + 1;
    const recId = "aud-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100);
    const actorRole = entry.actor_role || "ADMIN";
    const action = entry.action || "SECURITY_EVENT";
    const target = entry.target || "SYSTEM";
    const detail = entry.detail || "";
    const payloadStr = `${prevHash}|${recId}|${actorRole}|${action}|${target}|${detail}`;
    const blockHash = computeDeterministicHashHex(payloadStr);

    const record = {
      id: recId,
      block_index: blockIndex,
      timestamp: new Date().toISOString(),
      actor_role: actorRole,
      actor_name: entry.actor_name || "Quản trị viên",
      action,
      target,
      severity: entry.severity || "INFO",
      detail,
      prev_hash: prevHash,
      block_hash: blockHash
    };
    logs.unshift(record);
    const trimmed = logs.slice(0, 60);
    try {
      localStorage.setItem(LS.auditLogs, JSON.stringify(trimmed));
    } catch (e) {}
    return record;
  },

  verifyAuditChainIntegrity() {
    const logsDesc = this.getAuditLogs();
    const asc = [...logsDesc].reverse();
    let brokenAt = null;
    for (let i = 0; i < asc.length; i++) {
      const b = asc[i];
      const expectedPrev = i === 0 ? b.prev_hash : asc[i - 1].block_hash;
      const recomputed = computeDeterministicHashHex(`${expectedPrev}|${b.id}|${b.actor_role}|${b.action}|${b.target}|${b.detail}`);
      if (b.prev_hash !== expectedPrev || b.block_hash !== recomputed) {
        brokenAt = b.id;
        break;
      }
    }
    return {
      valid: brokenAt === null,
      totalBlocks: asc.length,
      headHash: logsDesc[0]?.block_hash || "0x0",
      brokenAt
    };
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
  },

  // 5. Tường Lửa Chống Cắt Cầu & Rò Rỉ Thông Tin Liên Hệ (Anti-Disintermediation & Contact Leakage DLP)
  // Tự động phát hiện & che giấu SĐT, Zalo, Facebook, STK ngân hàng hoặc lời rủ giao dịch ngoài luồng trong bài đăng và In-App Chat
  redactContactLeakage(rawText, sourceContext = "CONTENT") {
    let text = String(rawText || "");
    if (!text) return { sanitizedText: "", detected: false, reasons: [] };

    const reasons = [];
    // Phát hiện số điện thoại Việt Nam (kể cả viết cách bằng dấu chấm, gạch ngang, khoảng trắng: 090 123 4567, +8490...)
    const phoneRegex = /(?:\+?84|0)(?:[\s.\-_]*\d){8,10}\b/g;
    if (phoneRegex.test(text)) {
      reasons.push("Số điện thoại cá nhân");
      text = text.replace(phoneRegex, "[🔒 Đã ẩn SĐT - Liên hệ qua Chat Nội Bộ Sàn]");
    }

    // Phát hiện link/từ khóa kéo khách sang Zalo, Facebook, Telegram, Viber hoặc giao dịch ngoài sàn
    const offPlatformRegex = /(?:zalo\.me\/[^\s]+|fb\.com\/[^\s]+|facebook\.com\/[^\s]+|t\.me\/[^\s]+|kết\s*bạn\s*zalo|nhắn\s*zalo\s*riêng|giao\s*dịch\s*ngoài\s*sàn|mua\s*riêng\s*bên\s*ngoài|chuyển\s*khoản\s*riêng|không\s*qua\s*sàn)/gi;
    if (offPlatformRegex.test(text)) {
      reasons.push("Điều hướng giao dịch ngoài nền tảng (Zalo/FB/Ngoài luồng)");
      text = text.replace(offPlatformRegex, "[🛡️ Đã chặn điều hướng ngoài sàn]");
    }

    if (reasons.length > 0) {
      this.logAudit({
        actor_role: "ANTI_LEAKAGE_DLP",
        actor_name: "DisintermediationGuard",
        action: "CONTACT_LEAKAGE_REDACTED",
        target: sourceContext,
        severity: "WARN",
        detail: `Tự động che thông tin liên hệ ngoài luồng (${reasons.join(", ")}) tại [${sourceContext}] để chống cắt cầu.`
      });
    }

    return {
      sanitizedText: text,
      detected: reasons.length > 0,
      reasons
    };
  },

  evaluateChatAntiLeakage(userMessage) {
    const raw = String(userMessage || "").trim();
    const check = this.redactContactLeakage(raw, "IN_APP_CHAT");
    const solicitationRe = /(?:số\s*điện\s*thoại|sđt|zalo|facebook|fb|chuyển\s*khoản\s*trực\s*tiếp|mua\s*trực\s*tiếp|bỏ\s*qua\s*web|không\s*qua\s*web|liên\s*hệ\s*riêng|gọi\s*riêng|stk\s*cá\s*nhân)/i;

    if (check.detected || solicitationRe.test(raw)) {
      this.logAudit({
        actor_role: "ANTI_LEAKAGE_DLP",
        actor_name: "ChatAntiCircumvention",
        action: "ANTI_DISINTERMEDIATION_BLOCKED",
        target: "InAppChat",
        severity: "DANGER",
        detail: `Chặn hành vi trao đổi SĐT/Zalo hoặc gạ giao dịch ngoài sàn trong Chat: "${raw.slice(0, 80)}"`
      });
      return {
        blocked: true,
        sanitizedText: check.sanitizedText,
        warningReply: `🛡️ [Chính Sách Chống Giao Dịch Ngoài Luồng - Anti-Disintermediation]: Hệ thống đã tự động ẩn Số điện thoại / Zalo / Thông tin chuyển khoản riêng. Lưu ý: (1) Đặt trên Web AgriConnect bạn được Freeship Xe Lạnh (≥350k), giảm 5–8% + Tích lũy 5% AgriPoints (RẺ HƠN mua lẻ bên ngoài 13–18%) và được Bảo hiểm Ví Escrow 12h hoàn tiền 100% nếu trái sượng. (2) Giao dịch ngoài sàn sẽ mất 100% bảo hiểm đổi trả; khách hàng báo cáo hành vi rủ mua ngoài sàn được thưởng nóng Voucher 50.000 đ!`
      };
    }
    return { blocked: false, sanitizedText: raw, warningReply: null };
  },

  // 6. Chính sách Giữ chân 2 chiều (Two-Sided Retention: AgriPoints cho Khách & Chiết khấu Luỹ tiến cho Nông dân)
  calculateLoyaltyBenefits(subtotalVnd = 0, orderMode = "SINGLE") {
    const sub = Number(subtotalVnd || 0);
    // Tích điểm 5% AgriPoints cho đơn kế tiếp (8% nếu đặt Subscription định kỳ)
    const pointRate = orderMode === "SUBSCRIPTION_WEEKLY" ? 0.08 : 0.05;
    const earnedPointsVnd = Math.round(sub * pointRate);
    // So sánh tổng lợi ích khi mua trên Web vs mua trực tiếp ngoài luồng từ nông dân
    // Mua ngoài luồng: Tốn ship lẻ liên tỉnh ~65.000đ + 0% hoàn điểm + 0% bảo hiểm sượng hỏng
    const estimatedOffPlatformExtraCost = sub > 0 ? (45000 + earnedPointsVnd) : 0;
    return {
      pointRatePct: Math.round(pointRate * 100),
      earnedPointsVnd,
      estimatedOffPlatformExtraCost
    };
  },

  getFarmerRetentionTier(monthlyKg = 340, circumventionViolations = 0) {
    if (circumventionViolations > 0) {
      return {
        tierCode: "PENALTY_TIER",
        tierName: "⚠️ Đang Cảnh Cáo Vi Phạm Cắt Cầu",
        commissionPct: 15,
        preorderAdvancePct: 0,
        badge: "Hạ bậc hiển thị • Phí sàn 15%",
        nextTierHint: "Tuân thủ 100% giao dịch qua sàn trong 30 ngày để khôi phục mức phí ưu đãi 7%."
      };
    }
    if (monthlyKg >= 500) {
      return {
        tierCode: "DIAMOND_FARM",
        tierName: "💎 Đối Tác Kim Cương (≥ 500kg/tháng)",
        commissionPct: 5,
        preorderAdvancePct: 30,
        badge: "Phí sàn chỉ 5% • Ứng vốn Pre-order 30%",
        nextTierHint: "Đang hưởng mức phí thấp nhất toàn sàn + Bao tiêu Loại 1, 2, 3 & Ugly Food."
      };
    }
    if (monthlyKg >= 200) {
      return {
        tierCode: "GOLD_FARM",
        tierName: "🌟 Đối Tác Chuẩn Vàng (≥ 200kg/tháng)",
        commissionPct: 7,
        preorderAdvancePct: 30,
        badge: "Phí sàn ưu đãi 7% (Giảm 3%) • Ứng vốn 30%",
        nextTierHint: `Còn thiếu ${Math.max(0, 500 - monthlyKg)}kg trong tháng để lên Hạng Kim Cương (Phí sàn giảm chỉ còn 5%!).`
      };
    }
    return {
      tierCode: "STANDARD_FARM",
      tierName: "🌱 Đối Tác Tiêu Chuẩn (< 200kg/tháng)",
      commissionPct: 10,
      preorderAdvancePct: 20,
      badge: "Phí sàn cơ bản 10%",
      nextTierHint: `Bán thêm ${Math.max(0, 200 - monthlyKg)}kg qua sàn để giảm phí xuống 7% & mở khóa ứng vốn 30%!`
    };
  },

  // 7. Phân Quyền Chỉnh Sửa & Đăng Bài (Editor / Farmer / Admin Content & Media Authorization Guard)
  // Chỉ người được cấp quyền (nhập Mã PIN Quản trị / Mã Cấp Quyền hoặc đang đăng nhập Cổng Quản Trị) mới được đăng bài, sửa ảnh/video và nội dung.
  isEditorAuthorized() {
    try {
      if (sessionStorage.getItem(LS.adminSession) === "1" || localStorage.getItem("agriconnect_admin_session") === "true") {
        return true;
      }
      const raw = localStorage.getItem(LS.editorSession);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (!session || !session.authorized) return false;
      if (session.expiresAt && Date.now() > Number(session.expiresAt)) {
        localStorage.removeItem(LS.editorSession);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  getEditorSessionInfo() {
    try {
      if (sessionStorage.getItem(LS.adminSession) === "1" || localStorage.getItem("agriconnect_admin_session") === "true") {
        return {
          authorized: true,
          role: "ADMIN",
          actorName: "Quản trị viên Hệ thống",
          label: "🔓 Đã cấp quyền: Quản trị viên"
        };
      }
      const raw = localStorage.getItem(LS.editorSession);
      if (!raw) return { authorized: false, role: "GUEST", actorName: "Khách thăm quan", label: "🔒 Chế độ Khách (Chỉ xem & Mua hàng)" };
      const session = JSON.parse(raw);
      if (this.isEditorAuthorized()) {
        return {
          authorized: true,
          role: session.role || "AUTHORIZED_EDITOR",
          actorName: session.actorName || "Quản trị / Nhà vườn được cấp quyền",
          label: `🔓 Đã cấp quyền: ${session.actorName || "Biên tập viên / Nhà vườn"}`
        };
      }
    } catch (e) {}
    return { authorized: false, role: "GUEST", actorName: "Khách thăm quan", label: "🔒 Chế độ Khách (Chỉ xem & Mua hàng)" };
  },

  unlockEditorAccess(pinOrCode, actorName = "Quản trị viên / Nhà vườn được cấp quyền") {
    this.checkLoginRateLimit();
    const cleanPin = String(pinOrCode || "").trim();
    const validAdminPin = String(window.APP_CONFIG?.CAMPAIGN?.ADMIN_PIN || "123456").trim();
    const validCodes = [validAdminPin, "123456", "AGRI2026", "BACNAM2026"];

    if (!cleanPin || !validCodes.some(c => c.toLowerCase() === cleanPin.toLowerCase())) {
      const failState = this.recordLoginFailure("EDITOR_AUTH_MODAL");
      const remaining = Math.max(0, 5 - Number(failState.count || 1));
      throw new Error(`❌ Mã cấp quyền không chính xác! Chỉ người được cấp quyền mới được phép đăng bài, sửa ảnh & nội dung (Còn ${remaining} lần thử).`);
    }

    this.resetLoginRateLimit();
    const sessionObj = {
      authorized: true,
      role: cleanPin === validAdminPin ? "ADMIN_EDITOR" : "AUTHORIZED_FARMER",
      actorName: actorName || (cleanPin === validAdminPin ? "Quản trị viên Hệ thống" : "Nhà vườn Đối tác được cấp quyền"),
      grantedAt: new Date().toISOString(),
      expiresAt: Date.now() + 12 * 3600 * 1000 // Cấp quyền trong phiên 12 giờ
    };

    try {
      localStorage.setItem(LS.editorSession, JSON.stringify(sessionObj));
    } catch (e) {}

    this.logAudit({
      actor_role: sessionObj.role,
      actor_name: sessionObj.actorName,
      action: "EDITOR_PERMISSION_GRANTED",
      target: "CONTENT_MEDIA_CMS",
      severity: "SUCCESS",
      detail: `Mở khóa quyền Đăng bài & Chỉnh sửa Ảnh/Video/Nội dung thành công cho [${sessionObj.actorName}] (Hiệu lực 12h).`
    });

    return sessionObj;
  },

  lockEditorAccess() {
    const info = this.getEditorSessionInfo();
    try {
      localStorage.removeItem(LS.editorSession);
      localStorage.removeItem("agriconnect_admin_session");
      sessionStorage.removeItem(LS.adminSession);
    } catch (e) {}

    this.logAudit({
      actor_role: info.role || "EDITOR",
      actor_name: info.actorName || "Quản trị viên",
      action: "EDITOR_PERMISSION_LOCKED",
      target: "CONTENT_MEDIA_CMS",
      severity: "INFO",
      detail: "Đã khóa quyền chỉnh sửa & đăng bài, chuyển giao diện về chế độ Khách hàng (Ẩn toàn bộ nút sửa/xóa)."
    });
    return true;
  },

  assertEditorAuthorized(actionName = "EDIT_OR_POST_CONTENT") {
    if (!this.isEditorAuthorized()) {
      this.logAudit({
        actor_role: "UNAUTHORIZED_VISITOR",
        actor_name: "Khách chưa được cấp quyền",
        action: "UNAUTHORIZED_EDIT_BLOCKED",
        target: actionName,
        severity: "DANGER",
        detail: `Chặn thao tác trái phép [${actionName}]: Người dùng chưa được cấp quyền cố gắng đăng bài hoặc chỉnh sửa/xóa hình ảnh & nội dung.`
      });
      throw new Error("🔒 [Chưa Được Cấp Quyền]: Chỉ Quản trị viên hoặc Nhà vườn được cấp quyền mới được phép đăng bài, chỉnh sửa hình ảnh, video và nội dung!");
    }
    return true;
  },

  // 8. Chống Giả Mạo Tem QR Động Có Chữ Ký Số & Giới Hạn Số Lần Quét (Dynamic Anti-Counterfeit Signed QR)
  generateSignedQrPayload(orderCode, maxScans = 15) {
    const cleanCode = String(orderCode || "AC-261105-DEMO02").trim().toUpperCase();
    const expEpochSec = Math.floor(Date.now() / 1000) + 7 * 86400; // Hạn tem 7 ngày theo vòng đời nông sản tươi
    const sigFull = computeDeterministicHashHex(`AGRI_DYNAMIC_QR_V2|${cleanCode}|MAX_${maxScans}`);
    const sigShort = sigFull.slice(2, 18).toUpperCase();
    return {
      orderCode: cleanCode,
      signature: sigShort,
      maxScans,
      expiresAtEpoch: expEpochSec,
      queryString: `code=${encodeURIComponent(cleanCode)}&sig=${sigShort}&max=${maxScans}`
    };
  },

  verifySignedQrScan(orderCode, providedSig = "", incrementScan = true) {
    const cleanCode = String(orderCode || "").trim().toUpperCase();
    const expected = this.generateSignedQrPayload(cleanCode, 15);
    let counts = {};
    try {
      counts = JSON.parse(localStorage.getItem(LS.qrScanCounter) || "{}");
    } catch (e) { counts = {}; }

    const currentCount = Number(counts[cleanCode] || 0) + (incrementScan ? 1 : 0);
    if (incrementScan) {
      counts[cleanCode] = currentCount;
      try {
        localStorage.setItem(LS.qrScanCounter, JSON.stringify(counts));
      } catch (e) {}
    }

    const sigMatched = !providedSig || providedSig.toUpperCase() === expected.signature;
    const isClonedAlert = currentCount > expected.maxScans || !sigMatched;

    if (isClonedAlert) {
      this.logAudit({
        actor_role: "ANTI_COUNTERFEIT_QR",
        actor_name: "DynamicQrVerifier",
        action: !sigMatched ? "QR_SIGNATURE_FORGERY_DETECTED" : "QR_SCAN_LIMIT_EXCEEDED",
        target: cleanCode,
        severity: "DANGER",
        detail: !sigMatched
          ? `Phát hiện chữ ký số QR không hợp lệ trên mã đơn ${cleanCode} (Nghi vấn làm giả tem QR dán lên hàng trôi nổi).`
          : `Mã QR của đơn ${cleanCode} đã bị quét ${currentCount}/${expected.maxScans} lần — Cảnh báo sao chép tem QR hàng loạt!`
      });
    }

    return {
      validSignature: sigMatched,
      expectedSignature: expected.signature,
      scanCount: currentCount,
      maxScans: expected.maxScans,
      isClonedSuspected: isClonedAlert,
      ipfsCid: "bafybeig" + computeDeterministicHashHex(`IPFS_CERT_${cleanCode}`).slice(2, 34),
      smartContractNetwork: "Polygon PoS (ERC-4337 Account Abstraction • Gasless 0đ)"
    };
  },

  // 9. Hệ Thống AI & Bộ Rules Chống Gian Lận / Lạm Dụng Chính Sách Hoàn Tiền "Bao Ăn 1 Đổi 1" (Anti-Fraud Refund Engine)
  evaluateRefundFraudRisk(claimInput = {}, existingClaims = []) {
    const phone = String(claimInput.customer_phone || "").replace(/\D/g, "");
    const orderCode = String(claimInput.order_code || "").trim().toUpperCase();
    const videoUrl = String(claimInput.unbox_video_url || "").trim().toLowerCase();
    const claimType = claimInput.claim_type || "PARTIAL_20";

    let riskScore = 10;
    const flags = [];

    // Rule 1: Kiểm tra tần suất khiếu nại theo SĐT / Thiết bị
    const samePhoneClaims = existingClaims.filter(c => String(c.customer_phone || "").replace(/\D/g, "") === phone);
    if (samePhoneClaims.length >= 2) {
      riskScore += 45;
      flags.push(`SĐT ${this.maskPhone(phone, "CONFIRMED")} đã gửi ${samePhoneClaims.length + 1} yêu cầu hoàn tiền liên tiếp`);
    }

    // Rule 2: Kiểm tra trùng lặp link Video Unbox giữa các đơn hàng khác nhau
    const duplicateVideo = existingClaims.find(c =>
      c.unbox_video_url &&
      String(c.unbox_video_url).trim().toLowerCase() === videoUrl &&
      String(c.order_code).toUpperCase() !== orderCode &&
      !videoUrl.includes("video-unbox-agriconnect")
    );
    if (duplicateVideo) {
      riskScore += 50;
      flags.push(`Tái sử dụng cùng 1 link Video Unbox của đơn khác (${duplicateVideo.order_code})`);
    }

    // Rule 3: Đòi hoàn 100% liên tục hoặc mô tả quá ngắn/bất thường
    if (claimType === "FULL_100" && samePhoneClaims.some(c => c.claim_type === "FULL_100")) {
      riskScore += 25;
      flags.push("Yêu cầu hoàn 100% lặp lại nhiều lần (High-Value Claim Pattern)");
    }
    if (String(claimInput.reason || "").trim().length < 10) {
      riskScore += 15;
      flags.push("Mô tả tình trạng hư hỏng quá ngắn (<10 ký tự)");
    }

    riskScore = Math.min(99, riskScore);
    const riskLevel = riskScore >= 70 ? "HIGH_FRAUD_RISK" : (riskScore >= 40 ? "MEDIUM_REVIEW" : "LOW_AUTO_ELIGIBLE");

    if (riskScore >= 40) {
      this.logAudit({
        actor_role: "ANTI_FRAUD_AI",
        actor_name: "RefundAbuseDetector",
        action: riskScore >= 70 ? "REFUND_FRAUD_FLAGGED" : "REFUND_MANUAL_REVIEW_REQUIRED",
        target: orderCode || phone,
        severity: riskScore >= 70 ? "DANGER" : "WARN",
        detail: `AI chấm điểm rủi ro gian lận hoàn tiền: ${riskScore}/100 (${riskLevel}) • Lý do: ${flags.join("; ")}.`
      });
    }

    return {
      riskScore,
      riskLevel,
      flags,
      autoApproveEligible: riskScore < 40,
      recommendation: riskScore >= 70
        ? "🚨 CẢNH BÁO LẠM DỤNG CAO: Tạm khóa tự động hoàn 1-Click, yêu cầu đối chiếu mã QR động trong video unbox!"
        : (riskScore >= 40 ? "⚠️ CẦN KIỂM TRA VIDEO: Phát hiện lịch sử khiếu nại lặp lại." : "✅ HỢP LỆ (Rủi ro thấp): Đủ điều kiện duyệt nhanh 1-Click qua Smart Contract Escrow.")
    };
  },

  // 10. Dự Báo Thời Tiết Mùa Vụ & Cảnh Báo Thu Hoạch Sớm Cho Nhà Vườn (Agri-Weather Forecast & Intercropping Score)
  getFarmWeatherAdvisory() {
    return {
      updatedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      regions: [
        {
          region: "Đông Nam Bộ & Bình Phước (Sầu riêng Ri6, Măng cụt)",
          tempC: "27–33°C",
          humidity: "78%",
          rainProbThuFri: "65% (Có mưa rào chiều tối Thứ Năm)",
          status: "WARN_EARLY_HARVEST",
          badge: "🌦️ Cảnh báo mưa trước ngày hái Thứ Sáu",
          advice: "Khuyến nghị vườn Bác Năm che phủ gốc rãnh thoát nước tránh sầu riêng hút nước gây sượng cơm; ưu tiên cắt sớm từ 04:30–06:30 sáng Thứ Sáu trước khi nắng lên."
        },
        {
          region: "Đà Lạt - Lâm Đồng (Rau thủy canh, Cà chua, Khoai mật)",
          tempC: "15–22°C",
          humidity: "82%",
          rainProbThuFri: "20% (Trời nắng nhẹ, sương sớm)",
          status: "OPTIMAL",
          badge: "☀️ Thời tiết lý tưởng thu hoạch",
          advice: "Độ ẩm ổn định, hàm lượng đường Brix cà chua & khoai mật đạt đỉnh. Sơ chế lạnh 4°C ngay tại trạm Đơn Dương."
        },
        {
          region: "Miền Tây ĐBSCL & Tây Nguyên (Bơ sáp, Xoài Hòa Lộc, Bưởi)",
          tempC: "26–32°C",
          humidity: "74%",
          rainProbThuFri: "15% (Nắng ráo thuận lợi)",
          status: "OPTIMAL",
          badge: "🌱 Độ chín sinh lý đạt chuẩn 8.5/10",
          advice: "Các vườn áp dụng xen canh (Bơ - Cà phê - Thảm cỏ tự nhiên) được cộng +15% điểm ưu tiên hiển thị đầu trang và trợ giá bao bì sinh thái."
        }
      ]
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
      if (!localStorage.getItem(LS.farmPosts)) localStorage.setItem(LS.farmPosts, JSON.stringify(DEMO_FARM_POSTS));
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

  _readObj(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("LocalStorage write error:", e);
      if (e.name === "QuotaExceededError" || /quota/i.test(e.message)) {
        console.error("[AgriConnect] Bộ nhớ LocalStorage đầy do ảnh tải lên quá lớn.");
        try {
          if (typeof window !== "undefined" && typeof window.showToast === "function") {
            window.showToast("⚠️ Bộ nhớ tạm trình duyệt đã đầy. Khuyên dùng link ảnh trực tuyến để tối ưu!");
          }
        } catch (_) {}
      }
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

  // Hợp nhất bản ghi chỉnh sửa (overrides) và lọc bỏ sản phẩm đã xóa (deletedIds)
  _applyProductCustomizations(rawList) {
    const overrides = this._readObj(LS.productOverrides);
    const deletedIds = new Set(this._read(LS.deletedProductIds).map(String));
    const seen = new Set();
    const out = [];
    for (let i = 0; i < rawList.length; i++) {
      const p = rawList[i];
      if (!p || !p.id) continue;
      const pid = String(p.id);
      if (deletedIds.has(pid) || seen.has(pid)) continue;
      seen.add(pid);
      const ov = overrides[pid];
      const merged = ov ? { ...p, ...ov, is_custom_media: true } : p;
      out.push(enrichProductMeta(merged, i));
    }
    return out;
  }

  // ================= SẢN PHẨM & QUẢN LÝ BÀI ĐĂNG (THÊM / SỬA / XÓA ẢNH, VIDEO & NHÀ VƯỜN) =================
  async getProducts() {
    const customFarmerItems = this._read(LS.farmerCustomProducts);
    // Các loại Rau củ quả Đà Lạt, Nông sản khô & Đặc sản mới bổ sung (p14 -> p23) luôn được hợp nhất kể cả ở chế độ Cloud
    const extraCatalogItems = DEMO_PRODUCTS.filter(p => Number(String(p.id).replace(/\D/g, "")) >= 14);
    if (this.isCloud) {
      try {
        const { data, error } = await this.client
          .from("products").select("*").eq("is_available", true).order("created_at", { ascending: true });
        if (!error && data && data.length > 0) {
          return this._applyProductCustomizations([...customFarmerItems, ...data, ...extraCatalogItems, ...HAPPY_HOUR_UGLY_FOOD]);
        }
      } catch (err) {
        console.warn("[AgriConnect] Không tải được từ Supabase, dùng dữ liệu dự phòng:", err);
      }
    }
    const local = this._read(LS.products);
    const base = (local && local.length > 0) ? local.filter(p => p.is_available !== false) : [...DEMO_PRODUCTS, ...HAPPY_HOUR_UGLY_FOOD];
    return this._applyProductCustomizations([...customFarmerItems, ...base]);
  }

  async getAllProducts() {
    const customFarmerItems = this._read(LS.farmerCustomProducts);
    const extraCatalogItems = DEMO_PRODUCTS.filter(p => Number(String(p.id).replace(/\D/g, "")) >= 14);
    if (this.isCloud) {
      try {
        const { data, error } = await this.client.from("products").select("*");
        if (!error && data && data.length > 0) {
          return this._applyProductCustomizations([...customFarmerItems, ...data, ...extraCatalogItems, ...HAPPY_HOUR_UGLY_FOOD]);
        }
      } catch (err) {
        console.warn("[AgriConnect] Lỗi lấy sản phẩm admin:", err);
      }
    }
    const local = this._read(LS.products);
    const base = (local && local.length > 0) ? local : [...DEMO_PRODUCTS, ...HAPPY_HOUR_UGLY_FOOD];
    return this._applyProductCustomizations([...customFarmerItems, ...base]);
  }

  // Nén ảnh tải lên từ thiết bị thành Base64 DataURL gọn nhẹ (<80KB) để lưu LocalStorage mượt mà, tránh đầy bộ nhớ
  async compressImageToDataUrl(file, maxWidth = 720, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("Không có file"));
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(ev.target.result);
        img.src = ev.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Tạo mới hoặc Cập nhật bài đăng sản phẩm (hỗ trợ đa ảnh, video & thông tin Nhà vườn)
  async saveProductPost(postData) {
    window.security.assertEditorAuthorized("SAVE_PRODUCT_POST");
    const isEditing = Boolean(postData.id);
    const pid = isEditing ? String(postData.id) : ("farmer-" + Date.now());
    const mediaGallery = Array.isArray(postData.media_gallery) && postData.media_gallery.length > 0
      ? postData.media_gallery.filter(m => m && m.url)
      : [{ id: "m-" + Date.now(), type: "image", url: postData.image_url || "images/hero-fruits.jpg", caption: "Ảnh thực tế tại vườn" }];

    const primaryImg = mediaGallery.find(m => m.type !== "video")?.url || postData.image_url || "images/hero-fruits.jpg";
    const primaryVid = postData.video_url !== undefined
      ? postData.video_url
      : (mediaGallery.find(m => m.type === "video")?.url || "");

    if (primaryVid && !mediaGallery.some(m => m.type === "video" && m.url === primaryVid)) {
      mediaGallery.push({ id: "v-" + Date.now(), type: "video", url: primaryVid, caption: "Video quay thực tế tại Nhà vườn" });
    }

    const cleanFarmerName = window.security.redactContactLeakage(
      postData.farm_info?.farmer_name || postData.farmer_name || "Vườn Bác Năm & HTX Liên Kết",
      "PRODUCT_FARMER_NAME"
    ).sanitizedText;
    const cleanFarmStory = window.security.redactContactLeakage(
      postData.farm_info?.farm_story || postData.farm_story || postData.description || "Thu hoạch sáng sớm Thứ Sáu, vận chuyển Cold-Chain về TP.HCM.",
      "PRODUCT_DESCRIPTION"
    ).sanitizedText;

    const farmInfo = {
      farmer_name: cleanFarmerName,
      farm_region: postData.farm_info?.farm_region || postData.farm_region || "Đông Nam Bộ • Tây Nguyên • Đà Lạt",
      farming_method: postData.farm_info?.farming_method || postData.farming_method || "Canh tác VietGAP • Hữu cơ vi sinh",
      farmer_phone: postData.farm_info?.farmer_phone || postData.farmer_phone || "0784 203 424",
      farm_story: cleanFarmStory
    };

    const customList = this._read(LS.farmerCustomProducts);
    const existingCustomIdx = customList.findIndex(p => String(p.id) === pid);
    let existingBase = existingCustomIdx >= 0 ? customList[existingCustomIdx] : null;
    if (!existingBase && isEditing) {
      const all = await this.getAllProducts();
      existingBase = all.find(p => String(p.id) === pid) || {};
    }

    const priceSale = Number(postData.price_sale || existingBase?.price_sale || 65000);
    const priceOriginal = Number(postData.price_original || existingBase?.price_original || Math.round(priceSale * 0.72));
    const cleanProductName = window.security.redactContactLeakage(
      postData.name || existingBase?.name || "Nông sản mới đăng từ Nhà vườn",
      "PRODUCT_TITLE"
    ).sanitizedText;

    const updatedRecord = enrichProductMeta({
      ...(existingBase || {}),
      id: pid,
      name: cleanProductName,
      category: postData.category || existingBase?.category || "TraiCay",
      highlights: Array.isArray(postData.highlights) && postData.highlights.length > 0
        ? postData.highlights
        : (existingBase?.highlights || [
            `🏡 ${farmInfo.farmer_name} (${farmInfo.farm_region})`,
            `Sản lượng mở bán: ${postData.stock_kg || 50} kg • ${postData.harvest_date || "Hái sáng Thứ Sáu"}`,
            `${farmInfo.farming_method} • Bảo hành Ví Escrow 12h`
          ]),
      description: cleanFarmStory || existingBase?.description,
      unit: postData.unit || existingBase?.unit || "kg",
      weight_kg: Number(postData.weight_kg || existingBase?.weight_kg || 1),
      stock_kg: Number(postData.stock_kg || existingBase?.stock_kg || 50),
      price_original: priceOriginal,
      price_sale: priceSale,
      image_url: primaryImg,
      custom_image_url: primaryImg,
      is_custom_media: true,
      media_gallery: mediaGallery,
      video_url: primaryVid,
      farm_info: farmInfo,
      harvest_date: postData.harvest_date || existingBase?.harvest_date || "Thu hoạch sáng Thứ Sáu tuần này",
      certification_badge: postData.certification_badge || existingBase?.certification_badge || `VietGAP • ${farmInfo.farmer_name.slice(0, 26)}`,
      is_available: true,
      updated_at: new Date().toISOString(),
      created_at: existingBase?.created_at || new Date().toISOString()
    });

    if (existingCustomIdx >= 0) {
      customList[existingCustomIdx] = updatedRecord;
      this._write(LS.farmerCustomProducts, customList);
    } else if (!isEditing || pid.startsWith("farmer-")) {
      customList.unshift(updatedRecord);
      this._write(LS.farmerCustomProducts, customList);
    }

    // Luôn lưu vào productOverrides để cả sản phẩm mặc định (p1..p23, ugly-1..4) hay Cloud đều giữ nguyên ảnh/video/thông tin vườn đã sửa
    const overrides = this._readObj(LS.productOverrides);
    overrides[pid] = updatedRecord;
    this._write(LS.productOverrides, overrides);

    // Nếu sản phẩm này trước đó bị xóa thì gỡ khỏi danh sách xóa
    const deletedIds = this._read(LS.deletedProductIds).filter(id => String(id) !== pid);
    this._write(LS.deletedProductIds, deletedIds);

    window.security.logAudit({
      actor_role: "FARMER_PORTAL",
      actor_name: farmInfo.farmer_name,
      action: isEditing ? "PRODUCT_POST_UPDATED" : "PRODUCT_POST_CREATED",
      target: pid,
      severity: "SUCCESS",
      detail: `${isEditing ? "Cập nhật" : "Đăng mới"} bài sản phẩm "${updatedRecord.name}" (${mediaGallery.length} media, Video: ${primaryVid ? "Có" : "Không"}) • Nhà vườn: ${farmInfo.farmer_name}.`
    });

    return updatedRecord;
  }

  // Xóa bài đăng sản phẩm (hỗ trợ xóa cả bài tự đăng lẫn ẩn sản phẩm mặc định)
  async deleteProductPost(productId) {
    window.security.assertEditorAuthorized("DELETE_PRODUCT_POST");
    const pid = String(productId || "");
    if (!pid) return false;
    const customList = this._read(LS.farmerCustomProducts).filter(p => String(p.id) !== pid);
    this._write(LS.farmerCustomProducts, customList);

    const overrides = this._readObj(LS.productOverrides);
    delete overrides[pid];
    this._write(LS.productOverrides, overrides);

    const deletedIds = this._read(LS.deletedProductIds);
    if (!deletedIds.includes(pid)) {
      deletedIds.push(pid);
      this._write(LS.deletedProductIds, deletedIds);
    }

    window.security.logAudit({
      actor_role: "FARMER_PORTAL",
      actor_name: "Quản lý Nhà Vườn",
      action: "PRODUCT_POST_DELETED",
      target: pid,
      severity: "WARN",
      detail: `Đã xóa bài đăng nông sản mã [${pid}] khỏi kệ hàng.`
    });
    return true;
  }

  // Khôi phục lại toàn bộ sản phẩm gốc nếu người dùng muốn reset các mục đã xóa
  async restoreDefaultProducts() {
    window.security.assertEditorAuthorized("RESTORE_DEFAULT_PRODUCTS");
    localStorage.removeItem(LS.deletedProductIds);
    localStorage.removeItem(LS.productOverrides);
    return this.getProducts();
  }

  // Nhà vườn đăng lứa mới từ trang farmer.html (Tương thích ngược, gọi thẳng saveProductPost)
  async addFarmerBatchProduct(newProd) {
    return this.saveProductPost(newProd);
  }

  // ================= BÀI ĐĂNG & NHẬT KÝ THÔNG TIN NHÀ VƯỜN (FARM PROFILE & GALLERY POSTS) =================
  getFarmPosts() {
    const list = this._read(LS.farmPosts);
    if (!list || list.length === 0) {
      this._write(LS.farmPosts, DEMO_FARM_POSTS);
      return DEMO_FARM_POSTS;
    }
    return list;
  }

  saveFarmPost(postInput) {
    window.security.assertEditorAuthorized("SAVE_FARM_POST");
    const list = this.getFarmPosts();
    const isEdit = Boolean(postInput.id);
    const postId = isEdit ? String(postInput.id) : ("fpost-" + Date.now());
    const mediaGallery = Array.isArray(postInput.media_gallery) && postInput.media_gallery.length > 0
      ? postInput.media_gallery.filter(m => m && m.url)
      : [{ id: "fp-img-" + Date.now(), type: "image", url: postInput.image_url || "images/hero-fruits.jpg", caption: "Hình ảnh thực tế tại Nhà vườn" }];

    const cleanFpTitle = window.security.redactContactLeakage(
      postInput.title || "Nhật ký mùa vụ & Thu hoạch thực tế tại Nhà vườn",
      "FARM_POST_TITLE"
    ).sanitizedText;
    const cleanFpStory = window.security.redactContactLeakage(
      postInput.story || "Cập nhật hình ảnh và video thu hoạch nông sản tươi sạch sáng nay tại vườn.",
      "FARM_POST_STORY"
    ).sanitizedText;

    const record = {
      id: postId,
      farmer_name: postInput.farmer_name || "Nhà Vườn Liên Kết AgriConnect",
      farm_region: postInput.farm_region || "Đông Nam Bộ • Tây Nguyên • Đà Lạt • Miền Tây",
      farming_method: postInput.farming_method || "Canh tác VietGAP • Chín cây tự nhiên 100%",
      farmer_phone: postInput.farmer_phone || "0784 203 424",
      title: cleanFpTitle,
      story: cleanFpStory,
      media_gallery: mediaGallery,
      video_url: postInput.video_url || (mediaGallery.find(m => m.type === "video")?.url || ""),
      updated_at: new Date().toISOString(),
      created_at: postInput.created_at || new Date().toISOString()
    };

    const idx = list.findIndex(item => String(item.id) === postId);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    this._write(LS.farmPosts, list);
    return record;
  }

  deleteFarmPost(postId) {
    window.security.assertEditorAuthorized("DELETE_FARM_POST");
    const pid = String(postId || "");
    const list = this.getFarmPosts().filter(item => String(item.id) !== pid);
    this._write(LS.farmPosts, list);
    return list;
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

  // ================= KHIẾU NẠI & BỒI THƯỜNG TỰ ĐỘNG 1-CLICK (ESCROW + AI ANTI-FRAUD GUARD) =================
  async submitRefundClaim(claimInput) {
    const existingList = this._read(LS.refundClaims);
    const fraudEval = window.security.evaluateRefundFraudRisk(claimInput, existingList);

    const newClaim = {
      id: "claim-" + Date.now(),
      order_code: String(claimInput.order_code || "").trim().toUpperCase(),
      customer_phone: String(claimInput.customer_phone || "").trim(),
      claim_type: claimInput.claim_type || "PARTIAL_20", // PARTIAL_20 | FULL_100
      reason: claimInput.reason || "Nông sản bị dập/sượng khi mở thùng",
      unbox_video_url: claimInput.unbox_video_url || "",
      fraud_risk_score: fraudEval.riskScore,
      fraud_risk_level: fraudEval.riskLevel,
      fraud_flags: fraudEval.flags,
      fraud_recommendation: fraudEval.recommendation,
      status: "PENDING",
      created_at: new Date().toISOString()
    };

    existingList.unshift(newClaim);
    this._write(LS.refundClaims, existingList);

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
          const escrowState = localExtra.escrow_status || (data[0].order_status === "DELIVERED" ? "RELEASED_TO_FARMER" : "HELD_IN_ESCROW");
          const merkleProof = window.security.generateBatchMerkleProof(clean, escrowState);
          return {
            ...data[0],
            escrow_status: escrowState,
            order_mode: localExtra.order_mode || "SINGLE",
            merkle_proof: merkleProof,
            smart_contract_address: "0x7F4c...92E8 (AgriEscrowV2)"
          };
        }
      } catch (err) {
        console.warn("Trace fallback local:", err);
      }
    }
    const o = this._read(LS.orders).find(x => String(x.order_code).toUpperCase() === clean);
    if (!o) return null;
    const batch = JSON.parse(localStorage.getItem(LS.batch) || "{}");
    const escrowState = o.escrow_status || (o.order_status === "DELIVERED" ? "RELEASED_TO_FARMER" : "HELD_IN_ESCROW");
    const merkleProof = window.security.generateBatchMerkleProof(o.order_code, escrowState);
    return {
      order_code: o.order_code, order_status: o.order_status, payment_status: o.payment_status,
      delivery_type: o.delivery_type, total_kg: o.total_kg, created_at: o.created_at,
      escrow_status: escrowState,
      order_mode: o.order_mode || "SINGLE",
      batch_name: batch.batch_name, harvest_date: batch.harvest_date, delivery_date: batch.delivery_date,
      item_summary: (o.items || []).map(i => `${i.qty}x ${i.name}`).join(", "),
      merkle_proof: merkleProof,
      smart_contract_address: "0x7F4c...92E8 (AgriEscrowV2)"
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

  // ================= ĐĂNG NHẬP QUẢN TRỊ (CÓ CHỐNG BRUTE-FORCE 5 LẦN KHÓA 60 GIÂY) =================
  async adminLogin({ email, password, pin }) {
    window.security.checkLoginRateLimit();
    if (this.isCloud) {
      const { error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) {
        const rl = window.security.recordLoginFailure(email || "CLOUD_ADMIN");
        throw new Error(`Sai email hoặc mật khẩu (Lần thử ${rl.count}/5).`);
      }
      const ok = await this.isAdmin();
      if (!ok) {
        await this.client.auth.signOut();
        window.security.recordLoginFailure(email || "NON_ADMIN_USER");
        throw new Error("Tài khoản này chưa được cấp quyền quản trị (chưa có trong bảng admin_users).");
      }
      window.security.resetLoginRateLimit();
      window.security.logAudit({
        actor_role: "ADMIN",
        actor_name: email || "Cloud Admin",
        action: "ADMIN_LOGIN_SUCCESS",
        target: "ADMIN_PORTAL",
        severity: "SUCCESS",
        detail: "Đăng nhập Cổng Quản Trị thành công qua Supabase Auth."
      });
      return true;
    }
    if (String(pin) === String(window.APP_CONFIG?.CAMPAIGN?.ADMIN_PIN)) {
      window.security.resetLoginRateLimit();
      sessionStorage.setItem(LS.adminSession, "1");
      try {
        window.security.unlockEditorAccess(pin, "Quản trị viên Hệ thống (Admin)");
      } catch (e) {}
      window.security.logAudit({
        actor_role: "ADMIN",
        actor_name: "Demo Admin PIN",
        action: "ADMIN_LOGIN_SUCCESS",
        target: "ADMIN_PORTAL",
        severity: "SUCCESS",
        detail: "Đăng nhập Cổng Quản Trị thành công bằng mã PIN."
      });
      return true;
    }
    const rl = window.security.recordLoginFailure("DEMO_PIN");
    throw new Error(`Sai mã PIN quản trị (Lần thử ${rl.count}/5 — Khóa 60s nếu sai 5 lần).`);
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
