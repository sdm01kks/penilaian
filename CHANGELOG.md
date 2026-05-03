## [2026-05-03] — v12 · Sesi 16 · Penyempurnaan Layout Cetak SKL

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

---

| # | Masalah (dari catatan PDF) | Perubahan CSS |
|---|---------------------------|---------------|
| 1 | Logo terlalu kecil | `54px × 54px` → `76px × 76px` |
| 2 | Ukuran font nama sekolah terlalu kecil | `font-size: 13pt` → `15pt` |
| 3 | NSS tidak berada di tepi kiri di atas garis | Baris NSS/NPSN dipindah ke **luar** blok `.kop-surat`, menjadi elemen sendiri dengan `width: 100%` — kini sejajar dengan garis pemisah |
| 4 | Jarak antara "LULUS" dan teks di bawahnya terlalu dekat | `margin-bottom: 2px` → `8px` pada `.nilai-rerata` |
| 5 | Jarak antara kalimat akhir dan "Ditetapkan" terlalu dekat | `padding-top: 4mm` → `8mm` pada `.sign-area` |
| 6 | Lampiran masih 2 halaman | Font tabel: `10.5pt → 10pt`, padding sel dikurangi, `line-height` body dikurangi `1.6 → 1.5`, biodata padding dikurangi, `sign-gap: 13mm → 11mm` |

### 📋 File yang Diubah (v12)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-skl.html` | **Diubah** |

---

*Dibuat: 3 Mei 2026 (v12) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
