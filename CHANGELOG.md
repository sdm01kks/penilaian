## [2026-05-03] — v13 · Sesi 17 · Spasi Biodata dan Sebelum LULUS (SKL Hal. 1)

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Lokasi | Perubahan CSS |
|---|--------|---------------|
| 1 | Setelah tabel biodata (sebelum "Berdasarkan...") | `.biodata-tbl` `margin-bottom: 3px → 10px` |
| 2 | Sebelum "-------- L U L U S --------" | `.lulus-text` `margin-top: 6px → 10px` |

---

## [2026-05-03] — v14 · Sesi 18 · Logo Tanpa Garis, Lebih Besar, Spasi LULUS 32pt

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Garis horizontal di bawah logo ikut tercetak | Logo di-crop ulang: tinggi dipotong 82% (membuang garis di bagian bawah gambar asli) |
| 2 | Logo masih terlalu kecil | Ukuran tampil `76px → 96px`, `object-position: top` |
| 3 | Spasi sebelum LULUS terlalu kecil | `.lulus-text` `margin-top: 10px → 32pt` (sesuai anotasi "32pt untuk mengisi ruang ini") |

---

## [2026-05-03] — v15 · Sesi 19 · Logo Lebih Lebar, Spasi Setelah LULUS

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Logo terpotong di sisi kanan | Crop diperlebar ke 20% lebar gambar (201px) agar seluruh badge tampil |
| 2 | Logo masih kecil | `96px → 112px` |
| 3 | Jarak antara "LULUS" dan "dari sekolah dasar..." terlalu dekat | `.lulus-text` `margin-bottom: 4px → 14px` |

---

## [2026-05-03] — v16 · Sesi 20 · Hapus "S" Hantu, Jarak Garis ke Judul, Jarak Nomor ke Tubuh

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Huruf "S" terpotong muncul di samping logo | Crop dikembalikan ke **15.5%** (156px) — crop 20% terlalu lebar hingga menangkap huruf "S" dari kata "SEKOLAH" di gambar header PNG asli |
| 2 | Tidak ada jarak antara garis header dan "SURAT KETERANGAN KELULUSAN/LULUS" | `.doc-title` `margin-top: 6px → 18pt` |
| 3 | Tidak ada jarak antara baris Nomor dan "Yang bertanda tangan..." / "Kepala Sekolah..." | `.doc-nomor` `margin-bottom: 5px → 18pt` |

---

## [2026-05-03] — v17 · Sesi 21 · Crop Logo Berdasarkan Piksel (Tidak Terpotong)

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

**Masalah:** Logo masih terpotong sedikit di sisi kanan meskipun persentase crop sudah disesuaikan.

**Root cause:** Pendekatan persentase lebar gambar tidak akurat karena badge logo tidak memiliki lebar yang proporsional tetap terhadap gambar penuh.

**Solusi:** Gambar dipindai **piksel per piksel** dari kiri ke kanan untuk menemukan kolom paling kanan yang masih memiliki konten (piksel tidak putih, nilai < 235). Ditemukan bahwa badge logo berakhir di kolom 219. Crop final = **225×185px** (kolom 219 + 6px padding).

CSS diperbarui: `height: auto` (bukan fixed 112px) agar gambar tidak dikompres secara vertikal.

| File | Status |
|------|--------|
| `ujian-sekolah/preview-skl.html` | **Diubah** |

---

## [2026-05-03] — v18 · Sesi 22 · [DIBATALKAN — Segera Diganti v19]

Filter mapel guru bidang studi diperbaiki menggunakan perbandingan nama — ternyata masih salah karena `currentUser.mapel` berisi ID bukan nama. Patch ini langsung digantikan oleh v19.

---

## [2026-05-03] — v19 · Sesi 23 · Fix Filter Mapel Guru Bidang Studi (Input Nilai Ujian Sekolah)

### 🐛 Perbaikan Bug

**File:** `ujian-sekolah/input-nilai-us.html`, `ujian-sekolah/input-rata-rapor.html`

**Masalah:** Guru bidang studi (`guru_mapel`) yang mengampu kelas 6 dapat mengakses halaman Input Nilai Ujian Sekolah dan Input Nilai Rata-Rata Rapor, tetapi tabel mata pelajaran kosong — tidak ada baris yang ditampilkan.

**Investigasi tiga versi filter yang salah:**

| Versi | Kode | Masalah |
|-------|------|---------|
| v5 (asli) | `m.id === currentUser.mapel` | Tidak handle koma — `"MP001,MP003" !== "MP001"` |
| v18 | Bandingkan `m.nama` vs `currentUser.mapel` | `currentUser.mapel` berisi **ID**, bukan nama mapel |
| **v19 ✅** | Split ID lalu `mapelIds.includes(m.id)` | Benar |

**Root cause:** `currentUser.mapel` (kolom F sheet USERS) menyimpan **ID mapel dipisahkan koma** (contoh: `"MP001,MP003"`), bukan nama. Ini dikonfirmasi dari kode `setup/kelola-guru.html` baris 690 yang melakukan `u.mapel.split(',')` dan mengiterasi hasilnya sebagai ID.

**Fix:**
```javascript
// Sebelum (salah):
allMapel = allMapel.filter(m => m.id === currentUser.mapel);

// Sesudah (benar):
const mapelIds = (currentUser.mapel||'').split(',').map(s=>s.trim()).filter(Boolean);
if (mapelIds.length > 0) {
  allMapel = allMapel.filter(m => mapelIds.includes(m.id));
}
```

