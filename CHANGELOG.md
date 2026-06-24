## [2026-06-24] — v64 · Perbaikan Cetak Batch: Nomor Surat Siswa Berikutnya Tidak Lagi Meluber ke Halaman Sebelumnya

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Saat mencetak syahadah lebih dari satu siswa sekaligus (batch), nomor surat siswa ke-2 (pg1 siswa berikutnya) muncul di pojok kanan bawah halaman 2 siswa sebelumnya (pg2). Ini menyebabkan harus cetak satu per satu, tidak efektif untuk 57 siswa. Root cause: `.cert-page` tidak memiliki tinggi yang dikunci (`min-height:0` + tidak ada `height`), sehingga browser tidak bisa menjamin setiap `.cert-page` terkurung persis satu halaman A4 saat render print. | Tambah `height:267mm` (= 297mm A4 − 15mm margin atas − 15mm margin bawah), `box-sizing:border-box`, dan `overflow:hidden` pada `.cert-page`. Tambah juga `page-break-inside:avoid;break-inside:avoid` sebagai lapisan tambahan. Kini setiap halaman terkunci ke satu A4 dan cetak batch berjalan benar. |

### 📐 Catatan Kalkulasi

`@page` menetapkan `margin:15mm`. Tinggi A4 = 297mm. Tinggi konten = 297 − 15 − 15 = **267mm**. Padding dalam `.cert-page` (`10mm 14mm 10mm`) sudah termasuk dalam 267mm karena `box-sizing:border-box`.

### 📋 File yang Diubah (v64)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — `.cert-page`: ganti `min-height:0` → `height:267mm;box-sizing:border-box;overflow:hidden`; tambah `page-break-inside:avoid;break-inside:avoid` |
| `CHANGELOG.md` | **Diubah** — tambah entri v64 ini |
| `ANTIREGRESI.md` | **Diubah** — tambah §40 |

---

## [2026-06-24] — v63 · Koreksi Layout TTD Halaman 1: Rata Kiri + Nama Lurus

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Halaman 1 (Syahadah): teks "Kepala Sekolah / Madrasah,", nama, dan NBM di kolom kanan tampil rata tengah dan nama tidak lurus dengan nama Ketua Majelis. Pola masalah identik dengan yang sudah diperbaiki di halaman 2 (v61–v62). | Terapkan pola yang sama: kolom kanan diberi `display:flex;flex-direction:column;justify-content:space-between;align-self:stretch;text-align:left` — jabatan menempel di atas (lurus kolom kiri), nama+NBM menempel di bawah (lurus dengan nama kolom kiri), semua rata kiri. |

### 📋 File yang Diubah (v63)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — kolom kanan `shd-sign` halaman 1: ganti struktur `shd-sign-gap` menjadi flex `space-between`, tambah `text-align:left`, bungkus nama+NBM dalam `<div>` |
| `CHANGELOG.md` | **Diubah** — tambah entri v63 ini |

---

## [2026-06-24] — v62 · Koreksi Rata Kiri Kolom Kepala Sekolah Halaman 2

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Teks "Kepala Sekolah / Madrasah,", nama, dan NBM di kolom kanan halaman 2 tampil di tengah (center) — seharusnya rata kiri sesuai tampilan dokumen resmi. | Tambah `text-align:left` pada inline style kolom kanan di `dnilai-sign`. |

### 📋 File yang Diubah (v62)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — kolom kanan `.dnilai-sign`: tambah `text-align:left` |
| `CHANGELOG.md` | **Diubah** — tambah entri v62 ini |

---

## [2026-06-24] — v61 · Koreksi Layout TTD Halaman 2: Jabatan Lurus Atas, Nama Lurus Bawah

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Fix v60 membuat nama+NBM lurus tapi memindahkan "Kepala Sekolah / Madrasah," ikut turun — seharusnya jabatan ini lurus dengan "Ketua Majelis Dikdasmen & PNF" di atas. | `.dnilai-sign` dikembalikan ke `align-items:flex-start`. Kolom kanan diberi `display:flex;flex-direction:column;justify-content:space-between;align-self:stretch` — jabatan menempel di atas (lurus dengan kolom kiri), nama+NBM menempel di bawah (lurus dengan nama kolom kiri) karena tinggi kolom dipaksa sama via `align-self:stretch`. |

### 📋 File yang Diubah (v61)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — CSS `.dnilai-sign`: `align-items` kembali ke `flex-start`; kolom kanan: `justify-content:space-between` + `align-self:stretch`; nama+NBM dibungkus `<div>` agar jadi satu unit di bawah |
| `CHANGELOG.md` | **Diubah** — tambah entri v61 ini |

---

## [2026-06-24] — v60 · Perbaikan Layout Halaman 2 Syahadah ISMUBA

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Jarak antara tabel nilai dan baris tanggal (Bandung, …) terlalu sempit — terlihat mepet. | Tambah `margin-top:16pt` pada div tanggal di halaman 2. |
| 2 | `ujian-sekolah/preview-ismuba.html` | Nama Ketua Majelis (kiri) dan nama Kepala Sekolah (kanan) tidak sejajar — nama kepala sekolah muncul jauh lebih tinggi karena kolom kiri memiliki lebih banyak konten (3 baris teks + QR code). | Ubah `.dnilai-sign` dari `align-items:flex-start` → `align-items:flex-end` agar kedua kolom sejajar dari bawah. Kolom kanan juga diberi `display:flex;flex-direction:column;justify-content:flex-end` agar nama dan NBM selalu menempel di baris terbawah, lurus dengan kolom kiri. |

### 📋 File yang Diubah (v60)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — CSS `.dnilai-sign`: `align-items` jadi `flex-end`; div tanggal: tambah `margin-top:16pt`; kolom kanan sign: tambah `display:flex;flex-direction:column;justify-content:flex-end` |
| `CHANGELOG.md` | **Diubah** — tambah entri v60 ini |

---

## [2026-06-24] — v59 · Koreksi: Nomor Seri Syahadah Hanya di Halaman 1

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `ujian-sekolah/preview-ismuba.html` | Nomor seri syahadah (v58) ikut muncul di halaman 2 (Daftar Nilai), padahal sesuai juknis hanya diperlukan di halaman 1 (Syahadah). | Hapus render `${noSertif ? ...}` dari `pg2.innerHTML`. CSS `.shd-no-sertif` tetap ada karena masih dipakai pg1. |

### 📋 File yang Diubah (v59)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — hapus baris render `shd-no-sertif` dari `pg2` |
| `CHANGELOG.md` | **Diubah** — tambah entri v59 ini |

---

## [2026-06-24] — v58 · Nomor Seri Syahadah ISMUBA Per-Siswa

### ✨ Fitur Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `assets/js/sheets.js` | Tambah field `no_seri_syahadah` (kolom Q sheet SISWA). Range baca `getSiswa()` diperluas dari `A:P` → `A:Q`. Field juga ditambahkan di `addSiswa()` agar siswa baru bisa menyimpan nomor ini. |
| 2 | `ujian-sekolah/preview-ismuba.html` | Render nomor seri syahadah di pojok kanan atas **halaman 1** (Syahadah) dan **halaman 2** (Daftar Nilai), sesuai format juknis resmi Dikdasmen PWM Jawa Barat 2026. Elemen hanya tampil jika data tersedia (tidak menampilkan teks kosong). |
| 3 | `ujian-sekolah/config-skl.html` | Hapus field `ismuba_no_sertif_prefix` dari form dan `CONFIG_KEYS`. Nomor seri kini bersifat per-siswa (disimpan di sheet SISWA kolom Q), bukan prefix global. |

### 🔄 Perubahan Skema

Nomor sertifikat Syahadah ISMUBA **tidak lagi menggunakan prefix global** (`ismuba_no_sertif_prefix` + `no_peserta`). Berdasarkan data resmi (`nopes_ijazah_dan_syahadah_2026.xlsx`), setiap siswa memiliki nomor seri unik (contoh: `01/SD/01/24/2026`) yang diisi ke kolom Q sheet SISWA secara manual atau via import.

### 📋 File yang Diubah (v58)

| File | Status |
|------|--------|
| `assets/js/sheets.js` | **Diubah** — range `getSiswa()` jadi `A:Q`; tambah `no_seri_syahadah: r[16]`; tambah `siswa.no_seri_syahadah` di `addSiswa()` |
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — hapus `noSertifPfx`; `noSertif` kini dari `siswa.no_seri_syahadah`; tambah CSS `.shd-no-sertif`; tambah render `<div class="shd-no-sertif">` di pg1 dan pg2 |
| `ujian-sekolah/config-skl.html` | **Diubah** — hapus form field `ismuba_no_sertif_prefix` dan hapus dari `CONFIG_KEYS` |
| `ANTIREGRESI.md` | **Diubah** — tambah §39, update penanda kode kumulatif v58 |
| `CHANGELOG.md` | **Diubah** — tambah entri v58 ini |

### 📐 Yang TIDAK berubah

- Logika kalkulasi nilai ISMUBA (PAI, Kemuhammadiyahan, Arab) — tidak disentuh
- Struktur halaman cetak (layout, tabel, tanda tangan) — tidak disentuh
- Field `no_peserta_ismuba` (kolom P) — tetap ada, hanya ditampilkan di header preview screen, tidak di halaman cetak
- Semua config ISMUBA lainnya di `config-skl.html` — tidak disentuh

---

