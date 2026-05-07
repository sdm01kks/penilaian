## [2026-05-07] — v13 · Hotfix · `saveNilaiUSBatch` Tidak Dapat Dipanggil dari Halaman Input Nilai US

### 🐛 Perbaikan Bug Kritis

---

### BUG-03 · `assets/js/sheets.js` · `SHEETS.saveNilaiUSBatch is not a function`

**File:** `assets/js/sheets.js`

**Gejala:** Saat guru menekan tombol **Simpan** di halaman `ujian-sekolah/input-nilai-us.html`, muncul error:

```
⛔ SHEETS.saveNilaiUSBatch is not a function
```

Tidak ada nilai yang tersimpan ke sheet `NILAI_US`.

**Akar masalah:**

Fungsi `saveNilaiUSBatch` *didefinisikan* di dalam IIFE `sheets.js` (baris 1101) tetapi **tidak dicantumkan dalam blok `return { … }` (public API)**. Akibatnya, `SHEETS.saveNilaiUSBatch` bernilai `undefined` saat dipanggil dari `input-nilai-us.html` baris 471.

Regresi ini muncul saat perbaikan v10 (Sesi 24 · Fix Setoran TT) menyentuh bagian bawah `sheets.js` — blok `return` diedit untuk menambahkan fungsi-fungsi SetorTT, namun `saveNilaiUSBatch` yang sudah ada sejak v5 (SAJ-01) terlewat tidak diikutsertakan.

**Perbaikan:**

```diff
  // Ujian Sekolah / Sumatif Akhir Jenjang
  valuesBatchWrite,
  getNilaiRaporRerata,
  saveNilaiRaporRerata,
  saveNilaiRaporReataBatch,
  getNilaiUS,
  saveNilaiUS,
+ saveNilaiUSBatch,
```

**Catatan pola regresi:** Setiap kali blok `return { … }` di `sheets.js` diubah, **seluruh fungsi yang didefinisikan di atas return wajib diverifikasi** masih tercantum. Lihat `ANTIREGRESI.md` untuk checklist lengkap.

### 📋 File yang Diubah (v13)

| File | Status | Keterangan |
|------|--------|------------|
| `assets/js/sheets.js` | **Diubah** | `saveNilaiUSBatch` ditambahkan ke blok `return { … }` |

### 🔍 Penanda Kode — Anti-Regresi

| File | Penanda |
|------|---------|
| `sheets.js` | `saveNilaiUSBatch,` ada di blok `return { … }` |

---

## [2026-05-05] — v12 · Bugfix · Dropdown Kelas Mutasi Masuk

### 🐛 Perbaikan Bug

---

### BUG-02 · `siswa/mutasi.html` · Dropdown "Masuk ke Kelas" kosong untuk akun guru kelas

**File:** `siswa/mutasi.html`

**Gejala:** Pada tab Mutasi Masuk, dropdown "Masuk ke Kelas" tidak menampilkan pilihan apapun saat diakses oleh akun guru kelas. Guru tidak bisa melanjutkan pengajuan karena kelas tujuan tidak dapat dipilih.

**Akar masalah (dua bug sekaligus):**

**Bug A — `populasiDropdownKelas()` tidak memfilter berdasarkan kelas guru.**

Fungsi ini menampilkan **semua** kelas yang ada di seluruh sekolah (`allKelas`) tanpa memfilter berdasarkan kelas yang diampu guru. Ini berlawanan dengan desain yang benar: untuk mutasi masuk, guru hanya boleh memilih kelas yang menjadi tanggung jawabnya sendiri. Halaman lain seperti `penilaian/input-nilai.html` sudah menerapkan filter ini dengan benar (`isiDropdownKelas()`).

Dampak langsung: jika `allKelas` berhasil dimuat, dropdown justru menampilkan semua kelas sekolah (salah desain). Namun jika terjadi kondisi di mana `allKelas` kosong atau `currentUser.kelas` tidak terkonfigurasi, dropdown tampak kosong — sesuai laporan.

**Bug B — `muatData()` memanggil `getSiswa(currentUser.kelas)` dengan string mentah.**

`currentUser.kelas` bisa berupa string dipisah koma seperti `"4A,4B"` (untuk guru yang mengampu lebih dari satu kelas). Fungsi `getSiswa()` melakukan pencocokan eksak (`r[4] === kelas`), sehingga tidak ada siswa yang cocok dengan string `"4A,4B"` — semua siswa tidak termuat. Ini menyebabkan dropdown "Pilih Siswa" (mutasi keluar) juga kosong untuk guru multi-kelas.

