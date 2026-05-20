## [2026-05-20] — v20 · Perbaikan Akses Menu SAJ untuk Guru Mapel yang Juga Mengajar TT

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `dashboard/guru-mapel.html` | Guru bidang studi yang mengajarkan PAI, Bahasa Arab, atau Kemuhammadiyahan di kelas 6 tidak dapat menemukan menu Input Nilai US/SAJ di dashboard mereka, sementara guru mapel lain (PJOK, Bahasa Indonesia, KKA) di kelas yang sama bisa mengaksesnya dengan normal. Penyebabnya adalah kondisi `if (!isTTGuru)` yang memblokir **seluruh** akses SAJ bagi guru yang sekaligus mengampu tahsin-tahfizh — termasuk guru yang juga mengajar mapel reguler kelas 6. Guru PJOK/B.Indonesia/KKA tidak mengajar TT sehingga `isTTGuru = false` dan menu SAJ tampil normal. Guru PAI/B.Arab/KMH yang ikut mengajar TT kena blokir. | Ganti kondisi dari `!isTTGuru` menjadi `!isPureTTGuru`, di mana `isPureTTGuru = isTTGuru && mapelArr.every(m => /* cek TT */)`. Hanya guru yang **seluruh** mapel-nya adalah TT (guru TT murni) yang tidak perlu akses SAJ. Guru yang mengajar TT sekaligus mapel reguler di kelas 6 tetap mendapat akses. Filter mapel TT dari tampilan sudah ditangani di `input-nilai-us.html` via `TAHSIN_KW`. |

> **Catatan:** Kondisi `!isTTGuru` semula dimaksudkan untuk menyembunyikan menu SAJ dari guru TT karena tahsin-tahfizh bukan bagian dari ujian sekolah. Asumsi ini tidak akurat — guru PAI/B.Arab/KMH di sekolah Muhammadiyah sering sekaligus mengampu tahsin-tahfizh. `sheets.js` tidak disentuh. Lihat ANTIREGRESI.md §12.

### 📋 File yang Diubah (v20)

| File | Status |
|------|--------|
| `dashboard/guru-mapel.html` | **Diubah** — blok SAJ menu: ganti `if (!isTTGuru)` dengan `isPureTTGuru` + `if (hasKelas6 && !isPureTTGuru)` |
| `ANTIREGRESI.md` | **Diubah** — tambah §12, riwayat regresi v20, penanda kode kumulatif v20 |
| `CHANGELOG.md` | **Diubah** — tambah entri v20 ini |

---