## [2026-06-18] — v57 · Perbaikan Cetak Rapor Terpotong: Catatan Wali, Ketidakhadiran, TTD

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/preview.html` | Hasil cetak PDF rapor sering terpotong di tengah kotak Catatan Wali atau bagian Ketidakhadiran saat pergantian halaman. Contoh konkret: rapor Fairel Atharizz Calief kelas 4B. | **Akar masalah:** CSS `.abs-catatan-grid{page-break-inside:avoid}` adalah dead code — HTML aktual untuk bagian D memakai `<div style="display:flex;...">` inline, tidak pernah memakai class `.abs-catatan-grid`. Aturan CSS itu tidak pernah berlaku sama sekali. **Fix:** bungkus seluruh bagian D (tabel absensi + Catatan Wali + Tanggapan Orang Tua) dengan class baru `.rpr-bagian-d` yang benar-benar dipakai di HTML, diberi `page-break-inside:avoid`. |
| 2 | `rapor/preview.html` | Bagian Keputusan (Naik/Tinggal kelas, khusus semester 2) bisa terpotong antara judul dan kotak keputusannya. | `.rpr-keputusan` di CSS lama hanya menyasar div bagian dalam; pembungkus luarnya (`<div style="margin-top:10pt">` polos) tidak terlindungi. Fix: pembungkus luar diberi class `.rpr-keputusan-wrap` dengan `page-break-inside:avoid`. |
| 3 | `rapor/preview.html` | Bagian TTD (tanda tangan) bisa terpisah dari baris tanggal kota di atasnya saat pergantian halaman. | `.rpr-ttd` lama hanya menyasar grid 3 kolom TTD, bukan pembungkus yang juga berisi baris tanggal. Fix: pembungkus luar diberi class `.rpr-ttd-wrap` dengan `page-break-inside:avoid`. |
| 4 | `rapor/preview.html` | Proteksi per-bagian (1-3) masih memungkinkan garis potong jatuh di SELA antar bagian (misal antara akhir Bagian D dan awal Keputusan). | Tambah pembungkus gabungan `.rpr-footer-group` yang menyatukan Bagian D + Keputusan + TTD sebagai satu unit `page-break-inside:avoid`. Total tinggi gabungan (~250-300pt) jauh di bawah satu halaman A4 penuh (~737pt setelah margin), sehingga aman digabung tanpa risiko menyisakan halaman kosong besar. |

### 📋 File yang Diubah (v57)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — HTML pembangun bagian D/Keputusan/TTD diberi class baru (`rpr-bagian-d`, `rpr-keputusan-wrap`, `rpr-ttd-wrap`) + pembungkus gabungan `rpr-footer-group`; CSS print: hapus rule dead code `.abs-catatan-grid`, tambah 6 rule `page-break-inside:avoid` untuk class yang benar-benar dipakai |
| `ANTIREGRESI.md` | **Diubah** — tambah §38, entri riwayat v57, penanda kode kumulatif v57 |
| `CHANGELOG.md` | **Diubah** — tambah entri v57 ini |

### 🔍 Catatan Audit

Pola dead-code CSS seperti ini (rule yang terlihat seperti perlindungan tapi tidak pernah benar-benar dipakai) berisiko muncul lagi jika class HTML diubah tanpa memeriksa ulang CSS yang menyasarnya, atau sebaliknya. Lihat checklist di ANTIREGRESI §38 untuk pencegahan saat mengubah struktur bagian ini di masa depan.

---

## [2026-06-16] — v56 · [KOREKSI TAHAP 1] Reset Tahun Ajaran: Arsip, Bukan Hapus

### 🐛 Koreksi Desain Penting

Versi v55 (Tahap 1) merancang `resetTahunAjaranBaru()` sebagai operasi **destruktif** — `clearRange()` langsung mengosongkan sheet `NILAI`, `TP_KKTP`, dkk. tanpa menyalinnya dulu. Ini **tidak sesuai** dengan kebutuhan: data tahun ajaran lama harus tetap bisa diakses kapan saja dari dalam sistem, bukan hanya lewat file backup `.json` yang harus di-restore (dan restore akan menimpa data tahun berjalan).

**Desain baru: arsip otomatis sebelum kosongkan.**

| Langkah | Sebelumnya (v55) | Sekarang (v56) |
|---------|-------------------|------------------|
| 1 | `clearRange()` langsung pada sheet aktif | `duplicateSheetAs()` — salin sheet aktif ke tab baru `<SHEET>_<tahun>` |
| 2 | (data lama hilang) | Jika langkah 1 berhasil → `clearRange()` sheet aktif. Jika gagal → **batal**, sheet aktif TIDAK dikosongkan (fail-safe) |
| 3 | — | Data lama tetap ada selamanya di tab arsip, bisa dibaca via `getTahunArsipTersedia()` + `readArsip()` |

**Fungsi baru di `assets/js/sheets.js`:**

| Fungsi | Kegunaan |
|--------|----------|
| `getSheetMetadata()` | Ambil daftar semua tab + `sheetId` numerik (dibutuhkan API duplicate/delete sheet) |
| `duplicateSheetAs(asal, arsip)` | Duplikasi tab — dasar mekanisme arsip. Tidak overwrite jika arsip dengan nama sama sudah ada |
| `getTahunArsipTersedia()` | Deteksi semua tahun ajaran yang sudah diarsipkan, dari pola nama tab |
| `readArsip(namaSheet, tahunArsip)` | Baca data mentah dari tab arsip tertentu |

**`resetTahunAjaranBaru()` ditulis ulang** — sekarang menerima parameter `tahunLama` dan melakukan siklus arsip→kosongkan per sheet, bukan kosongkan langsung 8 sheet sekaligus tanpa jejak.

### 📋 File yang Diubah (v56)

| File | Status |
|------|--------|
| `assets/js/sheets.js` | **Diubah** — tambah `getSheetMetadata`, `duplicateSheetAs`, `getTahunArsipTersedia`, `readArsip`; `resetTahunAjaranBaru` ditulis ulang total (arsip-dulu, bukan hapus langsung) |
| `CHANGELOG.md` | **Diubah** — tambah entri v56 ini |
| `ANTIREGRESI.md` | **Diubah** — tambah §37, update §36 |

### 📐 Yang TETAP tidak berubah dari v55

- `USERS` (guru/admin) dan `SISWA` tidak pernah masuk daftar reset
- `luluskanSiswa()` tetap mempertahankan `id_siswa` (§35)
- `TP_KKTP` tetap disengaja ikut dalam siklus arsip+reset (§36) — bedanya sekarang diarsipkan dulu, bukan langsung hilang

---

## [2026-06-16] — v55 · [TAHAP 1/4] Fondasi Backend: Alumni, Naik Kelas, Reset Tahun Ajaran

### 🚧 Status: Sedang Dikerjakan (Tahap 1 dari 4)

Fitur besar: **Backup/Restore Data** dan **Reset Tahun Ajaran Baru** (termasuk naik kelas dan
kelulusan). Dipecah menjadi 4 tahap agar progress bisa disimpan dan dilanjutkan:

1. ✅ **Tahap 1 (selesai)** — Fondasi backend di `sheets.js`: fungsi Alumni, naik kelas, reset
2. ⬜ Tahap 2 — Halaman Naik Kelas (`setup/naik-kelas.html`)
3. ⬜ Tahap 3 — Halaman Backup & Restore (`setup/backup-restore.html`)
4. ⬜ Tahap 4 — Halaman Reset Tahun Ajaran Baru + menu Alumni di dashboard admin

### ✨ Fitur Baru (Tahap 1)

**Sheet baru `ALUMNI`** (kolom A–Q): identitas siswa lengkap (identik struktur SISWA) +
`tahun_lulus`. **`id_siswa` dipertahankan sama** dengan saat masih di SISWA — keputusan desain
kunci agar seluruh riwayat nilai (NILAI, KOKURIKULER, EKSKUL_SISWA, ABSENSI, SETORAN_TT,
NILAI_RAPOR_RERATA, NILAI_US) tetap bisa diakses penuh untuk alumni, bukan hanya ringkasan.

**Fungsi baru di `assets/js/sheets.js`:**

| Fungsi | Kegunaan |
|--------|----------|
| `clearRange(range)` | Kosongkan isi range tanpa menghapus sheet/header — dasar untuk reset |
| `getAlumni({ tahun_lulus })` | Ambil daftar alumni, opsional filter per tahun lulus |
| `luluskanSiswa(siswaList, tahunLulus)` | Pindahkan siswa kelas 6 ke ALUMNI lalu hapus dari SISWA, `id_siswa` dipertahankan |
| `pindahKelasSiswa(idSiswa, kelasBaru)` | Naik kelas untuk satu siswa — hanya kolom E (kelas) yang diubah |
| `pindahKelasBatch(mapping)` | Naik kelas massal dalam satu `valuesBatchWrite` — dipakai baik untuk mode otomatis (1→2, 3→4, 5→6) maupun assign manual oleh guru (2→3, 4→5) |
| `resetTahunAjaranBaru()` | Kosongkan `TP_KKTP`, `NILAI`, `KOKURIKULER`, `EKSKUL_SISWA`, `ABSENSI`, `SETORAN_TT`, `NILAI_RAPOR_RERATA`, `NILAI_US` |

### 📐 Keputusan Desain Penting

**Naik kelas — dua mode:**
- **Otomatis** (1→2, 3→4, 5→6): urutan kelas dipertahankan (1A→2A, 1B→2B), tidak diacak
- **Assign manual** (2→3, 4→5 — peralihan fase): guru/admin menyusun ulang siswa ke kelas tujuan secara bebas lewat UI; sistem TIDAK melakukan randomisasi otomatis

**Reset tahun ajaran — `TP_KKTP` DISENGAJA ikut dikosongkan.** Keputusan eksplisit: meskipun kurikulum sama antar tahun, Tujuan Pembelajaran dan KKTP bisa disesuaikan setelah evaluasi akhir tahun, jadi guru menyusun ulang dari awal setiap tahun ajaran — bukan dipertahankan otomatis.

**Yang TIDAK direset:** `USERS`, `KELAS`, `MAPEL`, `EKSKUL` (master jenis), `DPL` (master jenis), `CONFIG` (kecuali field `tahun_pelajaran` yang akan diupdate di Tahap 4), `MUTASI`, `SYNC_LOG`.

**Backup/Restore — tanpa scope Google Drive tambahan.** Backup berupa file `.json` yang diunduh ke perangkat admin (lokal atau bisa diunggah manual ke cloud storage apa pun oleh admin). Restore = upload file tersebut kembali. Tidak menambah OAuth scope karena hanya memakai Sheets API yang sudah ada plus `Blob`/`FileReader` di browser.

### 📋 File yang Diubah (v55)

| File | Status |
|------|--------|
| `assets/js/sheets.js` | **Diubah** — tambah `clearRange`, `getAlumni`, `luluskanSiswa`, `pindahKelasSiswa`, `pindahKelasBatch`, `resetTahunAjaranBaru` + ekspor semuanya |
| `CHANGELOG.md` | **Diubah** — tambah entri v55 ini (status in-progress) |
| `ANTIREGRESI.md` | **Diubah** — tambah §35, §36, dan penanda kumulatif tahap 1 |

### ⚠️ Catatan untuk Lanjutan

Sheet `ALUMNI` **belum dibuat di spreadsheet** — admin perlu membuat tab baru bernama `ALUMNI` dengan header di baris 1–2 (kolom A–Q sesuai skema di atas) sebelum Tahap 2–4 dapat diuji. Header disarankan: `id_siswa, nama, nis, nisn, kelas_terakhir, agama, alamat, nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp, tempat_lahir, tgl_lahir, nama_wali, no_peserta_ismuba, tahun_lulus`.

---

## [2026-06-15] — v54 · Akses Leger Bidang Studi untuk Guru Kelas yang Merangkap Guru Mapel

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/leger-guru-mapel.html` | `requireLogin('guru_mapel')` menolak `guru_kelas` yang juga mengajar bidang studi di kelas lain. Guru dengan role `guru_kelas` tidak bisa mengakses halaman ini meskipun memiliki kelas tambahan (kolom K) dan mata pelajaran (kolom F). | `requireLogin(['guru_mapel', 'guru_kelas'])`. Untuk `guru_kelas`, kelas yang tersedia di dropdown diambil hanya dari `kelasMapelList` (kolom K) — bukan dari `kelasList` (E+K) agar guru tidak bisa melihat leger kelasnya sendiri via halaman ini (sudah ada di `leger-kelas.html`). |
| 2 | `rapor/leger-guru-mapel.html` | Link Dashboard selalu mengarah ke `guru-mapel.html` meskipun yang login adalah `guru_kelas`. | Tambah kondisi `dashHref` berdasarkan `currentUser.role` — dikondisikan untuk `navDashboard` dan `topbarHome`. |
| 3 | `rapor/leger-guru-mapel.html` | Jika `guru_kelas` membuka halaman tapi kolom K-nya kosong (tidak punya kelas mapel), halaman menampilkan dropdown kelas kosong tanpa penjelasan. | Tambah guard: jika `guru_kelas` dan `allKelasGuru` kosong → tampilkan pesan informatif dengan link kembali ke dashboard. |
| 4 | `dashboard/guru-kelas.html` | Menu "Leger Bidang Studi Saya" tidak muncul di sidebar karena tidak ada link ke `leger-guru-mapel.html`. | Tambah `navLegerMapel` (`display:none` secara default) di seksi Rapor & Leger. JS menampilkannya hanya jika `kelasMapelList.length > 0 && mapelBidStudi.length > 0` (guru punya kelas tambahan dan mapel yang diajarkan). |

### 📋 File yang Diubah (v54)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/leger-guru-mapel.html` | **Diubah** | `requireLogin` ke array; logika kelas berbeda per role; kondisi Dashboard href; guard kolom K kosong |
| `dashboard/guru-kelas.html` | **Diubah** | Tambah `navLegerMapel` di sidebar; JS kondisional untuk menampilkan menu |
| `CHANGELOG.md` | **Diubah** | Tambah entri v54 ini |
| `ANTIREGRESI.md` | **Diubah** | Tambah §34 dan penanda kumulatif v54 |

---

## [2026-06-15] — v53 · Leger Nilai Bidang Studi untuk Guru Mapel

### ✨ Fitur Baru

Halaman baru `rapor/leger-guru-mapel.html` — leger nilai per mata pelajaran untuk guru bidang studi.

**Latar belakang:** Selama ini guru bidang studi hanya dapat menginput nilai tanpa akses ke rekap nilai akhir dari mata pelajaran yang diampunya. Halaman ini memungkinkan guru untuk meninjau kembali penilaian yang telah diberikan.

**Format tabel:** identik dengan leger guru kelas — No · Nama Siswa · NISN · kolom per TP · Nilai Akhir · Peringkat — bedanya hanya menampilkan satu mata pelajaran yang dipilih.

**Filter tersedia:**
- **Mata Pelajaran** — hanya mapel yang diampu guru (exclude Tahsin-Tahfizh). Jika guru hanya mengajar 1 mapel, dropdown disembunyikan dan mapelnya dipilih otomatis.
- **Kelas** — semua kelas dari `kelasList` (kolom E + K sesuai §30), mencakup kelas tambahan.
- **Semester**

**Cara hitung:** identik dengan `preview.html` dan `leger-kelas.html` — `nilai_akhir per TP = slm × bobot_slm% + sas × bobot_sas%`, `nilai akhir mapel = rata-rata semua TP`. Semua siswa ditampilkan walau nilai belum ada (tampil `—`).

**Statistik ringkas:** jumlah siswa, jumlah TP, rata-rata kelas, nilai tertinggi, nilai terendah, ketuntasan (≥70).

**Akses:** `requireLogin('guru_mapel')` — hanya guru bidang studi. Guru kelas dan admin tidak dapat mengakses halaman ini.

**Kelas yang bisa dipilih:** `kelasList` (kolom E + K), sehingga guru mapel yang mengajar di banyak kelas (termasuk kelas di kolom K) bisa memilih semua kelasnya.

### 📋 File yang Diubah (v53)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/leger-guru-mapel.html` | **Baru** | Halaman leger nilai bidang studi untuk guru_mapel |
| `dashboard/guru-mapel.html` | **Diubah** | Tambah seksi "Laporan" di sidebar dengan link ke `leger-guru-mapel.html` |
| `CHANGELOG.md` | **Diubah** | Tambah entri v53 ini |
| `ANTIREGRESI.md` | **Diubah** | Tambah penanda kumulatif v53 |

---

## [2026-06-15] — v52 · Perbaikan Fase Salah di Identitas Rapor (Preview & Cetak)

### 🐛 Perbaikan Bug — Fase di Rapor Diambil dari Sheet, Bukan Dihitung dari Kelas

**Gejala:** Identitas siswa di halaman preview dan cetak rapor menampilkan fase yang salah — misalnya Kelas 2B menampilkan "Fase B" padahal seharusnya "Fase A".

**Akar masalah:**
Di `rapor/preview.html`, baris:
```javascript
const fase = allKelas.find(k => k.nama === activeKelas)?.fase || '?';
```
mengambil nilai fase dari kolom D sheet `KELAS` (via `getKelas()`). Kolom ini diisi manual dan tidak ada validasi, sehingga bisa tidak akurat. Nilai `d.fase` ini kemudian ditampilkan langsung di template string identitas siswa — di dua tempat: render screen dan render print.

Klasifikasi fase yang benar per kurikulum:
- Kelas 1–2 → **Fase A**
- Kelas 3–4 → **Fase B**
- Kelas 5–6 → **Fase C**

**Perbaikan (v52):**
Tambah helper `faseKini(kelas)` yang menghitung fase dari nomor kelas secara deterministik — serupa dengan `nextFase()` yang sudah ada untuk fase kenaikan kelas. Kedua call site `${d.fase}` (screen + print) diganti menjadi `${faseKini(d.kelas)}`.

```javascript
// faseKini: fase siswa SAAT INI dihitung dari nomor kelas
// ⚠️ ANTIREGRESI §33 — jangan ganti dengan d.fase dari sheet
function faseKini(kelas) { const n=parseInt(kelas.replace(/[^0-9]/g,'')); return isNaN(n)?'?':n<=2?'A':n<=4?'B':n<=6?'C':'D'; }
```

### 📋 File yang Diubah (v52)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/preview.html` | **Diubah** | Tambah `faseKini(kelas)`; ganti `${d.fase}` → `${faseKini(d.kelas)}` di 2 call site (screen + print) |
| `CHANGELOG.md` | **Diubah** | Tambah entri v52 |
| `ANTIREGRESI.md` | **Diubah** | Tambah §33 + 3 baris penanda kumulatif v52 |

---

## [2026-06-15] — v51 · Rekap Nilai Bidang Studi: Tulis Ulang Sesuai Kebutuhan Admin

### ✨ Perubahan Besar

`leger-mapel.html` ditulis ulang sepenuhnya. Halaman lama menampilkan nilai per-siswa per-TP
(sama dengan leger kelas tapi untuk satu mapel) — tidak relevan untuk kebutuhan admin.
Halaman baru menampilkan **rekap rata-rata per mapel × kelas** dalam satu tabel ringkas.

**Kolom tabel baru:**

| Kolom | Isi |
|-------|-----|
| Mata Pelajaran | Nama mapel (exclude Tahsin-Tahfizh) |
| Kelas [X] | Rata-rata nilai akhir semua siswa di kelas tersebut untuk mapel ini |
| Rata-rata | Rata-rata dari semua kelas yang punya data |
| Terbaik | Nilai tertinggi + nama kelas |
| Terburuk | Nilai terendah + nama kelas |
| Baris footer | Rata-rata semua mapel per kelas |

**Cara hitung:** identik dengan `preview.html` dan `leger-kelas.html` —
`nilai_akhir per TP = slm × bobot_slm% + sas × bobot_sas%`,
`nilai akhir mapel per siswa = rata-rata semua TP`,
`nilai kelas = rata-rata semua siswa di kelas tersebut`.

**Filter:** hanya semester (tidak ada filter kelas/mapel — justru tujuannya melihat semua sekaligus).

