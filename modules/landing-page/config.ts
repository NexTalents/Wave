// Central content and asset configuration for the reusable WAVE landing page.
// Visual assets intentionally remain the existing reference assets; only copy and links are localized here.

export type Language = "ID" | "EN"
export type LinkRef = { label: string; href: string; external?: boolean }
export type NavItem = { label: string; href?: string; external?: boolean; menu?: LinkRef[] }
export type FooterGroup = { title: string; links: LinkRef[] }
export type ReferenceAsset = { src: string; mobileSrc?: string; alt: string; width?: number; height?: number }
export type Scene = { id: string; text: string; mobileLines?: readonly string[]; image: ReferenceAsset }
export type ProductItem = { id: string; title: string; description: string; cta: LinkRef; image: ReferenceAsset }
export type Testimonial = { id: string; name: string; role: string; quote: string; image: ReferenceAsset }

const WAVE_ORIGIN = "https://amartha.com"
const CONTENT_HUB_ORIGIN = "https://content-hub.amartha.com/uploads"
const contentHub = (file: string, alt: string, width?: number, height?: number): ReferenceAsset => ({ src: `${CONTENT_HUB_ORIGIN}/${file}`, alt, width, height })

export const homeAssets = {
  hero: { video: `${WAVE_ORIGIN}/hero-video.mp4`, videoMobile: `${WAVE_ORIGIN}/hero-video-mobile.mp4` },
  inclusive: {
    petals: [
      { src: `${WAVE_ORIGIN}/inclusive-growth/petal-1.webp`, alt: "", width: 2000, height: 2000 },
      { src: `${WAVE_ORIGIN}/inclusive-growth/petal-2.webp`, alt: "", width: 2000, height: 2000 },
      { src: `${WAVE_ORIGIN}/inclusive-growth/petal-3.webp`, alt: "", width: 2000, height: 2000 },
    ] satisfies ReferenceAsset[],
    scenes: [
      contentHub("home_parallax_1_9b60537b61.jpg", "Pelaku usaha bunga teratai", 1440, 927),
      { ...contentHub("AMF_00380_2_1_Final_3f1cd32149_375a5fe620.webp", "Komunitas perempuan pelaku usaha", 1440, 900), mobileSrc: `${CONTENT_HUB_ORIGIN}/AMF_00380_2_1_mobile_Final_80a42329cf_e4cb5db714.webp` },
      { ...contentHub("AMF_01179_2_1_Final_c83991e729_e076975816.webp", "Pelaku usaha mikro di rumahnya", 1440, 900), mobileSrc: `${CONTENT_HUB_ORIGIN}/AMF_01179_2_2_Final_d868f0dc5c_4a30c96e22.webp` },
    ],
  },
  phoneFrame: { src: `${WAVE_ORIGIN}/phone-blank.png`, alt: "", width: 702, height: 1420 } satisfies ReferenceAsset,
  productScreens: [
    contentHub("Prosper_Updated_1_97a15c8e95_f90ef19a5f.png", "Tampilan operator bank sampah", 656, 1458),
    contentHub("Celengan_Updated_1_b60d22d437_e22beb54cf.png", "Tampilan indeks WPI", 656, 1458),
    contentHub("Modal_UI_App_1_b75cdcd12d_b24772b5b6.png", "Tampilan intelijen pasar", 656, 1456),
    contentHub("Alink_Homepage_1_7f38ef62da_e937869db7.png", "Tampilan kebutuhan pembeli", 656, 1458),
  ],
  business: [contentHub("home_business_1_2b7838a2a9.jpg", "Usaha pengeringan hasil laut"), contentHub("home_business_2_adabad5c89.webp", "Ekosistem usaha akar rumput")],
  founderQuote: contentHub("quote_bg_1e410786f8.jpg", "Komunitas pesisir dari udara"),
  testimonials: [
    contentHub("Pak_Ajay_Investor_Premium_1_1b9bb5906d_709622db88.webp", "Operator bank sampah", 356, 368),
    contentHub("Ibu_Lina_Mitra_Amartha_c6adedfe00_1_1_69a10327e8_3e84025aa4.jpg", "Pemulung mitra", 356, 368),
    contentHub("testimonial_3_0399367d44.jpg", "Pembeli industri", 356, 368),
    contentHub("Nurjannah_fb989a9c56.jpg", "Bank sampah mitra", 356, 368),
  ],
} as const

