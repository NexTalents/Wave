// Localized copy for the WAVE marketing pages linked from the site header.
import {
  BarChart3,
  Boxes,
  Calculator,
  ClipboardCheck,
  Eye,
  Handshake,
  HeartHandshake,
  Leaf,
  LineChart,
  Megaphone,
  MessageCircle,
  Package,
  Receipt,
  Recycle,
  Scale,
  ShieldCheck,
  Smartphone,
  Store,
  Target,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { LinkRef } from "@/modules/landing-page/config"

export type Feature = { icon: LucideIcon; title: string; description: string }
export type Step = { title: string; description: string }
export type Faq = { question: string; answer: string }
export type PageHeroContent = { eyebrow: string; title: string; description: string; actions: LinkRef[] }
export type CtaContent = { title: string; description: string; actions: LinkRef[] }
export type SectionHeading = { eyebrow: string; title: string; description?: string }

const WHATSAPP_HREF = "https://wa.me/628112002026"
const EMAIL_HREF = "mailto:hello@wave.id"

export const howItWorksByLanguage = {
  ID: {
    hero: {
      eyebrow: "Cara Kerja",
      title: "Dari setoran pertama hingga harga acuan pasar",
      description: "WAVE mengubah setiap transaksi limbah yang tervalidasi menjadi data harga terbuka. Semakin banyak transaksi tercatat, semakin akurat harga acuan untuk semua pihak.",
      actions: [{ label: "Lihat indeks WPI", href: "/wpi" }, { label: "Mulai bersama WAVE", href: "/login" }],
    } satisfies PageHeroContent,
    steps: {
      heading: { eyebrow: "Alur transaksi", title: "Lima langkah sederhana di setiap setoran" } satisfies SectionHeading,
      items: [
        { title: "Setor limbah", description: "Pemulung atau warga membawa limbah terpilah ke bank sampah atau agregator mitra WAVE." },
        { title: "Timbang dan tentukan grade", description: "Operator menimbang material dan menentukan grade berdasarkan kebersihan dan jenisnya." },
        { title: "Catat dengan harga acuan WPI", description: "Harga acuan WPI tampil saat pencatatan sehingga harga yang dibayar bisa dibandingkan secara terbuka." },
        { title: "Bayar dan kirim struk", description: "Pemulung menerima pembayaran beserta struk digital atau cetak berisi berat, grade, dan harga." },
        { title: "Data membentuk indeks", description: "Transaksi yang lolos validasi menjadi bagian dari Waste Price Index yang diperbarui berkala." },
      ] satisfies Step[],
    },
    roles: {
      heading: { eyebrow: "Peran dalam ekosistem", title: "Setiap pihak mendapat manfaat yang berbeda", description: "Pilih peran Anda untuk melihat bagaimana WAVE bekerja dari sudut pandang Anda." } satisfies SectionHeading,
      items: [
        { value: "pemulung", label: "Pemulung", title: "Tahu nilai limbah sebelum menjual", description: "Pemulung tidak perlu memiliki aplikasi. Informasi harga sampai lewat papan harga, struk, dan WhatsApp.", points: ["Cek harga acuan harian per material", "Terima struk untuk setiap setoran", "Bandingkan harga yang dibayar dengan acuan pasar"], cta: { label: "Selengkapnya untuk pemulung", href: "/untuk-pemulung" } },
        { value: "bank-sampah", label: "Bank Sampah", title: "Operasional rapi, keputusan jual lebih tepat", description: "Operator mencatat setoran, memantau stok, dan menggunakan prediksi harga untuk menentukan waktu jual.", points: ["Pencatatan digital berat, grade, dan harga", "Kalkulator Jual Sekarang vs Tunggu", "Akses ke pembeli industri terverifikasi"], cta: { label: "Selengkapnya untuk bank sampah", href: "/untuk-bisnis#bank-sampah" } },
        { value: "industri", label: "Pembeli Industri", title: "Pasokan bahan baku yang lebih pasti", description: "Pembeli industri melihat ketersediaan pasokan per wilayah dan grade, lalu mempublikasikan kebutuhan materialnya.", points: ["Data volume dan grade per wilayah", "Publikasi kebutuhan bahan baku", "Transaksi batch dengan pemasok terverifikasi"], cta: { label: "Selengkapnya untuk industri", href: "/untuk-bisnis#pembeli-industri" } },
      ],
    },
    index: {
      heading: { eyebrow: "Waste Price Index", title: "Bagaimana harga acuan dibentuk", description: "WPI bukan harga yang ditetapkan sepihak. Indeks dihitung dari transaksi nyata yang tercatat di jaringan WAVE." } satisfies SectionHeading,
      items: [
        { icon: ShieldCheck, title: "Transaksi tervalidasi", description: "Hanya transaksi dengan berat, grade, dan harga lengkap yang lolos pemeriksaan anomali yang dihitung." },
        { icon: Boxes, title: "Dikelompokkan per material", description: "Harga dipisahkan menurut material, grade, dan wilayah agar perbandingan tetap adil." },
        { icon: LineChart, title: "Diperbarui berkala", description: "Indeks diperbarui mengikuti periode transaksi sehingga tren naik-turun harga mudah dipantau." },
      ] satisfies Feature[],
      note: { title: "Harga acuan, bukan jaminan harga", description: "WPI membantu negosiasi yang lebih adil. Harga transaksi akhir tetap disepakati antara penjual dan pembeli." },
    },
    faq: {
      heading: { eyebrow: "Pertanyaan umum", title: "Masih ada yang ingin ditanyakan?" } satisfies SectionHeading,
      items: [
        { question: "Apakah pemulung wajib mengunduh aplikasi?", answer: "Tidak. Pemulung bisa menerima struk cetak atau digital, melihat papan harga di bank sampah, dan mengecek harga melalui WhatsApp." },
        { question: "Dari mana data harga WPI berasal?", answer: "Dari transaksi nyata di bank sampah dan agregator mitra yang tercatat di WAVE, lalu divalidasi sebelum dihitung menjadi indeks." },
        { question: "Seberapa sering harga diperbarui?", answer: "Harga acuan diperbarui berkala mengikuti periode transaksi yang masuk. Setiap halaman WPI menampilkan waktu pembaruan terakhir." },
        { question: "Bagaimana bank sampah bergabung?", answer: "Bank sampah dapat mendaftar melalui tombol Mulai bersama WAVE. Tim kami akan membantu proses verifikasi dan pelatihan pencatatan." },
      ] satisfies Faq[],
    },
    cta: { title: "Siap membuat harga limbah lebih terbuka?", description: "Bergabunglah dengan jaringan bank sampah, agregator, dan pembeli industri yang bertransaksi secara transparan.", actions: [{ label: "Mulai bersama WAVE", href: "/login" }, { label: "Lihat indeks WPI", href: "/wpi" }] } satisfies CtaContent,
  },
  EN: {
    hero: {
      eyebrow: "How It Works",
      title: "From the first deposit to a market reference price",
      description: "WAVE turns every validated waste transaction into open price data. The more transactions recorded, the more accurate the reference price becomes for everyone.",
      actions: [{ label: "View the WPI", href: "/wpi" }, { label: "Get started with WAVE", href: "/login" }],
    } satisfies PageHeroContent,
    steps: {
      heading: { eyebrow: "Transaction flow", title: "Five simple steps in every deposit" } satisfies SectionHeading,
      items: [
        { title: "Deposit waste", description: "Waste pickers or residents bring sorted waste to a WAVE partner waste bank or aggregator." },
        { title: "Weigh and grade", description: "The operator weighs the material and assigns a grade based on its type and cleanliness." },
        { title: "Record with the WPI reference", description: "The WPI reference price appears during recording, so the paid price can be compared openly." },
        { title: "Pay and send a receipt", description: "Waste pickers receive payment with a digital or printed receipt showing weight, grade, and price." },
        { title: "Data builds the index", description: "Transactions that pass validation become part of the regularly updated Waste Price Index." },
      ] satisfies Step[],
    },
    roles: {
      heading: { eyebrow: "Roles in the ecosystem", title: "Every participant benefits differently", description: "Pick your role to see how WAVE works from your perspective." } satisfies SectionHeading,
      items: [
        { value: "pemulung", label: "Waste Pickers", title: "Know the value of waste before selling", description: "Waste pickers do not need an app. Price information reaches them through price boards, receipts, and WhatsApp.", points: ["Check daily reference prices per material", "Receive a receipt for every deposit", "Compare the paid price with the market reference"], cta: { label: "More for waste pickers", href: "/untuk-pemulung" } },
        { value: "bank-sampah", label: "Waste Banks", title: "Tidy operations, better selling decisions", description: "Operators record deposits, track inventory, and use price forecasts to decide when to sell.", points: ["Digital records of weight, grade, and price", "Sell Now vs Wait calculator", "Access to verified industrial buyers"], cta: { label: "More for waste banks", href: "/untuk-bisnis#bank-sampah" } },
        { value: "industri", label: "Industrial Buyers", title: "More predictable raw-material supply", description: "Industrial buyers see available supply by region and grade, then publish their material needs.", points: ["Volume and grade data by region", "Publish raw-material demand", "Batch transactions with verified suppliers"], cta: { label: "More for industry", href: "/untuk-bisnis#pembeli-industri" } },
      ],
    },
    index: {
      heading: { eyebrow: "Waste Price Index", title: "How the reference price is formed", description: "The WPI is not a one-sided price. It is calculated from real transactions recorded across the WAVE network." } satisfies SectionHeading,
      items: [
        { icon: ShieldCheck, title: "Validated transactions", description: "Only transactions with complete weight, grade, and price data that pass anomaly checks are counted." },
        { icon: Boxes, title: "Grouped by material", description: "Prices are separated by material, grade, and region so comparisons stay fair." },
        { icon: LineChart, title: "Updated regularly", description: "The index updates with each transaction period, making price trends easy to follow." },
      ] satisfies Feature[],
      note: { title: "A reference, not a guaranteed price", description: "The WPI supports fairer negotiation. The final transaction price is still agreed between seller and buyer." },
    },
    faq: {
      heading: { eyebrow: "FAQ", title: "Still have questions?" } satisfies SectionHeading,
      items: [
        { question: "Do waste pickers need to download an app?", answer: "No. Waste pickers can receive printed or digital receipts, view price boards at waste banks, and check prices through WhatsApp." },
        { question: "Where does WPI price data come from?", answer: "From real transactions at partner waste banks and aggregators recorded in WAVE, validated before being calculated into the index." },
        { question: "How often are prices updated?", answer: "Reference prices update regularly with each incoming transaction period. Every WPI page shows its latest update time." },
        { question: "How can a waste bank join?", answer: "Waste banks can sign up through Get started with WAVE. Our team will help with verification and recording training." },
      ] satisfies Faq[],
    },
    cta: { title: "Ready to make waste prices more open?", description: "Join a network of waste banks, aggregators, and industrial buyers that trade transparently.", actions: [{ label: "Get started with WAVE", href: "/login" }, { label: "View the WPI", href: "/wpi" }] } satisfies CtaContent,
  },
} as const

export const wastePickersByLanguage = {
  ID: {
    hero: {
      eyebrow: "Untuk Pemulung",
      title: "Ketahui harga yang adil untuk setiap kilogram",
      description: "Cek harga acuan limbah tanpa perlu aplikasi. Terima struk untuk setiap setoran, dan putuskan kapan waktu terbaik untuk menjual.",
      actions: [{ label: "Cek harga hari ini", href: "/wpi" }, { label: "Tanya lewat WhatsApp", href: WHATSAPP_HREF, external: true }],
    } satisfies PageHeroContent,
    benefits: {
      heading: { eyebrow: "Manfaat", title: "Dirancang untuk kerja Anda sehari-hari" } satisfies SectionHeading,
      items: [
        { icon: Eye, title: "Harga yang bisa dicek", description: "Lihat harga acuan per material dan grade sebelum menyetor, jadi Anda tahu nilai limbah Anda." },
        { icon: Receipt, title: "Struk di setiap setoran", description: "Berat, grade, harga acuan, dan harga yang dibayar tercatat jelas di struk cetak atau digital." },
        { icon: MessageCircle, title: "Cukup lewat WhatsApp", description: "Kirim nama material ke nomor WhatsApp WAVE dan dapatkan harga acuan terbaru." },
        { icon: Smartphone, title: "Tanpa aplikasi", description: "Tidak perlu ponsel pintar canggih atau kuota besar. Informasi harga tetap sampai ke Anda." },
      ] satisfies Feature[],
    },
    channels: {
      heading: { eyebrow: "Cara cek harga", title: "Tiga cara mudah mengetahui harga", description: "Pilih yang paling nyaman untuk Anda." } satisfies SectionHeading,
      items: [
        { title: "Lihat papan harga", description: "Bank sampah mitra WAVE memasang papan harga acuan yang diperbarui berkala." },
        { title: "Kirim pesan WhatsApp", description: "Ketik nama material, misalnya \"HARGA KARDUS\", lalu kirim ke nomor WhatsApp WAVE." },
        { title: "Periksa struk setoran", description: "Setiap struk menampilkan harga acuan WPI di samping harga yang Anda terima." },
      ] satisfies Step[],
    },
    tips: {
      heading: { eyebrow: "Tips", title: "Cara mendapatkan nilai lebih dari limbah Anda" } satisfies SectionHeading,
      items: [
        { icon: Recycle, title: "Pilah sejak awal", description: "Limbah yang terpilah per jenis lebih mudah dinilai dan biasanya mendapat grade lebih baik." },
        { icon: ClipboardCheck, title: "Jaga tetap bersih dan kering", description: "Kardus kering dan plastik bersih umumnya dihargai lebih tinggi daripada yang basah atau kotor." },
        { icon: TrendingUp, title: "Pantau tren harga", description: "Jika harga sedang naik, menyimpan stok sebentar bisa lebih menguntungkan. Tanyakan pada operator." },
      ] satisfies Feature[],
    },
    note: { title: "Harga acuan membantu Anda bernegosiasi", description: "Harga yang Anda terima bisa sedikit berbeda dari acuan karena grade, kondisi, dan biaya operasional bank sampah. Struk membantu Anda melihat perbedaannya dengan jelas." },
    faq: {
      heading: { eyebrow: "Pertanyaan umum", title: "Yang sering ditanyakan pemulung" } satisfies SectionHeading,
      items: [
        { question: "Apakah layanan ini berbayar?", answer: "Tidak. Mengecek harga dan menerima struk dari bank sampah mitra WAVE gratis untuk pemulung." },
        { question: "Di mana saya bisa menyetor limbah?", answer: "Di bank sampah atau agregator mitra WAVE. Hubungi kami lewat WhatsApp untuk mengetahui lokasi terdekat." },
        { question: "Kenapa harga yang saya terima berbeda dari harga acuan?", answer: "Harga acuan adalah rata-rata pasar. Grade, kondisi material, dan biaya operasional bisa membuat harga transaksi sedikit berbeda." },
        { question: "Bagaimana kalau saya tidak punya ponsel?", answer: "Anda tetap bisa melihat papan harga di bank sampah dan meminta struk cetak setiap kali menyetor." },
      ] satisfies Faq[],
    },
    cta: { title: "Mulai cek harga limbah Anda hari ini", description: "Lihat harga acuan terbaru atau tanyakan lokasi bank sampah mitra terdekat.", actions: [{ label: "Lihat harga WPI", href: "/wpi" }, { label: "Hubungi via WhatsApp", href: WHATSAPP_HREF, external: true }] } satisfies CtaContent,
  },
  EN: {
    hero: {
      eyebrow: "For Waste Pickers",
      title: "Know the fair price for every kilogram",
      description: "Check waste reference prices without an app. Get a receipt for every deposit, and decide the best time to sell.",
      actions: [{ label: "Check today's prices", href: "/wpi" }, { label: "Ask on WhatsApp", href: WHATSAPP_HREF, external: true }],
    } satisfies PageHeroContent,
    benefits: {
      heading: { eyebrow: "Benefits", title: "Built around your daily work" } satisfies SectionHeading,
      items: [
        { icon: Eye, title: "Prices you can check", description: "See reference prices by material and grade before depositing, so you know what your waste is worth." },
        { icon: Receipt, title: "A receipt for every deposit", description: "Weight, grade, reference price, and paid price are clearly shown on a printed or digital receipt." },
        { icon: MessageCircle, title: "Just use WhatsApp", description: "Send a material name to the WAVE WhatsApp number and get the latest reference price." },
        { icon: Smartphone, title: "No app needed", description: "No advanced smartphone or large data plan required. Price information still reaches you." },
      ] satisfies Feature[],
    },
    channels: {
      heading: { eyebrow: "Checking prices", title: "Three easy ways to know the price", description: "Choose whichever is most convenient for you." } satisfies SectionHeading,
      items: [
        { title: "Look at the price board", description: "WAVE partner waste banks display regularly updated reference price boards." },
        { title: "Send a WhatsApp message", description: "Type a material name, for example \"PRICE CARDBOARD\", and send it to the WAVE WhatsApp number." },
        { title: "Check your deposit receipt", description: "Every receipt shows the WPI reference price next to the price you received." },
      ] satisfies Step[],
    },
    tips: {
      heading: { eyebrow: "Tips", title: "How to get more value from your waste" } satisfies SectionHeading,
      items: [
        { icon: Recycle, title: "Sort early", description: "Waste sorted by type is easier to assess and usually earns a better grade." },
        { icon: ClipboardCheck, title: "Keep it clean and dry", description: "Dry cardboard and clean plastic are usually valued higher than wet or dirty material." },
        { icon: TrendingUp, title: "Watch price trends", description: "When prices are rising, holding stock briefly may pay off. Ask your operator." },
      ] satisfies Feature[],
    },
    note: { title: "Reference prices help you negotiate", description: "The price you receive may differ slightly from the reference because of grade, condition, and waste-bank operating costs. Your receipt shows the difference clearly." },
    faq: {
      heading: { eyebrow: "FAQ", title: "Common questions from waste pickers" } satisfies SectionHeading,
      items: [
        { question: "Is this service paid?", answer: "No. Checking prices and receiving receipts from WAVE partner waste banks is free for waste pickers." },
        { question: "Where can I deposit waste?", answer: "At WAVE partner waste banks or aggregators. Contact us on WhatsApp to find the nearest location." },
        { question: "Why is my price different from the reference?", answer: "The reference is a market average. Grade, material condition, and operating costs can make the transaction price slightly different." },
        { question: "What if I don't have a phone?", answer: "You can still view the price board at the waste bank and ask for a printed receipt every time you deposit." },
      ] satisfies Faq[],
    },
    cta: { title: "Start checking your waste prices today", description: "See the latest reference prices or ask for the nearest partner waste bank.", actions: [{ label: "View WPI prices", href: "/wpi" }, { label: "Contact via WhatsApp", href: WHATSAPP_HREF, external: true }] } satisfies CtaContent,
  },
} as const

export const businessByLanguage = {
  ID: {
    hero: {
      eyebrow: "Untuk Bisnis",
      title: "Data harga dan pasokan limbah untuk keputusan bisnis yang lebih baik",
      description: "WAVE membantu bank sampah, agregator, dan pembeli industri bertransaksi dengan data yang sama: harga acuan, volume, dan grade yang tervalidasi.",
      actions: [{ label: "Mulai bersama WAVE", href: "/login" }, { label: "Hubungi tim kami", href: EMAIL_HREF, external: true }],
    } satisfies PageHeroContent,
    segments: [
      {
        id: "bank-sampah",
        heading: { eyebrow: "Bank Sampah & Agregator", title: "Kelola operasional dan jual di waktu yang tepat", description: "Semua yang dibutuhkan operator untuk mencatat, menyimpan, dan menjual material dengan lebih percaya diri." } satisfies SectionHeading,
        items: [
          { icon: ClipboardCheck, title: "Pencatatan digital", description: "Catat setoran lengkap dengan berat, grade, harga acuan WPI, dan harga yang dibayar." },
          { icon: Calculator, title: "Jual Sekarang vs Tunggu", description: "Prediksi harga dan kalkulator membantu memutuskan waktu jual dengan memperhitungkan risiko." },
          { icon: Package, title: "Stok yang terlihat", description: "Pantau stok per material dan grade untuk merencanakan pengiriman batch." },
          { icon: Handshake, title: "Akses pembeli industri", description: "Terhubung dengan pembeli terverifikasi yang mencari pasokan sesuai stok Anda." },
        ] satisfies Feature[],
      },
      {
        id: "pembeli-industri",
        heading: { eyebrow: "Pembeli Industri", title: "Rencanakan pembelian bahan baku daur ulang", description: "Pasokan yang terverifikasi dan data pasar membantu tim pengadaan bekerja lebih efisien." } satisfies SectionHeading,
        items: [
          { icon: ShieldCheck, title: "Pasokan terverifikasi", description: "Bertransaksi dengan bank sampah dan agregator yang datanya tercatat dan tervalidasi." },
          { icon: Megaphone, title: "Publikasikan kebutuhan", description: "Umumkan kebutuhan material, grade, dan volume agar pemasok dapat merespons." },
          { icon: BarChart3, title: "Data pasar", description: "Gunakan indeks harga dan tren volume per wilayah untuk perencanaan anggaran." },
          { icon: Leaf, title: "Jejak dampak", description: "Rantai pasok tercatat mendukung pelaporan keberlanjutan dan dampak sosial." },
        ] satisfies Feature[],
      },
    ],
    onboarding: {
      heading: { eyebrow: "Cara memulai", title: "Bergabung dalam beberapa langkah", description: "Proses onboarding disesuaikan dengan peran bisnis Anda." } satisfies SectionHeading,
      tabs: [
        { value: "bank-sampah", label: "Bank Sampah & Agregator", steps: [{ title: "Daftar akun", description: "Buat akun operator dan lengkapi profil bank sampah Anda." }, { title: "Verifikasi", description: "Tim WAVE memverifikasi lokasi, legalitas, dan jenis material yang dikelola." }, { title: "Pelatihan pencatatan", description: "Operator mendapat pendampingan untuk mencatat setoran dan mencetak struk." }, { title: "Mulai bertransaksi", description: "Catat setoran, pantau stok, dan tawarkan material ke pembeli industri." }] satisfies Step[] },
        { value: "pembeli-industri", label: "Pembeli Industri", steps: [{ title: "Hubungi tim kami", description: "Ceritakan kebutuhan material, grade, volume, dan wilayah operasional Anda." }, { title: "Verifikasi perusahaan", description: "Kami memverifikasi profil perusahaan untuk menjaga kepercayaan di jaringan." }, { title: "Publikasi kebutuhan", description: "Kebutuhan Anda ditampilkan ke pemasok yang sesuai di jaringan WAVE." }, { title: "Transaksi batch", description: "Sepakati harga berbasis data WPI dan terima pasokan secara terjadwal." }] satisfies Step[] },
      ],
    },
    faq: {
      heading: { eyebrow: "Pertanyaan umum", title: "Pertanyaan dari mitra bisnis" } satisfies SectionHeading,
      items: [
        { question: "Apakah WAVE menjadi perantara transaksi?", answer: "WAVE menyediakan data harga dan mempertemukan pasokan dengan kebutuhan. Kesepakatan harga dan pengiriman tetap dilakukan antara penjual dan pembeli." },
        { question: "Material apa saja yang didukung?", answer: "Material daur ulang umum seperti kardus, kertas, plastik PET dan HDPE, logam, dan kaca. Daftar lengkap tersedia di halaman WPI." },
        { question: "Bagaimana data saya dijaga?", answer: "Data transaksi individual tidak dipublikasikan. Yang tampil di WPI hanyalah agregat harga per material, grade, dan wilayah." },
        { question: "Apakah ada biaya untuk bergabung?", answer: "Hubungi tim kami untuk informasi skema kemitraan yang sesuai dengan skala operasional Anda." },
      ] satisfies Faq[],
    },
    cta: { title: "Bangun rantai pasok limbah yang lebih transparan", description: "Diskusikan kebutuhan bisnis Anda dengan tim WAVE.", actions: [{ label: "Mulai bersama WAVE", href: "/login" }, { label: "Kirim email", href: EMAIL_HREF, external: true }] } satisfies CtaContent,
  },
  EN: {
    hero: {
      eyebrow: "For Businesses",
      title: "Waste price and supply data for better business decisions",
      description: "WAVE helps waste banks, aggregators, and industrial buyers trade on the same data: validated reference prices, volumes, and grades.",
      actions: [{ label: "Get started with WAVE", href: "/login" }, { label: "Contact our team", href: EMAIL_HREF, external: true }],
    } satisfies PageHeroContent,
    segments: [
      {
        id: "bank-sampah",
        heading: { eyebrow: "Waste Banks & Aggregators", title: "Run operations and sell at the right time", description: "Everything operators need to record, store, and sell materials with more confidence." } satisfies SectionHeading,
        items: [
          { icon: ClipboardCheck, title: "Digital records", description: "Record deposits with weight, grade, WPI reference price, and paid price." },
          { icon: Calculator, title: "Sell Now vs Wait", description: "Price forecasts and a calculator help you choose when to sell while accounting for risk." },
          { icon: Package, title: "Visible inventory", description: "Track stock by material and grade to plan batch shipments." },
          { icon: Handshake, title: "Industrial buyer access", description: "Connect with verified buyers looking for supply that matches your stock." },
        ] satisfies Feature[],
      },
      {
        id: "pembeli-industri",
        heading: { eyebrow: "Industrial Buyers", title: "Plan recycled raw-material purchases", description: "Verified supply and market data help procurement teams work more efficiently." } satisfies SectionHeading,
        items: [
          { icon: ShieldCheck, title: "Verified supply", description: "Trade with waste banks and aggregators whose data is recorded and validated." },
          { icon: Megaphone, title: "Publish demand", description: "Announce material, grade, and volume needs so suppliers can respond." },
          { icon: BarChart3, title: "Market data", description: "Use price indices and regional volume trends for budget planning." },
          { icon: Leaf, title: "Impact trail", description: "A recorded supply chain supports sustainability and social-impact reporting." },
        ] satisfies Feature[],
      },
    ],
    onboarding: {
      heading: { eyebrow: "Getting started", title: "Join in a few steps", description: "Onboarding is tailored to your business role." } satisfies SectionHeading,
      tabs: [
        { value: "bank-sampah", label: "Waste Banks & Aggregators", steps: [{ title: "Create an account", description: "Sign up as an operator and complete your waste-bank profile." }, { title: "Verification", description: "The WAVE team verifies location, legal status, and the materials you handle." }, { title: "Recording training", description: "Operators are guided on recording deposits and printing receipts." }, { title: "Start trading", description: "Record deposits, track stock, and offer materials to industrial buyers." }] satisfies Step[] },
        { value: "pembeli-industri", label: "Industrial Buyers", steps: [{ title: "Contact our team", description: "Tell us your material, grade, volume, and operating-region needs." }, { title: "Company verification", description: "We verify your company profile to maintain trust across the network." }, { title: "Publish demand", description: "Your needs are shown to matching suppliers in the WAVE network." }, { title: "Batch transactions", description: "Agree on WPI-informed prices and receive scheduled supply." }] satisfies Step[] },
      ],
    },
    faq: {
      heading: { eyebrow: "FAQ", title: "Questions from business partners" } satisfies SectionHeading,
      items: [
        { question: "Does WAVE act as a transaction intermediary?", answer: "WAVE provides price data and matches supply with demand. Price agreements and delivery remain between seller and buyer." },
        { question: "Which materials are supported?", answer: "Common recyclables such as cardboard, paper, PET and HDPE plastics, metals, and glass. The full list is on the WPI page." },
        { question: "How is my data protected?", answer: "Individual transaction data is never published. The WPI only shows aggregated prices by material, grade, and region." },
        { question: "Is there a fee to join?", answer: "Contact our team for a partnership scheme that fits your operational scale." },
      ] satisfies Faq[],
    },
    cta: { title: "Build a more transparent waste supply chain", description: "Discuss your business needs with the WAVE team.", actions: [{ label: "Get started with WAVE", href: "/login" }, { label: "Send an email", href: EMAIL_HREF, external: true }] } satisfies CtaContent,
  },
} as const

export const aboutByLanguage = {
  ID: {
    hero: {
      eyebrow: "Tentang WAVE",
      title: "Membuat harga limbah terlihat, agar nilainya bisa dibagi lebih adil",
      description: "WAVE (Waste Value Exchange) adalah platform indeks harga limbah yang dihitung dari transaksi nyata dan dibangun bersama bank sampah serta pengelola limbah di Indonesia.",
      actions: [{ label: "Lihat cara kerja", href: "/cara-kerja" }, { label: "Lihat indeks WPI", href: "/wpi" }],
    } satisfies PageHeroContent,
    story: {
      heading: { eyebrow: "Cerita kami", title: "Pasar limbah yang selama ini gelap" } satisfies SectionHeading,
      paragraphs: [
        "Di sepanjang rantai nilai limbah, harga sering ditentukan oleh pihak yang memiliki informasi paling banyak. Pemulung, yang bekerja paling keras, justru paling jarang tahu nilai sebenarnya dari limbah yang mereka kumpulkan.",
        "Kami meminjam bahasa bursa—ticker, indeks, dan grafik—untuk membuka pasar ini bagi pemulung, operator, pengepul, dan pembeli industri. Setiap transaksi tervalidasi menjadi bagian dari harga acuan bersama.",
        "Pemulung tidak perlu memiliki aplikasi. Mereka tetap bisa menerima struk digital atau cetak, melihat papan harga publik, dan mengecek harga melalui WhatsApp.",
      ],
    },
    mission: [
      { icon: Target, title: "Misi", description: "Menyediakan harga acuan limbah yang terbuka dan dapat dipercaya, sehingga setiap pihak dalam rantai nilai mendapat bagian yang lebih adil." },
      { icon: Eye, title: "Visi", description: "Ekonomi sirkular Indonesia di mana nilai setiap kilogram limbah terlihat, tercatat, dan dirasakan oleh semua yang terlibat." },
    ] satisfies Feature[],
    problems: {
      heading: { eyebrow: "Masalah yang kami selesaikan", title: "Tiga kesenjangan di pasar limbah" } satisfies SectionHeading,
      items: [
        { icon: Scale, title: "Harga tidak terlihat", description: "Tanpa harga acuan, pemulung dan bank sampah sulit menilai apakah harga yang ditawarkan wajar." },
        { icon: Users, title: "Informasi tidak merata", description: "Data pasar terkonsentrasi di pihak tertentu sehingga posisi tawar pelaku kecil lemah." },
        { icon: Truck, title: "Pasokan tidak pasti", description: "Pembeli industri kesulitan merencanakan bahan baku karena pasokan tidak tercatat dengan baik." },
      ] satisfies Feature[],
    },
    values: {
      heading: { eyebrow: "Nilai kami", title: "Prinsip yang memandu setiap keputusan" } satisfies SectionHeading,
      items: [
        { icon: Eye, title: "Transparan", description: "Metodologi indeks terbuka dan dapat dipelajari siapa saja." },
        { icon: HeartHandshake, title: "Inklusif", description: "Informasi harus sampai ke pemulung, bahkan tanpa aplikasi." },
        { icon: LineChart, title: "Berbasis data", description: "Harga acuan lahir dari transaksi nyata, bukan perkiraan sepihak." },
        { icon: Handshake, title: "Kolaboratif", description: "Dibangun bersama bank sampah, agregator, dan industri." },
      ] satisfies Feature[],
    },
    impact: {
      heading: { eyebrow: "Dampak", title: "Dampak yang kami ukur", description: "Kami menilai keberhasilan WAVE dari perubahan nyata di lapangan." } satisfies SectionHeading,
      items: [
        { icon: Wallet, title: "Pendapatan yang lebih adil", description: "Selisih antara harga acuan dan harga yang diterima pemulung semakin kecil dan transparan." },
        { icon: Recycle, title: "Lebih banyak yang didaur ulang", description: "Harga yang jelas mendorong lebih banyak material dipilah dan masuk ke industri daur ulang." },
        { icon: Store, title: "Bank sampah yang tumbuh", description: "Operasional yang tercatat membuka akses ke pembeli dan pembiayaan yang lebih baik." },
      ] satisfies Feature[],
    },
    ecosystem: { title: "Siapa yang kami layani", items: ["Pemulung", "Bank Sampah", "Agregator & Pengepul", "Pembeli Industri", "Pemerintah Daerah", "Mitra Keberlanjutan"] },
    cta: { title: "Mari membangun pasar limbah yang lebih adil", description: "Hubungi kami untuk kemitraan, riset, atau sekadar berdiskusi tentang ekonomi sirkular.", actions: [{ label: "Hubungi kami", href: EMAIL_HREF, external: true }, { label: "Mulai bersama WAVE", href: "/login" }] } satisfies CtaContent,
  },
  EN: {
    hero: {
      eyebrow: "About WAVE",
      title: "Making waste prices visible, so value can be shared more fairly",
      description: "WAVE (Waste Value Exchange) is a waste-price index platform built from real transactions and developed with waste banks and waste-management operators across Indonesia.",
      actions: [{ label: "See how it works", href: "/cara-kerja" }, { label: "View the WPI", href: "/wpi" }],
    } satisfies PageHeroContent,
    story: {
      heading: { eyebrow: "Our story", title: "A market that has long been opaque" } satisfies SectionHeading,
      paragraphs: [
        "Across the waste value chain, prices are often set by whoever holds the most information. Waste pickers, who work the hardest, are the least likely to know the true value of what they collect.",
        "We borrow the language of an exchange—tickers, indices, and charts—to open this market to waste pickers, operators, aggregators, and industrial buyers. Every validated transaction becomes part of a shared reference price.",
        "Waste pickers do not need an app. They can receive digital or printed receipts, view public price boards, and check prices through WhatsApp.",
      ],
    },
    mission: [
      { icon: Target, title: "Mission", description: "Provide open, trustworthy waste reference prices so every participant in the value chain gets a fairer share." },
      { icon: Eye, title: "Vision", description: "An Indonesian circular economy where the value of every kilogram of waste is visible, recorded, and felt by everyone involved." },
    ] satisfies Feature[],
    problems: {
      heading: { eyebrow: "The problems we solve", title: "Three gaps in the waste market" } satisfies SectionHeading,
      items: [
        { icon: Scale, title: "Invisible prices", description: "Without a reference, waste pickers and waste banks struggle to judge whether an offer is fair." },
        { icon: Users, title: "Unequal information", description: "Market data sits with a few players, weakening the bargaining position of small actors." },
        { icon: Truck, title: "Uncertain supply", description: "Industrial buyers find it hard to plan raw materials because supply is poorly recorded." },
      ] satisfies Feature[],
    },
    values: {
      heading: { eyebrow: "Our values", title: "Principles behind every decision" } satisfies SectionHeading,
      items: [
        { icon: Eye, title: "Transparent", description: "The index methodology is open for anyone to study." },
        { icon: HeartHandshake, title: "Inclusive", description: "Information must reach waste pickers, even without an app." },
        { icon: LineChart, title: "Data-driven", description: "Reference prices come from real transactions, not one-sided estimates." },
        { icon: Handshake, title: "Collaborative", description: "Built together with waste banks, aggregators, and industry." },
      ] satisfies Feature[],
    },
    impact: {
      heading: { eyebrow: "Impact", title: "The impact we measure", description: "We judge WAVE's success by real change on the ground." } satisfies SectionHeading,
      items: [
        { icon: Wallet, title: "Fairer income", description: "The gap between the reference price and what waste pickers receive becomes smaller and transparent." },
        { icon: Recycle, title: "More recycling", description: "Clear prices encourage more material to be sorted and enter the recycling industry." },
        { icon: Store, title: "Growing waste banks", description: "Recorded operations open access to better buyers and financing." },
      ] satisfies Feature[],
    },
    ecosystem: { title: "Who we serve", items: ["Waste Pickers", "Waste Banks", "Aggregators & Collectors", "Industrial Buyers", "Local Governments", "Sustainability Partners"] },
    cta: { title: "Let's build a fairer waste market", description: "Contact us about partnerships, research, or simply to talk circular economy.", actions: [{ label: "Contact us", href: EMAIL_HREF, external: true }, { label: "Get started with WAVE", href: "/login" }] } satisfies CtaContent,
  },
} as const
