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
    publishedData:
      "Data published WAVE — angka berasal dari snapshot yang dipublikasikan melalui pipeline WPI.",
    staleData:
      "Snapshot published terakhir berstatus stale — gunakan sebagai referensi dengan kehati-hatian.",
    emptyData:
      "Belum ada snapshot published untuk ditampilkan. Data akan muncul setelah kalkulasi dan publikasi disetujui.",
    unavailableData:
      "Data WPI belum dapat dimuat. Coba lagi setelah koneksi ke backend tersedia.",
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
        "Indeks yang tampil berasal dari snapshot hasil kalkulasi backend per material, grade, wilayah, dan periode. Versi metodologi mengikuti metadata snapshot yang dipublikasikan.",
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
        "Halaman publik membaca snapshot yang sudah dipublikasikan. Frekuensi pembaruan mengikuti pipeline kalkulasi dan publikasi WPI.",
      ],
      [
        "Bagaimana grade ditentukan?",
        "Definisi grade di halaman ini bersifat sementara dan menunggu persetujuan bisnis.",
      ],
    ] as [string, string][],
    disclaimer:
      "WPI adalah informasi referensi pasar, bukan jaminan harga transaksi tertentu.",
    chartNote:
      "Grafik hanya menggunakan snapshot published; garis emas menunjukkan harga acuan setoran jika tersedia.",
    related: "Material terkait",
    back: "Kembali ke WPI",
  },
  EN: {
    eyebrow: "Waste Price Index",
    title: "Visible waste prices, for fairer decisions.",
    description:
      "Explore recycled-material prices based on validated transactions, deposit reference prices, regions, grades, and observation periods.",
    lastUpdated: "Last updated",
    prototype:
      "Prototype data — figures on this page are illustrative and do not represent the actual market.",
    publishedData:
      "WAVE published data — figures come from snapshots published through the WPI pipeline.",
    staleData:
      "The latest published snapshot is marked stale — use it as a reference with care.",
    emptyData:
      "There is no published snapshot to display yet. Data will appear after an approved calculation and publication.",
    unavailableData:
      "WPI data could not be loaded. Try again when the backend connection is available.",
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
        "The displayed index comes from a backend snapshot calculated by material, grade, region, and observation window. The snapshot carries its methodology version.",
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
        "The public page reads published snapshots. Update frequency follows the WPI calculation and publication pipeline.",
      ],
      [
        "How are grades defined?",
        "Grade definitions on this page are provisional and pending business approval.",
      ],
    ] as [string, string][],
    disclaimer:
      "WPI is market-reference information, not a guarantee of any specific transaction price.",
    chartNote:
      "The chart only uses published snapshots; the gold line shows the deposit reference price when available.",
    related: "Related materials",
    back: "Back to WPI",
  },
} as const

export type WpiCopy = (typeof wpiContentByLanguage)["ID"]

export function useWpiContent(language: Language) {
  return wpiContentByLanguage[language]
}