const commonSite = {
  appHref: "#mulai",
  contact: { call: "+62 811-2000-2026", whatsapp: "+62 811-2000-2026", email: "hello@wave.id" },
  social: [{ label: "linkedin", href: "https://www.linkedin.com/" }, { label: "instagram", href: "https://www.instagram.com/" }, { label: "youtube", href: "https://www.youtube.com/" }] satisfies LinkRef[],
  copyright: "© 2026 WAVE (Waste Value Exchange)",
}

export const siteByLanguage = {
  ID: {
    ...commonSite,
    name: "WAVE",
    languages: ["EN", "ID"] as const,
    primaryNav: [{ label: "Tentang WAVE", href: "/tentang-kami" }, { label: "Cara Kerja", href: "/#cara-kerja" }, { label: "Untuk Pemulung", href: "/#untuk-pemulung" }, { label: "Untuk Bisnis", href: "/#untuk-bisnis" }] as NavItem[],
    footerGroups: [
      { title: "Jelajahi", links: [{ label: "Tentang WAVE", href: "/tentang-kami" }, { label: "Cara Kerja", href: "/#cara-kerja" }, { label: "Dampak", href: "/#dampak" }] },
      { title: "Ekosistem", links: [{ label: "Pemulung", href: "/#untuk-pemulung" }, { label: "Bank Sampah", href: "/#untuk-bank-sampah" }, { label: "Pembeli Industri", href: "/#untuk-bisnis" }] },
    ] satisfies FooterGroup[],
    disclosure: { summary: "Tentang data WAVE", body: "WAVE menggunakan transaksi tervalidasi untuk membentuk indeks harga limbah. Harga acuan dapat berubah mengikuti data pasar dan tidak menjamin harga transaksi tertentu." },
  },
  EN: {
    ...commonSite,
    name: "WAVE",
    languages: ["EN", "ID"] as const,
    primaryNav: [{ label: "About WAVE", href: "/tentang-kami" }, { label: "How It Works", href: "/#cara-kerja" }, { label: "For Waste Pickers", href: "/#untuk-pemulung" }, { label: "For Businesses", href: "/#untuk-bisnis" }] as NavItem[],
    footerGroups: [
      { title: "Explore", links: [{ label: "About WAVE", href: "/tentang-kami" }, { label: "How It Works", href: "/#cara-kerja" }, { label: "Impact", href: "/#dampak" }] },
      { title: "Ecosystem", links: [{ label: "Waste Pickers", href: "/#untuk-pemulung" }, { label: "Waste Banks", href: "/#untuk-bank-sampah" }, { label: "Industrial Buyers", href: "/#untuk-bisnis" }] },
    ] satisfies FooterGroup[],
    disclosure: { summary: "About WAVE data", body: "WAVE uses validated transactions to build a waste-price index. Reference prices can change with market data and do not guarantee a specific transaction price." },
  },
} as const

const idProducts: ProductItem[] = [
  { id: "produk-1", title: "Catat Setoran dengan Transparan", description: "Operator bank sampah mencatat berat, grade, harga acuan WPI, dan harga yang dibayar dalam satu alur.", cta: { label: "Pelajari alurnya", href: "/#cara-kerja" }, image: homeAssets.productScreens[0] },
  { id: "produk-2", title: "Pantau Waste Price Index", description: "Ticker harga per komoditas, wilayah, dan grade membantu semua pihak memahami nilai pasar.", cta: { label: "Lihat indeks WPI", href: "/#cara-kerja" }, image: homeAssets.productScreens[1] },
  { id: "produk-3", title: "Jual di Waktu yang Lebih Baik", description: "Prediksi harga dan kalkulator Jual Sekarang vs Tunggu membantu bank sampah mengambil keputusan dengan sadar risiko.", cta: { label: "Kenali intelijennya", href: "/#untuk-bank-sampah" }, image: homeAssets.productScreens[2] },
  { id: "produk-4", title: "Hubungkan dengan Pembeli Industri", description: "Kebutuhan bahan baku bertemu pasokan terverifikasi untuk transaksi batch yang lebih efisien.", cta: { label: "Untuk pembeli industri", href: "/#untuk-bisnis" }, image: homeAssets.productScreens[3] },
]
const enProducts: ProductItem[] = [
  { id: "produk-1", title: "Record Deposits Transparently", description: "Waste-bank operators record weight, grade, WPI reference price, and paid price in one workflow.", cta: { label: "Explore the flow", href: "/#cara-kerja" }, image: homeAssets.productScreens[0] },
  { id: "produk-2", title: "Track the Waste Price Index", description: "Commodity, region, and grade tickers help everyone understand market value.", cta: { label: "View the WPI", href: "/#cara-kerja" }, image: homeAssets.productScreens[1] },
  { id: "produk-3", title: "Sell at a Better Time", description: "Price forecasts and the Sell Now vs Wait calculator help waste banks make risk-aware decisions.", cta: { label: "Explore the intelligence", href: "/#untuk-bank-sampah" }, image: homeAssets.productScreens[2] },
  { id: "produk-4", title: "Connect with Industrial Buyers", description: "Verified supply meets material demand for more efficient batch transactions.", cta: { label: "For industrial buyers", href: "/#untuk-bisnis" }, image: homeAssets.productScreens[3] },
]

