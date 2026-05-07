## [2026-05-07] — v17 · Perbaikan Jarak Footer Rapor

### 🐛 Perbaikan

Semua perubahan hanya pada `rapor/preview.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Jarak antara garis pembatas footer dan teks footer masih terlalu besar | `padding-top` pada `@bottom-left` dan `@bottom-right` di `@page` dikurangi dari **3pt → 1pt** |

### 📋 File yang Diubah (v17)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — `@page @bottom-left` dan `@bottom-right`, `padding-top: 3pt` |

---

## [2026-05-07] — v16 · Perbaikan Keputusan Naik/Tinggal Kelas di Rapor

### 🐛 Perbaikan

Semua perubahan hanya pada `rapor/preview.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | "Naik ke Fase X" menampilkan fase yang salah — fase selalu naik satu huruf dari fase saat ini, padahal kelas 1→2 tetap fase A, kelas 3→4 tetap fase B, dst. | Tulis ulang `nextFase(f)` menjadi `nextFase(kelas)`: fase dihitung dari kelas **tujuan** (kelas+1), bukan dari fase saat ini. Pemetaan: kelas 1–2=A, 3–4=B, 5–6=C, 7+=D. Call site diubah dari `nextFase(d.fase)` → `nextFase(d.kelas)` di dua tempat (screen + print). |
| 2 | "Tinggal di kelas 2B" — mencantumkan huruf rombongan belajar, seharusnya hanya tingkatan ("Tinggal di kelas 2") | Tambah helper `kelasPokok(k)`: ekstrak angka saja dari nama kelas. Pakai `kelasPokok(d.kelas)` di dua tempat (screen + print). |

> **Catatan:** Ini adalah perbaikan ke-2 untuk masalah yang sama. Lihat ANTIREGRESI.md §7 untuk checklist dan penanda kode wajib.

### 📋 File yang Diubah (v16)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — fungsi `nextFase`, helper baru `kelasPokok`, 4 call site (baris ~527–531, ~660–661, ~945–946) |

---

## [2026-05-07] — v15 · Perbaikan Kokurikuler Terpotong di Cetak Rapor

### 🐛 Perbaikan

Semua perubahan hanya pada `rapor/preview.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Teks kokurikuler terpotong di batas halaman saat cetak — border box berhenti di tepi halaman, sisa teks muncul di halaman berikutnya tanpa border | Tambahkan `break-inside:avoid;page-break-inside:avoid` pada `.kok-box` di print CSS template |

> **Catatan:** Ini adalah perbaikan ke-4 untuk masalah yang sama. Lihat ANTIREGRESI.md §6 untuk checklist wajib dan penanda kode yang harus selalu ada agar masalah ini tidak terulang.

### 📋 File yang Diubah (v15)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — baris 793, print CSS template |

---

## [2026-05-07] — v14 · Perbaikan Layout Sertifikat ISMUBA

### 🐛 Perbaikan

Semua perubahan hanya pada `ujian-sekolah/preview-ismuba.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Background hitam pada gambar logo | Logo diproses ulang: piksel hitam (R<40, G<40, B<40) diubah menjadi transparan menggunakan alpha channel PNG |
| 2 | Frame tidak sesuai contoh (double outline CSS) | Ganti dengan `border: 1px solid #000` + `box-shadow: inset` untuk efek frame luar tipis + dalam tebal, sesuai format asli |
| 3 | Baris spasi terlalu besar (18pt) | Semua `cert-gap`, `cert-gap2`, `cert-gap3`, `cert-gap4` dikurangi dari **18pt → 12pt** |
| 4 | Jarak terlalu kecil antara paragraf "yang telah mengikuti..." dan tabel | `margin-top: 10pt` ditambahkan pada `.cert-tbl` |
| 5 | Nilai Al-Islam tidak muncul | Ditambahkan fallback: jika `map_ismuba_pai` kosong di config, sistem otomatis mencoba `map_pai` (pemetaan PAI untuk ijazah reguler) — karena Al-Islam = Pendidikan Agama Islam dan Budi Pekerti |

### 📋 File yang Diubah (v14)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** |

---

*Dibuat: 7 Mei 2026 (v14) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