**Perbaikan:**

**`muatData()` — Gunakan `kelasList` yang sudah diparsing, bukan string mentah:**

```diff
-  const [siswa, kelas] = await Promise.all([
-    SHEETS.getSiswa(currentUser.kelas),
-    SHEETS.getKelas(),
-  ]);
-  allSiswaKelas = siswa.filter(s => s.nama);
-  allKelas      = kelas;
+  const kelasUtamaArr  = (currentUser.kelas || '').split(',').map(s => s.trim()).filter(Boolean);
+  const kelasMapelArr  = (currentUser.kelas_mapel || '').split(',').map(s => s.trim()).filter(Boolean);
+  const kelasDiampuArr = [...new Set([...kelasUtamaArr, ...kelasMapelArr])];
+
+  const [semuaKelas, ...siswaBatch] = await Promise.all([
+    SHEETS.getKelas(),
+    ...kelasDiampuArr.map(k => SHEETS.getSiswa(k)),
+  ]);
+  allKelas = semuaKelas;
+  const seenIds = new Map();
+  siswaBatch.flat().filter(s => s.nama).forEach(s => seenIds.set(s.id, s));
+  allSiswaKelas = [...seenIds.values()];
```

**`populasiDropdownKelas()` — Filter kelas berdasarkan `kelasDiampuArr`, konsisten dengan `isiDropdownKelas()` di `input-nilai.html`:**

```diff
-function populasiDropdownKelas() {
+function populasiDropdownKelas(kelasDiampuArr) {
   const sel = document.getElementById('selKelasMasuk');
   sel.innerHTML = '<option value="">— Pilih kelas —</option>';
-  allKelas.forEach(k => {
+  const kelasTersedia = kelasDiampuArr && kelasDiampuArr.length
+    ? allKelas.filter(k => kelasDiampuArr.includes(k.nama))
+    : allKelas;
+  kelasTersedia.forEach(k => {
     const opt = document.createElement('option');
     opt.value = k.nama;
     opt.textContent = k.nama;
-    if (k.nama === currentUser.kelas) opt.selected = true;
     sel.appendChild(opt);
   });
+  if (kelasTersedia.length === 1) sel.value = kelasTersedia[0].nama;
 }
```

Jika guru hanya mengampu satu kelas, kelas tersebut otomatis terpilih sehingga guru tidak perlu memilih secara manual.

---

### 📋 Ringkasan File yang Diubah (v5.2)

| File | Status | Keterangan |
|------|--------|------------|
| `siswa/mutasi.html` | **Diubah** | Bugfix `muatData()`: muat siswa per kelas dari `kelasDiampuArr`, bukan raw string; bugfix `populasiDropdownKelas()`: filter kelas berdasarkan kelas yang diampu guru |

---

*Dibuat: 05 Mei 2026 (v5.2) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

---

## [2026-05-03] — v3 · Sesi 17 · Spasi Biodata dan Sebelum LULUS (SKL Hal. 1)

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Lokasi | Perubahan CSS |
|---|--------|---------------|
| 1 | Setelah tabel biodata (sebelum "Berdasarkan...") | `.biodata-tbl` `margin-bottom: 3px → 10px` |
| 2 | Sebelum "-------- L U L U S --------" | `.lulus-text` `margin-top: 6px → 10px` |

---

## [2026-05-03] — v4 · Sesi 18 · Logo Tanpa Garis, Lebih Besar, Spasi LULUS 32pt

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Garis horizontal di bawah logo ikut tercetak | Logo di-crop ulang: tinggi dipotong 82% (membuang garis di bagian bawah gambar asli) |
| 2 | Logo masih terlalu kecil | Ukuran tampil `76px → 96px`, `object-position: top` |
| 3 | Spasi sebelum LULUS terlalu kecil | `.lulus-text` `margin-top: 10px → 32pt` (sesuai anotasi "32pt untuk mengisi ruang ini") |

---

## [2026-05-03] — v5 · Sesi 19 · Logo Lebih Lebar, Spasi Setelah LULUS

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Logo terpotong di sisi kanan | Crop diperlebar ke 20% lebar gambar (201px) agar seluruh badge tampil |
| 2 | Logo masih kecil | `96px → 112px` |
| 3 | Jarak antara "LULUS" dan "dari sekolah dasar..." terlalu dekat | `.lulus-text` `margin-bottom: 4px → 14px` |

---