export const homeByLanguage = {
  ID: {
    hero: { heading: "Harga limbah transparan untuk ekonomi sirkular Indonesia", cta: { label: "Lihat cara kerja WAVE", href: "/#cara-kerja" } satisfies LinkRef, video: homeAssets.hero.video, videoMobile: homeAssets.hero.videoMobile, overlay: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0) 70%)" },
    inclusive: { heading: "Membuka nilai limbah, dari pemulung hingga industri", scenes: [
      { id: "inclusive-1", text: "Harga acuan yang lahir dari transaksi nyata, bukan keputusan sepihak", mobileLines: ["Harga acuan dari", "transaksi nyata,", "bukan keputusan sepihak"], image: homeAssets.inclusive.scenes[0] },
      { id: "inclusive-2", text: "Informasi harga yang sampai ke pemulung tanpa perlu memiliki aplikasi", mobileLines: ["Informasi harga sampai", "ke pemulung tanpa", "perlu aplikasi"], image: homeAssets.inclusive.scenes[1] },
      { id: "inclusive-3", text: "Pasokan yang lebih pasti untuk bank sampah dan pembeli industri", mobileLines: ["Pasokan lebih pasti", "untuk bank sampah", "dan pembeli industri"], image: homeAssets.inclusive.scenes[2] },
    ] satisfies Scene[] },
    products: { heading: "Satu platform untuk seluruh rantai nilai limbah", items: idProducts },
    business: { heading: "Nilai untuk setiap peran", subheading: "WAVE membuat pasar limbah lebih terbuka, terukur, dan inklusif.", slides: [{ id: "bisnis-1", title: "Untuk Bank Sampah & Agregator", description: "Pencatatan digital, prediksi harga, stok yang terlihat, dan akses ke pembeli industri membantu operasional tumbuh dengan sehat.", cta: { label: "Mulai dari operasional", href: "/#untuk-bank-sampah" } satisfies LinkRef }, { id: "bisnis-2", title: "Untuk Pembeli Industri", description: "Temukan pasokan yang lebih stabil, publikasikan kebutuhan, dan gunakan data pasar untuk merencanakan pembelian bahan baku.", cta: { label: "Bangun kemitraan", href: "/#untuk-bisnis" } satisfies LinkRef }] },
    founderQuote: { quote: "Ketika harga menjadi terbuka, setiap kilogram limbah punya peluang untuk menciptakan nilai yang lebih adil.", name: "WAVE", role: "Waste Value Exchange" },
    testimonials: { heading: "Membangun kepercayaan di setiap transaksi", items: [{ id: "testi-1", name: "Operator Bank Sampah", role: "Pengguna utama WAVE", quote: "Kami bisa menunjukkan dengan jelas dari mana harga dibentuk dan berapa nilai yang diterima pemulung.", image: homeAssets.testimonials[0] }, { id: "testi-2", name: "Pemulung Mitra", role: "Penerima manfaat", quote: "Saya bisa mengecek harga kardus hari ini dan tahu kapan stok saya lebih baik dijual.", image: homeAssets.testimonials[1] }, { id: "testi-3", name: "Pembeli Industri", role: "Pengguna data pasar", quote: "Data volume dan grade membuat kami lebih mudah merencanakan kebutuhan bahan baku.", image: homeAssets.testimonials[2] }, { id: "testi-4", name: "Mitra Ekosistem", role: "Penggerak ekonomi sirkular", quote: "WAVE memberi bahasa bersama untuk menghubungkan dampak sosial, lingkungan, dan nilai bisnis.", image: homeAssets.testimonials[3] }] satisfies Testimonial[] },
  },
  EN: {
    hero: { heading: "Transparent waste prices for Indonesia's circular economy", cta: { label: "See how WAVE works", href: "/#cara-kerja" } satisfies LinkRef, video: homeAssets.hero.video, videoMobile: homeAssets.hero.videoMobile, overlay: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0) 70%)" },
    inclusive: { heading: "Unlocking waste value, from waste pickers to industry", scenes: [{ id: "inclusive-1", text: "A reference price built from real transactions, not one-sided decisions", mobileLines: ["A reference price from", "real transactions,", "not one-sided decisions"], image: homeAssets.inclusive.scenes[0] }, { id: "inclusive-2", text: "Price information that reaches waste pickers without requiring an app", mobileLines: ["Price information reaches", "waste pickers without", "requiring an app"], image: homeAssets.inclusive.scenes[1] }, { id: "inclusive-3", text: "More predictable supply for waste banks and industrial buyers", mobileLines: ["More predictable supply", "for waste banks", "and industrial buyers"], image: homeAssets.inclusive.scenes[2] }] satisfies Scene[] },
    products: { heading: "One platform for the entire waste value chain", items: enProducts },
    business: { heading: "Value for every role", subheading: "WAVE makes the waste market more open, measurable, and inclusive.", slides: [{ id: "bisnis-1", title: "For Waste Banks & Aggregators", description: "Digital records, price forecasts, visible inventory, and access to industrial buyers help operations grow sustainably.", cta: { label: "Start with operations", href: "/#untuk-bank-sampah" } satisfies LinkRef }, { id: "bisnis-2", title: "For Industrial Buyers", description: "Find more stable supply, post material needs, and use market data to plan raw-material purchases.", cta: { label: "Build a partnership", href: "/#untuk-bisnis" } satisfies LinkRef }] },
    founderQuote: { quote: "When prices become visible, every kilogram of waste has a chance to create fairer value.", name: "WAVE", role: "Waste Value Exchange" },
    testimonials: { heading: "Building trust into every transaction", items: [{ id: "testi-1", name: "Waste-bank Operator", role: "WAVE's primary user", quote: "We can clearly show how the price was formed and how much value reaches waste pickers.", image: homeAssets.testimonials[0] }, { id: "testi-2", name: "Partner Waste Picker", role: "Beneficiary", quote: "I can check today's cardboard price and know when my stock may be better sold.", image: homeAssets.testimonials[1] }, { id: "testi-3", name: "Industrial Buyer", role: "Market-data user", quote: "Volume and grade data make it easier to plan our raw-material needs.", image: homeAssets.testimonials[2] }, { id: "testi-4", name: "Ecosystem Partner", role: "Circular-economy enabler", quote: "WAVE gives social impact, environmental impact, and business value a shared language.", image: homeAssets.testimonials[3] }] satisfies Testimonial[] },
  },
} as const