**Akses:** tetap hanya admin (`requireLogin('admin')`).

**Visual:** sel terbaik diberi latar hijau muda, sel terburuk latar oranye muda.

### 📋 File yang Diubah (v51)

| File | Status |
|------|--------|
| `rapor/leger-mapel.html` | **Ditulis ulang** — konsep baru: rekap rata-rata per mapel × kelas |
| `CHANGELOG.md` | **Diubah** — tambah entri v51 ini |

---

## [2026-06-15] — v50 · Leger Kelas: Hitung Nilai dari SLM+SAS+Bobot, Tampilkan Semua Siswa

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/leger-kelas.html` | Data leger selalu kosong (0 siswa, 0 mapel) meskipun nilai sudah diinput | Akar masalah: `tampilkanLeger()` membaca kolom `r[9]` (nilai_akhir tersimpan di sheet). Kolom ini hanya terisi jika nilai pernah disimpan ulang oleh sistem — pada banyak kasus kolom ini kosong meskipun `nilai_slm` dan `nilai_sas` sudah ada. Fix: hitung nilai akhir dari `nilai_slm * bobot_slm + nilai_sas * bobot_sas` per TP, identik dengan logika `preview.html`. |
| 2 | `rapor/leger-kelas.html` | Siswa tanpa nilai tidak muncul sama sekali di tabel | Fix: semua siswa selalu ditampilkan. Nilai yang belum ada ditampilkan sebagai `—`. Ranking hanya diberikan untuk siswa yang memiliki minimal satu nilai; siswa tanpa nilai sama sekali mendapat `—` di kolom peringkat. |
| 3 | `rapor/leger-kelas.html` | Nilai ditampilkan dengan satu desimal (`87.3`) — tidak konsisten dengan rapor | Diubah ke bilangan bulat (`Math.round`) sesuai tampilan di `preview.html`. |
| 4 | `rapor/leger-kelas.html` | Label cetak selalu menampilkan "Wali Kelas" meskipun yang mencetak adalah admin | Kondisikan: admin → "Admin: [nama]"; guru kelas → "Wali Kelas: [nama]". |

### 📋 File yang Diubah (v50)

| File | Status |
|------|--------|
| `rapor/leger-kelas.html` | **Diubah** — `tampilkanLeger()` ditulis ulang: muat TP via `getTPKKTP`, hitung `na = slm*bSlm% + sas*bSas%` per TP, rata-rata per mapel, tampilkan semua siswa, ranking null untuk siswa tanpa nilai |
| `CHANGELOG.md` | **Diubah** — tambah entri v50 ini |

---

## [2026-06-15] — v49 · Audit Akses Leger: Guru Kelas Dibatasi ke Kelas Utama Saja

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/leger-kelas.html` | `kelasDiampu` memakai `currentUser.kelasList` (gabungan kolom E+K sejak §30/v43). Guru kelas yang mengajar mapel di kelas lain (kolom K) bisa melihat leger kelas-kelas tersebut — padahal hanya boleh melihat kelas utamanya sendiri. | Ganti ke `currentUser.kelas` (kolom E saja) untuk `guru_kelas`, identik dengan aturan §31 (kolom E untuk kepemilikan/identifikasi, bukan akses lintas kelas). Admin tetap mendapat semua kelas (kelasDiampu kosong). Komentar §31+§33 ditambahkan. |

### ✅ Konfirmasi akses setelah v49

| Halaman | Guru Kelas | Guru Mapel | Admin |
|---------|-----------|-----------|-------|
| `leger-kelas.html` | ✅ Hanya kelas utama (kolom E) | ❌ Tidak bisa masuk | ✅ Semua kelas |
| `leger-mapel.html` | ❌ Tidak bisa masuk | ❌ Tidak bisa masuk | ✅ Semua mapel + kelas |

### 📋 File yang Diubah (v49)

| File | Status |
|------|--------|
| `rapor/leger-kelas.html` | **Diubah** — `kelasDiampu`: ganti `kelasList` → `kelas` (kolom E) untuk guru_kelas; eksplisit `[]` untuk admin; komentar §31+§33 |
| `CHANGELOG.md` | **Diubah** — tambah entri v49 ini |

---

## [2026-06-15] — v48 · Fix Tampilan Sidebar Leger + Pesan Informatif Kelas Kosong

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/leger-mapel.html` | Teks "Dashboard" di sidebar tidak tampil sempurna — terrender sebagai teks literal dengan karakter backslash | Akar masalah: saat patch v46 diinjeksikan via Python string, quotes di HTML ter-escape menjadi `\"` → backslash literal di HTML. Fix: ganti ke quote biasa dan arahkan href langsung ke `admin.html` (tidak perlu JS lagi karena halaman ini khusus admin). |
| 2 | `rapor/leger-mapel.html` | Subtext halaman menyebut "mata pelajaran yang Anda ampu" — tidak relevan untuk admin | Diubah menjadi "per mata pelajaran dan kelas" yang netral. |
| 3 | `rapor/leger-kelas.html` | Jika `allKelas` kosong setelah load berhasil, dropdown menampilkan hanya "Pilih Kelas" tanpa keterangan apapun | Tambah pengecekan `kelasList.length === 0` → tampilkan "Tidak ada kelas tersedia" dan disable tombol Tampilkan/Cetak. |

### 📋 File yang Diubah (v48)

| File | Status |
|------|--------|
| `rapor/leger-mapel.html` | **Diubah** — fix backslash di nav HTML; href navDashboard langsung ke admin.html; update subtext halaman |
| `rapor/leger-kelas.html` | **Diubah** — tambah guard kelasList.length === 0 dengan pesan informatif |
| `CHANGELOG.md` | **Diubah** — tambah entri v48 ini |

---

## [2026-06-15] — v47 · Koreksi Akses Leger: Kelas untuk Admin+Guru, Bidang Studi Khusus Admin

### 🐛 Koreksi + ✨ Peningkatan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `rapor/leger-kelas.html` | Admin kini dapat mengakses Leger Nilai Kelas (leger semua mapel per-kelas). `requireLogin` diubah ke `['guru_kelas', 'admin']`. Admin mendapat semua kelas di dropdown (kelasDiampu kosong → allKelas). Sidebar dikondisikan: Dashboard → `admin.html` untuk admin; nav Input Penilaian dan Setup TP disembunyikan untuk admin. Header menampilkan "Administrator". |
| 2 | `rapor/leger-mapel.html` | Leger Nilai Bidang Studi **dibatasi khusus admin** (bukan guru). `requireLogin` diubah ke `'admin'`. Sidebar bug diperbaiki: Dashboard selalu mengarah ke `admin.html`; nav khusus guru (TT, Setup TT) disembunyikan; label header menampilkan "Administrator". Blok `isTTGuru` yang tidak relevan untuk admin dihapus. |
| 3 | `dashboard/admin.html` | Sidebar diperbarui: "Leger Nilai Kelas" (📊, `leger-kelas.html`) sebagai menu utama; "Leger Nilai Bidang Studi" (📈, `leger-mapel.html`) sebagai menu terpisah di bawahnya. |

### 📋 File yang Diubah (v47)

| File | Status |
|------|--------|
| `rapor/leger-kelas.html` | **Diubah** — `requireLogin`, label header, `navDashboard` id + JS kondisional, hide nav input untuk admin |
| `rapor/leger-mapel.html` | **Diubah** — `requireLogin('admin')`, sidebar fix, hapus blok isTTGuru |
| `dashboard/admin.html` | **Diubah** — pisah nav leger-kelas dan leger-mapel |
| `CHANGELOG.md` | **Diubah** — tambah entri v47 ini |

> **Catatan v46:** Patch v46 keliru membuka `leger-mapel.html` untuk semua guru. v47 mengoreksinya: `leger-kelas.html` (leger per-kelas semua mapel) untuk admin + guru kelas; `leger-mapel.html` (leger bidang studi) khusus admin.


---

## [2026-06-15] — v46 · Akses Admin ke Leger Nilai Bidang Studi
 · Akses Admin ke Leger Nilai Bidang Studi

### ✨ Peningkatan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `rapor/leger-mapel.html` | Admin kini diizinkan mengakses halaman Leger Nilai Bidang Studi. `requireLogin` diubah dari `'guru_mapel'` menjadi `['guru_kelas', 'guru_mapel', 'admin']`. Admin otomatis mendapat semua kelas dan semua mapel di dropdown (karena `allowedKelas = []` → filter tidak diterapkan, dan branch `// admin: semua mapel tampil` sudah ada di `_updateMapelDropdown`). |
| 2 | `rapor/leger-mapel.html` | Sidebar dan header dikondisikan berdasarkan role: tombol Dashboard mengarah ke `admin.html` untuk admin, `guru-kelas.html` untuk guru kelas, dan `guru-mapel.html` untuk guru mapel. Nav khusus guru (Setoran TT, Setup TT, Laporan TT) disembunyikan untuk admin. Label `userMapel` menampilkan "Administrator" untuk admin. |
| 3 | `dashboard/admin.html` | Tambah link "Leger Nilai Bidang Studi" di sidebar admin di bawah "Preview & Cetak Rapor". |

### 📋 File yang Diubah (v46)

| File | Status |
|------|--------|
| `rapor/leger-mapel.html` | **Diubah** — `requireLogin` ke array 3 role; `navDashboard` id + JS kondisional; hide nav guru-only untuk admin; label `userMapel` untuk admin |
| `dashboard/admin.html` | **Diubah** — tambah nav-item leger-mapel di seksi Laporan & Rapor |
| `CHANGELOG.md` | **Diubah** — tambah entri v46 ini |

---

## [2026-06-14] — v45 · Perbaikan Guru TT Salah di Kelas Multi-Mapel + UI Kelas Khusus TT

### 🐛 Perbaikan + ✨ Peningkatan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `rapor/laporan-tt.html` | **Fix `cariGuruTT()`.** Guru yang mengajar banyak mapel (misal Al-Islam + TT) sebelumnya false-match sebagai guru TT di kelas yang hanya diampu Al-Islam-nya saja (bukan TT). Contoh: Pak Indra (Al-Islam + TT di 1A/1B; Al-Islam saja di 3A) muncul sebagai guru TT kelas 3A, padahal guru TT kelas 3A adalah Pak Rizki. Penyebab: skema sheet USERS tidak bisa merepresentasikan "mapel X di kelas A, mapel Y di kelas B". Fix: `cariGuruTT()` kini menggunakan kolom K sebagai pembatas kelas TT untuk `guru_mapel`. Jika kolom K diisi admin → hanya kelas di kolom K yang dianggap kelas TT. Jika kolom K kosong → fallback ke kolom E (TT murni, semua kelas). Untuk `guru_kelas` merangkap: tetap pakai E+K (§25-B). |
| 2 | `setup/kelola-guru.html` | **UI "Kelas Khusus Tahsin-Tahfizh".** Tambah seksi baru yang muncul otomatis saat `guru_mapel` memilih mapel TT dan mengajar di lebih dari 1 kelas. Admin bisa memilih subset kelas yang benar-benar diampu TT, tersimpan ke kolom K. Jika dikosongkan, semua kelas dianggap kelas TT (backward compatible). |

### 📋 File yang Diubah (v45)

| File | Status |
|------|--------|
| `rapor/laporan-tt.html` | **Diubah** — `cariGuruTT()`: tambah cabang role dengan komentar §32 |
| `setup/kelola-guru.html` | **Diubah** — HTML seksi `#seksiKelasTT`; variabel `kelasTTDipilih`; fungsi `isTTDipilih`, `renderKelasTTSeksi`, `renderKelasTTCheckbox`, `toggleKelasTT`; panggilan dari `toggleMapelCheck`, `toggleKelasCheck`, `pilihRole`; `simpanGuru()` menyimpan `kelasTTDipilih` ke `kelas_mapel` |
| `ANTIREGRESI.md` | **Diubah** — tambah §32, entri riwayat v45, penanda kode kumulatif v45 |
| `CHANGELOG.md` | **Diubah** — tambah entri v45 ini |

### ⚠️ Catatan Migrasi Data

Guru yang sudah terdaftar sebagai `guru_mapel` multi-mapel perlu diedit di Kelola Guru untuk mengisi kolom "Kelas Khusus TT" agar `cariGuruTT()` bekerja benar. Sebelum diisi, kolom K kosong → fallback ke kolom E (sama seperti perilaku lama).

---

