import type { Material } from "./types"

const grades = [
  { code: "A", name: { ID: "Grade A", EN: "Grade A" }, description: { ID: "Bersih, kering, dan terpilah. Definisi sementara, menunggu persetujuan bisnis.", EN: "Clean, dry, and sorted. Draft definition, pending business approval." } },
  { code: "B", name: { ID: "Grade B", EN: "Grade B" }, description: { ID: "Sedikit kontaminasi atau campuran. Definisi sementara, menunggu persetujuan bisnis.", EN: "Light contamination or mixed material. Draft definition, pending business approval." } },
  { code: "C", name: { ID: "Grade C", EN: "Grade C" }, description: { ID: "Kontaminasi lebih tinggi atau belum terpilah. Definisi sementara, menunggu persetujuan bisnis.", EN: "Higher contamination or unsorted. Draft definition, pending business approval." } },
]

export const materials: Material[] = [
  { slug: "pet", name: { ID: "PET Botol", EN: "PET Bottles" }, category: { ID: "Plastik", EN: "Plastic" }, description: { ID: "Botol PET pascakonsumsi yang dipilah berdasarkan kualitas.", EN: "Post-consumer PET bottles sorted by quality." }, grades },
  { slug: "hdpe", name: { ID: "HDPE", EN: "HDPE" }, category: { ID: "Plastik", EN: "Plastic" }, description: { ID: "Kemasan plastik HDPE untuk kebutuhan daur ulang.", EN: "HDPE plastic packaging for recycling." }, grades },
  { slug: "pp", name: { ID: "PP", EN: "PP" }, category: { ID: "Plastik", EN: "Plastic" }, description: { ID: "Material polypropylene dari kemasan dan komponen rumah tangga.", EN: "Polypropylene from packaging and household components." }, grades },
  { slug: "kardus", name: { ID: "Kardus/OCC", EN: "Cardboard/OCC" }, category: { ID: "Kertas", EN: "Paper" }, description: { ID: "Kardus bekas dan corrugated cardboard yang telah dikumpulkan.", EN: "Used cardboard and corrugated cardboard collected for recycling." }, grades },
  { slug: "aluminium", name: { ID: "Aluminium", EN: "Aluminium" }, category: { ID: "Logam", EN: "Metal" }, description: { ID: "Aluminium pascakonsumsi yang dipilah dari material lain.", EN: "Post-consumer aluminium sorted from other materials." }, grades },
  { slug: "besi", name: { ID: "Besi", EN: "Ferrous metal" }, category: { ID: "Logam", EN: "Metal" }, description: { ID: "Material besi dari aliran scrap pascakonsumsi.", EN: "Ferrous material from post-consumer scrap streams." }, grades },
]

export const materialSlugs = materials.map((material) => material.slug)