export const aboutByLanguage = {
  ID: { eyebrow: "Tentang WAVE", title: "Membuat harga limbah terlihat, agar nilainya bisa dibagi lebih adil.", paragraphs: ["WAVE (Waste Value Exchange) adalah platform indeks harga limbah yang dihitung dari transaksi nyata dan dibangun bersama bank sampah serta pengelola limbah.", "Kami meminjam tampilan bursa—ticker, indeks, dan grafik—untuk membuat pasar yang selama ini gelap menjadi lebih terbuka bagi pemulung, operator, pengepul, dan pembeli industri.", "Pemulung tidak perlu memiliki aplikasi. Mereka tetap bisa menerima struk digital atau cetak, melihat papan harga publik, dan mengecek harga melalui WhatsApp."], cta: { label: "Kembali ke beranda", href: "/" } satisfies LinkRef },
  EN: { eyebrow: "About WAVE", title: "Making waste prices visible, so value can be shared more fairly.", paragraphs: ["WAVE (Waste Value Exchange) is a waste-price index platform built from real transactions and developed with waste banks and waste-management operators.", "We borrow the language of an exchange—tickers, indices, and charts—to open up a market that has long been opaque to waste pickers, operators, aggregators, and industrial buyers.", "Waste pickers do not need an app. They can receive digital or printed receipts, view public price boards, and check prices through WhatsApp."], cta: { label: "Back to home", href: "/" } satisfies LinkRef },
} as const

export type SiteContent = (typeof siteByLanguage)[Language]
export type HomeContent = (typeof homeByLanguage)[Language]
export const landingPageConfig = { site: siteByLanguage.ID, homeAssets, home: homeByLanguage.ID } as const