## [2026-06-12] — v44 · Perbaikan Wali Kelas Salah di TTD Rapor (Regresi dari v43)

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/preview.html` | TTD rapor menampilkan nama guru mapel yang mengajar di kelas tersebut (bukan wali kelas sebenarnya). Contoh: rapor kelas 4A menampilkan Bu April (wali 4B, guru Al-Islam di 4A) alih-alih Bu Wilis (wali kelas 4A). | **Akar masalah:** regresi dari v43. Setelah `getUsers().kelasList` diubah menjadi gabungan kolom E+K, `users.find()` untuk wali kelas yang memakai `u.kelasList?.includes(activeKelas)` kini juga mencocokkan guru mapel merangkap. **Fix:** ganti ke `u.kelas?.split(',').map(s=>s.trim()).includes(activeKelas)` — hanya mencocokkan dari kolom E (kelas utama). Lihat ANTIREGRESI §31 untuk aturan umum: `kelas` (kolom E) untuk identifikasi wali; `kelasList` (E+K) untuk hak akses. |

### 📋 File yang Diubah (v44)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — `users.find()` wali kelas: ganti `u.kelasList?.includes(activeKelas)` → `u.kelas?.split(',').map(s=>s.trim()).includes(activeKelas)` + komentar `⚠️ ANTIREGRESI §31` |
| `ANTIREGRESI.md` | **Diubah** — tambah §31, entri riwayat v44, penanda kode kumulatif v44 |
| `CHANGELOG.md` | **Diubah** — tambah entri v44 ini |

---

## [2026-06-12] — v43 · Perbaikan Akses Laporan TT untuk Guru Kelas TT Merangkap (Nisya)

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `assets/js/sheets.js` | `guru_kelas` yang mengajar TT di kelas lain (kolom K di sheet USERS) tidak mendapat dropdown kelas TT tambahannya saat membuka `laporan-tt.html`. Kasus konkret: Nisya El Salsabila. | **Akar masalah:** `getUsers()` di `sheets.js` membangun `kelasList` hanya dari kolom E (`r[4]`), sedangkan `auth.js` membangun dari gabungan kolom E + kolom K. Fix §28 (v39) menyebabkan `freshUser.kelasList` dari `getUsers()` menimpa `currentUser.kelasList` dari session — yang lebih lengkap karena sudah gabungan E+K. Akibatnya kelas TT di kolom K hilang dari dropdown. **Fix:** `kelasList` di `getUsers()` kini dibangun identik dengan `auth.js`: IIFE yang menggabungkan kolom E dan kolom K dengan deduplikasi `new Set`. |

> **Catatan:** Ini adalah regresi yang ditimbulkan oleh fix §28 (v39). Fix §28 benar dalam niatnya (sync `kelasList` dari sheet terbaru), tapi mengungkap inkonsistensi yang sudah lama ada antara `getUsers()` dan `auth.js`. Invariant yang harus dijaga: `getUsers().kelasList ≡ auth.js kelasList ≡ [kolom E ∪ kolom K]`. Lihat ANTIREGRESI.md §30.

### 📋 File yang Diubah (v43)

| File | Status |
|------|--------|
| `assets/js/sheets.js` | **Diubah** — `getUsers()`: `kelasList` dibangun dengan IIFE gabungan kolom E + `kelasMapelRaw` + komentar `⚠️ ANTIREGRESI §30` |
| `ANTIREGRESI.md` | **Diubah** — tambah §30, entri riwayat v43, penanda kode kumulatif v43 |
| `CHANGELOG.md` | **Diubah** — tambah entri v43 ini |

---

## [2026-06-11] — v42 · Logo Sekolah di Avatar Siswa + Perbaikan Tampilan Aspek Dashboard

### ✨ Peningkatan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `rapor/laporan-tt.html` | **Logo Muhammadiyah di avatar siswa.** Inisial huruf (mis. "A") di kartu siswa diganti dengan logo sekolah (embedded base64). Berlaku di tampilan dashboard (screen) maupun cetakan PDF. Ke depannya posisi ini akan digunakan untuk foto siswa. CSS `.lpr-avatar` disesuaikan untuk menampilkan gambar (background dihapus, `overflow: hidden` ditambahkan). |
| 2 | `rapor/laporan-tt.html` | **Tampilan aspek tahsin di dashboard diperbaiki.** CSS untuk `.aspek-grid`, `.aspek-item`, `.aspek-item-header`, `.aspek-score-num`, `.aspek-score-pred`, dan `.aspek-item-desc` sebelumnya hanya ada di dalam `printHTML` template (hanya aktif saat cetak). Tampilan screen (dashboard) tidak punya CSS ini sehingga semua elemen aspek tampil tanpa layout — label, angka nilai, predikat, dan deskripsi menyatu dalam satu baris teks berantakan. Fix: tambah CSS screen yang identik (dengan ukuran px/screen yang sesuai) di `<style>` utama dokumen. Cetakan PDF tidak terpengaruh karena sudah punya CSS-nya sendiri di printHTML. |

### 📋 File yang Diubah (v42)

| File | Status |
|------|--------|
| `rapor/laporan-tt.html` | **Diubah** — (1) `.lpr-avatar` screen CSS: hapus background hijau, tambah `overflow:hidden`; (2) avatar HTML di `buildLaporanIqro` dan `buildLaporanQuran`: ganti `charAt(0)` dengan `<img>` logo base64; (3) print `.lpr-avatar` CSS: hapus background, tambah `overflow:hidden`; (4) tambah CSS screen aspek grid lengkap |
| `CHANGELOG.md` | **Diubah** — tambah entri v42 ini |

---

## [2026-06-11] — v41 · Peningkatan Laporan TT: Nilai Aspek, Footer, dan Peralihan Halaman

### ✨ Peningkatan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `rapor/laporan-tt.html` | **Nilai dan predikat per aspek tahsin.** Bagian "Capaian Aspek Tahsin" kini menampilkan nilai numerik rata-rata dan predikat per aspek (Makharijul Huruf, Penerapan Tajwid, dst.) yang dihitung dari field `nilai_aspek` di setiap setoran. Sebelumnya semua aspek mendapat deskripsi dari nilai rata-rata keseluruhan tanpa menampilkan angkanya. Jika guru belum menginput nilai per aspek (data lama), deskripsi tetap ditampilkan dari `avgNilai` sebagai fallback. |
| 2 | `rapor/laporan-tt.html` | **Footer halaman diselaraskan dengan rapor akademik (`preview.html`).** `@page` margin diubah dari `1.5cm 1.8cm` menjadi `1.5cm`; font-size dari `8.5pt` menjadi `9pt`; color dari `#777` menjadi `#888`; border-top dari `0.5pt` menjadi `1px`; ditambahkan `vertical-align: top` (penanda §8) dan `padding-top: 2pt`. |
| 3 | `rapor/laporan-tt.html` | **Peralihan halaman lebih rapi.** Card siswa sebelumnya dibungkus border luar penuh (`1pt solid #bdbdbd`) sehingga border terpotong di tengah halaman saat konten melebihi satu halaman. Solusi: border luar dihapus; pemisah antar siswa (saat cetak banyak) menggunakan garis horizontal hijau tua di atas card berikutnya (`border-top: 1.5pt solid #1e4d3b`). Header card dan section-section di dalamnya kini bebas terpotong tanpa meninggalkan artefak visual. |

### 📋 File yang Diubah (v41)

| File | Status |
|------|--------|
| `rapor/laporan-tt.html` | **Diubah** — (1) `buildLaporanQuran`: aspek section pakai IIFE untuk hitung rata-rata `nilai_aspek` per aspek; (2) `@page`: selaraskan dengan `preview.html`; (3) `.lpr-card` CSS: hapus border, ganti separator; (4) aspek CSS baru: `.aspek-item-header`, `.aspek-score-num`, `.aspek-score-pred` |
| `CHANGELOG.md` | **Diubah** — tambah entri v41 ini |

---

## [2026-06-11] — v40 · Perbaikan Progress Hafalan Selalu 0% di Laporan TT

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/laporan-tt.html` | Bagian "Progress Hafalan vs Target" selalu menampilkan `0 / N (0%)` dan semua item "Detail target hafalan" menampilkan `—`, meskipun siswa sudah menyetor dan lulus seluruh target. Contoh konkret: Adila Anissa Kelas 3B sudah menyetor 2 kali dengan 12 materi hafalan yang semuanya lulus, namun laporan tetap menampilkan 0/12. | Akar masalah: `buildLaporanQuran` membangun `materiLulus` dengan `new Set(setoranLulus.map(s => s.materi))`. Satu baris setoran yang mencakup banyak materi sekaligus menyimpan `s.materi` sebagai JSON array (`'["al-nas_1-6","al-falaq_1-5",...]'`), bukan key tunggal. Karena Set tidak di-expand, `materiLulus.has("al-nas_1-6")` selalu `false`. Fix: ganti ke pola `forEach` + `startsWith('[')` expand yang sudah terbukti benar di `input-setoran-tt.html` (penanda §11). |

> **Catatan:** Pola expand JSON array `materi` sudah ada di `input-setoran-tt.html` (v11) tapi tidak diadopsi ke `laporan-tt.html` saat fungsi `buildLaporanQuran` dibuat. Lihat ANTIREGRESI.md §29.

### 📋 File yang Diubah (v40)

| File | Status |
|------|--------|
| `rapor/laporan-tt.html` | **Diubah** — `buildLaporanQuran`: ganti `new Set(setoranLulus.map(s=>s.materi))` dengan `forEach` + expand `startsWith('[')` + komentar `⚠️ ANTIREGRESI §29` |
| `ANTIREGRESI.md` | **Diubah** — tambah §29, entri riwayat v40, penanda kode kumulatif v40 |
| `CHANGELOG.md` | **Diubah** — tambah entri v40 ini |

---

## [2026-06-11] — v39 · Perbaikan Akses Laporan TT untuk Guru Mapel (Muhammad Rizki)

### 🐛 Perbaikan

| # | File | Masalah | Solusi |
|---|------|---------|--------|
| 1 | `rapor/laporan-tt.html` | Guru `guru_mapel` TT (contoh: Muhammad Rizki) tidak mendapat dropdown kelas saat membuka halaman laporan — atau mendapat daftar kelas yang tidak sesuai dengan kelas yang sebenarnya diajarnya. Penyebabnya: blok `freshUser` di init hanya me-refresh `currentUser.mapel` dari data sheet terbaru, tapi **tidak** me-refresh `currentUser.kelasList`, `currentUser.kelas_mapel`, dan `currentUser.kelasMapelList`. Fungsi `isiDropdownKelas()` yang dipanggil setelahnya memakai `currentUser.kelasList` dari session login lama — sehingga jika admin mengubah kelas guru sejak guru terakhir login, dropdown tampil kosong atau tidak sesuai. | Tambah tiga baris refresh setelah `currentUser.mapel = freshUser.mapel`: (1) `currentUser.kelasList = freshUser.kelasList`, (2) `currentUser.kelas_mapel = freshUser.kelas_mapel`, (3) `currentUser.kelasMapelList = freshUser.kelasMapelList`. Diberi komentar `⚠️ ANTIREGRESI §28`. Lihat §28. |
| 2 | `rapor/laporan-tt.html` | Fungsi `isTTGuru()` tidak identik dengan implementasi di `guru-mapel.html` — tidak memiliki alias `m === 'tahsin-tahfizh'` dan `m.replace(/[^a-z]/g,'').includes('tahsin')`. Jika format mapel guru TT di sheet menggunakan format yang hanya dikenali oleh alias tersebut, `isiDropdownKelas()` akan memperlakukan guru sebagai bukan guru TT dan menampilkan dropdown yang salah. | Tambah dua alias yang hilang ke `isTTGuru()` agar identik dengan `guru-mapel.html` dan `cariGuruTT()`. |
| 3 | `dashboard/guru-mapel.html` | Sama dengan bug #1 — blok `freshUser` di init dashboard hanya me-refresh `mapel`, tidak `kelasList`. Akibatnya `hasKelas6` (yang menentukan apakah menu SAJ tampil) dihitung dari data session lama — guru yang baru ditugaskan ke kelas 6 tidak melihat menu SAJ sampai logout-login ulang. | Tambah refresh `kelasList`, `kelas_mapel`, dan `kelasMapelList` yang identik dengan fix #1. |

> **Catatan:** Bug #1 dan #3 merupakan kekurangan dari pola `freshUser` yang sejak awal hanya dirancang untuk me-refresh `mapel`. Pola yang benar sejak v39: setiap kali `freshUser` dipakai untuk sinkronisasi, **semua field yang mempengaruhi akses wajib di-refresh** — bukan hanya satu field. Lihat ANTIREGRESI.md §28.

### 📋 File yang Diubah (v39)

| File | Status |
|------|--------|
| `rapor/laporan-tt.html` | **Diubah** — (1) blok `freshUser`: tambah refresh `kelasList` + `kelas_mapel` + `kelasMapelList` dengan komentar §28; (2) `isTTGuru()`: tambah alias `m === 'tahsin-tahfizh'` dan `m.replace(/[^a-z]/g,'').includes('tahsin')` |
| `dashboard/guru-mapel.html` | **Diubah** — blok `freshUser`: tambah refresh `kelasList` + `kelas_mapel` + `kelasMapelList` dengan komentar §28 |
| `ANTIREGRESI.md` | **Diubah** — tambah §28, riwayat regresi v39, penanda kode kumulatif v39 |
| `CHANGELOG.md` | **Diubah** — tambah entri v39 ini |

---

## [2026-06-09] — v38 · Perbaikan Urutan Siswa Tidak Abjad Setelah Tambah Baru

### 🐛 Perbaikan Bug — `getSiswa()` Tidak Mengurutkan Hasil Secara Abjad

**Gejala:** Siswa yang baru ditambahkan (via form tambah manual di `data-siswa.html` maupun via persetujuan mutasi masuk di `verifikasi-mutasi.html`) muncul di posisi paling akhir daftar — atau posisi acak — bukan di urutan abjad yang seharusnya.

**Akar masalah:**
`getSiswa()` di `sheets.js` tidak pernah mengurutkan hasilnya. Urutan yang dikembalikan mengikuti urutan fisik baris di Google Sheets. Karena `append('SISWA!A1', [row])` selalu menulis baris baru di akhir sheet, siswa baru selalu muncul di posisi terakhir. Tidak ada halaman yang secara konsisten melakukan sort sendiri — kecuali `leger-kelas.html` yang kebetulan sudah menambahkan `.sort()` manual.

**Perbaikan (v38):**
Tambah `sort` abjad satu baris di `getSiswa()` di `sheets.js`, setelah deduplikasi dan sebelum `return`:

```javascript
// FIX v38: urutkan berdasarkan nama (abjad A–Z)
siswa.sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'id'));
return siswa.map(r => ({ ... }));
```

Dengan ini, semua halaman yang memanggil `getSiswa()` — dashboard guru, input nilai, input absensi, input ekskul, input setoran TT, leger, rapor, mutasi — otomatis mendapat daftar siswa terurut abjad tanpa perlu perubahan di masing-masing halaman.

**Tidak ada dampak regresi:**
- `leger-kelas.html` yang sudah punya `.sort()` sendiri: sort ganda tidak merusak, hasilnya sama.
- Nomor urut tampilan di tabel (kolom `#`) digenerate dari index array di `renderTabel` — bukan dari data sheet — sehingga langsung mencerminkan urutan abjad yang baru.

### 📋 File yang Diubah (v38)

| File | Status | Perubahan |
|------|--------|-----------|
| `assets/js/sheets.js` | **Diubah** | `getSiswa`: tambah `siswa.sort((a, b) => (a[1]\|\|'').localeCompare(b[1]\|\|'', 'id'))` setelah deduplikasi, sebelum `return` |
| `ANTIREGRESI.md` | **Diubah** | Tambah baris v38 di tabel riwayat; tambah §27; tambah penanda kumulatif v38 |
| `CHANGELOG.md` | **Diubah** | Tambah entri v38 ini |

---

## [2026-06-09] — v37 · Perbaikan Siswa Baru Tidak Muncul di Daftar Kelas (addSiswa & getSiswa)

### 🐛 Perbaikan Bug — `addSiswa` Tanpa Anchor `!A1` dan Kolom P Tidak Disimpan/Dibaca

**Gejala dua bug sekaligus:**
- Setelah mutasi masuk disetujui (`verifikasi-mutasi.html`), nama siswa baru tidak muncul otomatis di daftar siswa kelas yang dituju.
- Setelah admin menambahkan siswa baru via form di `setup/data-siswa.html`, nama siswa baru tidak muncul di tabel.

Kedua alur ini memanggil `SHEETS.addSiswa()`, lalu `muatData()` / `SHEETS.getSiswa()` — namun siswa yang baru ditambahkan tidak ditemukan.

**Akar masalah — tiga kekurangan berlapis di `assets/js/sheets.js`:**