Perubahan ini menangani satu mapel maupun guru yang mengampu beberapa mapel sekaligus.

### 📋 File yang Diubah (v19)

| File | Status | Keterangan |
|------|--------|------------|
| `ujian-sekolah/input-nilai-us.html` | **Diubah** | Filter mapel guru_mapel berdasarkan ID |
| `ujian-sekolah/input-rata-rapor.html` | **Diubah** | Filter mapel guru_mapel berdasarkan ID |

### 🔍 Penanda Kode — Anti-Regresi

| File | Penanda |
|------|---------|
| `input-nilai-us.html` | `mapelIds.includes(m.id)` |
| `input-rata-rapor.html` | `mapelIds.includes(m.id)` |

---

---

## [2026-05-04] — v20 · Sesi 24 · Fix Setoran TT Tidak Tersimpan/Hilang Setelah Refresh

### 🐛 Perbaikan Bug Kritis

**File:** `assets/js/sheets.js`

**Masalah:** Setoran Tahsin-Tahfizh berhasil disimpan (ada konfirmasi `saved with id: STxxx`) tetapi hilang setelah refresh. Selain itu `updateSetoranTT` selalu gagal dengan error "Setoran tidak ditemukan".

**Investigasi:**

| # | Gejala | Root Cause |
|---|--------|------------|
| 1 | Data hilang setelah refresh | `append('SETORAN_TT', [row])` tanpa anchor → API mencari batas tabel di seluruh sheet → menemukan sisa data di kolom ZU → data ditulis di sana, tidak pernah terbaca karena hanya baca `A:M` |
| 2 | `getSetoranTT` selalu return 0 item | Filter `r[4] === tahun` aktif; format `tahun_pelajaran` tidak konsisten (`2025/2026` vs `2025-2026`) sehingga tidak pernah cocok |
| 3 | `updateSetoranTT` gagal temukan ID | `findIndex` tidak pakai `.trim()` → spasi tersembunyi menyebabkan mismatch |

**Fix:**

```javascript
// FIX 1: anchor A1 agar append selalu ke kolom A
await append('SETORAN_TT!A1', [row]);

// FIX 2: hapus filter tahun, tambah trim
const normKelas    = (kelas    || '').trim();
const normSemester = (semester || '').trim();
if (normKelas)    data = data.filter(r => (r[2]||'').trim() === normKelas);
if (normSemester) data = data.filter(r => (r[3]||'').trim() === normSemester);
// Tahun sengaja tidak difilter - format bisa beda (2025/2026 vs 2025-2026)

// FIX 3: trim pada findIndex
rows.findIndex(r => String(r[0]||'').trim() === String(id).trim());
```

### 📋 File yang Diubah (v20)

| File | Status | Keterangan |
|------|--------|------------|
| `assets/js/sheets.js` | **Diubah** | 3 fix di `saveSetoranTT`, `getSetoranTT`, `updateSetoranTT` |

### 🔍 Penanda Kode — Anti-Regresi

| File | Penanda |
|------|---------|
| `sheets.js` | `append('SETORAN_TT!A1', [row])` |
| `sheets.js` | `// Tahun sengaja tidak difilter` |
| `sheets.js` | `String(r[0]||'').trim() === String(id).trim()` |

---

## [2026-05-04] — v21 · Sesi 24 · Fix Progress Bar Hafalan Tidak Sinkron (Multi-Materi)

### 🐛 Perbaikan Bug

**File:** `penilaian/input-setoran-tt.html`

**Masalah:** Bar progress hafalan di daftar siswa muncul namun tidak sinkron — bagian hijau tidak mencerminkan capaian yang sebenarnya. Setoran dengan beberapa materi sekaligus (multi-select) tidak terhitung dalam progress.

**Root cause:** `lulusSet` dibangun dari `x.materi` secara langsung. Untuk multi-select, materi disimpan sebagai JSON array string (`'["79-1-15","79-16-30"]'`). Saat dicek dengan `lulusSet.has("79-1-15")`, tidak cocok karena yang ada di set adalah string array lengkap.

**Fix:**

```javascript
// Sebelum (salah untuk multi-select):
const lulusSet = new Set(allSt.filter(...).map(x => x.materi));

// Sesudah (expand JSON array):
const lulusSet = new Set();
allSt.filter(x => x.status_hafalan === 'lulus').forEach(x => {
  const m = x.materi || '';
  if (m.startsWith('[')) {
    try { JSON.parse(m).forEach(k => lulusSet.add(k)); } catch(e) { lulusSet.add(m); }
  } else if (m) {
    lulusSet.add(m);
  }
});
```

Dengan fix ini, satu setoran multi-materi yang lulus akan menambahkan **setiap key materi secara individual** ke `lulusSet`, sehingga progress bar terhitung dengan benar.

### 📋 File yang Diubah (v21)

| File | Status | Keterangan |
|------|--------|------------|
| `penilaian/input-setoran-tt.html` | **Diubah** | Fix `lulusSet` expand JSON array materi |

### 🔍 Penanda Kode — Anti-Regresi

| File | Penanda |
|------|---------|
| `input-setoran-tt.html` | `m.startsWith('[')` di dalam forEach lulusSet |

---

*Dibuat: 3 Mei 2026 (v13–v19) | Diperbarui: 4 Mei 2026 (v20–v21) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