## [2026-05-03] — v6 · Sesi 20 · Hapus "S" Hantu, Jarak Garis ke Judul, Jarak Nomor ke Tubuh

### 🐛 Perbaikan Layout Cetak

Semua perubahan hanya pada `ujian-sekolah/preview-skl.html`.

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Huruf "S" terpotong muncul di samping logo | Crop dikembalikan ke **15.5%** (156px) — crop 20% terlalu lebar hingga menangkap huruf "S" dari kata "SEKOLAH" di gambar header PNG asli |
| 2 | Tidak ada jarak antara garis header dan "SURAT KETERANGAN KELULUSAN/LULUS" | `.doc-title` `margin-top: 6px → 18pt` |
| 3 | Tidak ada jarak antara baris Nomor dan "Yang bertanda tangan..." / "Kepala Sekolah..." | `.doc-nomor` `margin-bottom: 5px → 18pt` |

---

## [2026-05-03] — v7 · Sesi 21 · Crop Logo Berdasarkan Piksel (Tidak Terpotong)

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

## [2026-05-03] — v8 · Sesi 22 · [DIBATALKAN — Segera Diganti v9]

Filter mapel guru bidang studi diperbaiki menggunakan perbandingan nama — ternyata masih salah karena `currentUser.mapel` berisi ID bukan nama. Patch ini langsung digantikan oleh v9.

---

## [2026-05-03] — v9 · Sesi 23 · Fix Filter Mapel Guru Bidang Studi (Input Nilai Ujian Sekolah)

### 🐛 Perbaikan Bug

**File:** `ujian-sekolah/input-nilai-us.html`, `ujian-sekolah/input-rata-rapor.html`

**Masalah:** Guru bidang studi (`guru_mapel`) yang mengampu kelas 6 dapat mengakses halaman Input Nilai Ujian Sekolah dan Input Nilai Rata-Rata Rapor, tetapi tabel mata pelajaran kosong — tidak ada baris yang ditampilkan.

**Investigasi tiga versi filter yang salah:**

| Versi | Kode | Masalah |
|-------|------|---------|
| v1 (asli) | `m.id === currentUser.mapel` | Tidak handle koma — `"MP001,MP003" !== "MP001"` |
| v8 | Bandingkan `m.nama` vs `currentUser.mapel` | `currentUser.mapel` berisi **ID**, bukan nama mapel |
| **v9 ✅** | Split ID lalu `mapelIds.includes(m.id)` | Benar |

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

## [2026-05-04] — v10 · Sesi 24 · Fix Setoran TT Tidak Tersimpan/Hilang Setelah Refresh

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

## [2026-05-04] — v11 · Sesi 24 · Fix Progress Bar Hafalan Tidak Sinkron (Multi-Materi)

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

---

## [2026-05-01] — v2 · Bugfix · Pengajuan Mutasi Siswa

### 🐛 Perbaikan Bug

---

### BUG-01 · `siswa/mutasi.html` · Pengajuan mutasi selalu gagal dengan error "Cannot read properties of null (reading 'jenis')"

**File:** `siswa/mutasi.html`

**Gejala:** Setiap kali guru kelas menekan tombol "Ya, Kirim Pengajuan" di modal konfirmasi, muncul pesan *"⛔ Gagal mengirim pengajuan"* dengan teks error *"Cannot read properties of null (reading 'jenis')"*. Tidak ada log error di console browser. Data mutasi tidak tersimpan ke sheet.

**Akar masalah:** Race condition antara `tutupModal()` dan penggunaan `pendingPayload` di dalam `kirimFinal()`.

Urutan eksekusi yang bermasalah:

```
kirimFinal()
  → tutupModal()          ← pendingPayload diset null DI SINI
  → SHEETS.addMutasi(pendingPayload)  ← dipanggil dengan null!
      → data.jenis        ← throws: Cannot read properties of null
  → catch(e) → showAlert('error', ..., e.message)
```

Fungsi `tutupModal()` selalu menjalankan `pendingPayload = null` sebagai bagian dari reset modal. Karena `tutupModal()` dipanggil *sebelum* `addMutasi`, variabel `pendingPayload` sudah bernilai `null` saat data mutasi akan dikirim.

**Perbaikan:** Menyimpan referensi `pendingPayload` ke variabel lokal `payload` di awal fungsi `kirimFinal()`, sebelum `tutupModal()` dipanggil. Seluruh operasi async (`addMutasi`, `showAlert`, `muatRiwayat`) menggunakan `payload` alih-alih `pendingPayload`. Baris `pendingPayload = null` yang redundan di blok `try` juga dihapus karena `tutupModal()` sudah menanganinya.