**Masalah 1 — `addSiswa` tidak menggunakan anchor `!A1`:**
```javascript
// ❌ LAMA — tanpa anchor
await append('SISWA', [row]);
```
Tanpa anchor `!A1`, Google Sheets API mencari batas tabel terakhir di seluruh sheet. Jika sheet `SISWA` pernah memiliki data di kolom jauh (misalnya sisa formula atau kolom helper), baris baru ditulis di sana — jauh di luar kolom A–P — sehingga `getSiswa('SISWA!A:O')` tidak pernah membacanya. Ini persis pola yang sudah didokumentasikan di ANTIREGRESI §3.

**Masalah 2 — `addSiswa` tidak menyimpan kolom P (`no_peserta_ismuba`):**
Sheet `SISWA` memiliki 16 kolom (A–P). Kolom P adalah `no_peserta_ismuba` yang ditambahkan di v21 (`edit-siswa-kelas.html`) dan digunakan di `setup/data-siswa.html`. Namun `addSiswa()` di `sheets.js` hanya membentuk `row` dengan 15 elemen — kolom P tidak pernah ditulis saat menambah siswa baru.

**Masalah 3 — `getSiswa` hanya membaca `SISWA!A:O` (15 kolom):**
Meskipun masalah 2 menyebabkan kolom P selalu kosong untuk siswa baru, `getSiswa()` juga tidak membaca kolom P sama sekali — sehingga field `no_peserta_ismuba` tidak pernah tersedia di objek siswa yang dikembalikan, bahkan untuk siswa lama yang kolom P-nya sudah terisi manual.

**Perbaikan (v37) — hanya `assets/js/sheets.js`:**

```javascript
// getSiswa: baca A:P (16 kolom)
const rows = await read('SISWA!A:P');  // ← A:O → A:P
// ...
return siswa.map(r => ({
  // ... semua field lama ...
  no_peserta_ismuba: r[15] || '',  // ← tambah mapping kolom P
}));

// addSiswa: 16 elemen + anchor A1
const row = [
  id, siswa.nama, fmtNum(siswa.nis), fmtNum(siswa.nisn), siswa.kelas,
  siswa.agama, siswa.alamat, siswa.nama_ayah, siswa.nama_ibu,
  siswa.pekerjaan_ayah, siswa.pekerjaan_ibu, fmtNum(siswa.no_hp),
  siswa.tempat_lahir, siswa.tgl_lahir, siswa.nama_wali,
  siswa.no_peserta_ismuba || '',  // ← tambah kolom P
];
await append('SISWA!A1', [row]);  // ← 'SISWA' → 'SISWA!A1' (anchor A1)
```

**Tidak ada dampak regresi:**
- `updateSiswa()` di `setup/data-siswa.html` sudah benar sejak v21 — menulis `SISWA!A${idx+1}:P${idx+1}` dengan 16 elemen. Tidak diubah.
- `verifikasi-mutasi.html` memanggil `SHEETS.addSiswa({ nama, kelas, agama })` — field `no_peserta_ismuba` tidak dikirim, defaultnya `''`. Ini aman dan konsisten.
- Semua halaman lain yang memanggil `getSiswa()` mendapat field baru `no_peserta_ismuba` — field ini sudah dikenal oleh `data-siswa.html` (kolom P) dan halaman SKL. Tidak ada halaman yang akan rusak karena tambahan field.

### 📋 File yang Diubah (v37)

| File | Status | Perubahan |
|------|--------|-----------|
| `assets/js/sheets.js` | **Diubah** | `getSiswa`: range read `A:O` → `A:P`; tambah `no_peserta_ismuba: r[15]\|\|''` di return. `addSiswa`: tambah `siswa.no_peserta_ismuba\|\|''` di row (elemen ke-16); ganti `append('SISWA', [row])` → `append('SISWA!A1', [row])` |
| `ANTIREGRESI.md` | **Diubah** | Tambah baris v37 di tabel riwayat; update §3 penanda (tambah `SISWA!A1`); tambah §26 (sinkronisasi kolom sheet SISWA); tambah penanda kumulatif v37 |
| `CHANGELOG.md` | **Diubah** | Tambah entri v37 ini |

---

## [2026-06-05] — v36 · Nama Guru TT Tidak Muncul untuk Guru Kelas yang Merangkap TT

### 🐛 Perbaikan Bug — `cariGuruTT` Tidak Mengenali Kelas TT dari `kelasMapelList`

**Gejala:** Setelah v35 di-deploy, nama guru TT kelas 2B (Nisya El Salsabila) tetap tidak muncul di tanda tangan laporan Tahsin-Tahfizh — tampil `—`. v34 dan v35 berhasil menghilangkan nama Tisandi yang salah, tetapi nama Nisya tidak kunjung muncul sebagai penggantinya.

**Akar masalah — satu bug yang terlewat:**

Nisya adalah **guru_kelas kelas 2C** yang merangkap mengajar Tahsin-Tahfizh di **kelas 2B**. Dalam skema data USERS:

| Kolom | Field | Nilai Nisya |
|-------|-------|-------------|
| E | `kelas` | `2C` (kelas utama sebagai wali kelas) |
| F | `mapel` | ID mapel TT (mis. `mp_tt01`) |
| K | `kelas_mapel` | `2B` (kelas tambahan sebagai guru mapel TT) |

`cariGuruTT` (v35) mengecek kelas dengan:
```javascript
return (u.kelasList || []).includes(kelas);
```
`u.kelasList` dibangun hanya dari kolom E → `["2C"]`. Ketika admin mencetak laporan kelas 2B, fungsi mencari `["2C"].includes("2B")` = **false** → Nisya tidak ditemukan → tanda tangan `—`.

Kelas TT Nisya (`2B`) ada di `u.kelasMapelList` (kolom K), yang sama sekali tidak dicek oleh `cariGuruTT`.

**Perbaikan (v36):**

```javascript
// ⚠️ ANTIREGRESI §25-B: cek kelasList (kolom E) DAN kelasMapelList (kolom K).
// guru_kelas yang merangkap TT di kelas lain → kelas TT ada di kolom K, bukan kolom E.
const allKelasGuru = [
  ...(u.kelasList      || []),
  ...(u.kelasMapelList || []),
];
return allKelasGuru.includes(kelas);
```

**Mengapa v34/v35 tidak menangkap ini:**
v34 menambah filter kelas (sebelumnya tidak ada filter sama sekali). v35 menambah filter status nonaktif dan melengkapi kondisi `hasTT`. Keduanya mengasumsikan kelas TT guru ada di kolom E (`kelasList`), yang benar untuk `guru_mapel` murni. Kasus `guru_kelas` merangkap TT di kelas berbeda belum pernah diuji.

**Tidak ada dampak regresi:** `kelasMapelList` kosong untuk `guru_mapel` murni dan `guru_mapel` biasa, sehingga spread `[...kelasList, ...kelasMapelList]` identik dengan `kelasList` saja untuk kasus-kasus yang sudah bekerja sebelumnya.

### 📋 File yang Diubah (v36)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/laporan-tt.html` | **Diubah** | `cariGuruTT`: ganti `(u.kelasList\|\|[]).includes(kelas)` dengan spread `[...kelasList,...kelasMapelList].includes(kelas)`; update komentar §25-B |
| `ANTIREGRESI.md` | **Diubah** | Tambah baris v36 di tabel riwayat; update §25 dengan kode terkini dan §25-B; tambah risiko & checklist baru |
| `CHANGELOG.md` | **Diubah** — tambah entri v36 ini |

---



### 🐛 Perbaikan Lanjutan — Dua Kasus Yang Terlewat di v34

**Gejala:** Setelah v34 di-deploy, laporan kelas 2B masih menampilkan "Tisandi, S.Pd" di tanda tangan.

**Dua akar masalah yang tersisa:**

**Masalah 1 — Tidak ada filter status `nonaktif`:**
Admin kemungkinan besar menonaktifkan Tisandi (`status = 'nonaktif'`) sebagai cara "menghapus" dari aktif, bukan menghapus baris secara penuh. Namun `getUsers()` di `sheets.js` **tidak menyaring** berdasarkan status — ia mengembalikan semua user termasuk yang nonaktif. `cariGuruTT` tidak mengecek status, sehingga Tisandi yang sudah nonaktif tetap ditemukan dan muncul di tanda tangan.

**Masalah 2 — `hasTT` tidak konsisten dengan `isTTGuru`:**
`isTTGuru()` (fungsi yang menentukan apakah user yang login adalah guru TT) menggunakan kondisi:
```javascript
m === 'tt' || m === 'mp_tt' || m.endsWith('_tt') || m.startsWith('tt_')
```
Tetapi `cariGuruTT` (v34) hanya mengecek:
```javascript
lower === 'mp_tt' || lower.endsWith('_tt')
```
Jika mapel disimpan sebagai `"TT"`, `"tt"`, atau `"tt_01"`, `isTTGuru` mengenalinya sebagai guru TT tetapi `cariGuruTT` tidak. Akibatnya guru TT yang mapelnya dalam format pendek tidak akan ditemukan oleh pencarian, dan tanda tangan menampilkan `'—'`.

**Perbaikan (v35):**
```javascript
function cariGuruTT(allUsers, kelas) {
  return allUsers.find(u => {
    // Lewati yang nonaktif
    if ((u.status || '').toLowerCase() === 'nonaktif') return false;
    // hasTT identik dengan isTTGuru() — semua format mapel didukung
    const hasTT = (u.mapelList || []).some(x => {
      const lower = x.toLowerCase();
      return lower.includes('tahsin') || lower.includes('tahfizh') ||
             lower === 'tt' || lower === 'mp_tt' ||
             lower.endsWith('_tt') || lower.startsWith('tt_');
    });
    if (!hasTT) return false;
    if (!kelas) return true;
    return (u.kelasList || []).includes(kelas);
  }) || null;
}
```

**Catatan untuk admin:** Jika laporan masih menampilkan Tisandi setelah deploy v35, berarti Tisandi masih berstatus `aktif` dan masih terdaftar di kelas 2B di sheet USERS. Langkah yang harus dilakukan:
1. Buka **Kelola Guru** (sekarang berfungsi benar setelah v32)
2. Edit profil Tisandi
3. Hapus centang kelas 2B dari daftar kelas yang diampu
4. Simpan — atau ubah status Tisandi menjadi **Nonaktif**
5. Reload halaman laporan TT dan cetak ulang

### 📋 File yang Diubah (v35)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/laporan-tt.html` | **Diubah** | `cariGuruTT`: tambah filter `status !== 'nonaktif'`; lengkapi `hasTT` dengan `=== 'tt'` dan `startsWith('tt_')` |
| `ANTIREGRESI.md` | **Diubah** | Update §25 dengan kode yang disempurnakan; tambah baris v35 di tabel riwayat |
| `CHANGELOG.md` | **Diubah** — tambah entri v35 ini |

---

## [2026-06-02] — v34 · Perbaikan Nama Guru TT di Tanda Tangan Laporan Salah

### 🐛 Perbaikan Bug — Nama Guru TT di TTD Tidak Sesuai Kelas

**Gejala:** Guru TT kelas 2B (Nisya El Salsabila) tidak muncul di bagian tanda tangan saat admin mencetak laporan Tahsin-Tahfizh kelas 2B. Yang muncul adalah nama guru TT lain (Tisandi) yang juga terdaftar di sistem. Setelah admin menghapus Tisandi dari kelas 2B melalui kelola guru, nama Tisandi tetap muncul di tanda tangan laporan.

**Akar masalah — dua bug berlapis:**

**Bug 1 — Cache global tanpa filter kelas:**
Di init time, kode lama mencari guru TT pertama dari seluruh USERS sheet tanpa mempertimbangkan kelas:
```javascript
// ❌ LAMA — find() tanpa filter kelas
const guruTTUser = allUsersCache.find(u => {
  const m = (u.mapel || '').toLowerCase().split(',').map(s=>s.trim());
  return m.some(x => x.includes('tahsin') || ...);
});
config['_nama_guru_tt'] = guruTTUser.nama;  // ← cache global, salah kelas
```
Karena Tisandi muncul lebih awal di USERS sheet dari Nisya, Tisandi selalu "menang" meskipun Nisya yang mengajar kelas 2B.

**Bug 2 — Cache stale setelah perubahan:**
`config['_nama_guru_tt']` di-set sekali saat halaman dimuat. Setelah admin mengubah kelas Tisandi, nilai cache tidak berubah — Tisandi tetap muncul di tanda tangan sampai halaman di-reload penuh.

**Perbaikan:**

1. Variabel `allUsersGlobal` ditambahkan di level modul dan diisi dari `allUsersCache` saat init (menggantikan cache `config['_nama_guru_tt']` yang misleading)
2. Fungsi `cariGuruTT(allUsers, kelas)` yang memfilter berdasarkan mapel **DAN** `kelasList`:
```javascript
function cariGuruTT(allUsers, kelas) {
  return allUsers.find(u => {
    const hasTT = (u.mapelList || []).some(x => {
      const lower = x.toLowerCase();
      return lower.includes('tahsin') || lower.includes('tahfizh') ||
             lower === 'mp_tt' || lower.endsWith('_tt');
    });
    if (!hasTT) return false;
    if (!kelas) return true;
    return (u.kelasList || []).includes(kelas);
  }) || null;
}
```
3. `bukaJendelaCetak` kini memanggil `cariGuruTT(allUsersGlobal, kelas)` setiap kali cetak, sesuai kelas yang sedang ditampilkan

Dengan perbaikan ini:
- Kelas 2B → Nisya El Salsabila (yang memiliki kelas 2B di kelasList) ✅
- Kelas lain → guru TT kelas tersebut ✅
- Setelah admin mengubah kelas guru → lookup fresh per kelas berikutnya ✅

### 📋 File yang Diubah (v34)

| File | Status | Perubahan |
|------|--------|-----------|
| `rapor/laporan-tt.html` | **Diubah** | Tambah `allUsersGlobal` modul; hapus `config['_nama_guru_tt']` cache; tambah `cariGuruTT()`; `bukaJendelaCetak` pakai fungsi tersebut |
| `ANTIREGRESI.md` | **Diubah** | Tambah §25, baris v34 di tabel riwayat, tiga baris penanda kumulatif |
| `CHANGELOG.md` | **Diubah** — tambah entri v34 ini |

---

## [2026-06-02] — v33 · Tanggal Penerimaan Rapor Kelas 1–5 Sem. II Dipisahkan dari Kelas 6

### ✨ Perubahan Aturan — Dua Tanggal Penerimaan Rapor Semester II

**Latar belakang:** Mulai semester genap ini, tanggal penerimaan rapor Semester II tidak lagi seragam untuk semua kelas. Kelas 6 menerima rapor lebih awal karena keperluan PPDB (Penerimaan Peserta Didik Baru) di jenjang SMP. Kelas 1–5 menerima rapor pada tanggal yang berbeda.

