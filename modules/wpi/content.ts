import type { Language } from "@/modules/landing-page/config"

export const wpiContentByLanguage = {
  ID: {
    eyebrow: "Waste Price Index",
    title: "Harga limbah yang terlihat, untuk keputusan yang lebih adil.",
    description:
      "Lihat indeks harga material daur ulang berdasarkan transaksi tervalidasi, harga acuan setoran, wilayah, grade, dan periode pengamatan.",
    lastUpdated: "Data terakhir diperbarui",
    prototype:
      "Data prototipe — angka pada halaman ini bersifat ilustratif dan belum merepresentasikan pasar aktual.",
    snapshot: "Ringkasan pasar",
    filters: "Filter data",
    table: "Harga material",
    chart: "Pergerakan harga",
    explorer: "Jelajahi material",
    methodology: "Metodologi dan batasan",
    reset: "Reset filter",
    viewDetail: "Lihat detail",
    index: "Indeks transaksi tervalidasi",
    reference: "Harga acuan setoran",
    asking: "Harga penawaran — Segera hadir",
    priceType: "Jenis harga",
    material: "Material",
    grade: "Grade",
    region: "Wilayah",
    period: "Periode",
    unit: "Satuan: Rupiah/kg",
    price: "Harga",
    allMaterials: "Semua material",
    allGrades: "Semua grade",
    periodOptions: { "7d": "7 hari", "30d": "30 hari", "90d": "90 hari" },
    empty: "Belum cukup data untuk membentuk indeks.",
    noAsking: "Harga penawaran publik belum tersedia.",
    change: "Perubahan",
    volume: "Volume",
    observations: "Observasi",
    updated: "Diperbarui",
    source: "Sumber",
    faq: [
      [
        "Apa itu WPI?",
        "WPI menyatukan transaksi tervalidasi menjadi referensi harga material daur ulang yang dapat dibaca publik.",
      ],
      [
        "Apa perbedaan indeks dan harga acuan?",
        "Indeks transaksi dibentuk dari transaksi yang selesai dan tervalidasi. Harga acuan setoran membantu menentukan nilai awal saat material diserahkan.",
      ],
      [
        "Apakah WPI menjamin harga transaksi?",
        "Tidak. Harga aktual dapat berbeda berdasarkan lokasi, volume, grade, kebersihan, logistik, dan kesepakatan para pihak.",
      ],
      [
        "Bagaimana indeks dihitung?",
        "Versi prototipe menggunakan agregasi harga transaksi per material, grade, wilayah, dan periode. Versi metodologi: draft-0.",
      ],
      [
        "Berapa minimum data yang dibutuhkan?",
        "Kombinasi dengan kurang dari lima transaksi tidak dipublikasikan sebagai indeks.",
      ],
      [
        "Bagaimana outlier diperlakukan?",
        "Aturan outlier masih menjadi keputusan bisnis terbuka dan akan dicatat dalam versi metodologi berikutnya.",
      ],
      [
        "Seberapa sering data diperbarui?",
        "Snapshot publik prototipe menggunakan tanggal acuan tetap. Pipeline pembaruan produksi akan ditentukan bersama dashboard internal.",
      ],
      [
        "Bagaimana grade ditentukan?",
        "Definisi grade di halaman ini bersifat sementara dan menunggu persetujuan bisnis.",
      ],
    ] as [string, string][],
    disclaimer:
      "WPI adalah informasi referensi pasar, bukan jaminan harga transaksi tertentu.",
    chartNote:
      "Grafik menunjukkan median/agregasi prototipe transaksi tervalidasi.",
    related: "Material terkait",
    back: "Kembali ke WPI",
    market: {
      title: "Pasar WPI",
      subtitle:
        "Grafik, order book, dan kedalaman likuiditas untuk material daur ulang.",
      prototype:
        "Data pasar disimulasikan — grafik, order book, spread, dan pergerakan harga dibangkitkan untuk prototipe dan bukan likuiditas pasar nyata.",
      currentPrice: "Harga terkini",
      high24h: "Tertinggi 24j",
      low24h: "Terendah 24j",
      volume24h: "Volume 24j",
      change24h: "Perubahan 24j",
      statusSimulated: "Simulasi",
      statusConnecting: "Menghubungkan…",
      statusLive: "Langsung",
      statusError: "Terputus",
      candlestick: "Candlestick",
      line: "Garis",
      open: "Buka",
      high: "Tertinggi",
      low: "Terendah",
      close: "Tutup",
      volume: "Volume",
      timeframe: "Rentang waktu",
      chartView: "Tampilan grafik",
      orderBook: "Order book",
      bids: "Permintaan beli",
      asks: "Penawaran jual",
      price: "Harga",
      size: "Jumlah",
      total: "Total kumulatif",
      spread: "Spread",
      dataUnavailable: "Data simulasi tidak tersedia.",
      srChartSummary:
        "Harga terakhir {last}, perubahan 24 jam {change}, rentang {low} hingga {high}, rentang waktu {timeframe}.",
    },
  },
  EN: {
    eyebrow: "Waste Price Index",
    title: "Visible waste prices, for fairer decisions.",
    description:
      "Explore recycled-material prices based on validated transactions, deposit reference prices, regions, grades, and observation periods.",
    lastUpdated: "Last updated",
    prototype:
      "Prototype data — figures on this page are illustrative and do not represent the actual market.",
    snapshot: "Market snapshot",
    filters: "Data filters",
    table: "Material prices",
    chart: "Price movement",
    explorer: "Explore materials",
    methodology: "Methodology and limitations",
    reset: "Reset filters",
    viewDetail: "View details",
    index: "Validated transaction index",
    reference: "Deposit reference price",
    asking: "Asking price — Coming soon",
    priceType: "Price type",
    material: "Material",
    grade: "Grade",
    region: "Region",
    period: "Period",
    unit: "Unit: Rupiah/kg",
    price: "Price",
    allMaterials: "All materials",
    allGrades: "All grades",
    periodOptions: { "7d": "7 days", "30d": "30 days", "90d": "90 days" },
    empty: "There is not enough data to form an index.",
    noAsking: "Public asking prices are not available yet.",
    change: "Change",
    volume: "Volume",
    observations: "Observations",
    updated: "Updated",
    source: "Source",
    faq: [
      [
        "What is WPI?",
        "WPI turns validated transactions into a public reference for recycled-material prices.",
      ],
      [
        "What is the difference between the index and reference price?",
        "The transaction index is formed from completed, validated transactions. The deposit reference price helps set an initial value when material is handed over.",
      ],
      [
        "Does WPI guarantee a transaction price?",
        "No. Actual prices can differ based on location, volume, grade, cleanliness, logistics, and the parties' agreement.",
      ],
      [
        "How is the index calculated?",
        "The prototype aggregates transaction prices by material, grade, region, and period. Methodology version: draft-0.",
      ],
      [
        "What is the minimum data needed?",
        "Combinations with fewer than five transactions are not published as an index.",
      ],
      [
        "How are outliers handled?",
        "Outlier rules remain an open business decision and will be recorded in a future methodology version.",
      ],
      [
        "How often is data updated?",
        "The public prototype uses a fixed reference date. The production update pipeline will be defined with the internal dashboard.",
      ],
      [
        "How are grades defined?",
        "Grade definitions on this page are provisional and pending business approval.",
      ],
    ] as [string, string][],
    disclaimer:
      "WPI is market-reference information, not a guarantee of any specific transaction price.",
    chartNote:
      "The chart shows a prototype aggregation of validated transactions.",
    related: "Related materials",
    back: "Back to WPI",
    market: {
      title: "WPI Market",
      subtitle:
        "Chart, order book, and liquidity depth for recycled materials.",
      prototype:
        "Market data is simulated — the chart, order book, spread, and price movement are generated for a prototype and do not represent real market liquidity.",
      currentPrice: "Current price",
      high24h: "24h high",
      low24h: "24h low",
      volume24h: "24h volume",
      change24h: "24h change",
      statusSimulated: "Simulated",
      statusConnecting: "Connecting…",
      statusLive: "Live",
      statusError: "Offline",
      candlestick: "Candlestick",
      line: "Line",
      open: "Open",
      high: "High",
      low: "Low",
      close: "Close",
      volume: "Volume",
      timeframe: "Timeframe",
      chartView: "Chart view",
      orderBook: "Order book",
      bids: "Bids",
      asks: "Asks",
      price: "Price",
      size: "Size",
      total: "Cumulative total",
      spread: "Spread",
      dataUnavailable: "Simulated data unavailable.",
      srChartSummary:
        "Last price {last}, 24-hour change {change}, range {low} to {high}, timeframe {timeframe}.",
    },
  },
} as const

export type WpiCopy = (typeof wpiContentByLanguage)["ID"]

export function useWpiContent(language: Language) {
  return wpiContentByLanguage[language]
}