**Perubahan kode (`siswa/mutasi.html`):**

```diff
 async function kirimFinal() {
   if (!pendingPayload) return;
+  const payload = pendingPayload;   // simpan referensi lokal sebelum tutupModal() menghapus pendingPayload
   document.getElementById('btnKirimFinal').disabled = true;
   tutupModal();
   showLoading('Mengirim pengajuan…');
   try {
-    await SHEETS.addMutasi(pendingPayload);
+    await SHEETS.addMutasi(payload);
     showAlert('success', '✅ Pengajuan berhasil dikirim',
-      `Pengajuan mutasi ${pendingPayload.jenis} untuk ${pendingPayload.nama_siswa} ...`);
+      `Pengajuan mutasi ${payload.jenis} untuk ${payload.nama_siswa} ...`);
     ...
     await muatRiwayat();
-    pendingPayload = null;   // redundan — tutupModal() sudah menanganinya
   } catch(e) { ...
```

---

### 📋 Ringkasan File yang Diubah (v5.1)

| File | Status | Keterangan |
|------|--------|------------|
| `siswa/mutasi.html` | **Diubah** | Bugfix `kirimFinal()`: simpan `pendingPayload` ke variabel lokal sebelum `tutupModal()` |

---

*Dibuat: 01 Mei 2026 (v5.1) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2026-04-30] — v1 · Sesi 9 · Fitur Ujian Sekolah / Sumatif Akhir Jenjang (SAJ)

### ✨ Fitur Baru

---

### SAJ-01 · `assets/js/sheets.js` · Lima fungsi baru untuk sheet NILAI_RAPOR_RERATA dan NILAI_US

**File:** `assets/js/sheets.js`

Ditambahkan dua sheet baru beserta fungsi akses data-nya.

**Sheet NILAI_RAPOR_RERATA** (kolom A–G):

| Kolom | Field | Keterangan |
|-------|-------|------------|
| A | id | ID unik (prefix `NR`) |
| B | id_siswa | ID siswa |
| C | id_mapel | ID mata pelajaran |
| D | kelas | Kelas (misal `6A`) |
| E | semester | Nomor semester 7–12 |
| F | tahun_pelajaran | TP aktif saat input |
| G | nilai | Nilai akhir angka (0–100) |

**Sheet NILAI_US** (kolom A–G):

| Kolom | Field | Keterangan |
|-------|-------|------------|
| A | id | ID unik (prefix `NU`) |
| B | id_siswa | ID siswa |
| C | id_mapel | ID mata pelajaran |
| D | kelas | Kelas |
| E | tahun_pelajaran | TP aktif saat input |
| F | nilai_tertulis | Nilai ujian tertulis (0–100) |
| G | nilai_praktik | Nilai ujian praktik/projek (0–100) |

**Fungsi yang ditambahkan dan diekspos:**

| Fungsi | Keterangan |
|--------|------------|
| `getNilaiRaporRerata({ id_siswa, id_mapel, kelas, semester })` | Baca nilai rata-rata rapor dengan filter opsional |
| `saveNilaiRaporRerata(item)` | Upsert nilai rata-rata rapor (4-key: siswa+mapel+semester) |
| `saveNilaiRaporReataBatch(items)` | Simpan banyak baris sekaligus |
| `getNilaiUS({ id_siswa, id_mapel, kelas, tahun })` | Baca nilai ujian sekolah dengan filter opsional |
| `saveNilaiUS(item)` | Upsert nilai ujian sekolah (3-key: siswa+mapel+kelas) |

**Catatan desain:** Kedua sheet hanya menyimpan **nilai akhir angka** per mata pelajaran. Tidak ada ketergantungan pada TP/KKTP dari sheet NILAI — berbeda dari alur penilaian rapor reguler.

---

### SAJ-02 · `ujian-sekolah/input-rata-rapor.html` · Halaman input nilai rata-rata rapor *(file baru)*

**File:** `ujian-sekolah/input-rata-rapor.html`

Halaman untuk menginput nilai rata-rata rapor per siswa per mata pelajaran untuk setiap semester (7–12).

**Fitur utama:**

- **Tabel nilai** — baris = mata pelajaran, kolom = semester 7–12
  - Semester 7 dan 8 (kelas 4) bersifat **opsional** — placeholder "–" dan tidak diwajibkan
  - Semester 9–10 = kelas 5, semester 11–12 = kelas 6