Sebelumnya, satu field `tgl_rapor` digunakan untuk semua kelas di semua semester. Field ini juga dipakai oleh dokumen SKL/Ijazah Kelas 6. Karena itu `tgl_rapor` **tetap dipertahankan** dan **tidak diubah maknanya** — ia masih menjadi tanggal utama untuk Kelas 6 dan untuk semua kelas di Semester I. Yang ditambahkan adalah field baru `tgl_rapor_1_5` khusus Kelas 1–5 Semester II.

**Matriks tanggal yang berlaku sejak v33:**

| Kondisi | Field yang dipakai | Catatan |
|---------|-------------------|---------|
| Semester I — semua kelas | `tgl_rapor` | Tidak berubah |
| Semester II — Kelas 6 | `tgl_rapor` | Tidak berubah; dipakai juga SKL/Ijazah |
| Semester II — Kelas 1–5 | `tgl_rapor_1_5` | **Baru.** Fallback ke `tgl_rapor` jika kosong |

**Perubahan teknis:**

**`setup/profil-sekolah.html`** — Seksi C (Konfigurasi Semester Aktif):
- Label `tgl_rapor` diperbarui menjadi: *"Tanggal Penerimaan Rapor — Kelas 6 & Sem. I (Semua Kelas)"* agar tidak membingungkan admin
- Ditambah field baru `tgl_rapor_1_5` dengan label: *"Tanggal Penerimaan Rapor Kelas 1–5 (Sem. II)"* — bersifat opsional; jika dikosongkan, sistem otomatis fallback ke `tgl_rapor`
- `setValue` dan `simpanBatch` diperbarui untuk membaca dan menyimpan `tgl_rapor_1_5`

**`rapor/preview.html`** dan **`rapor/laporan-tt.html`** — ditambah helper function identik:
```javascript
function pilihTglRapor(cfg, kelas, semester) {
  const tingkatan = parseInt(String(kelas).replace(/[^0-9]/g, ''));
  if (semester === 'II' && tingkatan >= 1 && tingkatan <= 5) {
    return cfg['tgl_rapor_1_5'] || cfg['tgl_rapor'] || '';
  }
  return cfg['tgl_rapor'] || '';
}
```
Semua titik yang sebelumnya membaca `config['tgl_rapor']` langsung digantikan dengan pemanggilan `pilihTglRapor()`.

**Tidak ada perubahan di:**
- `assets/js/sheets.js` — CONFIG sudah key-value generic, tidak perlu diubah
- `ujian-sekolah/*` — SKL/Ijazah Kelas 6 tetap menggunakan `tgl_rapor` (tanggal lebih awal), sudah benar

### 📋 File yang Diubah (v33)

| File | Status | Perubahan |
|------|--------|-----------|
| `setup/profil-sekolah.html` | **Diubah** | Rename label `tgl_rapor`; tambah field, `setValue`, `simpanBatch` untuk `tgl_rapor_1_5` |
| `rapor/preview.html` | **Diubah** | Tambah `pilihTglRapor()`; `raporData.tgl_rapor` pakai fungsi tersebut |
| `rapor/laporan-tt.html` | **Diubah** | Tambah `pilihTglRapor()`; `bukaJendelaCetak` pakai fungsi tersebut |
| `ANTIREGRESI.md` | **Diubah** | Tambah §24, baris v33 di tabel riwayat, penanda kumulatif |
| `CHANGELOG.md` | **Diubah** | Tambah entri v33 ini |

---

## [2026-06-02] — v32 · Perbaikan Form Edit Guru Selalu Kosong

### 🐛 Perbaikan Bug — Kelas & Mapel Tidak Terpopulasi Saat Buka Form Edit

**Gejala:** Admin membuka form edit guru (klik tombol ✏️ Edit), namun pilihan kelas dan mata pelajaran selalu tampak kosong — tidak ada checkbox yang tercentang. Admin harus mengisi ulang tugas guru dari awal setiap kali mengedit data apapun (nama, NBM, status, dll.), padahal data kelas/mapel sudah tersimpan dengan benar di sheet.

**Akar masalah — argumen `fromEdit` yang tidak diteruskan:**

`pilihRole` memiliki parameter `fromEdit` yang secara eksplisit dirancang untuk membedakan dua konteks pemanggilan:

```javascript
function pilihRole(role, fromEdit = false) {
  if (!fromEdit) {
    // Dipanggil oleh klik user dari UI → bersihkan state lama
    kelasDipilih      = [];
    kelasMapelDipilih = [];
    mapelDipilih      = [];
  }
  // ... render checkbox
}
```

`bukaEdit` menyiapkan ketiga array dari data guru, lalu memanggil `pilihRole(u.role)` — **tanpa** argumen `fromEdit=true`. Akibatnya `pilihRole` mengosongkan semua array yang baru saja diisi. `_forceRestoreCheckboxes()` yang dipanggil sesudahnya beroperasi pada array kosong — tidak ada yang bisa di-restore.

**Perbaikan:**

```javascript
// ❌ SEBELUM — fromEdit default ke false → array dikosongkan
pilihRole(u.role);

// ✅ SESUDAH — fromEdit=true → array tidak dikosongkan, render menggunakan data guru
// ⚠️ ANTIREGRESI §23: wajib fromEdit=true — tanpa ini pilihRole akan clear ketiga array
// (kelasDipilih/kelasMapelDipilih/mapelDipilih) yang baru saja diisi dari data guru,
// menyebabkan form edit selalu kosong.
pilihRole(u.role, true);
```

Satu argumen `true` — itulah seluruh perbaikan. Parameter `fromEdit` sudah ada dan dirancang dengan tepat; ia hanya tidak pernah diteruskan dari `bukaEdit`.

### 📋 File yang Diubah (v32)

| File | Status |
|------|--------|
| `setup/kelola-guru.html` | **Diubah** — `bukaEdit()`: `pilihRole(u.role)` → `pilihRole(u.role, true)`; tambah komentar penanda ANTIREGRESI §23 |
| `ANTIREGRESI.md` | **Diubah** — tambah §23, baris v32 di tabel riwayat, dua baris penanda kumulatif |
| `CHANGELOG.md` | **Diubah** — tambah entri v32 ini |

---

## [2026-06-02] — v31 · Perbaikan Ekskul Pilihan Tidak Muncul di Preview & Cetak Rapor

### 🐛 Perbaikan Bug — Ekskul Level Cakap/Mahir Tidak Tampil di Rapor

**Gejala:** Guru kelas 2B yang menginput capaian ekskul Angklung untuk siswanya tidak dapat melihat nilai ekskul tersebut di preview maupun cetak rapor. Yang tampil di rapor hanya ekskul wajib (kokurikuler) yaitu Hizbul Wathan dan Tapak Suci — ekskul pilihan yang sudah diinput tidak muncul sama sekali.

**Akar masalah — kondisi level ekskul yang terlalu sempit:**

Fungsi `buildSeksiEkskul` di `rapor/preview.html` memiliki logika berbeda untuk dua jenis ekskul:
- **Kokurikuler (wajib):** selalu ditampilkan untuk semua siswa — benar ✅
- **Ekstrakurikuler (pilihan):** hanya ditampilkan jika siswa "mengikuti" — di sinilah bug-nya ❌

Untuk ekstrakurikuler pilihan, kondisi yang dipakai adalah:
```javascript
// ❌ KODE LAMA — hanya mencocokkan level 1 (Layak)
const row = eksSiswa.find(r => r[3] === e.id &&
  (r[4]==='1' || r[4]===1 || String(r[4]).toLowerCase()==='true'));
```

Sistem level ekskul di `input-ekskul.html` menyimpan integer:
- `0` — belum diisi (tidak tampil)
- `1` — Layak (tampil) ← satu-satunya yang lolos kondisi lama
- `2` — Cakap (tampil) ← **tidak lolos kondisi lama → bug**
- `3` — Mahir (tampil) ← **tidak lolos kondisi lama → bug**
- `4` — Tidak Ikut (tidak tampil)

Kondisi `r[4]==='1'` tampak seperti cek "truthy" tapi sebenarnya adalah cek persamaan string — ia **hanya** mencocokkan level Layak. Guru kelas 2B yang memasukkan level Cakap (2) atau Mahir (3) untuk Angklung tidak bisa melihat hasilnya di rapor karena kondisi gagal.

**Perbaikan:**

```javascript
// ✅ KODE BARU
// ⚠️ ANTIREGRESI §22: level disimpan sebagai integer 1–3 (ikut) atau 4 (Tidak Ikut) atau 0 (belum diisi).
// Jangan kembalikan ke cek r[4]==='1' — itu hanya mencocokkan Layak, melewatkan Cakap dan Mahir.
const row = eksSiswa.find(r => r[3] === e.id &&
  parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3);
```

Dengan perbaikan ini:
- Level 1 (Layak) → muncul di rapor ✅
- Level 2 (Cakap) → muncul di rapor ✅ (sebelumnya tidak muncul)
- Level 3 (Mahir) → muncul di rapor ✅ (sebelumnya tidak muncul)
- Level 4 (Tidak Ikut) → tidak muncul di rapor ✅
- Level 0 / belum diisi → tidak muncul di rapor ✅

Perbaikan berlaku untuk tampilan **screen** (preview di browser) maupun **cetak** (print/PDF), karena keduanya menggunakan `sectionD` yang dihasilkan oleh `buildSeksiEkskul` yang sama.

### 📋 File yang Diubah (v31)

| File | Status |
|------|--------|
| `rapor/preview.html` | **Diubah** — `buildSeksiEkskul()`: ganti `r[4]==='1'\|\|r[4]===1\|\|...` dengan `parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3`; tambah komentar penanda ANTIREGRESI §22 |
| `ANTIREGRESI.md` | **Diubah** — tambah §22 (level ekskul integer bukan boolean), tambah baris v31 di tabel riwayat, perbarui penanda kumulatif |
| `CHANGELOG.md` | **Diubah** — tambah entri v31 ini |

---

## [2026-05-29] — v30 · Perbaikan Nomor Urut Surat SKL Tidak Bertambah

### 🐛 Perbaikan Regresi — Seq Nomor Surat Selalu `.01` ⚠️ BERULANG BERPOTENSI

**Gejala:** Nomor surat siswa kedua, ketiga, dst. tetap `095.01` — tidak berubah menjadi `095.02`, `095.03`, dst.

**Dua bug sekaligus di dua file berbeda:**

---

**Bug 1 — `preview-skl.html`: `seq` berbasis `idx` bukan posisi absolut**

Ketika guru memilih satu siswa untuk preview/cetak, `daftar` hanya berisi satu elemen:

```javascript
const daftar = sid ? allSiswa.filter(s=>s.id===sid) : allSiswa.slice()...;
daftar.forEach((siswa, idx) => {
  const seq = String(idx+1).padStart(2,'0'); // ← idx selalu 0 → seq selalu '01'
```

`idx` dalam `forEach` adalah posisi dalam `daftar` (yang berisi satu siswa), bukan posisi dalam daftar lengkap seluruh siswa kelas. Sehingga siswa ke-5 pun mendapat `seq = '01'`.

**Perbaikan:**

```javascript
// ANTIREGRESI §21: seq HARUS dari posisi absolut di allSiswa (sudah terurut),
// bukan dari idx dalam daftar filter.
const posisi  = allSiswa.findIndex(s => s.id === siswa.id);
const seq     = String((posisi >= 0 ? posisi : idx) + 1).padStart(2,'0');
```

`allSiswa` sudah terurut secara nama (di-sort saat inisialisasi). `findIndex` memberi posisi absolut yang konsisten — siswa ke-5 selalu mendapat `seq = '05'`, baik saat preview semua siswa maupun preview satu siswa.

---

**Bug 2 — `generate-skl.html`: Belum diperbarui ke format 5-bagian (v29 terlewat)**

`generate-skl.html` masih menggunakan format nomor surat lama sepenuhnya — tidak ikut diperbarui saat v29:

```javascript
// ❌ KODE LAMA — masih ada di generate-skl.html setelah v29
const noUrutAwal = parseInt(cfg['skl_no_urut_awal']||'101');
const suffix     = cfg['skl_no_surat_suffix'] || '/KET/III.4.AU/A/2025';
// ...
const noUrut  = String(noUrutAwal + i).padStart(3, '0');  // increment BASE, bukan seq
const noSurat = noUrut + suffix;                           // format lama
```

Tiga masalah sekaligus:
1. `skl_no_surat_suffix` sudah **dihapus** dari `KEYS_TO_SAVE` di v29 → nilai selalu kosong → fallback ke `/KET/III.4.AU/A/2025` (format salah)
2. `noUrutAwal + i` men-increment **angka dasar** (95→96→97), bukan seq (095.01→095.02→095.03)
3. Validation check masih referensikan `cfg['skl_no_surat_suffix']` → selalu gagal → warning tidak akurat

**Perbaikan — disamakan dengan `preview-skl.html`:**

```javascript
// ✅ KODE BARU
const noKlas  = cfg['skl_no_kode_klas']      || '400.3.11.1';
const noBase  = String(parseInt(cfg['skl_no_urut_awal'] || '95')).padStart(3,'0');
const noInst  = cfg['skl_no_kode_instansi']  || 'SKet-UPTDSDM01KKS';
const noBulan = cfg['skl_no_bulan']           || 'VI';
const noTahun = cfg['skl_tahun_skl']          || '2026';
// ...
// Seq dari posisi absolut di allSiswa (terurut), bukan i dalam siswaTampil
const posisi  = allSiswa.findIndex(ss => ss.id === s.id);
const seq     = String((posisi >= 0 ? posisi : i) + 1).padStart(2,'0');
const noSurat = `${noKlas}/${noBase}.${seq}/${noInst}/${noBulan}/${noTahun}`;
```

Selain itu, `mapelFields` dan `lampData` juga diperbarui: `map_bing`, `map_tik`, `map_kka` dihapus (terlewat di v29). Nama file zip pun diperbarui dari `SKL_095_Nama.docx` ke `SKL_095.01_Nama.docx`.

### 📋 File yang Diubah (v30)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-skl.html` | **Diubah** — `forEach` dalam `loadPreview`: seq dari `allSiswa.findIndex` (posisi absolut), bukan `idx` |
| `ujian-sekolah/generate-skl.html` | **Diubah** — format nomor surat 5-bagian, `kepsekNIP`, hapus `noUrutAwal`/`suffix` lama, `mapelFields` 8 mapel, `lampData` 8 mapel, filename zip diperbarui |
| `ANTIREGRESI.md` | **Diubah** — perbarui §21 dengan peringatan dua-file, penanda kumulatif v30 |
| `CHANGELOG.md` | **Diubah** — tambah entri v30 ini |

---

## [2026-05-29] — v29 · Penyesuaian Format SKL 2025/2026 (preview-skl, config-skl)

### ✨ Perubahan Format SKL — Sesuai Aturan Baru 2025/2026

