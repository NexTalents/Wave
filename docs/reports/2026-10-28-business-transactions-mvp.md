# Report Implementasi MVP Transaksi dan Setoran Masuk

Tanggal: 28 Oktober 2026

## Yang dibuat

- Wizard operator pada `/dashboard/business` untuk memilih pemulung, memasukkan berat, dan mengambil foto melalui kamera smartphone.
- Mock Vision Adapter yang mengembalikan jenis material, kondisi, grade, dan catatan analisis.
- Review grade oleh operator dengan pilihan A/B/C.
- Hard block harga di bawah minimum grade.
- Perhitungan nilai transaksi, tunai, titip stok 70%, dan sisa pembulatan ke dompet digital.
- Mock WhatsApp Adapter dengan status pengiriman `sent` dan pesan struk simulasi.
- Schema dan mutation Convex untuk pemulung, harga pasar, transaksi immutable, lot titip stok, delivery receipt, daftar transaksi, serta void berotorisasi.
- Permission `transactions:confirm` dan `transactions:void` untuk tahap otorisasi berikutnya.

## Keputusan MVP

- Data picker dan WPI pada UI masih berupa data demo agar flow bisa dicoba tanpa seed/deployment tambahan.
- Foto masih diproses lokal dan belum disimpan ke Convex Storage.
- Tombol konfirmasi UI saat ini menguji adapter/mock secara lokal; mutation Convex sudah tersedia sebagai backend contract dan dapat dihubungkan setelah seed organisasi/pemulung tersedia.
- Tidak ada dependency baru yang diinstall.

## Batasan yang perlu dilanjutkan

- Seed pemulung dan harga per organisasi.
- Wiring UI ke mutation transaksi setelah organisasi aktif dan seed pemulung tersedia.
- Void dengan PIN supervisor.
- Cron pencairan lot setelah 30 hari dan formula kenaikan WPI.
- Penggantian Mock Vision dan Mock WhatsApp dengan service production.