- **Kolom rata-rata otomatis** (dihitung di sisi klien, tidak disimpan):
  - **Sem 9–12** — digunakan untuk komponen nilai SKL/ijazah
  - **Sem 7–11** — digunakan untuk pendaftaran SMP Negeri
- **Rumus rata-rata hanya menghitung semester yang terisi** — semester kosong tidak dihitung. Ini menangani kasus: siswa pindahan (tidak punya nilai ISMUBA/B.Inggris/TIK dari sekolah lama), mapel baru seperti KKA yang belum ada di tahun ajaran sebelumnya.
- **Tarik Nilai Sem 12** — ambil otomatis nilai akhir semester genap kelas 6 dari sheet NILAI, rata-ratakan per mapel (`nilai_akhir`), tanpa menyentuh TP/KKTP.
- **Ekspor CSV** — per siswa, dengan kolom: NISN, Nama, Mapel, Kelompok, ISMUBA, Sem7–Sem12.
- **Impor CSV** — mapping berdasarkan nama mata pelajaran (case-insensitive).
- **Highlight ISMUBA** — latar kuning, badge khusus; tetap diinput bersama mapel lain.
- **Dirty tracking** — tombol Simpan aktif hanya jika ada perubahan; menampilkan jumlah cell yang belum disimpan.

**Hak akses:** `admin`, `guru_kelas`, `guru_mapel` (halaman filter kelas 6 otomatis).

---

### SAJ-03 · `ujian-sekolah/input-nilai-us.html` · Halaman input nilai ujian sekolah *(file baru)*

**File:** `ujian-sekolah/input-nilai-us.html`

Halaman untuk menginput nilai ujian sekolah tertulis dan praktik/projek per siswa per mata pelajaran.

**Fitur utama:**

- **Dua kolom input per mapel:** Tertulis & Praktik
- **Bobot konfigurasibel** — default 60% tertulis + 40% praktik; total harus 100%; divalidasi sebelum simpan.
- **Kolom Nilai US** dihitung live: `round((Tertulis × bobotT%) + (Praktik × bobotP%))`.
- **Dirty tracking** per mapel.
- Nilai ISMUBA tetap diinput dalam halaman ini (tidak dipisahkan di tahap input).

**Hak akses:** `admin`, `guru_kelas`, `guru_mapel`.

---

### SAJ-04 · `ujian-sekolah/preview-skl.html` · Preview & Cetak SKL / Transkrip Nilai *(file baru)*

**File:** `ujian-sekolah/preview-skl.html`

Halaman pratinjau dan cetak dokumen SKL (Surat Keterangan Lulus) serta transkrip nilai untuk pendaftaran SMP.

**Dua mode dokumen:**

| Mode | Komponen Nilai | Rentang Semester Rapor | ISMUBA |
|------|---------------|------------------------|--------|
| SKL / Ijazah | Rata-rata Rapor + Nilai US | Sem 9–12 | Bagian terpisah di tabel + catatan "lampiran ijazah tersendiri" |
| Pendaftaran SMP Negeri | Rata-rata Rapor saja | Sem 7–11 | Disertakan dalam tabel yang sama |

**Formula nilai akhir (mode SKL):**
```
Nilai Akhir = (Rata-rata Rapor × BobotRapor%) + (Nilai US × BobotUS%)
```
Bobot dikonfigurasi per sesi cetak (default 60% rapor + 40% US), tidak disimpan ke database.

**Formula rata-rata rapor:** hanya semester yang terisi / jumlah semester terisi (sama dengan SAJ-02).

**Fitur lain:**
- Pilih kelas → pilih siswa (atau "Semua Siswa" untuk cetak seluruh kelas sekaligus)
- Peringatan `! belum lengkap` per baris jika nilai rata-rata rapor atau nilai US belum diinput
- **Print layout A4 ready**: kop sekolah, judul dokumen, biodata siswa, tabel bernomor urut, catatan rumus, blok tanda tangan kepala sekolah
- Satu siswa = satu halaman saat dicetak (`page-break-before: always`)
- Data kop diambil dari sheet `PROFIL` (nama kepala sekolah, NIP, NPSN)

**Hak akses:** `admin`, `guru_kelas`, `guru_mapel`.

---

### SAJ-05 · `dashboard/guru-kelas.html` · Menu dan action card Ujian Sekolah/SAJ

**File:** `dashboard/guru-kelas.html`