**Latar belakang:** Template SKL resmi yang baru hanya terdiri dari 1 halaman (SKL saja) dengan perubahan struktural signifikan dibanding tahun sebelumnya.

#### Perubahan `ujian-sekolah/preview-skl.html`

| Aspek | Sebelumnya | Sekarang |
|-------|-----------|---------|
| Jumlah halaman cetak | 2 (SKK + SKL) | **1 halaman** (SKL saja) |
| Kriteria kelulusan | 3 poin | **4 poin** (ditambah: SK Kepala Sekolah) |
| Teks kriteria 1 | "Ketuntasan … Kurikulum Merdeka" | "Ketuntasan … kurikulum satuan pendidikan;" |
| Teks kriteria 3 | "Rapat Pleno Dewan Guru … dilaksanakan" | "Rapat Dewan Guru tentang Kelulusan" |
| Teks kriteria 4 | *(tidak ada)* | "Keputusan Kepala Sekolah … Nomor: [noSK] Tanggal [tglPen]" |
| Format "Dinyatakan" | `Dinyatakan **LULUS** dengan nilai` (bold center) | `Dinyatakan …: LULUS` (style tabel biodata) |
| Pengelompokan mapel | Kelompok A & B | **Tidak ada kelompok** |
| Jumlah mapel | 11 (termasuk Bing, TIK, KKA) | **8 mapel** (Bing/TIK/KKA dihapus) |
| Nama mapel | PAI dan Budi Pekerti, IPAS, Seni Budaya, Bahasa dan Sastra Sunda | PAI dan Budi Pekerti (tanpa "Islam"), Ilmu Pengetahuan Alam Sosial, Seni Budaya dan Prakarya, Bahasa Sunda |
| Header kolom nilai | "Nilai Ijazah" | **"Nilai"** |
| Format angka nilai | Bilangan bulat (Math.round) | **2 angka di belakang koma, separator koma** (mis. `86,90`) |
| Baris rata-rata | Di luar tabel, di bawah tabel | **Di dalam tabel** (baris terakhir) |
| Format TTD | `Ditetapkan di: Kota Depok / Pada tanggal: …` | **`Kota Depok, [tanggal]`** |
| Label TTD | `Kepala SD Muhammadiyah 01 Kukusan,` | **`Kepala Sekolah,`** |
| Identifier TTD | `NBM. [nbm]` | **`NIP. [nip]`** (NIP kosong ditampilkan sebagai `-`) |
| Nomor surat | Format 2-bagian lama | **Format 5-bagian Perwal Depok No.79/2019** |

#### Perubahan `ujian-sekolah/config-skl.html`

**Format nomor surat baru — Perwal Depok No. 79 Tahun 2019:**

Format: `(1)/(2)-(3)/(4)/(5)` → `400.3.11.1/095.01/SKet-UPTDSDM01KKS/VI/2026`

Komponen field baru:
- `skl_no_kode_klas` — kode klasifikasi surat (default: `400.3.11.1`)
- `skl_no_urut_awal` — nomor urut dasar 3 digit (default: `95`; per siswa: `.01`, `.02`, …)
- `skl_no_kode_instansi` — kode instansi (default: `SKet-UPTDSDM01KKS`)
- `skl_no_bulan` — bulan surat dalam angka Romawi (default: `VI`)
- `skl_tahun_skl` — tahun surat (default: `2026`)
- `skl_kepsek_nip` — NIP kepala sekolah (isi `-` jika tidak punya NIP)
- `skl_no_surat_suffix` — **dihapus** dari `KEYS_TO_SAVE`, diganti 5 field di atas
- `map_bing`, `map_tik`, `map_kka` — **dihapus** dari `KEYS_TO_SAVE` (mapel tidak ada di SKL baru)

### 📋 File yang Diubah (v29)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-skl.html` | **Diubah** — halaman 1 (SKK) dihapus, satu halaman SKL diformat ulang total sesuai template 2025 |
| `ujian-sekolah/config-skl.html` | **Diubah** — field nomor surat 5-bagian, field NIP, hapus field lama |
| `ANTIREGRESI.md` | **Diubah** — tambah §21 (format SKL 2025), penanda kumulatif v29 |
| `CHANGELOG.md` | **Diubah** — tambah entri v29 ini |

---

## [2026-05-29] — v28 · Perbaikan Bug Gagal Simpan SLM & SAS (`input-nilai.html`)

### 🐛 Perbaikan Regresi — Gagal Simpan Nilai SLM/SAS ⚠️ BERULANG

**Gejala:** Guru kelas menekan tombol simpan nilai SLM/SAS, lalu muncul pesan merah:
> ⛔ Gagal menyimpan · Sheets write error 400: NILAI!A4028:K4028

Gagal terjadi khususnya pada mapel/kelas yang sudah memiliki banyak data nilai (ribuan baris di sheet NILAI). Simpan berhasil di awal semester/tahun ajaran ketika sheet masih baru/kecil, namun mulai gagal seiring bertambahnya data — sehingga tampak seperti bug intermittent yang sulit direproduksi.

**Akar masalah — dua lapisan:**

**Lapisan 1 (bug utama): `write()` dipakai untuk INSERT baris baru**

Fungsi `simpanTP()` di `input-nilai.html` menggunakan `SHEETS.write()` (yang memanggil Google Sheets API `values.update` / HTTP PUT) untuk menulis baris nilai baru:

```javascript
// ❌ KODE LAMA — SALAH untuk INSERT
const nextNilaiRow = Math.max(rows.length + 1, 3);
await SHEETS.write('NILAI!A' + nextNilaiRow + ':K' + nextNilaiRow, [row]);
```

`values.update` (PUT) hanya bekerja untuk **memperbarui sel yang sudah ada** dalam batas alokasi fisik sheet. Jika sheet hanya teralokasi hingga baris 4027, API mengembalikan **HTTP 400 Bad Request** untuk baris 4028. Sheet tidak auto-extend via PUT.

Sebaliknya, `values.append` (yang dipakai `SHEETS.append()`) **otomatis memperluas sheet** — tidak pernah gagal 400.

**Lapisan 2: Anti-pattern per-item API call di dalam loop (§9)**

`simpanTP()` memanggil `SHEETS.write()` di dalam loop `for (const item of toSave)` — anti-pattern yang sama persis yang diperbaiki di `eksekusiImport` pada v18, tetapi `simpanTP()` terlewat saat itu.

**Perbaikan — pola batch identik dengan `eksekusiImport` (v18) dan `saveNilaiUSBatch`:**

```javascript
// ✅ KODE BARU
const toUpdate = []; const toAppend = []; const nilaiDBLocal = {}; let _saveSeq = 0;
for (const item of toSave) {
  if (existIdx > 1) { toUpdate.push([...]) }
  else { row[0]='NL'+Date.now().toString(36)+(_saveSeq++).toString(36).padStart(3,'0'); toAppend.push(row); rows.push(row); }
}
// Eksekusi batch setelah loop — maks 2 API call total
await SHEETS.valuesBatchWrite(toUpdate);
if (toAppend.length) await SHEETS.append('NILAI!A1', toAppend);
```

### 📋 File yang Diubah (v28)

| File | Status |
|------|--------|
| `penilaian/input-nilai.html` | **Diubah** — `simpanTP()`: ganti per-row `write()` dengan pola batch `toUpdate[]` + `toAppend[]` + `valuesBatchWrite` + `append('NILAI!A1',…)` |
| `ANTIREGRESI.md` | **Diubah** — tambah §20 (simpanTP batch pattern), penanda kumulatif v28 |
| `CHANGELOG.md` | **Diubah** — tambah entri v28 ini |

---

## [2026-05-30] — v27 · Penyempurnaan Visual Syahadah ISMUBA

### 🎨 Perubahan Visual

| # | Perubahan | Detail |
|---|-----------|--------|
| 1 | Logo | Hanya satu logo Muhammadiyah berwarna **keemasan** (`Logo_Muhammadiyah.jpg`). Logo PP dan SDM dihapus dari Syahadah. |
| 2 | Judul "SYAHADAH" | Warna berubah dari biru tua menjadi **emas** (`#C8A340`), ukuran 28pt, letter-spacing lebih lebar. |
| 3 | Bismillah | Diganti dengan gambar kaligrafi (`Salam.jpg`) — bukan teks Unicode Arab. |
| 4 | Header organisasi | 3 baris terpisah: "MAJELIS PENDIDIKAN DASAR MENENGAH / DAN PENDIDIKAN NON FORMAL / PIMPINAN WILAYAH MUHAMMADIYAH JAWA BARAT". Nama PWM sekarang hardcoded, tidak dari config. |
| 5 | Tanggal dokumen | Format rata kanan dua baris: `Bandung, <u>7 Dzulhijjah 1447 H</u>` / `2 Juni 2026 M`. Tanggal 2 Juni 2026 menjadi default. Ditambahkan di **kedua halaman** (Syahadah dan Daftar Nilai). |
| 6 | Tanda tangan ketua majelis | Hardcoded: *Drs. Nur Komarudin, M.M.Pd. / NBM. 555.835 / Jawa Barat* + QR barcode (`Barcode.png`) di atas nama. Berlaku di kedua halaman. |

### 🔧 Konstanta yang Berubah

| Konstanta lama | Konstanta baru |
|----------------|---------------|
| `LOGO_PP` (base64 dari sheets.js) | `LOGO_MUH` (Logo_Muhammadiyah.jpg — embedded) |
| `LOGO_SDM` (base64 dari sheets.js) | `LOGO_SALAM` (Salam.jpg — embedded) |
| — | `LOGO_BARCODE` (Barcode.png — embedded) |

### 📋 File yang Diubah (v27)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — seluruh visual Syahadah diperbarui |
| `ANTIREGRESI.md` | **Diubah** — update §19, penanda kumulatif v27 |
| `CHANGELOG.md` | **Diubah** — tambah entri v27 ini |

---

## [2026-05-28] — v26 · Halaman Syahadah ISMUBA (preview-ismuba.html)

### ✨ Fitur Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `ujian-sekolah/preview-ismuba.html` *(baru)* | Halaman Preview & Cetak Syahadah ISMUBA — ijazah ISMUBA 2 halaman per siswa: Halaman 1 (Syahadah) dan Halaman 2 (Daftar Nilai). |
| 2 | `ujian-sekolah/config-skl.html` | Tambah 10 config key baru untuk Syahadah: nama PWM, ketua majelis, tanggal TKA, tanggal TTD (Hijriah & Masehi), prefix nomor sertifikat, nama sekolah. |

### 📄 Struktur Dokumen Syahadah (2 halaman per siswa)

**Halaman 1 — Syahadah:**
Logo PP Muh + SDM · Nama organisasi dan PWM · Judul "SYAHADAH" dengan Basmalah Arab ·
Identitas siswa (nama caps, TTL caps, nama orang tua, NISN, sekolah asal, NPSN) ·
Kalimat lulus TKA dengan tanggal pelaksanaan · Tanggal TTD Hijriah/Masehi ·
Dua kolom tanda tangan (Ketua Majelis Dikdasmen & PNF PWM ← Pas Foto 3×4 → Kepala Sekolah)

**Halaman 2 — Daftar Nilai:**
Judul "Daftar Nilai TKA ISMUBA" · Identitas siswa · Tabel nilai 3 mapel (angka + huruf terbilang) ·
Baris Jumlah dan Rata-rata · Dua kolom tanda tangan

### 🔧 Mekanisme Teknis

**Nilai dari `getNilaiISMUBA` — identik dengan `preview-tka.html`:**
Termasuk fix ANTIREGRESI v23 (alias search Al-Islam/PAI). Tidak ada duplikasi logika baru.

**Terbilang:** Fungsi `terbilang()` lokal mengkonversi angka ke kata Indonesia.
Rata-rata dengan desimal ditampilkan sebagai "Delapan puluh sembilan koma tiga puluh tiga".

**Tidak ada border/frame:** CSS `.cert-page` menggunakan `border:none; box-shadow:none` (lihat §18).

**Config keys baru (diisi di halaman Konfigurasi SKL):**

| Key | Keterangan | Contoh |
|-----|------------|--------|
| `ismuba_pwm_nama` | Nama PWM | Jawa Barat |
| `ismuba_ketua_nama` | Nama ketua majelis | Drs. Nur Komarudin, M.M.Pd. |
| `ismuba_ketua_nbm` | NBM ketua majelis | 555.835 |
| `ismuba_tgl_mulai` | Tanggal mulai TKA | 1 Maret 2026 |
| `ismuba_tgl_selesai` | Tanggal selesai TKA | 5 Maret 2026 |
| `ismuba_tgl_ttd_hijri` | Tanggal TTD Hijriah | 11 Syawal 1447 H |
| `ismuba_tgl_ttd_masehi` | Tanggal TTD Masehi | 30 Maret 2026 M |
| `ismuba_no_sertif_prefix` | Prefix nomor sertifikat | No. |
| `ismuba_nama_sekolah` | Nama sekolah untuk dokumen ISMUBA | SD Muhammadiyah 01 Kukusan |

### 📋 File yang Diubah (v26)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Baru** — halaman Syahadah ISMUBA 2 halaman |
| `ujian-sekolah/config-skl.html` | **Diubah** — tambah 10 config key baru Syahadah |
| `ujian-sekolah/preview-tka.html` | **Diubah** — tambah nav item ISMUBA di sidebar |
| `ujian-sekolah/preview-skl.html` | **Diubah** — aktifkan nav ISMUBA (hapus disabled) |
| `ujian-sekolah/generate-skl.html` | **Diubah** — aktifkan nav ISMUBA |
| `ujian-sekolah/leger-us.html` | **Diubah** — aktifkan nav ISMUBA |
| `ujian-sekolah/input-rata-rapor.html` | **Diubah** — aktifkan nav ISMUBA |
| `ujian-sekolah/config-skl.html` | **Diubah** — aktifkan nav ISMUBA |
| `dashboard/admin.html` | **Diubah** — aktifkan nav ISMUBA |
| `ANTIREGRESI.md` | **Diubah** — tambah §19 (Syahadah 2 halaman), update v26 |
| `CHANGELOG.md` | **Diubah** — tambah entri v26 ini |

---

## [2026-05-27] — v25 · Rename ISMUBA → TKA, File preview-tka.html, Hapus Border Sertifikat

### ✨ Fitur & Perubahan