## [2026-05-20] — v19 · Perbaikan Akses & Bobot Konfigurasi SKL untuk Guru Kelas 6

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/config-skl.html` | Guru kelas 6 tidak dapat mengakses halaman Konfigurasi SKL — `AUTH.requireLogin` hanya mengizinkan role `admin`, sehingga guru kelas 6 langsung diredirect ke halaman login saat membuka halaman tersebut. | Tambahkan `'guru_kelas'` ke array `AUTH.requireLogin`: `AUTH.requireLogin(['admin','guru_kelas'])`. Konsisten dengan halaman SAJ lain seperti `generate-skl.html` yang sudah mengizinkan `guru_kelas` sejak v1/SAJ-05. |
| 2 | `dashboard/guru-kelas.html` | Menu "Konfigurasi SKL" tidak ada di sidebar dashboard guru, sehingga tidak ada jalur navigasi langsung ke halaman tersebut. Menu hanya muncul dari sidebar `input-nilai-us.html`, itupun mengarah ke halaman yang menolak akses (masalah #1). | Tambahkan elemen `<a id="navConfigSKL">` di sidebar, tepat di bawah label *Ujian Sekolah / SAJ* (sebelum `navRataRapor`). Masukkan `'navConfigSKL'` ke dalam array `hasKelas6` agar menu hanya tampil jika guru mengampu kelas 6 — sesuai pola yang sudah ada untuk seluruh menu SAJ. |
| 3 | `ujian-sekolah/input-nilai-us.html` | Ada dua tempat pengaturan bobot ujian sekolah: satu di halaman Konfigurasi SKL dan satu lagi berupa input yang bisa diedit langsung di halaman Input Nilai US. Selain membingungkan guru, input di halaman ini tidak tersimpan ke config — perubahan hanya berlaku sementara dan hilang saat halaman di-refresh. | Ubah `<input type="number">` bobot menjadi `<input type="hidden">` + `<span>` read-only agar nilai selalu diambil dari Konfigurasi SKL. Tambahkan tautan langsung ke halaman Konfigurasi SKL di samping keterangan bobot. |
| 4 | `ujian-sekolah/input-nilai-us.html` | Header kolom tabel (`Tertulis (60%)` / `Praktik (40%)`) hardcoded dan tidak mencerminkan pengaturan bobot yang disimpan di Konfigurasi SKL — meski config sudah dimuat, `updateBobot()` tidak pernah dipanggil setelah nilai diapply ke field. | Tambah pemanggilan `updateBobot()` tepat setelah `config['skl_bobot_us_tertulis']` dan `config['skl_bobot_us_praktik']` diapply ke field tersembunyi, sehingga header tabel dan display bobot langsung sinkron dengan config saat halaman dimuat. |

> **Catatan:** Bug #1 dan #2 saling berkaitan — menu tidak ada di dashboard (bug #2) dan ketika ditemukan via sidebar `input-nilai-us.html`, halaman menolak akses (bug #1). Bug #3 dan #4 saling berkaitan — input bobot yang bisa diedit (bug #3) menyebabkan header tabel tidak sinkron dengan config (bug #4) karena `updateBobot()` hanya dipanggil oleh event `oninput` yang sudah dihapus. Lihat ANTIREGRESI.md §10.

### 📋 File yang Diubah (v19)

| File | Status |
|------|--------|
| `ujian-sekolah/config-skl.html` | **Diubah** — `AUTH.requireLogin`: tambah `'guru_kelas'` |
| `dashboard/guru-kelas.html` | **Diubah** — tambah `navConfigSKL` di sidebar SAJ dan di array `hasKelas6` |
| `ujian-sekolah/input-nilai-us.html` | **Diubah** — (1) bobot-bar: ganti `<input type="number">` dengan `<input type="hidden">` + `<span>` read-only; (2) tambah `updateBobot()` setelah config diapply |

---

## [2026-05-08] — v18 · Perbaikan Import Nilai: 429 Too Many Requests & ID Collision

### 🐛 Perbaikan

Semua perubahan hanya pada `penilaian/input-nilai.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Import nilai gagal dengan error `⛔ Import Gagal — Sheets append error 429: NILAI!A:K`. Terjadi karena `eksekusiImport` memanggil `SHEETS.append('NILAI!A:K', [row])` **satu kali per baris nilai** di dalam loop bertingkat (siswa × TP). Untuk kelas dengan banyak siswa dan TP (misal KKA kelas 6A), ini menghasilkan puluhan hingga ratusan API call terpisah dalam hitungan detik → Google Sheets API mengembalikan HTTP 429 Too Many Requests. | Refactor `eksekusiImport` mengikuti pola `saveNilaiUSBatch` yang sudah terbukti: kumpulkan semua perubahan ke `toUpdate[]` dan `toAppend[]` di dalam loop **tanpa memanggil API**, lalu eksekusi satu kali `SHEETS.valuesBatchWrite(toUpdate)` dan satu kali `SHEETS.append('NILAI!A1', toAppend)` setelah loop selesai. Jumlah API call turun dari ratusan menjadi maksimal 3 (read + batchWrite + append), tidak ada 429. |
| 2 | Range append `'NILAI!A:K'` salah — seharusnya menggunakan anchor `!A1` sesuai ANTIREGRESI §3. Penggunaan `NILAI!A:K` menyebabkan `sheets.js` meneruskan range kolom terbatas ke API, yang dapat menyebabkan data ditulis di posisi yang tidak terduga jika ada data di luar kolom K. | Ganti ke `SHEETS.append('NILAI!A1', toAppend)` — anchor A1 memastikan Google Sheets API selalu mencari batas tabel mulai dari kolom A, konsisten dengan pola `SETORAN_TT!A1`. |
| 3 | **Tabrakan ID baru (efek samping #1):** Setelah loop dibuat sinkron (tanpa `await` di dalamnya), semua `Date.now()` menghasilkan nilai yang sama dalam satu milidetik. ID baru dibentuk dari timestamp + 3 karakter random (36³ = 46.656 kombinasi) — dengan kelas 30 siswa × 10 TP = 300 baris baru, probabilitas tabrakan ID mencapai **~62%** (birthday paradox). ID duplikat di sheet menyebabkan data corruption silent saat import berikutnya (findIndex mencocokkan baris yang salah). | Ganti `Math.random().toString(36).slice(2, 5)` dengan counter inkremental `_importSeq` yang dimulai dari 0 untuk setiap eksekusi import. Format baru: `'NL' + Date.now().toString(36) + (_importSeq++).toString(36).padStart(3, '0')`. Counter menjamin semua ID dalam satu batch unik secara deterministik — berapapun jumlah baris yang diimport. |

> **Catatan:** Pola loop-per-row yang menyebabkan 429 adalah jebakan umum — mudah terulang saat menambah fitur import baru atau menyalin kode dari `saveNilai` (yang hanya menyimpan satu baris). Lihat ANTIREGRESI.md §9.

### 📋 File yang Diubah (v18)

| File | Status |
|------|--------|
| `penilaian/input-nilai.html` | **Diubah** — fungsi `eksekusiImport`: (1) ganti per-row `write`/`append` dengan pola batch `toUpdate[]` + `toAppend[]` + `valuesBatchWrite` + `append` satu kali; (2) tambah `_importSeq` counter untuk ID unik per-batch |

---

## [2026-05-07] — v17 · Perbaikan Jarak Footer Rapor

### 🐛 Perbaikan

Semua perubahan hanya pada `rapor/preview.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Jarak antara garis pembatas footer (`border-top`) dan teks footer terlalu besar, dan mengubah `padding-top` saja tidak berpengaruh pada jarak tersebut | Tambahkan `vertical-align: top` pada `@bottom-left` dan `@bottom-right`. Tanpa ini, teks di-align ke **tengah** margin box 1.5cm (default), sehingga border-top di ujung atas dan teks di tengah — gap ≈ 16pt tidak peduli berapa nilai `padding-top`. Dengan `vertical-align: top`, teks merapat ke atas dan `padding-top: 2pt` kini benar-benar mengontrol jarak garis–teks. |

> **Catatan:** Sebelumnya salah memperbaiki `padding-top` saja (v17 awal) tanpa menyadari bahwa `vertical-align` yang sesungguhnya menentukan posisi vertikal teks di dalam margin box. Lihat ANTIREGRESI.md §8.

### 📋 File yang Diubah (v17)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — `@page @bottom-left` dan `@bottom-right`: tambah `vertical-align: top`, `padding-top: 2pt` |

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