**Nav sidebar** — seksi baru "Ujian Sekolah / SAJ" dengan tiga item:
- 📊 Nilai Rata-Rata Rapor → `../ujian-sekolah/input-rata-rapor.html`
- ✏️ Nilai Ujian Sekolah → `../ujian-sekolah/input-nilai-us.html`
- 🎓 Preview & Cetak SKL → `../ujian-sekolah/preview-skl.html`

**Action card** — "Ujian Sekolah / SAJ" di grid Aksi Cepat.

**Visibilitas kondisional:** Menu dan card hanya ditampilkan jika guru memiliki minimal satu kelas 6 dalam `kelasList`-nya (gabungan kelas utama + kelas_mapel). Ini dilakukan via pengecekan `hasKelas6` di `window.addEventListener('load', ...)`.

```javascript
const hasKelas6 = kelasList.some(k => String(k).startsWith('6'));
if (hasKelas6) {
  ['navSAJLabel','navRataRapor','navNilaiUS','navSKL','cardSAJ']
    .forEach(id => { document.getElementById(id).style.display = ''; });
}
```

---

### SAJ-06 · `dashboard/admin.html` · Menu dan action card Ujian Sekolah/SAJ

**File:** `dashboard/admin.html`

**Nav sidebar** — seksi baru "Ujian Sekolah / SAJ" disisipkan sebelum seksi "Log", dengan tiga item nav yang sama seperti SAJ-05.

**Action card** — "Ujian Sekolah / SAJ" ditambahkan ke grid Aksi Cepat (selalu tampil untuk admin, tanpa cek kelas).

---

### ⚠️ Persiapan di Google Sheets

Tambahkan dua sheet baru di spreadsheet database dengan header berikut **di baris 1**:

**Sheet `NILAI_RAPOR_RERATA`** (baris 1):
```
id | id_siswa | id_mapel | kelas | semester | tahun_pelajaran | nilai
```

**Sheet `NILAI_US`** (baris 1):
```
id | id_siswa | id_mapel | kelas | tahun_pelajaran | nilai_tertulis | nilai_praktik
```

Header di baris 1 wajib ada persis seperti di atas (kolom A hingga G masing-masing). Baris 2 ke bawah diisi otomatis oleh aplikasi.

---

### 📋 Matriks Hak Akses Fitur SAJ

| Halaman | Admin | Guru Kelas (kelas 6) | Guru Kelas (bukan kelas 6) | Guru Mapel |
|---------|:-----:|:-------------------:|:-------------------------:|:----------:|
| `ujian-sekolah/input-rata-rapor.html` | ✅ | ✅ | ✅* | ✅* |
| `ujian-sekolah/input-nilai-us.html` | ✅ | ✅ | ✅* | ✅* |
| `ujian-sekolah/preview-skl.html` | ✅ | ✅ | ✅* | ✅* |
| Menu sidebar di dashboard | ✅ | ✅ | ✗ (tersembunyi) | — |

\* Halaman dapat diakses langsung via URL, tetapi dropdown kelas hanya menampilkan kelas 6 yang dimiliki pengguna. Guru bukan kelas 6 tidak akan mendapat pilihan kelas.

---

### 📋 Ringkasan File yang Diubah/Dibuat (v5)

| File | Status | Keterangan |
|------|--------|------------|
| `assets/js/sheets.js` | **Diubah** | +5 fungsi (getNilaiRaporRerata, saveNilaiRaporRerata, saveNilaiRaporReataBatch, getNilaiUS, saveNilaiUS) |
| `ujian-sekolah/input-rata-rapor.html` | **Baru** | Input nilai rata-rata rapor sem 7–12 per siswa |
| `ujian-sekolah/input-nilai-us.html` | **Baru** | Input nilai ujian sekolah tertulis & praktik |
| `ujian-sekolah/preview-skl.html` | **Baru** | Preview & cetak SKL / transkrip nilai |
| `dashboard/guru-kelas.html` | **Diubah** | +nav SAJ (kondisional kelas 6), +action card |
| `dashboard/admin.html` | **Diubah** | +nav SAJ, +action card |

### 🔍 Penanda Kode Baru — tambahkan ke tabel Anti-Regresi

| File | Penanda Kode — harus selalu ada |
|------|----------------------------------|
| `assets/js/sheets.js` | `getNilaiRaporRerata` |
| `assets/js/sheets.js` | `saveNilaiUS` |
| `dashboard/guru-kelas.html` | `hasKelas6` |
| `dashboard/guru-kelas.html` | `navSAJLabel` |

---


---

*Dibuat: 30 April 2026 (v5) | Diperbarui: 5 Mei 2026 (v1–v12) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