| # | Perubahan | Detail |
|---|-----------|--------|
| 1 | `preview-ismuba.html` → `preview-tka.html` | File baru sebagai halaman Preview & Cetak TKA. File `preview-ismuba.html` asli **tidak dihapus** — dipertahankan untuk halaman Preview & Cetak ISMUBA baru yang akan hadir. |
| 2 | Semua nav "Preview & Cetak ISMUBA" → "Preview & Cetak TKA" | Diperbarui di 8 file (dashboard guru, dashboard admin, dan 6 halaman ujian-sekolah). |
| 3 | Hapus border sertifikat TKA | `border:1px solid #000` dan `box-shadow:inset` pada `.cert-page` dihilangkan di `preview-tka.html`. Border tabel nilai di dalam dokumen **tetap ada**. |
| 4 | Nav "Preview & Cetak ISMUBA" placeholder | Ditambahkan di semua sidebar sebagai item disabled (`opacity:.45; pointer-events:none`) sambil menunggu template ISMUBA baru. |

### 🔧 Mekanisme Teknis

**Strategi rename — copy, bukan move:**
`preview-tka.html` adalah salinan `preview-ismuba.html` yang sudah dimodifikasi. File asli `preview-ismuba.html` dipertahankan utuh karena akan menjadi basis halaman ISMUBA baru dengan template berbeda. Dengan demikian tidak ada data/logika yang hilang, dan `navISMUBA` di `guru-kelas.html` sudah siap diaktifkan begitu halaman ISMUBA baru tersedia.

**Border yang dihapus vs yang dipertahankan:**
- ❌ Dihapus: `border:1px solid #000` dan `box-shadow:inset 0 0 0 4px #fff, inset 0 0 0 6px #000` pada `.cert-page` (frame kotak di sekeliling halaman)
- ✅ Dipertahankan: `border:1px solid #000` pada `.cert-tbl th` dan `.cert-tbl td` (garis tabel nilai di dalam sertifikat)

**navISMUBA di `guru-kelas.html`:**
`navISMUBA` tetap ada di array `hasKelas6` dan mengarah ke `preview-ismuba.html`, namun saat ini `display:none`. Ini menyiapkan "slot" yang tinggal diaktifkan saat halaman ISMUBA baru siap — tanpa perlu menyentuh array `hasKelas6` lagi.

### 📋 File yang Diubah (v25)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-tka.html` | **Baru** — salinan preview-ismuba dengan label TKA dan tanpa border |
| `ujian-sekolah/preview-ismuba.html` | **Tidak diubah** — dipertahankan untuk halaman ISMUBA baru |
| `dashboard/guru-kelas.html` | **Diubah** — tambah `navTKA` di sidebar dan array `hasKelas6` |
| `dashboard/admin.html` | **Diubah** — nav TKA aktif, nav ISMUBA placeholder |
| `ujian-sekolah/config-skl.html` | **Diubah** — nav TKA + ISMUBA placeholder |
| `ujian-sekolah/leger-us.html` | **Diubah** — nav TKA + ISMUBA placeholder |
| `ujian-sekolah/input-rata-rapor.html` | **Diubah** — nav TKA + ISMUBA placeholder |
| `ujian-sekolah/preview-skl.html` | **Diubah** — nav TKA + ISMUBA placeholder |
| `ujian-sekolah/generate-skl.html` | **Diubah** — nav TKA + ISMUBA placeholder |
| `ANTIREGRESI.md` | **Diubah** — tambah §18 (strategi rename ISMUBA→TKA), penanda kumulatif v25 |
| `CHANGELOG.md` | **Diubah** — tambah entri v25 ini |

---

## [2026-05-27] — v24 · Fitur Leger Nilai Ujian Sekolah

### ✨ Fitur Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `ujian-sekolah/leger-us.html` *(baru)* | Halaman leger (rekap tabel) nilai akhir ujian sekolah per siswa per mata pelajaran, khusus kelas 6. Dapat diakses oleh guru kelas yang mengampu kelas 6 dan admin. |

### 📐 Struktur Tabel Leger

| Kolom | Sumber Data |
|-------|-------------|
| No, Nama Siswa, NISN | `SISWA` sheet via `SHEETS.getSiswa()` |
| Nilai Akhir US per mapel | `NILAI_US` sheet via `SHEETS.getNilaiUS()` · formula `hitungNilaiUS(nt, np, bt, bp)` |
| Nilai Rata-rata | Rata-rata nilai akhir US seluruh mapel per siswa |
| Peringkat | Ranking berdasarkan Nilai Rata-rata (🥇🥈🥉 untuk 3 besar) |
| Baris Rata-rata Kelas | Rata-rata per mapel dari seluruh siswa di kelas |

Mapel Tahsin/Tahfizh dikecualikan dari tabel (konsisten dengan `input-nilai-us.html`).

### 🔧 Mekanisme Teknis

**Formula `hitungNilaiUS` identik dengan `generate-skl.html` dan `preview-skl.html`:**
Bobot tertulis dan praktik diambil dari config SKL (`skl_bobot_us_tertulis`, `skl_bobot_us_praktik`), sehingga angka di leger selalu konsisten dengan angka di dokumen SKL dan ijazah.

**Read-only — tidak ada write apapun:**
Halaman ini murni membaca `NILAI_US` dan `SISWA`. Tidak ada `SHEETS.write()`, `SHEETS.append()`, maupun `valuesBatchWrite()`.

**Akses & filter:**
- `requireLogin(['admin', 'guru_kelas'])` — kedua role dapat mengakses
- Guru kelas: filter otomatis ke kelas sendiri; hanya tampil kelas 6
- Admin: semua kelas 6 tersedia; link dashboard mengarah ke admin dashboard
- Di sidebar guru kelas: menu muncul via `hasKelas6` — tidak tampil untuk guru kelas non-6

### 📋 File yang Diubah (v24)

| File | Status |
|------|--------|
| `ujian-sekolah/leger-us.html` | **Baru** — halaman leger nilai ujian sekolah |
| `dashboard/guru-kelas.html` | **Diubah** — tambah `navLegerUS` di sidebar + masuk array `hasKelas6` |
| `dashboard/admin.html` | **Diubah** — tambah link leger-us di seksi "Ujian Sekolah / SAJ" sidebar |
| `ANTIREGRESI.md` | **Diubah** — tambah §17 (halaman read-only SAJ), penanda kumulatif v24 |
| `CHANGELOG.md` | **Diubah** — tambah entri v24 ini |

---

## [2026-05-26] — v23 · Perbaikan Nilai Al-Islam Kosong di Preview & Cetak ISMUBA

### 🐛 Perbaikan Regresi

**Gejala:** Kolom "Pendidikan Al-Islam" di halaman Preview & Cetak ISMUBA (`ujian-sekolah/preview-ismuba.html`) selalu menampilkan `—` (kosong) meski nilai sudah diinput, sementara Preview & Cetak SKL menampilkan nilai PAI dengan benar.

**Akar masalah — ketidakcocokan nama antar kurikulum:**

"Pendidikan Al-Islam" (nama kurikulum Muhammadiyah) dan "Pendidikan Agama Islam dan Budi Pekerti" (nama Kurikulum Merdeka) adalah mata pelajaran yang sama tetapi dengan nama berbeda. Keduanya mengacu pada ID mapel yang sama di database.

Fungsi `findMapelFuzzy()` di `preview-ismuba.html` memecah nama menjadi kata kunci, membuang stop words (`pendidikan`, `al`, `budi`, `pekerti`), lalu mencari irisan. Dengan kedua nama tersebut:
- `"Pendidikan Agama Islam dan Budi Pekerti"` → kata kunci: `["agama","islam"]`
- `"Pendidikan Al-Islam"` di database → tidak mengandung kata `"agama"`

Irisan kosong → fuzzy match gagal → `getNilaiISMUBA` mengembalikan `null`.

**Perbaikan — alias search untuk PAI/Al-Islam:**

Setelah fuzzy match biasa, jika hasilnya `null` dan field yang dicari adalah `ismuba_pai`, dilakukan pencarian langsung menggunakan alias kata kunci:

```javascript
if(!m && fieldKey==='ismuba_pai'){
  m = allMapel.find(mp => {
    const n = mp.nama.toLowerCase();
    return n.includes('al-islam') ||
           n.includes('al islam') ||
           (n.includes('agama') && n.includes('islam'));
  });
}
```

Pendekatan ini **tidak mengubah `findMapelFuzzy`** (digunakan banyak tempat), hanya menambah satu langkah fallback lokal di `getNilaiISMUBA` khusus untuk `ismuba_pai`. Preview SKL (`preview-skl.html`), Generate SKL (`generate-skl.html`), dan `sheets.js` tidak disentuh.

### 📋 File yang Diubah (v23)

| File | Status |
|------|--------|
| `ujian-sekolah/preview-ismuba.html` | **Diubah** — tambah alias search PAI/Al-Islam di `getNilaiISMUBA()` |
| `ANTIREGRESI.md` | **Diubah** — tambah §16 (alias mapel lintas kurikulum), penanda kumulatif v23 |
| `CHANGELOG.md` | **Diubah** — tambah entri v23 ini |

---

## [2026-05-26] — v22 · Perbaikan Bug Visual Halaman Login (Status Tampil Sebelum Login)

### 🐛 Perbaikan Regresi

**Gejala:** Halaman `index.html` saat pertama dibuka langsung menampilkan dua pesan sekaligus — "Sedang memverifikasi akun Anda…" dan "Terjadi kesalahan." — meskipun user belum menekan tombol login. Hal ini membuat guru mengira sistem bermasalah dan enggan mencoba login.

**Akar masalah:** CSS `index.html` mendefinisikan:
```css
.status-msg         { display: none; }   /* tersembunyi secara default */
.status-msg.loading { display: flex; }   /* ← override! */
.status-msg.error   { display: flex; }   /* ← override! */
```
Kedua elemen status sudah memiliki kelas `loading` dan `error` di HTML sejak halaman pertama dimuat, sehingga langsung terlihat tanpa aksi user apapun. Bukan regresi dari perubahan logika, melainkan dari CSS specificity yang tidak disadari.

**Perbaikan:** Tambahkan `style="display:none;"` sebagai inline style pada kedua elemen status di `index.html`. Inline style memiliki spesifisitas lebih tinggi dari class selector sehingga elemen tetap tersembunyi sampai JavaScript memanggil `showLoading()` atau `showError()` secara eksplisit.

**Terkait warning COOP di console:**
Warning `Cross-Origin-Opener-Policy policy would block the window.closed call` berasal dari library Google Identity Services (GIS) — bukan dari kode aplikasi. Warning ini sudah ada sebelumnya, tidak memengaruhi fungsionalitas login, dan tidak ada yang bisa dilakukan dari sisi HTML/JS. Didokumentasikan di ANTIREGRESI §15 agar tidak menjadi sumber kebingungan di masa depan.

### 📋 File yang Diubah (v22)

| File | Status |
|------|--------|
| `index.html` | **Diubah** — tambah `style="display:none;"` pada `#statusLoading` dan `#statusError` |
| `ANTIREGRESI.md` | **Diubah** — tambah §15 (CSS display bug), penanda kumulatif v22 |
| `CHANGELOG.md` | **Diubah** — tambah entri v22 ini |

---

## [2026-05-25] — v21 · Fitur Edit Data Siswa untuk Guru Kelas (TTL, Ekspor/Impor XLSX)

### ✨ Fitur Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `siswa/edit-siswa-kelas.html` *(baru)* | Halaman baru bagi guru kelas untuk melengkapi data siswa — khususnya Tempat & Tanggal Lahir yang dibutuhkan untuk penerbitan ijazah dan SKL. Menampilkan tabel inline-editable hanya untuk siswa di kelas yang diampu guru tersebut. Mendukung multi-kelas (tab kelas). |
| 2 | `siswa/edit-siswa-kelas.html` | **Ekspor template XLSX** — menghasilkan file Excel berisi daftar siswa kelas aktif lengkap dengan kolom yang bisa langsung diisi, ditambah sheet Petunjuk yang menjelaskan format tanggal yang diterima. |
| 3 | `siswa/edit-siswa-kelas.html` | **Impor XLSX/CSV** — baca file hasil ekspor atau format bebas, cocokkan baris ke siswa via NIS → NISN → Nama, tampilkan modal pratinjau perbandingan nilai lama vs baru, terapkan ke form (bukan langsung ke sheet), lalu guru menyimpan setelah tinjauan. |

### 🔧 Mekanisme Teknis Penting

**Targeted write — bukan overwrite baris penuh:**
Penyimpanan hanya menulis kolom yang relevan (`SISWA!D`, `SISWA!M:O`, `SISWA!P`) via `valuesBatchWrite`. Kolom lain (nama, kelas, agama, alamat, data orang tua, dll.) tidak pernah tersentuh — tidak ada risiko data hilang akibat perbedaan jumlah kolom atau versi sheet.

**Cache-first save — tidak ada re-read saat penyimpanan:**
Sheet `SISWA!A:P` hanya dibaca sekali saat halaman dimuat (`rawRowsCache`). Fungsi `simpanBaris()` dan `simpanSemua()` menggunakan cache ini untuk mencari indeks baris — tidak memanggil `SHEETS.read()` lagi. Cache diperbarui setelah setiap simpan berhasil. Ini mencegah error 403 yang terjadi ketika re-read dipicu di tengah sesi aktif.

**Format tanggal lahir sinkron dengan ijazah/SKL:**
Tanggal disimpan dalam format `YYYY-MM-DD` — format yang sudah dikenal `fmtTgl()` di `preview-skl.html` dan `formatTglLahir()` di `generate-skl.html`. Saat dicetak di dokumen, format otomatis menjadi "18 Juni 2013". Input `type="date"` di halaman ini dilengkapi preview langsung dalam format panjang Indonesia.

**Parser tanggal saat impor (multi-format):**
Impor menerima `YYYY-MM-DD`, `DD/MM/YYYY`, `DD Bulan YYYY` (Indonesia), dan serial angka Excel. Normalisasi selalu menghasilkan `YYYY-MM-DD` sebelum disimpan ke sheet.

### 🔒 Batasan Akses

- Hanya `guru_kelas` yang dapat mengakses halaman ini (`AUTH.requireLogin('guru_kelas')`)
- Tabel hanya menampilkan siswa yang `kelas`-nya cocok dengan `currentUser.kelas` (split koma, ANTIREGRESI §2)
- Kolom yang tidak dapat diedit guru: nama lengkap, kelas, NIS, agama, alamat, data orang tua, no HP

### 📋 File yang Diubah (v21)

| File | Status |
|------|--------|
| `siswa/edit-siswa-kelas.html` | **Baru** — halaman edit data siswa untuk guru kelas |
| `dashboard/guru-kelas.html` | **Diubah** — tambah nav item "✏️ Edit Data Siswa" di sidebar (seksi Data Siswa) + tombol di toolbar tabel siswa |
| `ANTIREGRESI.md` | **Diubah** — tambah §13 (targeted write), §14 (cache-first save), penanda kumulatif v21 |
| `CHANGELOG.md` | **Diubah** — tambah entri v21 ini |

---

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
