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
