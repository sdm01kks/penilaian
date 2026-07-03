# ANTIREGRESI.md — Panduan Pencegahan Regresi

> **Tujuan dokumen ini:** Setiap perbaikan bug di masa lalu pernah merusak fungsi lain yang sebelumnya sudah bekerja (regresi). Dokumen ini merangkum pola-pola regresi yang sudah terjadi, zona-zona risiko tinggi, dan checklist wajib yang harus dilakukan sebelum dan sesudah setiap perubahan kode.

---

## 🔴 Riwayat Regresi yang Pernah Terjadi

| Versi | File yang Diubah | Fungsi yang Rusak | Pola Penyebab |
|-------|-----------------|-------------------|---------------|
| v57 | `rapor/preview.html` | Cetak PDF rapor terpotong di tengah Catatan Wali, Ketidakhadiran, atau TTD saat pergantian halaman | CSS `.abs-catatan-grid{page-break-inside:avoid}` adalah dead code (HTML aktual tidak memakai class itu); `.rpr-keputusan`/`.rpr-ttd` hanya melindungi div dalam, bukan pembungkus luarnya. Lihat §38. |
| v54 | `rapor/leger-guru-mapel.html`, `dashboard/guru-kelas.html` | Guru kelas yang merangkap guru mapel tidak bisa membuka leger bidang studi — halaman menolak akses dan menu tidak muncul di sidebar | `requireLogin('guru_mapel')` menolak role `guru_kelas`; sidebar guru-kelas tidak punya link ke halaman ini. Lihat §34. |
| v45 | `rapor/laporan-tt.html`, `setup/kelola-guru.html` | `cariGuruTT()` mengembalikan guru yang hanya mengajar sebagian mapel TT, bukan semua kelas (Pak Indra: Al-Islam + TT di 1A/1B, Al-Islam saja di 3A → muncul salah sebagai guru TT kelas 3A) | `cariGuruTT()` hanya cek `hasTT` + `kelas ∈ kelasList`; tidak ada cara membedakan "TT di kelas A" vs "non-TT di kelas B". Fix: kolom K dipakai sebagai pembatas kelas TT untuk `guru_mapel`; UI ditambah seksi "Kelas Khusus TT". Lihat §32. |
| v44 | `rapor/preview.html` | Wali kelas di TTD rapor menampilkan nama guru yang mengajar mapel di kelas tersebut (bukan wali kelas sebenarnya) | `users.find()` memakai `u.kelasList?.includes(activeKelas)`; sejak v43 `kelasList` = gabungan E+K → guru non-wali yang punya kelas di kolom K false-match. Lihat §31. |
| v43 | `assets/js/sheets.js` | `guru_kelas` TT merangkap (Nisya) kehilangan akses dropdown kelas TT setelah v39 | `getUsers()` membangun `kelasList` hanya dari kolom E; `auth.js` membangun dari gabungan E+K. Setelah §28 (v39) menyinkronkan `freshUser.kelasList` ke `currentUser`, kelas K ditimpa. Lihat §30. |
| v40 | `rapor/laporan-tt.html` | Progress hafalan tampil 0/N (0%) dan semua detail target `—`, meski siswa sudah menyetor seluruh target | `buildLaporanQuran` membangun `materiLulus` dengan `.map(s=>s.materi)` tanpa expand JSON array; setoran multi-materi tersimpan sebagai JSON array → `materiLulus.has(k)` selalu false. Lihat §29. |
| v39 | `rapor/laporan-tt.html`, `dashboard/guru-mapel.html` | Guru `guru_mapel` TT (Muhammad Rizki) tidak mendapat dropdown kelas di laporan TT — kelas yang diampu tidak tampil | Blok `freshUser` hanya me-refresh `currentUser.mapel`; `kelasList` dan `kelas_mapel` tidak ikut di-refresh → `isiDropdownKelas()` memakai data session lama. Lihat §28. |
| v38 | `assets/js/sheets.js` | Siswa baru selalu muncul di posisi acak (biasanya akhir atau awal) di daftar siswa kelas — urutan tidak abjad | `getSiswa()` tidak mengurutkan hasil; siswa baru yang di-`append` ke baris terakhir sheet muncul di posisi sheet-nya. Lihat §27. |
| v37 | `assets/js/sheets.js` | Siswa baru (via tambah manual \& mutasi masuk disetujui) tidak muncul di daftar siswa kelas | (1) `addSiswa` menggunakan `append('SISWA', [row])` tanpa anchor `!A1` → data baru ditulis ke kolom acak, tidak terbaca `getSiswa`. (2) `addSiswa` tidak menyimpan field `no_peserta_ismuba` (kolom P). (3) `getSiswa` hanya membaca `SISWA!A:O` sehingga kolom P tidak pernah dipopulasi. Lihat §3 dan §26. |
| v36 | `rapor/laporan-tt.html` | Nama guru TT tidak muncul (tampil `—`) untuk guru_kelas yang merangkap TT di kelas lain (kelas TT ≠ kelas utama) | `cariGuruTT` hanya mengecek `u.kelasList` (kolom E = kelas utama); kelas TT ada di `u.kelasMapelList` (kolom K). Contoh: wali kelas 2C yang mengajar TT di 2B → `kelasList=["2C"]`, `includes("2B")=false`. Lihat §25-B. |
| v35 | `rapor/laporan-tt.html` | `cariGuruTT` masih menampilkan guru nonaktif; mapel format pendek ("tt", "tt_01") tidak dikenali | `hasTT` tidak konsisten dengan `isTTGuru` (kurang `=== 'tt'` dan `startsWith('tt_')`); tidak ada filter `status !== 'nonaktif'`. Lihat §25. |
| v34 | `rapor/laporan-tt.html` | Nama guru TT di tanda tangan selalu menampilkan guru pertama di sheet (Tisandi), bukan guru kelas yang dicetak (Nisya) | `find()` di init time tidak memfilter kelas; cache global `config['_nama_guru_tt']` dipakai untuk semua kelas. Lihat §25. |
| v33 | `setup/profil-sekolah.html`, `rapor/preview.html`, `rapor/laporan-tt.html` | Tanggal rapor Sem. II Kelas 1–5 berbeda dengan Kelas 6 — satu field tidak cukup | Tambah `tgl_rapor_1_5`; helper `pilihTglRapor()` memilih key berdasarkan semester + tingkatan. Lihat §24. |
| v32 | `setup/kelola-guru.html` | Form edit guru selalu kosong — kelas/mapel tidak terpopulasi | `bukaEdit` memanggil `pilihRole(u.role)` tanpa `fromEdit=true` → `pilihRole` mengosongkan semua array yang baru diisi. Lihat §23. |
| v31 | `rapor/preview.html` | Ekskul pilihan level Cakap/Mahir tidak muncul di rapor | `buildSeksiEkskul` mencocokkan `r[4]==='1'` — hanya Layak yang muncul; Cakap (2) & Mahir (3) diabaikan. Lihat §22. |
| v30 | `ujian-sekolah/preview-skl.html`, `ujian-sekolah/generate-skl.html` | Seq nomor surat selalu `.01` untuk semua siswa | preview-skl: `idx` selalu 0 saat filter satu siswa. generate-skl: masih pakai format lama (`noUrutAwal+i`, `skl_no_surat_suffix`). Lihat §21. |
| v29 | `ujian-sekolah/preview-skl.html`, `ujian-sekolah/config-skl.html` | Format SKL salah: halaman lama (SKK), mapel lama (11), nilai bulat, NBM | Format berubah total per aturan 2025/2026. Lihat §21. |
| v27 | `penilaian/input-nilai.html` | `simpanTP()` — gagal simpan SLM/SAS error 400 | `write()` / values.update (PUT) dipakai untuk INSERT baris baru; gagal 400 jika nomor baris melewati batas alokasi fisik sheet. Per-item API call dalam loop (`eksekusiImport` diperbaiki v18 tapi `simpanTP` terlewat). |
| v21 | `siswa/edit-siswa-kelas.html` *(baru)* | Tombol simpan gagal dengan error 403 | `simpanSemua()` memanggil `SHEETS.read()` ulang di dalam fungsi save — request read kedua dalam sesi aktif memicu 403. Diperbaiki dengan cache-first pattern (§14). |
| v20 | `dashboard/guru-mapel.html` | Menu SAJ tidak muncul untuk guru PAI/B.Arab/KMH yang juga mengajar TT | Kondisi `!isTTGuru` terlalu luas — memblokir semua guru TT, termasuk yang juga mengajar mapel lain di kelas 6 |
| v19 | `ujian-sekolah/config-skl.html`, `dashboard/guru-kelas.html`, `ujian-sekolah/input-nilai-us.html` | Akses Konfigurasi SKL guru kelas 6 + sinkronisasi bobot | `requireLogin` hanya mengizinkan `admin`; menu tidak ada di dashboard; input bobot editable di halaman yang salah; `updateBobot()` tidak dipanggil setelah config dimuat |
| v18 | `penilaian/input-nilai.html` | `eksekusiImport` — gagal 429 | Per-row API call (`append` dipanggil satu kali per siswa per TP di dalam loop) → rate limit Google Sheets API |
| v10 | `assets/js/sheets.js` | `saveNilaiUSBatch` | Blok `return { … }` diedit tapi satu fungsi terlewat tidak diekspor |
| v8 | `ujian-sekolah/input-nilai-us.html` | Filter mapel guru_mapel | Asumsi salah tentang format data (`currentUser.mapel` berisi ID, bukan nama) — langsung digantikan v9 |

---

## 🟢 Infrastruktur Pendukung

### 26. Autobackup Database (Google Apps Script) + Restore In-App

Sejak 3 Juli 2026, spreadsheet database di-backup otomatis setiap **Jumat
jam 23:00 WIB** ke folder Drive terpisah, menyimpan backup hingga **3 bulan
(90 hari)** ke belakang. Script **tidak** ada di kode aplikasi
(`auth.js`/`sheets.js`) — dipasang langsung di spreadsheet lewat Extensions
→ Apps Script.

- Kode script: `backup/BackupPenilaian.gs`
- Panduan setup & restore manual: `backup/PANDUAN_BACKUP.md`
- Jika `SPREADSHEET_ID` di `auth.js` pernah diganti (misal setelah restore
  skenario B di panduan), **ingat pasang ulang trigger di spreadsheet ID
  yang baru** — trigger Apps Script menempel ke spreadsheet lama, tidak ikut
  pindah otomatis.

**Restore dari dalam aplikasi (baru, admin-only):**
Halaman `setup/restore-backup.html` memungkinkan admin memilih titik backup
dan memulihkan seluruh data langsung dari browser, tanpa perlu masuk ke
Apps Script/Drive manual.

- Ditulis dengan fungsi baru di `sheets.js`: `listBackups()` (baca daftar
  file dari Drive via `drive.readonly`, scope OAuth **tidak berubah**),
  `getSheetNames()`, `readAllSheetsFrom()` (baca spreadsheet lain by ID —
  dipakai untuk baca isi backup), `valuesBatchClear()`, dan
  `restoreFromBackup()` (orkestrasi: clear semua sheet yang cocok namanya →
  tulis ulang data dari backup, masing-masing 1 API call batch).
- ⚠️ **Jangan ubah fungsi-fungsi ini menjadi per-sheet API call** — pola yang
  sama dengan §9/§20: harus tetap `valuesBatchClear()` + `valuesBatchWrite()`
  (2 request total), bukan loop `clear()`/`write()` per sheet.
- Sebelum eksekusi restore, halaman otomatis mengunduh snapshot JSON data
  aktif ke perangkat admin (jaring pengaman lokal, tidak menyentuh Drive —
  makanya tidak perlu scope `drive.file`).
- Konfirmasi wajib mengetik "PULIHKAN" sebelum tombol restore aktif —
  jangan hapus guard ini, restore bersifat destruktif & tidak ada tombol undo.
- Aksi restore dicatat ke `SYNC_LOG` untuk audit trail (siapa, kapan, titik
  backup mana yang dipulihkan).
- Sidebar link ke halaman ini sudah ditambahkan di semua halaman `setup/*`
  dan `dashboard/admin.html`. Jika menambah halaman admin baru, sertakan
  juga link ini agar konsisten.

---

## 🟡 Zona Risiko Tinggi

### 1. Blok `return { … }` di `assets/js/sheets.js`

**Mengapa berisiko:** Semua fungsi dalam IIFE `sheets.js` harus secara eksplisit dicantumkan di blok `return` agar dapat dipanggil dari halaman HTML sebagai `SHEETS.namaFungsi()`. Jika sebuah fungsi didefinisikan tapi tidak diekspor, error yang muncul adalah:
```
SHEETS.namaFungsi is not a function
```
Error ini tidak terdeteksi saat mengedit file karena JavaScript tidak memberikan peringatan kompilasi.

**Kapan risiko meningkat:** Setiap kali blok `return { … }` diedit — baik untuk menambah fungsi baru maupun untuk merapikan urutan.

**Checklist wajib setelah mengubah `sheets.js`:**
- [ ] Buka `sheets.js`, temukan semua baris `async function namaFungsi` (kecuali helper privat yang diawali `_`)
- [ ] Pastikan setiap nama fungsi tersebut muncul di dalam blok `return { … }`
- [ ] Jalankan pencarian cepat: nama fungsi yang baru ditambahkan sudah ada di `return`?
- [ ] Bandingkan jumlah definisi fungsi publik vs jumlah entri di `return` — harus sama

**Daftar fungsi publik yang wajib selalu ada di `return { … }`:**

```
// CRUD dasar
read, readBatch, write, append, deleteRow

// Konfigurasi & master data
getConfig, setConfig, getKelas, getSiswa, addSiswa
getUsers, addUser, getMapel, getTPKKTP, getDPL

// Nilai reguler
getNilai, saveNilai

// Ekskul & absensi
getEkskul, getAbsensi

// Setoran Tahsin-Tahfizh
getSetoranTT, saveSetoranTT, updateSetoranTT, deleteSetoranTT

// Mutasi siswa
getMutasi, addMutasi, updateMutasiStatus

// Ujian Sekolah / SAJ  ← ZONA REGRESI v13
valuesBatchWrite
getNilaiRaporRerata, saveNilaiRaporRerata, saveNilaiRaporReataBatch
getNilaiUS, saveNilaiUS, saveNilaiUSBatch   ← saveNilaiUSBatch pernah hilang (v13)

// Kalkulasi
hitungNilaiAkhir, tentukanLevel, generateDeskripsi
```

---

### 2. Format data `currentUser.*` — Asumsi yang Sering Salah

**Mengapa berisiko:** Beberapa field `currentUser` menyimpan **banyak nilai dipisahkan koma**, bukan nilai tunggal. Menggunakannya langsung untuk perbandingan (`===`) selalu gagal diam-diam — tidak ada error, hanya hasil yang kosong.

| Field | Format sebenarnya | Contoh | Cara pakai yang benar |
|-------|------------------|--------|----------------------|
| `currentUser.kelas` | String koma jika multi-kelas | `"4A,4B"` | `.split(',').map(s=>s.trim())` |
| `currentUser.kelas_mapel` | String koma jika multi-kelas | `"6A,6B"` | `.split(',').map(s=>s.trim())` |
| `currentUser.mapel` | **ID mapel** dipisahkan koma | `"MP001,MP003"` | `.split(',')` lalu `.includes(m.id)` |

**Penanda kode yang harus ada (jangan dihapus):**

| File | Penanda | Keterangan |
|------|---------|------------|
| `ujian-sekolah/input-nilai-us.html` | `mapelIds.includes(m.id)` | Filter mapel guru_mapel berdasarkan ID (bukan nama) |
| `ujian-sekolah/input-rata-rapor.html` | `mapelIds.includes(m.id)` | Idem |
| `siswa/mutasi.html` | `kelasDiampuArr` | Gabungan kelas_utama + kelas_mapel |

---

### 3. `append()` tanpa anchor sheet — Data Ditulis ke Tempat Salah

**Mengapa berisiko:** `append('NAMA_SHEET', rows)` tanpa `!A1` membuat Google Sheets API mencari batas tabel terakhir di seluruh sheet. Jika ada data sisa di kolom jauh (misalnya kolom ZU), data baru ditulis di sana — tidak pernah terbaca oleh `read('NAMA_SHEET!A:G')`.

**Aturan wajib:** Selalu gunakan anchor `!A1`:
```javascript
// ✅ Benar
await append('NILAI_US!A1', [row]);
await append('SETORAN_TT!A1', [row]);

// ❌ Salah — data bisa ditulis di kolom acak
await append('NILAI_US', [row]);
```

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `sheets.js` | `append('SETORAN_TT!A1', [row])` |
| `sheets.js` | `append('SISWA!A1', [row])` — FIX v37, sebelumnya `append('SISWA', [row])` tanpa anchor |
| `sheets.js` | `append('NILAI_US!A1'` — FIX v65, sebelumnya `append('NILAI_US', ...)` tanpa anchor di `saveNilaiUS()` dan `saveNilaiUSBatch()`. Ini adalah akar penyebab nilai US sejumlah siswa hilang tanpa error (tersimpan tapi di luar jangkauan baca `NILAI_US!A:G`) |
| `sheets.js` | `append('NILAI_US'` (tanpa `!A1`) — **TIDAK boleh ada lagi** |

> ~~Catatan: fungsi `saveNilaiUSBatch` menggunakan `append('NILAI_US', toAppend)` (tanpa anchor)~~ — **Sudah diperbaiki di v65.** Risiko ini sempat dibiarkan "untuk dipertimbangkan di masa depan" dan akhirnya benar-benar menyebabkan regresi nyata: nilai ujian sekolah sejumlah siswa hilang dari tampilan (per_siswa maupun per_mapel) meski sudah pernah tersimpan dengan benar sebelumnya. Baris baru yang di-append kemungkinan mendarat di luar jangkauan `NILAI_US!A:G` karena Sheets API mencari batas tabel di seluruh sheet tanpa anchor `!A1`. Jangan hilangkan anchor ini lagi.

---

### 4. Race Condition `pendingPayload` di Modal Konfirmasi

**Pola yang pernah terjadi (v1/BUG-01, `siswa/mutasi.html`):** Memanggil `tutupModal()` sebelum menggunakan data dari variabel yang direset oleh `tutupModal()`.

**Aturan:** Jika sebuah fungsi async menggunakan variabel yang akan direset oleh fungsi lain yang dipanggil di dalamnya, **simpan dulu ke variabel lokal**:
```javascript
// ✅ Benar
async function kirimFinal() {
  const payload = pendingPayload;  // simpan dulu
  tutupModal();                     // pendingPayload = null di sini
  await SHEETS.addMutasi(payload);  // aman
}

// ❌ Salah
async function kirimFinal() {
  tutupModal();                          // pendingPayload = null
  await SHEETS.addMutasi(pendingPayload); // null! → crash
}
```

---

### 5. Mode Dual `per_siswa` / `per_mapel` di `input-nilai-us.html` (v14)

**Mengapa berisiko:** `input-nilai-us.html` kini memiliki dua mode render yang berbagi banyak variabel global (`nilaiUS`, `dirty`, `viewMode`). Kesalahan di salah satu mode bisa diam-diam merusak mode lain.

**Kontrak yang harus dijaga:**

| Elemen | `per_siswa` | `per_mapel` |
|--------|-------------|-------------|
| Variabel aktif | `activeSiswa` | `activeMapel` |
| Key di `nilaiUS` | `id_mapel` | `id_siswa` |
| Key di `dirty` | `id_mapel` | `id_siswa` |
| Atribut input | `data-mapel` + `data-field` | `data-siswa` + `data-field` |
| Query selector bobot | `#tbodyUS tr` (jangan ubah ke `tr[data-mapel]`) | sama |
| Fungsi save | `SHEETS.saveNilaiUSBatch` — format item sama, jangan pisahkan | sama |

**Penanda kode yang harus selalu ada:**
- `viewMode = (currentUser.role === 'guru_mapel') ? 'per_mapel' : 'per_siswa'` — di init, jangan pindahkan
- `renderTablePerSiswa` dan `renderTablePerMapel` — dua fungsi terpisah, jangan digabung
- `const key = viewMode === 'per_siswa' ? el.dataset.mapel : el.dataset.siswa` — di `onNilaiChange`
- `mapelIds.includes(m.id)` — filter mapel dari v9, tetap harus ada

**Jika menambahkan mode baru di masa depan:** tambahkan entri ke tabel kontrak di atas, update `renderTable()` dispatcher, dan update `simpanSemua()` dengan branch baru.

### 8. Footer `@page` Margin Box — `vertical-align` Wajib Ada

**Mengapa berisiko:** `@page` margin boxes (`@bottom-left`, `@bottom-right`) memiliki tinggi penuh sebesar margin bawah halaman (1.5cm ≈ 42.5pt). Teks secara **default di-align ke tengah** box tersebut. Akibatnya:
- `border-top` berada di ujung atas box
- Teks berada di tengah box
- Jarak visual antara garis dan teks ≈ 16pt — besar — **tidak peduli berapa nilai `padding-top`**
- Mengubah `padding-top` hanya menggeser posisi box secara keseluruhan (teks ikut bergerak), bukan mengubah jarak internal garis–teks

**Penanda kode wajib:**

```css
/* ✅ BENAR — vertical-align: top wajib ada agar padding-top efektif */
@bottom-left {
  border-top: 1px solid #ccc;
  vertical-align: top;   /* ← WAJIB — tanpa ini, padding-top tidak mengontrol gap */
  padding-top: 2pt;      /* ← gap antara garis dan teks */
}

/* ❌ SALAH — tanpa vertical-align: top, padding-top tidak berpengaruh pada gap */
@bottom-left {
  border-top: 1px solid #ccc;
  padding-top: 2pt;  /* tidak efektif karena teks masih di tengah box */
}
```

**Checklist wajib setelah mengubah `@page` di `rapor/preview.html`:**
- [ ] Pastikan `vertical-align: top` ada di `@bottom-left` DAN `@bottom-right`
- [ ] `padding-top` mengontrol jarak garis–teks (nilai kecil, cukup 1–3pt)
- [ ] Jangan hapus `vertical-align: top` meski terlihat seperti "tidak penting"

---

### 7. Logika Fase dan Rombel di Keputusan Naik/Tinggal — `rapor/preview.html` ⚠️ BERULANG 2×

**Mengapa berisiko:** Fungsi `nextFase` dan `kelasPokok` keduanya ada di dalam file yang sering diedit untuk keperluan lain (layout, print CSS, section baru). Saat ada refactor, dua kekeliruan berikut berulang terjadi:
1. `nextFase` dikembalikan ke versi lama yang menerima `fase` bukan `kelas`, sehingga logika fase selalu naik satu huruf tanpa mempertimbangkan pemetaan kelas.
2. `kelasPokok` dihapus atau tidak dipakai, sehingga nama rombel (huruf) ikut tampil di baris "Tinggal di kelas".

**Pemetaan fase yang benar (wajib hafal):**

| Kelas tujuan | Fase |
|---|---|
| 1, 2 | A |
| 3, 4 | B |
| 5, 6 | C |
| 7, 8, 9 (SMP) | D |

**Riwayat pengulangan:**

| Kejadian | Pola penyebab |
|----------|---------------|
| Ke-1 & Ke-2 | `nextFase` ditulis ulang menerima `f` (fase) bukan `kelas`, dan/atau `kelasPokok` dihilangkan |

**Penanda kode wajib — tidak boleh dihapus atau diubah:**

```javascript
// ✅ BENAR — nextFase menerima kelas (string seperti "2B"), bukan fase
function nextFase(kelas) {
  const n=parseInt(kelas.replace(/[^0-9]/g,''));
  const nx=isNaN(n)?0:n+1;
  return nx<=2?'A':nx<=4?'B':nx<=6?'C':'D';
}

// ✅ BENAR — kelasPokok membuang huruf rombel
function kelasPokok(k) { const n=parseInt(k.replace(/[^0-9]/g,'')); return isNaN(n)?k:n; }

// ✅ BENAR — call site: pakai d.kelas, bukan d.fase
// Naik ke Fase ${nextFase(d.kelas)} | Kelas ${nextKelas(d.kelas)}
// Tinggal di kelas ${kelasPokok(d.kelas)}

// ❌ SALAH — versi lama yang sering muncul kembali
// function nextFase(f) { return f==='A'?'B':f==='B'?'C':'D'; }  ← JANGAN pakai ini
// nextFase(d.fase)   ← JANGAN, harus d.kelas
// Tinggal di kelas ${d.kelas}  ← JANGAN, harus kelasPokok(d.kelas)
```

**Kapan risiko meningkat:** Setiap kali blok helper functions di sekitar baris 524–531 `rapor/preview.html` diedit, atau saat copy-paste dari versi lama.

**Checklist wajib setelah mengubah `rapor/preview.html`:**
- [ ] Cari `function nextFase` — pastikan parameternya `kelas`, bukan `f` atau `fase`
- [ ] Cari `nextFase(d.` — pastikan argumennya `d.kelas`, bukan `d.fase` (harus ada di 2 tempat: screen + print)
- [ ] Cari `function kelasPokok` — pastikan fungsi ini masih ada
- [ ] Cari `Tinggal di kelas` — pastikan memakai `kelasPokok(d.kelas)`, bukan `d.kelas` mentah (harus ada di 2 tempat)
- [ ] Uji kasus: kelas 1→ harusnya "Fase A", kelas 2→ harusnya "Fase B", kelas 4→ harusnya "Fase C"
- [ ] Uji kasus tinggal: kelas "2B" → harus tampil "Tinggal di kelas 2" (tanpa huruf B)

---

### 6. Konten Terpotong di Batas Halaman — `rapor/preview.html` ⚠️ BERULANG 4×

**Mengapa berisiko:** `rapor/preview.html` menghasilkan HTML cetak via template string JavaScript. Setiap kali template CSS di-edit (untuk perbaikan tampilan, penyesuaian font, dll.), properti `break-inside` rawan terhapus atau terlupakan karena tidak terlihat efeknya di preview layar — hanya tampak saat dicetak atau di-PDF-kan.

**Riwayat pengulangan:**

| Kejadian | Pola penyebab |
|----------|---------------|
| Ke-1 s/d Ke-4 | Properti `break-inside: avoid` pada `.kok-box` hilang atau tidak ada saat print CSS diedit |

**Akar masalah:** CSS print template ada dalam template string JavaScript (baris ~737–821 di `rapor/preview.html`). Properti `break-inside` tidak terlihat efeknya di mode layar, sehingga mudah diabaikan saat refactor.

**Aturan wajib:** Tiga properti berikut pada `.kok-box` **tidak boleh dihapus** dalam kondisi apapun:

```css
/* WAJIB ADA — jangan hapus, lihat ANTIREGRESI §6 */
.kok-box {
  break-inside: avoid;         /* CSS modern — wajib */
  page-break-inside: avoid;    /* CSS lama — wajib untuk kompatibilitas */
}
```

**Mengapa dua properti?** `page-break-inside` adalah property lama yang masih dipakai browser berbasis Chromium versi tertentu. `break-inside` adalah standard W3C modern. Keduanya harus hadir bersamaan.

**Kapan risiko meningkat:** Setiap kali blok `/* ── Kokurikuler box ── */` di dalam template string `printHTML` diedit — baik untuk mengubah border, padding, font-size, maupun min-height.

**Checklist wajib setelah mengubah print CSS di `rapor/preview.html`:**
- [ ] Cari `.kok-box{` di dalam template string `printHTML` — pastikan ada `break-inside:avoid`
- [ ] Pastikan ada `page-break-inside:avoid` pada `.kok-box` yang sama
- [ ] Cek `.kok-header` masih memiliki `page-break-after:avoid` (agar header tidak terpisah dari box)
- [ ] Uji dengan data kokurikuler panjang (3+ kalimat): cetak ke PDF, periksa apakah teks terpotong di batas halaman

---

### 9. Pola Import Batch — Jangan Kembali ke Per-Row API Call di `penilaian/input-nilai.html`

**Mengapa berisiko:** Fitur import nilai (`eksekusiImport`) perlu menyimpan banyak baris sekaligus. Jebakan paling umum adalah menyalin kode dari `saveNilai` (yang menyimpan satu baris) dan menaruhnya di dalam loop — menghasilkan satu API call per baris. Untuk kelas dengan 30 siswa × 5 TP = 150 call, Google Sheets API mengembalikan HTTP **429 Too Many Requests** dan seluruh import gagal tanpa ada satu baris pun yang tersimpan.

**Akar masalah versi lama (v17 ke bawah):**
```javascript
// ❌ SALAH — per-row call di dalam loop → 429
for (const item of toImport) {
  for (const n of item.nilai) {
    await SHEETS.write('NILAI!A' + idx + ':K' + idx, [row]);  // N call
    await SHEETS.append('NILAI!A:K', [row]);                   // M call
  }
}
```

**Pola wajib sejak v18 (mengikuti `saveNilaiUSBatch`):**
```javascript
// ✅ BENAR — kumpulkan dulu, eksekusi batch setelah loop
const toUpdate = [];  // baris yang sudah ada
const toAppend = [];  // baris baru

for (const item of toImport) {
  for (const n of item.nilai) {
    if (existIdx > 1) {
      toUpdate.push(['NILAI!A' + (existIdx + 1) + ':K' + (existIdx + 1), [row]]);
    } else {
      toAppend.push(row);
      rows.push(row); // ← wajib: jaga local rows agar findIndex tidak duplikat
    }
  }
}

// Eksekusi satu kali setelah loop — maksimal 3 API call total
const CHUNK = 100;
for (let i = 0; i < toUpdate.length; i += CHUNK) {
  await SHEETS.valuesBatchWrite(toUpdate.slice(i, i + CHUNK));
}
if (toAppend.length) {
  await SHEETS.append('NILAI!A1', toAppend); // A1 anchor wajib
}
```

**Tiga invariant yang tidak boleh diubah:**

| Invariant | Mengapa |
|-----------|---------|
| `let _importSeq = 0` sebelum loop + `(_importSeq++).toString(36).padStart(3, '0')` di ID baru | Loop sinkron (tanpa await) membuat semua `Date.now()` bernilai sama dalam satu milidetik. Tanpa counter, hanya ada 36³ = 46.656 kombinasi random → birthday paradox memberi probabilitas tabrakan ~62% untuk kelas 30 siswa × 10 TP. ID duplikat menyebabkan data corruption silent. |
| `rows.push(row)` di cabang `toAppend` | Tanpa ini, iterasi berikutnya bisa salah menganggap baris yang baru di-push ke `toAppend` sebagai "tidak ada" jika ada duplikat di file import — menyebabkan duplikasi data di sheet |
| `SHEETS.valuesBatchWrite` untuk update, bukan loop `SHEETS.write` | Satu `batchUpdate` request menggantikan N request; Google Sheets API sudah mendukung ini via endpoint `values:batchUpdate` |
| `SHEETS.append('NILAI!A1', toAppend)` — bukan `'NILAI!A:K'` | Range `NILAI!A:K` menyebabkan API mencari batas tabel hanya di kolom A–K; jika ada data di luar K, append bisa nyasar. `!A1` memastikan pencarian mulai dari A1 |

**Kapan risiko meningkat:** Setiap kali `eksekusiImport` di `input-nilai.html` diedit untuk menambah kolom baru, mengubah logika kalkulasi, atau menyesuaikan filter baris.

**Checklist wajib setelah mengubah `eksekusiImport`:**
- [ ] Pastikan `let _importSeq = 0` ada **sebelum** loop (bukan di dalam loop)
- [ ] Pastikan ID baru menggunakan `(_importSeq++)` bukan `Math.random()` saja
- [ ] Pastikan tidak ada `await SHEETS.write(...)` atau `await SHEETS.append(...)` di dalam loop `for (const item of toImport)`
- [ ] Pastikan `toUpdate` dan `toAppend` masih ada sebagai array akumulator
- [ ] Pastikan `rows.push(row)` ada di cabang `toAppend` (bukan di cabang `toUpdate`)
- [ ] Pastikan eksekusi batch ada **setelah** kedua loop, bukan di dalamnya
- [ ] Uji dengan kelas yang memiliki banyak siswa (20+) dan banyak TP (5+) — import harus selesai tanpa error 429

---


### 10. Role Access `config-skl.html` — Guru Kelas 6 Harus Selalu Diizinkan

**Mengapa berisiko:** `config-skl.html` adalah satu-satunya tempat guru kelas 6 dapat mengatur bobot ujian sekolah. Jika role `guru_kelas` tidak ada di `AUTH.requireLogin`, guru akan diredirect ke halaman login tanpa pesan error yang jelas — tampaknya halaman "tidak ada" padahal sebenarnya akses ditolak.

**Akar masalah (v19):** Halaman dibuat hanya untuk `admin` di awal, kemudian fitur diperluas ke guru kelas 6 tetapi array role tidak diperbarui.

**Aturan wajib:**
```javascript
// ✅ Benar — guru_kelas harus selalu ada
const user = AUTH.requireLogin(['admin','guru_kelas']);

// ❌ Salah — menyebabkan guru kelas 6 diredirect ke login
const user = AUTH.requireLogin(['admin']);
```

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `ujian-sekolah/config-skl.html` | `AUTH.requireLogin(['admin','guru_kelas'])` |
| `dashboard/guru-kelas.html` | `'navConfigSKL'` di array `hasKelas6` |

**Checklist wajib setelah mengubah `config-skl.html` atau `dashboard/guru-kelas.html`:**
- [ ] Pastikan `AUTH.requireLogin` di `config-skl.html` masih mencantumkan `'guru_kelas'`
- [ ] Pastikan `'navConfigSKL'` masih ada di array `hasKelas6` di `dashboard/guru-kelas.html`
- [ ] Uji login sebagai `guru_kelas` yang mengampu kelas 6 → menu Konfigurasi SKL harus muncul di sidebar
- [ ] Uji login sebagai `guru_kelas` yang **tidak** mengampu kelas 6 → menu Konfigurasi SKL tidak boleh muncul

---

### 11. Bobot Ujian Sekolah — Satu Sumber Kebenaran di `config-skl.html`

**Mengapa berisiko:** `input-nilai-us.html` membaca bobot dari config SKL (`skl_bobot_us_tertulis`, `skl_bobot_us_praktik`) dan menerapkannya ke field tersembunyi. Jika ada input editable bobot di halaman ini, guru bisa mengubah bobot secara lokal tanpa tersimpan ke config — perubahan hilang saat refresh dan header tabel tidak sinkron dengan angka yang ditampilkan.

**Akar masalah (v19):** Input bobot yang bisa diedit ditinggalkan dari desain awal sebelum halaman Konfigurasi SKL dibuat. Setelah `config-skl.html` hadir, input ini seharusnya dihapus tetapi terlewat.

**Kontrak yang harus dijaga:**

| Elemen | Nilai yang benar | Yang salah |
|--------|-----------------|-----------|
| `#bobotTertulis` | `<input type="hidden">` — diisi dari config | `<input type="number">` yang bisa diedit pengguna |
| `#bobotPraktik` | `<input type="hidden">` — diisi dari config | `<input type="number">` yang bisa diedit pengguna |
| Display bobot | `<span id="bobotTertulisDisplay">` + `<span id="bobotPraktikDisplay">` — read-only | Input editable langsung |
| `updateBobot()` | Dipanggil setelah config diapply di `init()` | Hanya dipanggil via `oninput` yang sudah tidak ada |

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `ujian-sekolah/input-nilai-us.html` | `<input type="hidden" id="bobotTertulis">` — bukan `type="number"` |
| `ujian-sekolah/input-nilai-us.html` | `<input type="hidden" id="bobotPraktik">` — bukan `type="number"` |
| `ujian-sekolah/input-nilai-us.html` | `updateBobot();` tepat setelah blok `if (config['skl_bobot_us_praktik'])` di `init()` |

**Checklist wajib setelah mengubah area bobot di `input-nilai-us.html`:**
- [ ] Pastikan `#bobotTertulis` dan `#bobotPraktik` adalah `type="hidden"`, bukan `type="number"`
- [ ] Pastikan `updateBobot()` dipanggil setelah config diapply di `init()`
- [ ] Pastikan `getBobot()` masih membaca dari `document.getElementById('bobotTertulis').value` — tidak boleh hardcoded
- [ ] Uji: simpan bobot 70%/30% di Konfigurasi SKL → refresh halaman Input Nilai US → header kolom harus menampilkan `(70%)` / `(30%)`
- [ ] Pastikan `document.querySelectorAll('#tbodyUS tr')` di `updateBobot` tidak diubah ke selector lain (lihat ANTIREGRESI §5)

---

### 12. Akses SAJ untuk Guru Mapel — Jangan Kembali ke `!isTTGuru` di `dashboard/guru-mapel.html`

**Mengapa berisiko:** Kondisi `!isTTGuru` yang dulu dipakai untuk memblokir akses SAJ terlalu luas — ia memblokir guru mana pun yang mengajar tahsin-tahfizh, bahkan jika guru itu juga mengajar mapel lain (PAI, Bahasa Arab, KMH) di kelas 6. Ini adalah akar bug v20.

**Akar masalah (v20):** Asumsi awal salah — dikira guru TT tidak pernah sekaligus menjadi guru mapel reguler di kelas 6. Kenyataannya, guru PAI/B.Arab/KMH sering ikut mengampu tahsin-tahfizh.

**Pola yang salah dan sering kembali muncul:**
```javascript
// ❌ SALAH — memblokir guru TT yang juga punya mapel lain di kelas 6
if (!isTTGuru) {
  if (hasKelas6) { /* tampilkan SAJ menu */ }
}
```

**Pola yang benar sejak v20:**
```javascript
// ✅ BENAR — hanya blokir guru yang HANYA mengajar TT (tanpa mapel lain)
const isPureTTGuru = isTTGuru && mapelArr.every(m =>
  m.includes('tahsin') || m.includes('tahfizh') ||
  m === 'tt' || m === 'mp_tt' || m.endsWith('_tt') || m.startsWith('tt_') ||
  m === 'tahsin-tahfizh' || m.replace(/[^a-z]/g,'').includes('tahsin')
);
if (hasKelas6 && !isPureTTGuru) { /* tampilkan SAJ menu */ }
```

**Mengapa aman:** Filter mapel TT sudah dilakukan di `input-nilai-us.html` via `TAHSIN_KW` — TT tidak akan muncul di daftar mapel ujian sekolah meski guru memiliki TT di field `mapel`-nya.

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `dashboard/guru-mapel.html` | `isPureTTGuru` — jangan hapus atau ganti dengan `!isTTGuru` |
| `dashboard/guru-mapel.html` | `// ANTIREGRESI v20: jangan kembalikan ke !isTTGuru` — komentar penanda |

**Checklist wajib setelah mengubah logika SAJ di `dashboard/guru-mapel.html`:**
- [ ] Pastikan kondisi `isPureTTGuru` masih ada dan menggunakan pola `mapelArr.every(...)` bukan `isTTGuru` langsung
- [ ] Pastikan tidak ada `if (!isTTGuru)` yang membungkus blok SAJ menu
- [ ] Uji dengan akun guru yang mengajar PAI/B.Arab/KMH di kelas 6 sekaligus mengajar TT → menu SAJ **harus muncul**
- [ ] Uji dengan akun guru yang **hanya** mengajar TT (tanpa mapel lain) → menu SAJ **tidak boleh muncul**
- [ ] Uji dengan akun guru mapel non-TT di kelas 6 (PJOK, B.Indonesia, KKA) → menu SAJ tetap muncul seperti biasa

---

### 13. Halaman Edit Parsial — Gunakan Targeted Write, Bukan Overwrite Baris Penuh

**Mengapa berisiko:** Saat membuat halaman yang hanya mengedit *sebagian* kolom dari sebuah baris (misalnya hanya TTL dan NISN dari sheet SISWA yang punya 16 kolom), ada godaan untuk membaca baris penuh, memodifikasi beberapa kolom, lalu menulis kembali seluruh baris. Ini bermasalah karena:
- Kolom yang tidak diedit halaman ini bisa berbeda versinya antara `rawRowsCache` dan sheet aktual (admin mungkin mengedit saat guru sedang di halaman ini)
- Jika schema sheet berubah di masa depan (kolom ditambah menjadi A:Q misalnya), overwrite baris penuh akan memotong data kolom baru

**Pola yang salah (overwrite baris penuh):**
```javascript
// ❌ SALAH — menulis 16 kolom padahal hanya 5 yang diedit
const row = [id, nama, nis, nisn_baru, kelas, agama, alamat, ...dst];
await SHEETS.write(`SISWA!A${r}:P${r}`, [row]);
```

**Pola wajib sejak v21 (targeted write):**
```javascript
// ✅ BENAR — hanya tulis kolom yang memang diedit halaman ini
await SHEETS.valuesBatchWrite([
  [`SISWA!D${r}`,      [[fmtNum(data.nisn)]]],          // hanya kolom D
  [`SISWA!M${r}:O${r}`, [[tempat, tgl, wali]]],          // hanya kolom M–O
  [`SISWA!P${r}`,      [[data.no_peserta_ismuba]]],      // hanya kolom P
]);
```

**Keuntungan ganda:** (1) Kolom lain tidak bisa teroverwrite meski ada perbedaan versi cache. (2) Tetap bekerja jika sheet diperluas ke kolom Q, R, dst di masa depan.

**Kapan risiko meningkat:** Setiap kali membuat halaman baru yang mengedit subset kolom dari sheet SISWA, USERS, atau sheet master lain.

**Checklist wajib saat membuat halaman edit parsial:**
- [ ] Identifikasi kolom mana saja yang benar-benar diedit halaman ini
- [ ] Gunakan `valuesBatchWrite` dengan range per-kolom atau per-grup-kolom, bukan range penuh
- [ ] Jangan membaca baris penuh hanya untuk menulis kembali sebagian — gunakan cache
- [ ] Dokumentasikan di komentar kode: "halaman ini hanya menulis kolom X, Y, Z"

---

### 14. Cache-First Save — Jangan Re-read Sheet Saat Menyimpan

**Mengapa berisiko:** Pola umum yang terlihat "aman" adalah: sebelum menyimpan, baca sheet terbaru dulu untuk mendapatkan indeks baris yang akurat. Masalahnya:
- Request `SHEETS.read()` kedua dalam sesi yang sama bisa memicu error **403 Forbidden** jika Google Sheets API menganggap token sedang dalam konteks yang berbeda (terutama saat sesi OAuth sudah berjalan beberapa menit)
- Dua request berurutan (read + write) meningkatkan kemungkinan rate limit 429
- Saat save batch (banyak baris), setiap baris yang melakukan read sendiri menghasilkan N read + N write = 2N API calls

**Pola yang salah (re-read saat save):**
```javascript
// ❌ SALAH — SHEETS.read() dipanggil ulang di dalam fungsi save
async function simpanBaris(id) {
  const rows = await SHEETS.read('SISWA!A:P');  // ← re-read → bisa 403
  const idx  = rows.findIndex(r => r[0] === id);
  await SHEETS.write(`SISWA!A${idx+1}:P${idx+1}`, [row]);
}
```

**Pola wajib sejak v21 (cache-first):**
```javascript
// ✅ BENAR — cache dibaca sekali saat init, dipakai selamanya
let rawRowsCache = null;

async function muatData() {
  rawRowsCache = await SHEETS.read('SISWA!A:P');  // ← satu kali saja
  // ... render tabel ...
}

async function simpanBaris(id) {
  // Tidak ada SHEETS.read() di sini
  const idx = rawRowsCache.findIndex(r => String(r[0]||'').trim() === id);
  await SHEETS.valuesBatchWrite([...]);
  perbaruiCache(id, data);  // ← update cache setelah save
}
```

**Tiga aturan cache-first:**

| Aturan | Alasan |
|--------|--------|
| Baca sheet hanya sekali di `muatData()` atau `init()` | Mencegah 403 dari re-read berulang |
| Perbarui `rawRowsCache` setelah setiap save berhasil (`perbaruiCache`) | Menjaga cache tetap akurat tanpa harus re-read |
| Jika user klik "Muat Ulang", baru baca ulang sheet | Eksplisit dan terkontrol |

**Kapan re-read boleh dilakukan:**
- Hanya saat user secara eksplisit meminta muat ulang
- Bukan di dalam fungsi save, fungsi preview, atau handler event lain

**Penanda kode yang harus ada di `siswa/edit-siswa-kelas.html`:**

| Penanda | Keterangan |
|---------|------------|
| `rawRowsCache = await SHEETS.read('SISWA!A:P')` hanya di `muatData()` | Satu-satunya tempat read dilakukan |
| `// FIX: tidak ada SHEETS.read() di sini; pakai rawRowsCache` | Komentar wajib di `simpanBaris()` dan `simpanSemua()` |
| `perbaruiCache(id, data)` setelah setiap save berhasil | Menjaga cache sinkron tanpa re-read |

**Checklist wajib setelah mengubah `siswa/edit-siswa-kelas.html`:**
- [ ] Pastikan `SHEETS.read('SISWA!A:P')` **hanya ada** di fungsi `muatData()` — tidak di fungsi save manapun
- [ ] Pastikan `simpanBaris()` dan `simpanSemua()` menggunakan `cariIdxDiCache()` bukan `SHEETS.read()`
- [ ] Pastikan `perbaruiCache()` dipanggil setelah setiap save berhasil (per-baris maupun batch)
- [ ] Uji: simpan beberapa baris berturut-turut — tidak boleh ada error 403

---

### 15. Status Message Halaman Login — Wajib `style="display:none"` di HTML

**Mengapa berisiko:** Di `index.html`, dua elemen status memiliki kelas CSS yang sudah meng-override `display:none`:

```css
/* Di CSS global index.html */
.status-msg         { display: none; }   /* ← awalnya tersembunyi */
.status-msg.loading { display: flex; }   /* ← override ke flex! */
.status-msg.error   { display: flex; }   /* ← override ke flex! */
```

Jika elemen HTML sudah punya kelas `loading` atau `error` sejak halaman dimuat, keduanya **langsung terlihat** sebelum user menekan tombol apapun — muncul "Sedang memverifikasi akun Anda…" dan "Terjadi kesalahan." secara bersamaan.

**Penyebab terdeteksi v22:** Regresi visual ini muncul karena elemen HTML memiliki kelas lengkap sejak awal:
```html
<!-- ❌ SALAH — kelas loading/error langsung terpakai saat halaman dibuka -->
<div class="status-msg loading" id="statusLoading">
<div class="status-msg error"   id="statusError">
```

**Pola wajib sejak v22:**
```html
<!-- ✅ BENAR — inline style menimpa CSS, elemen tersembunyi saat pertama dibuka -->
<div class="status-msg loading" id="statusLoading" style="display:none;">
<div class="status-msg error"   id="statusError"   style="display:none;">
```

Inline style (`style="display:none"`) memiliki spesifisitas lebih tinggi dari class selector manapun, sehingga elemen tetap tersembunyi sampai JavaScript secara eksplisit memanggil `showLoading(true)` atau `showError(pesan)`.

**Penting:** Visibility kedua elemen ini HANYA boleh dikendalikan via fungsi JS `showLoading()` dan `showError()` di `index.html` — tidak dengan menambah/menghapus kelas dari JavaScript.

**Penanda wajib di `index.html`:**

| Penanda | Keterangan |
|---------|------------|
| `style="display:none;"` pada `#statusLoading` | Wajib ada. Tanpanya elemen tampil otomatis karena `.status-msg.loading { display:flex }` |
| `style="display:none;"` pada `#statusError` | Wajib ada. Tanpanya elemen tampil otomatis karena `.status-msg.error { display:flex }` |

**Catatan terkait COOP warning di console:**
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
Cross-Origin-Opener-Policy policy would block the window.parent call.
```
Warning ini berasal dari library Google Identity Services (GIS) saat mencoba berkomunikasi dengan popup OAuth-nya di browser yang menerapkan kebijakan COOP. Ini **bukan regresi dari kode aplikasi** — tidak ada yang bisa dilakukan dari sisi HTML/JS karena header COOP ditetapkan di level server/hosting. Warning ini bersifat informatif dan tidak memblokir proses login secara fungsional. Jangan pernah memodifikasi `auth.js` sebagai respons atas warning ini.

---

### 16. Alias Mapel Lintas Kurikulum — Jangan Andalkan Hanya pada `findMapelFuzzy`

**Mengapa berisiko:** SD Muhammadiyah menggunakan nama-nama mata pelajaran khas Muhammadiyah yang berbeda dari nama Kurikulum Merdeka resmi, meski merujuk pada ID mapel yang sama di database. Pasangan nama yang diketahui bermasalah:

| Nama di Kurikulum Merdeka (config SKL) | Nama di Muhammadiyah (label dokumen) |
|----------------------------------------|--------------------------------------|
| Pendidikan Agama Islam dan Budi Pekerti | Pendidikan Al-Islam |

**Mengapa `findMapelFuzzy` gagal pada kasus ini:**

`findMapelFuzzy` membuang stop words (`pendidikan`, `al`, `budi`, `pekerti`), lalu mencocokkan sisa kata. Untuk dua nama di atas, kata yang tersisa berbeda total (`"agama","islam"` vs `"al-islam"`) sehingga tidak ada irisan yang ditemukan.

**Pola wajib sejak v23 — alias search setelah fuzzy match gagal:**

Untuk setiap mapel yang nama Muhammadiyah-nya berbeda secara leksikal dari nama Kurikulum Merdeka, tambahkan langkah alias search **lokal** (bukan di `findMapelFuzzy`, karena fungsi itu digunakan banyak konteks):

```javascript
// Setelah findMapelFuzzy gagal (m === null):
if(!m && fieldKey === 'ismuba_pai'){
  m = allMapel.find(mp => {
    const n = mp.nama.toLowerCase();
    return n.includes('al-islam') ||
           n.includes('al islam') ||
           (n.includes('agama') && n.includes('islam'));
  });
}
```

**Yang TIDAK boleh dilakukan:**
- Mengubah `findMapelFuzzy` untuk menangani kasus ini — fungsi tersebut dipakai di banyak konteks dan perubahan bisa menimbulkan false positive di tempat lain
- Menambahkan `'agama'` atau `'islam'` ke daftar stop words — justru akan memperburuk match di konteks lain

**Penanda wajib di `ujian-sekolah/preview-ismuba.html`:**

| Penanda | Keterangan |
|---------|------------|
| Komentar `// ANTIREGRESI v23` di dalam `getNilaiISMUBA()` | Menjelaskan mengapa alias search diperlukan; jangan dihapus |
| Blok `if(!m && fieldKey==='ismuba_pai')` setelah `findMapelFuzzy` | Alias search wajib ada; menghapusnya mengembalikan bug nilai Al-Islam kosong |

**Checklist jika menambahkan mapel ISMUBA baru di masa depan:**
- [ ] Apakah nama mapel di Muhammadiyah berbeda dari nama di Kurikulum Merdeka?
- [ ] Jika ya, tambahkan alias search serupa untuk `ismuba_kmmd` dan `ismuba_arab` jika ternyata juga bermasalah
- [ ] Uji: buka preview-ismuba.html dengan siswa yang sudah ada nilai → pastikan ketiga nilai ISMUBA muncul

---

### 17. Halaman Read-Only SAJ — Formula `hitungNilaiUS` Harus Konsisten di Tiga Tempat

**Mengapa berisiko:** Formula `hitungNilaiUS(nt, np, bt, bp)` digunakan di tiga halaman berbeda untuk menghitung nilai akhir ujian sekolah dari komponen tertulis dan praktik:

| Halaman | Konteks penggunaan |
|---------|--------------------|
| `ujian-sekolah/generate-skl.html` | Nilai yang dicetak di dokumen SKL & ijazah |
| `ujian-sekolah/preview-skl.html` | Pratinjau nilai sebelum cetak |
| `ujian-sekolah/leger-us.html` | Leger rekap nilai per siswa per mapel |

Jika formula di salah satu halaman diubah tanpa menyamakan di tempat lain, akan terjadi inkonsistensi: nilai di leger berbeda dengan nilai di SKL yang sudah dicetak.

**Formula yang wajib identik di ketiga halaman:**
```javascript
function hitungNilaiUS(nt, np, bt, bp) {
  const hasT = nt !== null && nt !== undefined;
  const hasP = np !== null && np !== undefined;
  if (!hasT && !hasP) return null;
  if (!hasT) return np;
  if (!hasP) return nt;
  return (nt * bt / 100) + (np * bp / 100);
}
```

**Sumber bobot:** Selalu dari config SKL (`skl_bobot_us_tertulis`, default 60; `skl_bobot_us_praktik`, default 40). Jangan hardcode angka bobot di halaman manapun.

**Halaman `leger-us.html` bersifat READ-ONLY:**
Tidak boleh ada operasi write (`SHEETS.write`, `SHEETS.append`, `valuesBatchWrite`, `saveNilai*`) di halaman ini. Halaman ini hanya membaca `NILAI_US` dan `SISWA`.

**Penanda kumulatif wajib di `ujian-sekolah/leger-us.html`:**

| Penanda | Keterangan |
|---------|------------|
| Komentar `// ANTIREGRESI` di atas script | Mencantumkan sifat read-only dan sumber formula |
| `requireLogin(['admin', 'guru_kelas'])` | Bukan hanya `'guru_kelas'`; admin harus bisa akses |
| `navLegerUS` di array `hasKelas6` di `guru-kelas.html` | Wajib; menghapusnya menyebabkan menu muncul untuk semua guru |

**Checklist jika memperbarui formula bobot US di masa depan:**
- [ ] Ubah di `generate-skl.html` → `hitungNilaiUS`
- [ ] Ubah di `preview-skl.html` → `hitungNilaiUS` / `fmtTgl`
- [ ] Ubah di `leger-us.html` → `hitungNilaiUS`
- [ ] Pastikan sumber bobot tetap dari config, bukan hardcoded

---

### 18. Rename Halaman ISMUBA → TKA — Strategi Copy, Bukan Move

**Konteks:** Halaman `preview-ismuba.html` berfungsi ganda: dipakai untuk sertifikat TKA (Tes Kemampuan Akademik) ISMUBA, yang formatnya berbeda dari dokumen ISMUBA standar. Saat ini kedua dokumen menggunakan file yang sama, namun ke depan akan dipisah.

**Strategi yang digunakan (v25):**
- `preview-tka.html` = salinan `preview-ismuba.html` dengan label TKA dan tanpa border — **ini yang aktif digunakan**
- `preview-ismuba.html` = file asli dipertahankan utuh — **akan menjadi basis halaman ISMUBA baru**

**Yang TIDAK boleh dilakukan:**
- Menghapus `preview-ismuba.html` — file ini akan dipakai untuk halaman ISMUBA baru
- Menghapus `navISMUBA` dari array `hasKelas6` di `guru-kelas.html` — sudah disiapkan sebagai slot untuk halaman ISMUBA baru
- Mengubah isi logika/JS di `preview-tka.html` tanpa menyinkronkan perubahan ke `preview-ismuba.html` jika perubahan menyangkut data (misalnya perubahan cara ambil nilai, perubahan mapping mapel)

**Border di sertifikat TKA — dua jenis, perlakuan berbeda:**

| Elemen | CSS | Status v25 |
|--------|-----|------------|
| Frame kotak sekeliling halaman A4 | `border:1px solid #000` + `box-shadow:inset ...` pada `.cert-page` | ❌ **Dihapus** |
| Garis tabel nilai di dalam sertifikat | `border:1px solid #000` pada `.cert-tbl th/td` | ✅ **Dipertahankan** |

**Penanda wajib di `ujian-sekolah/preview-tka.html`:**

| Penanda | Keterangan |
|---------|------------|
| Komentar `/* ANTIREGRESI v25: border ... dihilangkan */` pada `.cert-page` | Mengingatkan bahwa tidak ada frame; jangan tambahkan kembali |
| `href="preview-tka.html"` pada nav-item active | Self-link wajib mengarah ke `preview-tka.html`, bukan `preview-ismuba.html` |

**Checklist saat halaman ISMUBA baru siap diaktifkan:**
- [ ] Buat/modifikasi `preview-ismuba.html` dengan template baru
- [ ] Aktifkan `navISMUBA` di `guru-kelas.html`: hapus `style="display:none;"` tidak perlu — sudah dihandle `hasKelas6`
- [ ] Hapus `style="opacity:.45;pointer-events:none;"` dari semua nav placeholder ISMUBA di 8 file nav
- [ ] Update ANTIREGRESI dan CHANGELOG

---

### 19. Syahadah ISMUBA — Dua `cert-page` per Siswa, Nilai Identik dengan TKA

**Struktur dokumen:** Setiap siswa menghasilkan 2 halaman cetak (2 elemen `.cert-page`):
- Halaman 1: Syahadah (identitas, kalimat lulus, tanda tangan)
- Halaman 2: Daftar Nilai (tabel 3 mapel, jumlah, rata-rata, tanda tangan)

**Nilai identik dengan `preview-tka.html`:**
Fungsi `getNilaiISMUBA()` di `preview-ismuba.html` harus selalu identik dengan yang ada di `preview-tka.html` — termasuk ANTIREGRESI v23 (alias search Al-Islam/PAI). Jika logika nilai diubah di salah satu, wajib disamakan di keduanya.

| File | Fungsi yang harus identik |
|------|--------------------------|
| `ujian-sekolah/preview-tka.html` | `getNilaiISMUBA()` + alias search v23 |
| `ujian-sekolah/preview-ismuba.html` | `getNilaiISMUBA()` + alias search v23 |

**Tidak ada border/frame pada cert-page:** Lihat §18 — berlaku juga untuk `preview-ismuba.html`.

**Config keys Syahadah (wajib ada di sheet CONFIG):**

| Key | Keterangan |
|-----|------------|
| `ismuba_pwm_nama` | Nama Pimpinan Wilayah Muhammadiyah |
| `ismuba_ketua_nama` | Nama Ketua Majelis Dikdasmen & PNF PWM |
| `ismuba_ketua_nbm` | NBM Ketua Majelis |
| `ismuba_tgl_mulai` | Tanggal mulai pelaksanaan TKA |
| `ismuba_tgl_selesai` | Tanggal selesai pelaksanaan TKA |
| `ismuba_tgl_ttd_hijri` | Tanggal tanda tangan dalam kalender Hijriah |
| `ismuba_tgl_ttd_masehi` | Tanggal tanda tangan dalam kalender Masehi |
| `ismuba_no_sertif_prefix` | Prefix nomor sertifikat |
| `ismuba_nama_sekolah` | Nama sekolah yang tercetak di dokumen ISMUBA |

Semua key ini disimpan dan dibaca via `SHEETS.getConfig()` / `SHEETS.saveConfig()` — tidak ada hardcode di JS.

**Penanda wajib di `ujian-sekolah/preview-ismuba.html`:**

| Penanda | Keterangan |
|---------|------------|
| `// ANTIREGRESI v26` di blok script | Menyebutkan sifat read-only dan sumber formula |
| `// ANTIREGRESI v23` di `getNilaiISMUBA()` | Alias search Al-Islam wajib dipertahankan |
| `border:none;box-shadow:none` pada `.cert-page` | Tidak ada frame halaman |

**Checklist jika mengubah `preview-ismuba.html` di masa depan:**
- [ ] Pastikan `getNilaiISMUBA()` tetap identik dengan `preview-tka.html`
- [ ] Pastikan tidak ada `SHEETS.write/append/valuesBatchWrite` di halaman ini
- [ ] Pastikan `border:none;box-shadow:none` pada `.cert-page` tidak dihapus
- [ ] Jika ada config key baru, tambahkan juga ke array `KEYS_TO_SAVE` di `config-skl.html`

---

### 20. `simpanTP()` di `input-nilai.html` — Pakai Batch, Bukan Per-Row Write ⚠️ BERULANG

**Mengapa berisiko:** `simpanTP()` adalah fungsi simpan utama untuk nilai SLM & SAS. Bug 400 ini pernah muncul, tampak sembuh sendiri (karena dicoba di sheet yang kecil), lalu muncul kembali saat sheet NILAI sudah besar (ribuan baris). Kodenya hampir identik dengan anti-pattern yang diperbaiki di `eksekusiImport` (v18/§9), namun terlewat saat itu.

**Dua lapisan masalah yang saling terkait:**

**Lapisan 1 — `write()` untuk INSERT baris baru:**

Google Sheets API `values.update` (HTTP PUT) hanya bekerja pada sel/baris yang **sudah teralokasi** di dalam sheet. Jika sheet NILAI hanya punya 4027 baris teralokasi, menulis ke baris 4028 via PUT → **HTTP 400 Bad Request**. Bug ini laten: tidak muncul di awal semester (sheet kecil), muncul setelah berbulan-bulan penggunaan.

`values.append` (HTTP POST, dipakai `SHEETS.append()`) **otomatis memperluas sheet** — tidak pernah 400 karena batas baris.

```javascript
// ❌ SALAH — KODE LAMA yang menyebabkan error 400
const nextNilaiRow = Math.max(rows.length + 1, 3);
await SHEETS.write('NILAI!A' + nextNilaiRow + ':K' + nextNilaiRow, [row]);
// Error: "Sheets write error 400: NILAI!A4028:K4028"
// Terjadi karena sheet tidak memiliki baris 4028 teralokasi.

// ✅ BENAR — pakai append() untuk baris baru (ANTIREGRESI §20)
toAppend.push(row);
// ...setelah loop:
await SHEETS.append('NILAI!A1', toAppend); // auto-extend sheet, tidak pernah 400
```

**Lapisan 2 — Per-item API call dalam loop:**

Memanggil `await SHEETS.write()` di dalam `for (const item of toSave)` menghasilkan N API call untuk N siswa. Identik dengan pola yang menyebabkan 429 di `eksekusiImport` (v18/§9).

**Pola wajib sejak v27 — batch identik dengan `eksekusiImport` (§9):**

```javascript
// Sebelum loop: siapkan akumulator
const toUpdate     = [];
const toAppend     = [];
const nilaiDBLocal = {};
let _saveSeq       = 0;  // counter ID unik — wajib (bukan Math.random)

for (const item of toSave) {
  const existIdx = rows.findIndex(...);

  if (item.hapus) {
    if (existIdx > 1) {
      toUpdate.push(['NILAI!A' + (existIdx+1) + ':K' + (existIdx+1), [Array(11).fill('')]]);
      rows[existIdx] = Array(11).fill('');
    }
    nilaiDBLocal[key] = null;
    continue;
  }

  if (existIdx > 1) {
    row[0] = rows[existIdx][0];
    toUpdate.push(['NILAI!A' + (existIdx+1) + ':K' + (existIdx+1), [row]]);
  } else {
    // Counter _saveSeq wajib — Date.now() identik di semua iterasi loop sinkron
    row[0] = 'NL' + Date.now().toString(36) + (_saveSeq++).toString(36).padStart(3,'0');
    toAppend.push(row);
    rows.push(row); // wajib: cegah duplikat findIndex di iterasi berikutnya
  }
  nilaiDBLocal[key] = { slm: item.slm, sas: item.sas };
}

// Eksekusi batch SETELAH loop — maks 2 API call total
const CHUNK = 100;
for (let i = 0; i < toUpdate.length; i += CHUNK) {
  await SHEETS.valuesBatchWrite(toUpdate.slice(i, i + CHUNK));
}
if (toAppend.length) {
  await SHEETS.append('NILAI!A1', toAppend); // A1 anchor wajib (lihat §3)
}

// Terapkan nilaiDB SETELAH batch berhasil (bukan di dalam loop)
for (const [key, val] of Object.entries(nilaiDBLocal)) {
  if (val === null) delete nilaiDB[key];
  else nilaiDB[key] = val;
}
```

**Perbedaan penting dengan `eksekusiImport` (§9):**

| Aspek | `eksekusiImport` (§9) | `simpanTP` (§20) |
|-------|----------------------|------------------|
| Scope ID counter | `_importSeq` | `_saveSeq` |
| Hapus data | Tidak ada | Ada — baris hapus juga masuk `toUpdate` dengan `Array(11).fill('')` |
| Scope nilaiDB | Langsung di dalam loop | Akumulasi `nilaiDBLocal`, terapkan setelah batch |

**Penanda kode wajib di `penilaian/input-nilai.html`:**

| Penanda | Keterangan |
|---------|------------|
| `const toUpdate = []; const toAppend = [];` **sebelum** `for (const item of toSave)` | Akumulator batch — wajib ada sebelum loop |
| `let _saveSeq = 0;` **sebelum** loop | Counter ID unik — wajib di luar loop |
| `// ANTIREGRESI §20: pakai append()...` di komentar blok else INSERT | Penanda wajib; mengingatkan alasan pakai append, bukan write |
| `rows.push(row)` di cabang INSERT (else) | Wajib — cegah duplikat findIndex iterasi berikutnya |
| `await SHEETS.append('NILAI!A1', toAppend)` **setelah** loop | Anchor A1 wajib; bukan `'NILAI!A:K'` atau tanpa anchor |
| Tidak ada `await SHEETS.write(...)` di dalam `for (const item of toSave)` | Wajib — per-row write → 400 atau 429 |

**Kapan risiko meningkat:** Setiap kali `simpanTP()` di `penilaian/input-nilai.html` diedit — untuk menambah kolom baru, mengubah logika perhitungan, atau menyesuaikan filter.

**Checklist wajib setelah mengubah `simpanTP()`:**
- [ ] Pastikan `toUpdate`, `toAppend`, `nilaiDBLocal`, dan `_saveSeq` dideklarasikan **sebelum** loop
- [ ] Pastikan tidak ada `await SHEETS.write(...)` atau `await SHEETS.append(...)` **di dalam** `for (const item of toSave)`
- [ ] Pastikan INSERT menggunakan `toAppend.push(row)` bukan `SHEETS.write()` ke nomor baris tertentu
- [ ] Pastikan `rows.push(row)` ada di cabang INSERT
- [ ] Pastikan eksekusi `valuesBatchWrite` dan `append('NILAI!A1', ...)` ada **setelah** loop
- [ ] Pastikan `nilaiDB` diperbarui dari `nilaiDBLocal` setelah batch berhasil, bukan di dalam loop
- [ ] Uji dengan kelas yang sudah punya banyak data nilai (semester sudah berjalan lama)
- [ ] Uji simpan SLM saja (tanpa SAS) → harus berhasil
- [ ] Uji simpan SLM + SAS sekaligus → harus berhasil
- [ ] Uji hapus nilai (kosongkan SLM) → harus berhasil tanpa error

---

### 21. Format SKL 2025/2026 — 1 Halaman, 8 Mapel, Nilai 2 Desimal, NIP, Nomor Surat 5-Bagian

**Mengapa berisiko:** Formatnya berubah total dari tahun sebelumnya. Bug nomor surat ini terjadi DUA KALI (v29 dan v30) karena:
1. `generate-skl.html` tidak ikut diperbarui saat format berubah di v29
2. `seq` di `preview-skl.html` berbasis `idx` dalam daftar filter, bukan posisi absolut

**Dua file yang HARUS selalu diperbarui bersamaan:**

| File | Fungsi kritis |
|------|---------------|
| `ujian-sekolah/preview-skl.html` | `loadPreview()` — nomor surat + format halaman cetak |
| `ujian-sekolah/generate-skl.html` | `generate()` — nomor surat + config reading + mapelFields |

**Invariant wajib sejak v30 — nomor surat:**

| Invariant | Alasan |
|-----------|--------|
| `seq` dari `allSiswa.findIndex(s => s.id === siswa.id)` **bukan** `idx` | `idx` selalu 0 saat preview/generate satu siswa → seq selalu `01` |
| `allSiswa` sudah terurut nama saat inisialisasi | Posisi absolut konsisten dengan urutan di dokumen resmi |
| `const noSurat = \`\${noKlas}/\${noBase}.\${seq}/\${noInst}/\${noBulan}/\${noTahun}\`` | Format 5-bagian Perwal Depok No.79/2019 — di **kedua** file |
| `skl_no_surat_suffix` **tidak boleh** diakses lagi (sudah dihapus dari KEYS_TO_SAVE) | Nilainya selalu kosong/undefined → fallback ke format lama yang salah |
| `skl_no_urut_awal` dibaca sebagai **base 3-digit tetap** (mis. `095`), bukan diincrement | `noUrutAwal + i` menghasilkan `096`, `097` — bukan `095.02`, `095.03` |

**Invariant wajib sejak v29 — format halaman:**

| Invariant | Alasan |
|-----------|--------|
| **Hanya 1 halaman cetak** (`pg2`, bukan `pg1+pg2`) | Halaman SKK (pg1) dihapus total per aturan 2025/2026 |
| **4 kriteria** di pembukaan SKL | Kriteria ke-4 = SK Kepala Sekolah wajib ada |
| **8 mapel saja** (PAI, PP, Bind, MTK, IPAS, SB, PJOK, BSund) | Bahasa Inggris/TIK/KKA sudah dihapus dari SKL |
| **Tanpa Kelompok A/B** di tabel nilai | Tidak ada pengelompokan per aturan baru |
| **Nilai 2 desimal dengan koma** (`v.toFixed(2).replace('.',',')`) | Format `86,90` bukan `87` |
| **Baris rata-rata di dalam tabel** (baris terakhir) | Bukan di luar tabel |
| **Header kolom = "Nilai"** (bukan "Nilai Ijazah") | Sesuai template resmi 2025 |
| **TTD: `Kota Depok, [tgl]`** (bukan `Ditetapkan di/Pada tanggal`) | Format resmi baru |
| **`NIP. [nip]`** (bukan `NBM. [nbm]`) | NIP kosong tampil sebagai `NIP. -` |

**Checklist wajib setelah mengubah nomor surat di SKL:**
- [ ] Perbarui `preview-skl.html` DAN `generate-skl.html` — tidak cukup satu file saja
- [ ] Di kedua file: `seq` harus dari `allSiswa.findIndex(s => s.id === ...)`, bukan `idx` atau `i`
- [ ] Di kedua file: tidak ada `skl_no_surat_suffix`, tidak ada `noUrutAwal + i`
- [ ] Uji preview **satu siswa** (siswa ke-3 misalnya) → nomor surat harus `095.03`, bukan `095.01`
- [ ] Uji preview **semua siswa** → nomor surat berurutan `095.01`, `095.02`, dst.
- [ ] Uji generate ZIP untuk **subset** siswa → nomor surat tetap berdasarkan posisi absolut

**Checklist wajib setelah mengubah format halaman cetak `preview-skl.html`:**
- [ ] Tidak ada `pg1` yang di-`appendChild` ke body (hanya `pg2`)
- [ ] 4 poin kriteria ada di pembukaan SKL
- [ ] Tidak ada `ml.grp` atau `lastGrp` atau `lastG2` di loop LAMP_DEF
- [ ] Nilai gunakan `.toFixed(2).replace('.',',')` bukan `Math.round()`
- [ ] Baris rata-rata (`lampRows`) ada sebagai `<tr>` terakhir setelah loop LAMP_DEF
- [ ] Header tabel = "Nilai" bukan "Nilai Ijazah"
- [ ] TTD menggunakan `kepsNIP` dengan prefix `NIP.`, bukan `kepsNBM`

**Checklist wajib setelah mengubah `config-skl.html`:**
- [ ] `KEYS_TO_SAVE` tidak mengandung `skl_no_surat_suffix`, `map_bing`, `map_tik`, `map_kka`
- [ ] `KEYS_TO_SAVE` mengandung `skl_no_kode_klas`, `skl_no_kode_instansi`, `skl_no_bulan`, `skl_tahun_skl`, `skl_kepsek_nip`
- [ ] `updatePreview()` membaca 5 komponen baru (bukan `no + sfx`)
- [ ] Field `skl_kepsek_nip` ada di form HTML

---

### Sebelum mengubah `assets/js/sheets.js`:
- [ ] Catat semua fungsi yang akan ditambah/dihapus/dipindah
- [ ] Siapkan perubahan blok `return { … }` yang sepadan

### Setelah mengubah `assets/js/sheets.js`:
- [ ] Verifikasi setiap `async function` (non-privat) tercantum di `return { … }`
- [ ] Cari di halaman HTML yang relevan: apakah ada `SHEETS.fungsiYangDiubah` yang dipanggil?
- [ ] Buka halaman di browser → buka DevTools Console → coba aksi simpan/muat data

### Setelah mengubah file HTML (penilaian / ujian-sekolah):
- [ ] Cek: apakah filter `currentUser.mapel` atau `currentUser.kelas` menggunakan split+includes, bukan `===`?
- [ ] Cek: apakah penanda kode anti-regresi (lihat tabel di atas) masih ada?
- [ ] Uji dengan akun `guru_mapel` yang mengampu lebih dari satu mapel/kelas
- [ ] Jika menyentuh `eksekusiImport` di `input-nilai.html`: pastikan tidak ada API call (`SHEETS.write`/`SHEETS.append`) di dalam loop — harus pakai pola batch `toUpdate`/`toAppend`. Lihat §9.

### 23. `bukaEdit` Wajib Memanggil `pilihRole(u.role, true)` — Bukan `pilihRole(u.role)` ⚠️

**Mengapa berisiko:** `pilihRole` memiliki dua mode eksekusi yang dikendalikan oleh parameter `fromEdit`:

```javascript
function pilihRole(role, fromEdit = false) {
  if (!fromEdit) {
    // Mode "klik user dari UI": bersihkan semua state pilihan lama
    kelasDipilih      = [];
    kelasMapelDipilih = [];
    mapelDipilih      = [];
  }
  // ... render checkbox menggunakan array di atas
}
```

**Akar masalah (v32):** `bukaEdit` menyiapkan tiga array state dari data guru, lalu memanggil `pilihRole(u.role)` tanpa argumen kedua. Karena `fromEdit` default ke `false`, `pilihRole` mengosongkan kembali semua array — termasuk yang baru saja diisi. `_forceRestoreCheckboxes()` yang dipanggil sesudahnya beroperasi pada array kosong sehingga tidak ada checkbox yang tercentang. Form edit guru selalu tampak kosong.

**Urutan bug (sebelum perbaikan):**
```
bukaEdit() sets kelasDipilih = ['2B']
bukaEdit() sets kelasMapelDipilih = []
bukaEdit() sets mapelDipilih = ['PAI','MTK']
pilihRole(u.role)  ← fromEdit=false → CLEAR semua array!
                     kelasDipilih = []  ← data hilang
                     mapelDipilih = []  ← data hilang
renderKelasCheckbox()  ← render dari array kosong → tidak ada yang dicentang
_forceRestoreCheckboxes()  ← loop dari array kosong → tidak ada yang di-restore
```

**Urutan benar (setelah perbaikan):**
```
bukaEdit() sets kelasDipilih = ['2B']
bukaEdit() sets mapelDipilih = ['PAI','MTK']
pilihRole(u.role, true)  ← fromEdit=true → TIDAK clear array
renderKelasCheckbox()  ← render dari kelasDipilih=['2B'] → '2B' tercentang ✅
_forceRestoreCheckboxes()  ← safety net whitespace → memperkuat centang ✅
```

**Pola yang salah (sering kembali):**
```javascript
// ❌ SALAH — pilihRole mengosongkan semua state yang baru diisi
pilihRole(u.role);
```

**Pola wajib sejak v32:**
```javascript
// ✅ BENAR
// ⚠️ ANTIREGRESI §23: wajib fromEdit=true — tanpa ini pilihRole akan clear ketiga array
// (kelasDipilih/kelasMapelDipilih/mapelDipilih) yang baru saja diisi dari data guru,
// menyebabkan form edit selalu kosong.
pilihRole(u.role, true);
```

**Kapan risiko meningkat:** Setiap kali `bukaEdit` di `setup/kelola-guru.html` diedit — untuk menambah field baru, mengubah urutan inisialisasi, atau ketika fungsi `pilihRole` direfactor.

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `setup/kelola-guru.html` | `pilihRole(u.role, true)` di dalam `bukaEdit` — bukan `pilihRole(u.role)` |
| `setup/kelola-guru.html` | Komentar `// ⚠️ ANTIREGRESI §23` di atas baris tersebut |

**Checklist wajib setelah mengubah `bukaEdit` atau `pilihRole` di `setup/kelola-guru.html`:**
- [ ] Pastikan `bukaEdit` memanggil `pilihRole(u.role, true)` — ada argumen `true`
- [ ] Pastikan komentar `⚠️ ANTIREGRESI §23` masih ada di atasnya
- [ ] Uji edit guru `guru_kelas` — kelas utama dan kelas tambahan harus tercentang sesuai data
- [ ] Uji edit guru `guru_mapel` — kelas yang diampu dan mapel harus tercentang sesuai data
- [ ] Uji edit guru `admin` — form nama/email/status terisi, tidak ada error
- [ ] Simpan tanpa mengubah apapun — data yang tersimpan harus identik dengan data sebelum edit
- [ ] Edit hanya nama/NBM/status (tidak ubah kelas/mapel) → kelas & mapel harus tetap tersimpan benar

---

### 24. Tanggal Rapor Berbasis Semester + Tingkatan Kelas — Gunakan `pilihTglRapor()` ⚠️

**Konteks:** Mulai v33, sistem mengenal dua tanggal penerimaan rapor yang berbeda untuk Semester II:

| Kondisi | Config key yang dipakai | Keterangan |
|---------|------------------------|------------|
| Semester I — semua kelas (1–6) | `tgl_rapor` | Seragam, tidak ada perkecualian |
| Semester II — Kelas 6 | `tgl_rapor` | Kelas 6 menerima rapor lebih awal (keperluan PPDB) |
| Semester II — Kelas 1–5 | `tgl_rapor_1_5` | Tanggal berbeda; fallback ke `tgl_rapor` jika kosong |

**Akar risiko:** Sebelum v33 hanya ada satu key `tgl_rapor`. Setelah v33, ada dua key. Jika kode yang mengambil tanggal **tidak memanggil `pilihTglRapor()`** dan langsung membaca `config['tgl_rapor']`, rapor Kelas 1–5 Semester II akan mencetak tanggal yang salah (tanggal milik Kelas 6).

**Fungsi wajib — identik di kedua file:**
```javascript
// ⚠️ ANTIREGRESI §24: Sem I semua kelas & Sem II Kelas 6 → tgl_rapor.
// Sem II Kelas 1–5 → tgl_rapor_1_5 (fallback tgl_rapor jika kosong).
// Jangan hardcode config['tgl_rapor'] langsung di titik cetak — gunakan fungsi ini.
function pilihTglRapor(cfg, kelas, semester) {
  const tingkatan = parseInt(String(kelas).replace(/[^0-9]/g, ''));
  if (semester === 'II' && tingkatan >= 1 && tingkatan <= 5) {
    return cfg['tgl_rapor_1_5'] || cfg['tgl_rapor'] || '';
  }
  return cfg['tgl_rapor'] || '';
}
```

**Pola yang salah (mudah kembali saat edit):**
```javascript
// ❌ SALAH — selalu pakai tanggal Kelas 6, Kelas 1–5 salah di Sem II
const tglRapor = config['tgl_rapor'] || '……………………';
```

**Pola wajib sejak v33:**
```javascript
// ✅ BENAR
// ⚠️ ANTIREGRESI §24: gunakan pilihTglRapor — jangan langsung config['tgl_rapor']
const tglRapor = pilihTglRapor(config, kelas, semester) || '……………………';
```

**Kapan risiko meningkat:**
- Setiap kali blok tanda tangan di `rapor/preview.html` atau `rapor/laporan-tt.html` diedit
- Jika ada file cetak baru yang ditambahkan (laporan naratif, rekap, dll.) dan mengambil tanggal dari config
- Jika `profil-sekolah.html` direfactor — pastikan `setValue`/`simpanBatch` untuk `tgl_rapor_1_5` tidak hilang

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/preview.html` | Fungsi `pilihTglRapor(cfg, kelas, semester)` dengan komentar §24 |
| `rapor/preview.html` | `pilihTglRapor(config, activeKelas, sem)` di assignment `tgl_rapor` pada `raporData` |
| `rapor/laporan-tt.html` | Fungsi `pilihTglRapor(cfg, kelas, semester)` dengan komentar §24 |
| `rapor/laporan-tt.html` | `pilihTglRapor(config, kelas, sem)` di `bukaJendelaCetak` |
| `setup/profil-sekolah.html` | `setValue('tgl_rapor_1_5', ...)` di blok load config |
| `setup/profil-sekolah.html` | `'tgl_rapor_1_5': getValue('tgl_rapor_1_5')` di `simpanBatch` semester |

**Checklist wajib setelah mengubah logika tanggal rapor:**
- [ ] Pastikan `pilihTglRapor` ada dan tidak diubah logika kondisinya tanpa alasan
- [ ] Uji Kelas 6, Sem. I → harus mencetak nilai `tgl_rapor`
- [ ] Uji Kelas 6, Sem. II → harus mencetak nilai `tgl_rapor`
- [ ] Uji Kelas 1 s.d. 5, Sem. I → harus mencetak nilai `tgl_rapor`
- [ ] Uji Kelas 1 s.d. 5, Sem. II, `tgl_rapor_1_5` terisi → harus mencetak nilai `tgl_rapor_1_5`
- [ ] Uji Kelas 1 s.d. 5, Sem. II, `tgl_rapor_1_5` **kosong** → harus fallback ke nilai `tgl_rapor`
- [ ] Uji preview rapor dan cetak rapor — keduanya harus menggunakan tanggal yang sama
- [ ] Uji laporan-tt — harus menggunakan tanggal yang sama dengan preview rapor untuk kelas yang sama

---

### 25. Guru TT di Tanda Tangan Wajib Difilter per Kelas — Gunakan `cariGuruTT()` ⚠️

**Konteks:** Sekolah memiliki lebih dari satu guru Tahsin-Tahfizh (TT), masing-masing mengajar kelas yang berbeda. Tanda tangan pada laporan TT harus menampilkan nama guru yang **mengajar kelas yang sedang dicetak**, bukan guru TT mana pun yang pertama ditemukan di sheet.

**Akar masalah (v34):** Kode lama melakukan `allUsersCache.find(u => ...)` satu kali di init time, mencari guru dengan mapel TT tanpa memeriksa kelas. Hasilnya disimpan ke `config['_nama_guru_tt']` — satu nilai global yang dipakai untuk semua kelas. Guru pertama di USERS sheet yang punya mapel TT selalu menang, apapun kelasnya.

Dua bug berlapis:
1. **Filter tidak ada:** `find` tidak memfilter `u.kelasList`, sehingga guru TT kelas lain (yang terdaftar lebih awal di sheet) selalu muncul
2. **Cache global stale:** `config['_nama_guru_tt']` di-set satu kali di init. Setelah admin mengubah kelas guru, nilai cache tidak berubah sampai halaman di-reload penuh

**Pola yang salah (mudah kembali):**
```javascript
// ❌ SALAH — cache global, tidak tahu kelas mana sedang dicetak
const guruTTUser = allUsersCache.find(u => {
  const m = (u.mapel || '').toLowerCase().split(',').map(s=>s.trim());
  return m.some(x => x.includes('tahsin') || ...);
});
config['_nama_guru_tt'] = guruTTUser.nama;  // cache global ← BUG

// ... lalu di bukaJendelaCetak ...
const guruTT = config['_nama_guru_tt'] || '—';  // ← pakai cache global tanpa tahu kelas
```

**Pola wajib sejak v35 (penyempurnaan dari v34):**

```javascript
// Di level modul:
// ⚠️ ANTIREGRESI §25: wajib dijaga agar lookup cariGuruTT bisa filter per kelas
let allUsersGlobal = [];  // diisi saat init, dipakai oleh cariGuruTT()

// Saat init — simpan seluruh user ke modul:
allUsersGlobal = allUsersCache;
// TIDAK lagi set config['_nama_guru_tt'] di sini

// Helper function:
// ⚠️ ANTIREGRESI §25 + §25-B: filter status nonaktif + mapel (identik isTTGuru) + kelasList/kelasMapelList
function cariGuruTT(allUsers, kelas) {
  return allUsers.find(u => {
    if ((u.status || '').toLowerCase() === 'nonaktif') return false;  // ← WAJIB
    const hasTT = (u.mapelList || []).some(x => {
      const lower = x.toLowerCase();
      return lower.includes('tahsin') || lower.includes('tahfizh') ||
             lower === 'tt' || lower === 'mp_tt' ||            // ← WAJIB: === 'tt'
             lower.endsWith('_tt') || lower.startsWith('tt_'); // ← WAJIB: startsWith
    });
    if (!hasTT) return false;
    if (!kelas) return true;  // fallback jika belum ada kelas terpilih
    // ⚠️ §25-B (v36): cek kelasList (kolom E) DAN kelasMapelList (kolom K).
    // guru_kelas yang merangkap TT di kelas lain → kelas TT ada di kolom K, bukan kolom E.
    // Contoh: wali kelas 2C (kelas=2C) yang mengajar TT di 2B → kelas_mapel=2B.
    // Sebelumnya hanya kelasList yang dicek → guru merangkap tidak pernah cocok.
    const allKelasGuru = [...(u.kelasList || []), ...(u.kelasMapelList || [])];
    return allKelasGuru.includes(kelas);  // ← WAJIB: spread dua kolom
  }) || null;
}

// Di bukaJendelaCetak — lookup per kelas saat cetak:
// ⚠️ ANTIREGRESI §25: cariGuruTT filter berdasarkan mapel+kelas —
// jangan config['_nama_guru_tt'] yang global tanpa filter kelas.
const guruTTUser = cariGuruTT(allUsersGlobal, kelas);
const guruTT    = guruTTUser?.nama  || '—';
const nbmGuruTT = guruTTUser?.nbm   || '';
```

**Kapan risiko meningkat:**
- Setiap kali bagian `bukaJendelaCetak` diedit — mudah tergoda kembali ke `config['_nama_guru_tt']` yang terlihat "lebih simpel"
- Jika ada refactor init yang menghapus `allUsersGlobal = allUsersCache`
- Jika `cariGuruTT` dipindah atau diganti dengan `find` inline tanpa filter kelas
- **Jika lookup kelas di `cariGuruTT` dikembalikan ke hanya `kelasList`** — guru_kelas merangkap (kelas TT di kolom K) tidak akan ditemukan lagi

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/laporan-tt.html` | `let allUsersGlobal = []` di level modul, komentar `⚠️ ANTIREGRESI §25` |
| `rapor/laporan-tt.html` | `allUsersGlobal = allUsersCache` di init (TANPA set `config['_nama_guru_tt']`) |
| `rapor/laporan-tt.html` | Fungsi `cariGuruTT(allUsers, kelas)` dengan komentar §25 dan §25-B |
| `rapor/laporan-tt.html` | `cariGuruTT(allUsersGlobal, kelas)` di `bukaJendelaCetak`, komentar `⚠️ ANTIREGRESI §25` |

**Checklist wajib setelah mengubah logika guru TT di `laporan-tt.html`:**
- [ ] Pastikan `allUsersGlobal` dideklarasi di level modul dan diisi di init
- [ ] Pastikan `config['_nama_guru_tt']` **tidak** di-set di mana pun
- [ ] Pastikan `cariGuruTT` menerima `kelas` sebagai parameter dan memfilter `u.kelasList` **DAN** `u.kelasMapelList`
- [ ] Pastikan `bukaJendelaCetak` memanggil `cariGuruTT(allUsersGlobal, kelas)` — bukan `config['_nama_guru_tt']`
- [ ] Uji dengan dua guru TT yang mengajar kelas berbeda (A dan B): cetak kelas A → nama guru A; cetak kelas B → nama guru B
- [ ] Uji guru_kelas yang merangkap TT di kelas lain (kelas utama ≠ kelas TT): nama harus muncul sesuai kelas TT
- [ ] Uji setelah admin mengubah kelas salah satu guru (tanpa reload) → nama harus sesuai kelas terpilih
- [ ] Uji dengan kelas tanpa guru TT terdaftar → harus muncul '—' (tidak crash)

---

### Umum:
- [ ] Perubahan apapun di `sheets.js` → update `CHANGELOG.md` dengan penanda kode di bagian 🔍
- [ ] Jika menemukan pola regresi baru → tambahkan ke dokumen ini

---

### 22. Level Ekskul di `buildSeksiEkskul` — Bukan Cek String `==='1'` ⚠️

**Mengapa berisiko:** Sistem ekskul menggunakan level integer 1–4 untuk mencatat capaian siswa:

| Level | Arti | Muncul di rapor? |
|-------|------|-----------------|
| 0 | Belum diisi | ❌ Tidak |
| 1 | Layak | ✅ Ya |
| 2 | Cakap | ✅ Ya |
| 3 | Mahir | ✅ Ya |
| 4 | Tidak Ikut | ❌ Tidak (eksplisit tidak mengikuti) |

**Akar masalah (v31):** Kondisi lama `r[4]==='1' || r[4]===1 || String(r[4]).toLowerCase()==='true'` hanya mencocokkan level Layak. Guru kelas 2B yang memasukkan capaian Angklung dengan level Cakap (2) atau Mahir (3) tidak bisa melihat ekskul tersebut di preview maupun cetak rapor. Kondisi ini tampak "masuk akal" secara sekilas (cek boolean/truthy), tapi sistem levelnya bukan boolean — ia integer 1–4.

**Pola yang salah (sering kembali):**
```javascript
// ❌ SALAH — hanya mencocokkan level 1 (Layak), melewatkan 2 dan 3
const row = eksSiswa.find(r => r[3] === e.id &&
  (r[4]==='1' || r[4]===1 || String(r[4]).toLowerCase()==='true'));
```

**Pola wajib sejak v31:**
```javascript
// ✅ BENAR — mencocokkan semua level "ikut" (Layak/Cakap/Mahir = 1/2/3)
// ⚠️ ANTIREGRESI §22: level disimpan sebagai integer 1–3 (ikut) atau 4 (Tidak Ikut) atau 0 (belum diisi).
// Jangan kembalikan ke cek r[4]==='1' — itu hanya mencocokkan Layak, melewatkan Cakap dan Mahir.
const row = eksSiswa.find(r => r[3] === e.id &&
  parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3);
```

**Kapan risiko meningkat:** Setiap kali `buildSeksiEkskul` di `rapor/preview.html` diedit — untuk menambah logika filter, mengubah format tampilan, atau menyesuaikan aturan jenis ekskul.

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/preview.html` | `parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3` di blok ekstrakurikuler `buildSeksiEkskul` |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §22` tepat sebelum filter level |

**Checklist wajib setelah mengubah `buildSeksiEkskul` di `rapor/preview.html`:**
- [ ] Pastikan kondisi level ekstrakurikuler menggunakan `parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3`
- [ ] Pastikan tidak ada cek `r[4]==='1'` atau `r[4]===1` atau `String(r[4])...==='true'`
- [ ] Uji dengan siswa yang memiliki ekskul pilihan di level Layak (1) → harus muncul di rapor
- [ ] Uji dengan siswa yang memiliki ekskul pilihan di level Cakap (2) → harus muncul di rapor
- [ ] Uji dengan siswa yang memiliki ekskul pilihan di level Mahir (3) → harus muncul di rapor
- [ ] Uji dengan siswa yang memiliki ekskul pilihan di level Tidak Ikut (4) → **tidak boleh** muncul di rapor
- [ ] Uji dengan siswa yang ekskul-nya belum diisi (level 0) → **tidak boleh** muncul di rapor
- [ ] Pastikan ekskul kokurikuler (Hizbul Wathan, Tapak Suci) tetap muncul untuk semua siswa, terlepas dari level

---

### 26. `addSiswa()` dan `getSiswa()` — Anchor `!A1` dan Kolom Sheet SISWA Harus Sinkron

**Mengapa berisiko:** Sheet `SISWA` memiliki kolom A–P (16 kolom), dengan kolom P berisi `no_peserta_ismuba`. Jika `addSiswa()` tidak menggunakan anchor `!A1` pada `append()`, data baru dapat ditulis ke posisi kolom yang acak — tidak pernah terbaca oleh `getSiswa()`. Masalah ini hanya terdeteksi secara operasional (siswa baru tidak muncul di daftar) dan tidak menghasilkan error JavaScript.

**Tiga kondisi yang harus selalu sinkron:**

| Kondisi | Nilai yang Benar |
|---------|-----------------|
| Range read di `getSiswa()` | `SISWA!A:P` (16 kolom, A–P) |
| Jumlah kolom di `row` dalam `addSiswa()` | 16 elemen (termasuk `no_peserta_ismuba` di indeks 15) |
| Range anchor `append` di `addSiswa()` | `SISWA!A1` — wajib anchor `!A1` (ANTIREGRESI §3) |

**Penyebab bug v37 — tiga kekurangan berlapis:**
1. `append('SISWA', [row])` tanpa anchor `!A1` → data ditulis ke kolom acak jika sheet punya data di kolom jauh
2. `row` hanya 15 elemen — kolom P (`no_peserta_ismuba`) tidak ikut disimpan
3. `getSiswa()` membaca `SISWA!A:O` (15 kolom) — kolom P tidak pernah dipopulasi

**Perbaikan (v37):**
```javascript
// getSiswa — baca A:P (bukan A:O)
const rows = await read('SISWA!A:P');
// ...
return siswa.map(r => ({
  // ... kolom lain ...
  no_peserta_ismuba: r[15] || '',  // kolom P
}));

// addSiswa — 16 elemen + anchor A1
const row = [
  id, siswa.nama, fmtNum(siswa.nis), fmtNum(siswa.nisn), siswa.kelas,
  siswa.agama, siswa.alamat, siswa.nama_ayah, siswa.nama_ibu,
  siswa.pekerjaan_ayah, siswa.pekerjaan_ibu, fmtNum(siswa.no_hp),
  siswa.tempat_lahir, siswa.tgl_lahir, siswa.nama_wali,
  siswa.no_peserta_ismuba || '',  // kolom P — wajib ada
];
await append('SISWA!A1', [row]);  // anchor A1 wajib (§3)
```

**Checklist wajib setiap kali schema sheet SISWA ditambah kolom baru:**
- [ ] Tambah kolom baru di `row` array `addSiswa()` di `sheets.js`
- [ ] Tambah mapping `r[N]` di return object `getSiswa()` di `sheets.js`
- [ ] Perbarui range read `getSiswa()` jika melewati kolom yang ada (`A:P` → `A:Q`, dst.)
- [ ] Perbarui `updateSiswa()` di `setup/data-siswa.html` (range write `SISWA!A${idx+1}:P${idx+1}` harus cocok)
- [ ] Perbarui hapus-siswa di `setup/data-siswa.html` (range kosongkan baris harus cocok)
- [ ] Pastikan `append` di `addSiswa()` selalu menggunakan anchor `SISWA!A1`

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` — `getSiswa` | `read('SISWA!A:P')` dan `r[15]` untuk `no_peserta_ismuba` |
| `assets/js/sheets.js` — `addSiswa` | `siswa.no_peserta_ismuba \|\| ''` sebagai elemen ke-16 di `row` |
| `assets/js/sheets.js` — `addSiswa` | `append('SISWA!A1', [row])` — anchor `A1` wajib |

---

### 27. `getSiswa()` Harus Mengurutkan Hasil Secara Abjad

**Mengapa berisiko:** `append()` selalu menulis baris baru di akhir sheet. Tanpa sort, urutan tampil mengikuti urutan fisik baris di Google Sheets — siswa yang ditambahkan belakangan (via tambah manual, impor, atau mutasi masuk) muncul di akhir atau awal tergantung dari posisi baris. Ini membingungkan guru yang terbiasa menemukan siswa berdasarkan urutan abjad.

**Aturan:** `getSiswa()` di `sheets.js` selalu mengurutkan hasil dengan `localeCompare('id')` setelah deduplikasi — sebelum `return`.

```javascript
// ✅ Benar — sort sebelum return
siswa.sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'id'));
return siswa.map(r => ({ ... }));
```

**Penanda kode yang harus ada:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` — `getSiswa` | `siswa.sort((a, b) => (a[1] \|\| '').localeCompare(b[1] \|\| '', 'id'))` tepat sebelum `return` |

**Catatan:** `leger-kelas.html` sebelumnya menambahkan `.sort()` sendiri setelah `getSiswa()` — ini menjadi redundan tapi tidak merusak setelah perbaikan ini. Tidak perlu dihapus.

---

### 28. `freshUser` Wajib Refresh `kelasList` dan `kelas_mapel` — Bukan Hanya `mapel` ⚠️

**Konteks:** Beberapa halaman membaca ulang data user dari sheet USERS saat init (`getUsers()`) untuk menghindari session cache yang basi. Pola ini menggunakan variabel `freshUser` untuk menimpa field `currentUser` dengan nilai terbaru dari sheet.

**Akar masalah (v39):** Pola `if (freshUser?.mapel) currentUser.mapel = freshUser.mapel` hanya me-refresh field `mapel`. Field `kelasList` dan `kelas_mapel` — yang dipakai oleh `isiDropdownKelas()` untuk menentukan kelas mana yang boleh dipilih guru — **tidak ikut di-refresh**. Akibatnya:

- Guru `guru_mapel` TT yang kelas ajarnya baru diubah admin tetap mendapat `kelasList` dari session login lama.
- `isiDropdownKelas()` memfilter kelas berdasarkan `currentUser.kelasList` yang sudah basi → dropdown kosong atau tidak berisi kelas yang benar → laporan tidak bisa dibuka.
- Bug ini tidak terdeteksi setelah login pertama (session masih fresh), tapi muncul jika guru sudah login lama dan admin mengubah kelas di sheet USERS tanpa meminta guru logout-login ulang.

**File yang terkena:** `rapor/laporan-tt.html` (dampak utama: dropdown kelas kosong) dan `dashboard/guru-mapel.html` (dampak: `hasKelas6` untuk menu SAJ pakai data lama).

**Pola yang salah:**
```javascript
// ❌ SALAH — hanya mapel yang di-refresh, kelasList masih dari session lama
const freshUser = allUsersCache.find(u => u.email === currentUser.email);
if (freshUser?.mapel) currentUser.mapel = freshUser.mapel;
// isiDropdownKelas() dipanggil setelah ini → pakai currentUser.kelasList LAMA
```

**Pola wajib sejak v39:**
```javascript
// ✅ BENAR — refresh semua field yang dipakai untuk filter akses
const freshUser = allUsersCache.find(u => u.email === currentUser.email);
if (freshUser?.mapel)      currentUser.mapel      = freshUser.mapel;
// ⚠️ ANTIREGRESI §28: WAJIB refresh kelasList dan kelas_mapel, bukan hanya mapel.
if (freshUser?.kelasList)  currentUser.kelasList  = freshUser.kelasList;
if (freshUser?.kelas_mapel !== undefined) {
  currentUser.kelas_mapel    = freshUser.kelas_mapel;
  currentUser.kelasMapelList = freshUser.kelasMapelList || [];
}
```

**Kapan risiko meningkat:**
- Setiap kali menambah pola `freshUser` di halaman baru — mudah menyalin hanya satu baris refresh
- Jika ada refactor yang memisahkan init dari `isiDropdownKelas()` / filter akses kelas
- Jika ditambahkan field baru di USERS sheet yang mempengaruhi akses → harus ikut di-refresh

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/laporan-tt.html` | Tiga baris refresh: `currentUser.mapel`, `currentUser.kelasList`, `currentUser.kelas_mapel/kelasMapelList` setelah `freshUser` ditemukan |
| `rapor/laporan-tt.html` | Komentar `// ⚠️ ANTIREGRESI §28` di blok refresh freshUser |
| `dashboard/guru-mapel.html` | Idem — tiga baris refresh dengan komentar `// ⚠️ ANTIREGRESI §28` |

**Checklist wajib setelah mengubah pola `freshUser`:**
- [ ] Pastikan `mapel`, `kelasList`, `kelas_mapel`, dan `kelasMapelList` semua di-refresh
- [ ] Pastikan `isiDropdownKelas()` dipanggil SETELAH blok refresh selesai
- [ ] Uji: login → admin ubah kelas guru di sheet → buka halaman (tanpa logout-login) → dropdown harus menampilkan kelas terbaru
- [ ] Uji guru_mapel TT yang baru saja ditambahkan ke kelas baru oleh admin → kelas baru harus tampil di dropdown

---

**Catatan tambahan (v39):** Ditemukan juga ketidakkonsistenan `isTTGuru()` antara `laporan-tt.html` dan `guru-mapel.html`. `laporan-tt.html` tidak memiliki alias `m === 'tahsin-tahfizh'` dan `m.replace(/[^a-z]/g,'').includes('tahsin')` yang ada di `guru-mapel.html`. Meski tidak langsung menyebabkan bug (karena `m.includes('tahsin')` sudah menangkap sebagian besar format), pola berbeda di dua file rawan menyebabkan edge case. Kedua fungsi diseragamkan di v39. Lihat juga §25 untuk checklist `cariGuruTT`.

---

### 29. `materiLulus` di `buildLaporanQuran` Wajib Expand JSON Array — Bukan `.map(s=>s.materi)` ⚠️ BERULANG

**Konteks:** Satu baris setoran TT dapat menyimpan banyak materi hafalan sekaligus. Format kolom `materi` di sheet SETORAN_TT bisa berupa key tunggal (`"al-nas_1-6"`) **atau** JSON array (`'["al-nas_1-6","al-falaq_1-5","al-masad_1-5",...]'`). Satu setoran dengan banyak materi terjadi ketika guru mencentang beberapa materi sekaligus di `input-setoran-tt.html`.

**Akar masalah (v40):** `buildLaporanQuran` di `rapor/laporan-tt.html` membangun `materiLulus` dengan:
```javascript
// ❌ SALAH — tidak expand JSON array
const setoranLulus = setoran.filter(s => s.status_hafalan === 'lulus');
const materiLulus  = new Set(setoranLulus.map(s => s.materi));
```
Jika `s.materi = '["al-nas_1-6","al-falaq_1-5",...]'`, maka Set berisi **string JSON mentah**, bukan key individual. Akibatnya `materiLulus.has("al-nas_1-6")` selalu `false` → `targetDicapai = []` → progress hafalan 0/N (0%) → semua detail target tampil `—`, meski siswa sudah menyetor seluruh target.

**Pola yang sudah benar di `input-setoran-tt.html`** (penanda §11 — lihat juga baris 739–749):
```javascript
// ✅ BENAR — expand JSON array, identik dengan input-setoran-tt.html
const materiLulus = new Set();
setoran.filter(s => s.status_hafalan === 'lulus').forEach(s => {
  const m = s.materi || '';
  if (m.startsWith('[')) {
    try { JSON.parse(m).forEach(k => materiLulus.add(k)); } catch(e) { materiLulus.add(m); }
  } else if (m) {
    materiLulus.add(m);
  }
});
```

**Dampak visual:** Progress hafalan menampilkan `0 / N (0%)` dan semua item di "Detail target hafalan" menampilkan `—`, meski siswa sudah menyetor dan lulus seluruh target semester.

**Kapan risiko meningkat:**
- Setiap kali ada refactor `buildLaporanQuran` — pola `.map(s=>s.materi)` lebih "simpel" dan mudah kembali dipakai
- Jika ada copy-paste dari bagian `buildLaporanIqro` yang tidak membutuhkan expand (Iqro tidak punya target hafalan)
- Jika format penyimpanan materi di `input-setoran-tt.html` berubah di masa depan, logika expand di sini harus ikut disesuaikan

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/laporan-tt.html` | `materiLulus` dibangun dengan `forEach` + expand `startsWith('[')`, komentar `// ⚠️ ANTIREGRESI §29` |
| `rapor/laporan-tt.html` | Tidak ada `new Set(setoranLulus.map(s => s.materi))` di `buildLaporanQuran` |

**Checklist wajib setelah mengubah logika materiLulus:**
- [ ] Pastikan expand `startsWith('[')` ada sebelum `materiLulus.add(m)`
- [ ] Pastikan `targetDicapai` dihitung dari `materiLulus` hasil expand, bukan dari `setoranLulus.map`
- [ ] Uji dengan setoran multi-materi (satu baris setoran berisi banyak materi) → progress harus terhitung benar
- [ ] Uji dengan setoran single-materi → tetap benar (tidak rusak)
- [ ] Uji kelas tanpa setoran sama sekali → harus tampil 0/N (0%) tanpa error

---

### 30. `getUsers()` di `sheets.js` — `kelasList` Wajib Gabungan Kolom E + K, Identik dengan `auth.js` ⚠️ KRITIS

**Konteks:** `kelasList` adalah field kunci yang menentukan kelas mana saja yang boleh dipilih guru di `isiDropdownKelas()`. Field ini dibangun di dua tempat: (1) `auth.js` saat guru login, (2) `getUsers()` di `sheets.js` saat halaman me-refresh data user.

**Akar masalah (v43):** `getUsers()` di `sheets.js` membangun `kelasList` hanya dari kolom E:

```javascript
// ❌ SALAH — kelasList hanya kolom E, kelas tambahan (kolom K) tidak ikut
kelasList: r[4] ? String(r[4]).split(',').map(s=>s.trim()).filter(Boolean) : [],
```

Sedangkan `auth.js` membangun `kelasList` sebagai gabungan kolom E + K:

```javascript
// Di auth.js — kelasList = gabungan E + K
const kelasListGabung = [...new Set([...kelasUtamaArr, ...kelasMapelArr])];
```

Ketika fix §28 diterapkan (v39), `freshUser.kelasList` dari `getUsers()` mulai digunakan untuk menimpa `currentUser.kelasList` dari session. Akibatnya `guru_kelas` yang mengajar TT di kelas tambahan (kolom K) kehilangan kelas tambahan tersebut dari `kelasList` — karena `freshUser.kelasList` hanya berisi kolom E.

**Dampak konkret (v43):** Nisya El Salsabila (`guru_kelas`) mengajar TT di kelas lain (kolom K). Saat membuka `laporan-tt.html`, `freshUser.kelasList` menimpa `kelasList` session dengan versi yang hanya berisi kelas utama (kolom E). `isiDropdownKelas()` memakai `kelasList` tersebut → kelas TT tambahan tidak muncul di dropdown → tidak bisa cetak laporan kelas tersebut.

**Pola wajib sejak v43 di `sheets.js` `getUsers()`:**

```javascript
// ✅ BENAR — identik dengan auth.js: gabungan kolom E + kolom K
kelasList: (() => {
  const e = r[4] ? String(r[4]).split(',').map(s=>s.trim()).filter(Boolean) : [];
  const k = kelasMapelRaw ? kelasMapelRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  return [...new Set([...e, ...k])];
})(),
```

**Invariant yang HARUS selalu terjaga:**

> `getUsers().kelasList` ≡ `auth.js kelasList` ≡ `[...kolom E, ...kolom K]` (deduplikasi)

Setiap kali salah satu diubah, yang lain **wajib** disesuaikan.

**Kapan risiko meningkat:**
- Jika ada refactor `getUsers()` yang menyederhanakan field-field user
- Jika `auth.js` diubah cara membangun `kelasList` tapi `sheets.js` tidak ikut
- Jika ada penambahan kolom baru di sheet USERS yang mempengaruhi akses kelas

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` | `kelasList` dibangun dengan IIFE gabungan `e` (kolom E) + `k` (kelasMapelRaw) dengan `new Set`, komentar `// ⚠️ ANTIREGRESI §30` |
| `assets/js/auth.js` | `kelasList` = `[...new Set([...kelasUtamaArr, ...kelasMapelArr])]` — pastikan identik dengan `sheets.js` |

**Checklist wajib setelah mengubah logika `kelasList`:**
- [ ] Pastikan `getUsers()` dan `auth.js` menghasilkan `kelasList` yang identik untuk data yang sama
- [ ] Uji `guru_kelas` yang punya kelas TT di kolom K → dropdown harus menampilkan kelas dari kolom E **dan** kolom K
- [ ] Uji `guru_mapel` biasa → tidak berubah
- [ ] Uji `admin` → tidak berubah (admin tidak difilter oleh `kelasList`)

---

### 31. Pencarian Wali Kelas Wajib Pakai Kolom E (`kelas`), Bukan `kelasList` ⚠️

**Konteks:** Wali kelas adalah satu-satunya `guru_kelas` yang **kelas utamanya** (kolom E) adalah kelas yang bersangkutan. Seorang `guru_kelas` bisa mengajar mapel di kelas lain sebagai guru mapel merangkap — kelas-kelas tambahan itu tersimpan di kolom K.

**Akar masalah (v44):** Setelah fix §30 (v43), `getUsers().kelasList` = gabungan kolom E + K. `preview.html` mencari wali kelas dengan:

```javascript
// ❌ SALAH — kelasList mencakup kelas tambahan (kolom K)
users.find(u =>
  u.role === 'guru_kelas' &&
  (u.kelasList?.includes(activeKelas) || u.kelas?.includes(activeKelas)) &&
  u.status === 'aktif'
)
```

Bu April (`guru_kelas` 4B, mengajar Al-Islam di 4A via kolom K) punya `kelasList = ["4B","4A","4C"]`. `kelasList.includes("4A")` = `true` → Bu April muncul sebagai wali kelas 4A, padahal wali 4A adalah Bu Wilis.

**Pola wajib sejak v44:**

```javascript
// ✅ BENAR — hanya cocokkan dari kolom E (field kelas)
users.find(u =>
  u.role === 'guru_kelas' &&
  u.kelas?.split(',').map(s => s.trim()).includes(activeKelas) &&
  u.status === 'aktif'
)
```

**Aturan umum:** Untuk mencari **wali/penanggung jawab** suatu kelas, selalu gunakan field `kelas` (kolom E). Untuk menentukan **hak akses** guru ke suatu kelas, gunakan `kelasList` (kolom E + K).

| Tujuan | Field yang digunakan |
|--------|---------------------|
| Siapa wali kelas X? | `u.kelas` (kolom E) |
| Apakah guru boleh akses kelas X? | `u.kelasList` (kolom E + K) |

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/preview.html` | `users.find()` untuk wali kelas memakai `u.kelas?.split(',').map(s=>s.trim()).includes(activeKelas)` — **bukan** `u.kelasList` |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §31` di blok pencarian wali kelas |

**Checklist wajib:**
- [ ] Setiap query "siapa wali kelas X" → gunakan `u.kelas`, bukan `u.kelasList`
- [ ] Uji kelas yang walikelas-nya berbeda dari guru mapel merangkap di kelas yang sama → wali kelas tampil benar
- [ ] Setelah ada perubahan di `getUsers()` yang mempengaruhi `kelasList` → audit semua `users.find(…guru_kelas…)` untuk memastikan tidak ada yang pakai `kelasList`

---

### 32. `cariGuruTT()` — Kolom K sebagai Pembatas Kelas TT untuk `guru_mapel` Multi-Mapel ⚠️

**Konteks:** `cariGuruTT()` mencocokkan guru TT untuk suatu kelas berdasarkan `hasTT` (mapel mengandung TT) dan kelas. Masalah muncul ketika seorang `guru_mapel` mengajar **lebih dari satu mapel** dan TT **hanya di sebagian kelas**.

**Akar masalah:** Skema sheet USERS tidak bisa merepresentasikan "mapel X di kelas A, mapel Y di kelas B" secara terpisah. Kolom E (`kelas`) berisi semua kelas yang diampu, kolom F (`mapel`) berisi semua mapel — tanpa relasi per-kelas. Akibatnya `cariGuruTT()` yang hanya cek `hasTT + kelas ∈ kelasList` akan false-match guru yang mengajar TT di kelas A tetapi juga mengajar mapel lain di kelas B (bukan TT).

**Contoh (v45):** Pak Indra: `kelas = "1A,1B,3A"`, `mapel = "al-islam,tahsin-tahfizh"`.
- `hasTT` = true → lanjut
- `kelas ∈ kelasList` untuk "3A" → true → Pak Indra muncul sebagai guru TT kelas 3A ❌
- Yang benar: Pak Rizki adalah guru TT kelas 3A

**Solusi (tanpa mengubah skema sheet):** Manfaatkan kolom K (`kelas_mapel`) sebagai **pembatas kelas TT** untuk `guru_mapel`. Semantik kolom K per role:

| Role | Makna kolom K |
|------|--------------|
| `guru_kelas` | Kelas tambahan tempat guru mengajar sebagai guru mapel |
| `guru_mapel` | Kelas khusus TT (subset dari kolom E); jika kosong → semua kelas E adalah kelas TT |

**Logika `cariGuruTT()` sejak v45:**
```javascript
if (u.role === 'guru_kelas') {
  // TT di kelas utama (E) dan/atau kelas tambahan (K) — pakai gabungan
  kelasGuru = [...kelasList, ...kelasMapelList];
} else { // guru_mapel
  kelasGuru = (kelasMapelList.length > 0)
    ? kelasMapelList   // kolom K diisi → ini adalah kelas TT yang dibatasi admin
    : kelasList;       // kolom K kosong → semua kelas E = kelas TT (TT murni)
}
```

**Cara pengisian data (di kelola-guru.html):** Saat `guru_mapel` memilih mapel yang mengandung TT dan kelas > 1, muncul seksi "Kelas Khusus Tahsin-Tahfizh" (opsional). Admin memilih subset kelas yang benar-benar diampu TT. Nilai tersimpan ke kolom K.

**Skenario lengkap:**

| Guru | Role | Kelas (E) | Mapel (F) | Kelas TT (K) | cariGuruTT("3A") | cariGuruTT("1A") |
|------|------|-----------|-----------|--------------|-------------------|-------------------|
| Pak Indra | guru_mapel | 1A,1B,3A | al-islam,tt | 1A,1B | ❌ tidak match | ✅ match |
| Pak Rizki | guru_mapel | 3A | tt | (kosong) | ✅ match | ❌ tidak match |
| Nisya | guru_kelas | 2C | tt | 2B | ❌ tidak match | ❌ tidak match |

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/laporan-tt.html` | `cariGuruTT()` memiliki cabang `if (u.role === 'guru_kelas')` dan `else` dengan komentar `// §32` |
| `setup/kelola-guru.html` | Fungsi `renderKelasTTSeksi()`, `renderKelasTTCheckbox()`, `toggleKelasTT()` ada dan dipanggil dari `toggleMapelCheck()` dan `toggleKelasCheck()` |
| `setup/kelola-guru.html` | `simpanGuru()`: `kelas_mapel` untuk `guru_mapel` = `kelasTTDipilih.join(',')` |

---

### 34. `leger-guru-mapel.html` — `guru_kelas` Merangkap Harus Diizinkan, Kelas dari Kolom K Saja ⚠️

**Konteks:** Banyak guru kelas (role = `guru_kelas`) yang juga mengajar mata pelajaran bidang studi di kelas lain. Data ini tersimpan di: kolom F (`mapel`) = mapel yang diajarkan, kolom K (`kelas_mapel`) = kelas tempat mengajar mapel tersebut.

**Akar masalah (v54):** `leger-guru-mapel.html` awalnya hanya mengizinkan `requireLogin('guru_mapel')`. `guru_kelas` ditolak meskipun secara fungsional memiliki tanggung jawab yang sama sebagai guru bidang studi di kelas lain.

**Dua aturan wajib yang harus selalu berjalan bersamaan:**

1. **Akses halaman:** `requireLogin(['guru_mapel', 'guru_kelas'])` — kedua role diizinkan.

2. **Kelas yang tersedia di dropdown berbeda per role:**

| Role | Kelas di dropdown `leger-guru-mapel.html` | Alasan |
|------|------------------------------------------|--------|
| `guru_mapel` | `kelasList` (kolom E + K) | Semua kelas yang diampu |
| `guru_kelas` | `kelasMapelList` (kolom K saja) | Kolom E = kelas wali → bukan ranah leger mapel; sudah ada di `leger-kelas.html` |

**Jika `guru_kelas` punya kolom K kosong:** Guru tidak punya kelas mapel tambahan → tampilkan pesan informatif dan link kembali ke dashboard, jangan tampilkan dropdown kosong.

**Menu di sidebar:** `navLegerMapel` di `guru-kelas.html` muncul hanya jika `kelasMapelList.length > 0 && mapelBidStudi.length > 0`. Jangan tampilkan menu ini untuk semua guru kelas secara default.

**Pola wajib:**
```javascript
// requireLogin
currentUser = AUTH.requireLogin(['guru_mapel', 'guru_kelas']);

// Logika kelas per role
if (currentUser.role === 'guru_kelas') {
  allKelasGuru = currentUser.kelasMapelList || [];  // kolom K saja
} else {
  allKelasGuru = currentUser.kelasList || [];        // E + K
}

// Guard kolom K kosong untuk guru_kelas
if (currentUser.role === 'guru_kelas' && allKelasGuru.length === 0) {
  // Tampilkan pesan — jangan lanjutkan
  return;
}
```

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/leger-guru-mapel.html` | `requireLogin(['guru_mapel', 'guru_kelas'])` |
| `rapor/leger-guru-mapel.html` | Cabang `if (currentUser.role === 'guru_kelas')` untuk `allKelasGuru` — hanya kolom K |
| `rapor/leger-guru-mapel.html` | Guard `allKelasGuru.length === 0` dengan pesan informatif |
| `rapor/leger-guru-mapel.html` | `dashHref` kondisional untuk link Dashboard dan topbar |
| `dashboard/guru-kelas.html` | `navLegerMapel` dengan `style="display:none"` + JS kondisional §34 |

**Checklist setelah mengubah akses `leger-guru-mapel.html`:**
- [ ] Guru kelas dengan kolom K berisi → bisa masuk, dropdown kelas = isi kolom K
- [ ] Guru kelas dengan kolom K kosong → pesan informatif, tidak error
- [ ] Guru mapel → perilaku tidak berubah, kelas dari kelasList (E+K)
- [ ] Sidebar guru-kelas: menu muncul hanya jika ada kelas mapel + mapel bukan "semua"
- [ ] Link Dashboard mengarah benar ke masing-masing dashboard role

---

### 35. `id_siswa` Alumni HARUS Identik dengan `id_siswa` di SISWA Sebelum Dihapus ⚠️ KRITIS

**Konteks:** Saat siswa kelas 6 lulus, identitasnya dipindahkan dari sheet `SISWA` ke sheet `ALUMNI` baru via `luluskanSiswa()`. Seluruh riwayat nilai siswa tersebut (`NILAI`, `KOKURIKULER`, `EKSKUL_SISWA`, `ABSENSI`, `SETORAN_TT`, `NILAI_RAPOR_RERATA`, `NILAI_US`) terhubung lewat kolom `id_siswa` di masing-masing sheet tersebut.

**Risiko utama:** Jika `luluskanSiswa()` di-refactor untuk men-generate `id` baru (misalnya memakai `_generateId('ALUMNI', 'AL')` seperti pola ID lain di sistem), seluruh riwayat nilai siswa tersebut akan **terputus permanen** — data nilai lama masih ada di sheet-sheet tersebut tapi tidak bisa lagi di-query untuk alumni itu karena `id_siswa` yang dicari tidak cocok.

**Pola wajib:**
```javascript
// ✅ BENAR — id_siswa dari SISWA dipertahankan apa adanya
const rowsAlumni = siswaList.map(s => [
  s.id, s.nama, ...  // s.id adalah id_siswa ASLI, BUKAN id baru
]);

// ❌ SALAH — JANGAN generate id baru untuk baris ALUMNI
const newId = await _generateId('ALUMNI', 'AL');  // akan memutus riwayat nilai!
```

**Implikasi desain:** Karena `id_siswa` dipertahankan, query nilai untuk alumni (misalnya saat admin ingin melihat rapor lengkap seorang alumni) menggunakan fungsi `getNilai`, `getAbsensi`, dll. yang **sudah ada** — tidak perlu fungsi baru khusus alumni untuk membaca riwayat nilai, cukup oper `id_siswa` dari hasil `getAlumni()`.

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` | `luluskanSiswa()` memakai `s.id` langsung sebagai kolom A baris ALUMNI, tidak ada pemanggilan `_generateId` untuk baris alumni |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §35` di deklarasi `luluskanSiswa` |

**Checklist wajib sebelum mengubah `luluskanSiswa()`:**
- [ ] `id_siswa` di baris ALUMNI sama persis dengan `id_siswa` yang dihapus dari SISWA
- [ ] Setelah lulus, `getNilai({ id_siswa })` untuk siswa tersebut masih mengembalikan data lengkap dari tahun-tahun sebelumnya
- [ ] Tidak ada pemanggilan `_generateId` di jalur kode `luluskanSiswa`

---

### 36. `TP_KKTP` SENGAJA Ikut Diarsipkan+Direset Saat Tahun Ajaran Baru — Bukan Bug ⚠️

**Konteks:** `resetTahunAjaranBaru()` mengarsipkan lalu mengosongkan beberapa sheet transaksional termasuk `TP_KKTP`. Ini adalah keputusan desain eksplisit dari pemilik sistem, bukan oversight.

**Alasan:** Meskipun kurikulum (Mapel, Kelas, Fase) relatif stabil antar tahun ajaran, Tujuan Pembelajaran (TP) dan KKTP-nya sering disesuaikan oleh guru setelah evaluasi akhir tahun ajaran — baik karena perubahan target kompetensi, revisi deskripsi level, atau penyesuaian bobot SLM/SAS. Mempertahankan TP_KKTP lama secara otomatis di sheet aktif berisiko guru lupa memperbarui dan memakai TP yang sudah tidak relevan untuk tahun ajaran baru.

**Konsekuensi teknis:** Karena `NILAI` mereferensikan `id_tp` dari `TP_KKTP`, mengosongkan `TP_KKTP` dari sheet aktif **mengharuskan** `NILAI` juga diarsipkan+dikosongkan di waktu yang sama — keduanya tidak bisa direset secara independen tanpa meninggalkan data nilai yang mereferensikan TP yang sudah tidak ada di sheet aktif.

**⚠️ PENTING (v56):** "Direset" di sini berarti dikosongkan dari SHEET AKTIF setelah diarsipkan ke tab `TP_KKTP_<tahun>` — bukan dihapus permanen. Lihat §37 untuk mekanisme arsipnya.

**Jika ada permintaan untuk "mempertahankan TP_KKTP saat reset" di masa depan:** Ini bukan tweak kecil — perlu didiskusikan ulang secara eksplisit dengan pemilik sistem karena bertentangan dengan keputusan desain yang sudah dikonfirmasi sebelumnya.

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` | `'TP_KKTP'` ada di array `sheetsToReset` dalam `resetTahunAjaranBaru()` |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §36/§37` di deklarasi `resetTahunAjaranBaru` |

---

### 37. Reset Tahun Ajaran WAJIB Arsip-Dulu-Kosongkan — TIDAK BOLEH Hapus Langsung ⚠️ KRITIS

**Konteks:** Pemilik sistem secara eksplisit menegaskan: data tahun ajaran lama harus tetap dapat diakses kapan saja dari dalam sistem, dan tidak boleh hilang hanya karena admin memulai tahun ajaran baru.

**Akar masalah (v55, dikoreksi di v56):** Rancangan awal `resetTahunAjaranBaru()` memanggil `clearRange()` langsung ke sheet aktif tanpa membuat salinan apa pun. Begitu dijalankan, data `NILAI`, `TP_KKTP`, dkk. untuk tahun ajaran lama **hilang permanen** dari spreadsheet — satu-satunya jejak adalah file backup `.json` manual (yang belum tentu dibuat admin, dan kalaupun ada, proses restore-nya akan menimpa data tahun berjalan).

**Pola WAJIB sejak v56 — arsip dulu, baru kosongkan:**

```javascript
// ✅ BENAR
for (const nama of sheetsToReset) {
  const dup = await duplicateSheetAs(nama, `${nama}_${tahunLama}`);
  if (dup.status === 'error') {
    continue;  // ⚠️ JANGAN clearRange jika duplicate gagal — fail-safe
  }
  await clearRange(`${nama}!A3:...`);  // baru kosongkan SETELAH arsip aman
}

// ❌ SALAH — JANGAN PERNAH lakukan ini lagi
await clearRange(`${nama}!A3:...`);  // tanpa duplicateSheetAs dulu = data lama hilang permanen
```

**Invariant yang harus selalu dijaga:** Untuk setiap sheet yang masuk siklus reset tahun ajaran, HARUS ada tab arsip `<SHEET>_<tahun>` yang berhasil dibuat SEBELUM `clearRange()` dipanggil pada sheet yang sama. Jika `duplicateSheetAs()` mengembalikan `status: 'error'`, sheet tersebut harus dilewati (skip), bukan tetap dikosongkan.

**Data yang TIDAK PERNAH masuk siklus reset sama sekali (selalu dipertahankan apa adanya):**

| Sheet | Alasan |
|-------|--------|
| `USERS` | Data guru & admin — tidak terikat tahun ajaran |
| `SISWA` | Siswa aktif — hanya berpindah kelas, tidak dihapus (kecuali kelas 6 lulus → ke ALUMNI, lihat §35) |
| `KELAS` | Struktur kelas |
| `MAPEL` | Daftar mata pelajaran |
| `EKSKUL`, `DPL` | Master jenis ekskul/kokurikuler (bukan nilai siswa) |
| `CONFIG` | Profil sekolah (hanya field `tahun_pelajaran` yang diupdate, bukan dikosongkan) |
| `MUTASI`, `SYNC_LOG` | Riwayat administratif sepanjang masa |
| `ALUMNI` | Arsip permanen siswa lulus |

**Cara mengakses data arsip dari dalam sistem:**
```javascript
const tahunTersedia = await SHEETS.getTahunArsipTersedia();
// → ['2025-2026', '2024-2025', ...] terbaru lebih dulu
const dataLama = await SHEETS.readArsip('NILAI', '2025-2026');
// → raw rows, dipetakan dengan skema kolom yang SAMA seperti getNilai()
```

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `assets/js/sheets.js` | `resetTahunAjaranBaru()`: `duplicateSheetAs()` dipanggil dan hasilnya dicek SEBELUM `clearRange()` untuk sheet yang sama |
| `assets/js/sheets.js` | `continue` (skip) jika `dup.status === 'error'` — TIDAK lanjut ke `clearRange` |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §37` di deklarasi `resetTahunAjaranBaru` dan `duplicateSheetAs` |
| `assets/js/sheets.js` | `duplicateSheetAs()` mengembalikan `status: 'sudah_ada'` (tidak overwrite) jika tab arsip dengan nama sama sudah ada |

**Checklist wajib sebelum mengubah `resetTahunAjaranBaru()` atau `duplicateSheetAs()`:**
- [ ] Tidak ada jalur kode yang memanggil `clearRange()` pada sheet transaksional tanpa `duplicateSheetAs()` berhasil terlebih dahulu untuk sheet yang sama
- [ ] Jika arsip gagal dibuat untuk satu sheet, sheet itu TIDAK dikosongkan, sheet lain tetap diproses (tidak saling blocking)
- [ ] Setelah reset, `getTahunArsipTersedia()` mengembalikan tahun yang baru diarsipkan
- [ ] Data di tab arsip bisa dibaca penuh via `readArsip()` dan jumlah barisnya sama dengan sebelum reset
- [ ] `USERS` dan `SISWA` tidak pernah disentuh oleh `resetTahunAjaranBaru()` dalam bentuk apa pun

---

### 38. Cetak Rapor — Bagian D (Ketidakhadiran/Catatan Wali), Keputusan, dan TTD WAJIB Tidak Terpotong Halaman ⚠️ KRITIS

**Konteks:** Beberapa guru melaporkan hasil cetak PDF rapor sering terpotong tepat di tengah kotak Catatan Wali, di tengah bagian Ketidakhadiran, atau di tengah blok tanda tangan — sehingga separuh konten ada di halaman sebelumnya dan separuh lagi di halaman berikutnya.

**Akar masalah (ditemukan saat audit, perbaikan diberi label v-berikutnya setelah v56):** Ada CSS rule `.abs-catatan-grid{page-break-inside:avoid}` yang terlihat seperti perlindungan, tapi **tidak pernah benar-benar berlaku** — HTML aktual untuk bagian D memakai `<div style="display:flex;...">` inline, bukan class `.abs-catatan-grid`. CSS itu adalah dead code yang menipu pembaca kode seolah sudah terlindungi. Selain itu, `.rpr-keputusan` dan `.rpr-ttd` hanya melindungi div bagian DALAM, sementara pembungkus LUARNYA (yang juga berisi judul/baris tanggal) tidak ikut dilindungi — garis potong tetap bisa jatuh di antara judul dan kontennya.

**Pola wajib sejak perbaikan ini:**

1. Setiap blok yang harus utuh dalam satu halaman cetak **harus** dibungkus div dengan class CSS yang benar-benar dipakai di HTML — JANGAN menulis CSS untuk class yang "kelihatannya" relevan tapi tidak pernah dirender dengan class itu di JS pembangun HTML.
2. `page-break-inside: avoid` harus ditempatkan pada **pembungkus terluar** dari unit visual yang ingin dilindungi, bukan hanya elemen di dalamnya.
3. Untuk grup section yang selalu berurutan tanpa konten lain di antaranya (Bagian D → Keputusan → TTD) dan totalnya tidak mendekati satu halaman penuh, gunakan **satu pembungkus gabungan** (`.rpr-footer-group`) di samping proteksi per-bagian — pertahanan berlapis mencegah garis potong masuk di sela-sela antar bagian.

**Struktur final (lihat `rapor/preview.html`, fungsi pembangun `printHTML`):**
```
<div class="rpr-footer-group">          ← proteksi gabungan, lihat §38
  <div class="rpr-section rpr-bagian-d">  ← Ketidakhadiran + Catatan Wali + Tanggapan
    ...tabel absensi... ...Catatan Wali... ...tanggapan-box...
  </div>
  <div class="rpr-keputusan-wrap">        ← hanya muncul di semester 2
    <div class="rpr-keputusan">...</div>
  </div>
  <div class="rpr-ttd-wrap">
    ...tanggal kota...
    <div class="rpr-ttd">...3 kolom TTD...</div>
  </div>
</div>
```

**CSS wajib (di dalam `printHTML` template, bukan CSS screen):**
```css
.rpr-bagian-d{page-break-inside:avoid;break-inside:avoid}
.rpr-keputusan-wrap{page-break-inside:avoid;break-inside:avoid}
.rpr-keputusan{page-break-inside:avoid;break-inside:avoid}
.rpr-ttd-wrap{page-break-inside:avoid;break-inside:avoid}
.rpr-ttd{page-break-inside:avoid;break-inside:avoid}
.rpr-footer-group{page-break-inside:avoid;break-inside:avoid}
```

**Mengapa aman dari risiko "blok terlalu besar dipaksa pindah halaman, menyisakan ruang kosong besar":** Total tinggi gabungan ketiga bagian ini (~250–300pt) jauh di bawah tinggi halaman A4 setelah margin (~737pt dengan margin 1.5cm). `page-break-inside: avoid` hanya berisiko menimbulkan ruang kosong berlebih jika blok yang dilindungi mendekati atau melebihi satu halaman penuh — itu tidak terjadi di sini.

**Penanda kode wajib:**

| File | Penanda |
|------|---------|
| `rapor/preview.html` | HTML pembangun bagian D memakai class `rpr-bagian-d` (bukan `abs-catatan-grid`) |
| `rapor/preview.html` | Pembungkus Keputusan memakai class `rpr-keputusan-wrap` (bukan inline style polos) |
| `rapor/preview.html` | Pembungkus TTD+tanggal memakai class `rpr-ttd-wrap` (bukan inline style polos) |
| `rapor/preview.html` | Ada pembungkus terluar `rpr-footer-group` yang menyatukan ketiga bagian |
| `rapor/preview.html` | CSS print punya keenam rule `page-break-inside:avoid` di atas, semuanya menyasar class yang BENAR-BENAR dipakai di HTML |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §38` di lokasi pembangunan HTML bagian D/Keputusan/TTD |

**Checklist wajib sebelum mengubah struktur bagian D/Keputusan/TTD:**
- [ ] Setiap class CSS untuk `page-break-inside:avoid` dicek ulang: apakah class itu BENAR-BENAR muncul di HTML yang dihasilkan, atau cuma "terlihat relevan"?
- [ ] Cetak rapor uji dengan kasus konten panjang (misal Catatan Wali dengan teks 2-3 baris penuh) — pastikan tidak terpotong dan tidak menimbulkan halaman kosong besar
- [ ] Cetak rapor uji untuk semester 1 (tanpa blok Keputusan) dan semester 2 (dengan blok Keputusan) — keduanya harus utuh
- [ ] Jika menambah bagian baru ke grup footer, perbarui estimasi tinggi total agar tetap jauh dari satu halaman penuh sebelum menambahkannya ke `.rpr-footer-group`

---

## 📌 Penanda Kode Kumulatif (Semua Versi)

Tabel ini merangkum semua penanda kode yang wajib ada dan **tidak boleh dihapus** tanpa alasan yang jelas.

| File | Penanda Kode | Ditambahkan | Keterangan |
|------|-------------|-------------|------------|
| `penilaian/input-nilai.html` | `let _importSeq = 0` sebelum loop + `(_importSeq++).toString(36).padStart(3,'0')` di ID baru | v18 | Wajib. Tanpa counter, tabrakan ID ~62% untuk kelas besar (birthday paradox, loop sinkron). Lihat §9. |
| `penilaian/input-nilai.html` | `toUpdate` dan `toAppend` sebagai akumulator (bukan per-row API call) di `eksekusiImport` | v18 | Wajib. Per-row call menyebabkan 429. Lihat §9. |
| `penilaian/input-nilai.html` | `rows.push(row)` di cabang `toAppend` (sebelum eksekusi batch) | v18 | Wajib. Tanpanya duplikat bisa lolos ke sheet jika file import memiliki baris yang sama. |
| `penilaian/input-nilai.html` | `SHEETS.append('NILAI!A1', toAppend)` — anchor `A1`, bukan `'NILAI!A:K'` | v18 | Wajib. Range `!A:K` membatasi pencarian batas tabel ke kolom A–K dan bisa menyebabkan data nyasar. Lihat §3 dan §9. |
| `rapor/preview.html` | `vertical-align: top` pada `@bottom-left` dan `@bottom-right` di `@page` | v17 | Wajib ada. Tanpanya, teks footer di-align ke tengah margin box — `padding-top` tidak efektif mengontrol gap garis–teks. Lihat §8. |
| `rapor/preview.html` | `function nextFase(kelas)` — parameter harus `kelas`, bukan `f`/`fase` | v16 | **BERULANG 2×** — Fase dihitung dari kelas tujuan, bukan dari fase saat ini. Jangan kembalikan ke versi lama `nextFase(f)`. |
| `rapor/preview.html` | `function kelasPokok(k)` — helper wajib ada | v16 | **BERULANG 2×** — Dipakai di "Tinggal di kelas". Tanpa ini, huruf rombel ikut tampil. |
| `rapor/preview.html` | `nextFase(d.kelas)` di 2 call site (screen + print) | v16 | Jangan ganti ke `nextFase(d.fase)` — lihat §7 |
| `rapor/preview.html` | `kelasPokok(d.kelas)` di 2 call site "Tinggal di kelas" (screen + print) | v16 | Jangan ganti ke `d.kelas` mentah — lihat §7 |
| `rapor/preview.html` | `break-inside:avoid;page-break-inside:avoid` pada `.kok-box` (dalam template string `printHTML`) | v15 | **BERULANG 4×** — Wajib ada agar konten kokurikuler tidak terpotong di batas halaman cetak. Jangan hapus saat edit print CSS. |
| `assets/js/sheets.js` | `saveNilaiUSBatch,` (di blok return) | v13 | Hotfix — pernah hilang dan menyebabkan error save nilai US |
| `assets/js/sheets.js` | `append('SETORAN_TT!A1', [row])` | v10 | Anchor A1 wajib agar data tidak ditulis ke kolom acak |
| `assets/js/sheets.js` | `// Tahun sengaja tidak difilter` | v10 | Format tahun tidak konsisten — filter tahun sengaja dihilangkan |
| `assets/js/sheets.js` | `String(r[0]\|\|'').trim() === String(id).trim()` | v10 | Trim wajib agar findIndex tidak mismatch karena spasi |
| `ujian-sekolah/input-nilai-us.html` | `mapelIds.includes(m.id)` | v9 | Filter mapel berdasarkan ID (bukan nama) |
| `ujian-sekolah/input-nilai-us.html` | `viewMode = (currentUser.role === 'guru_mapel') ? 'per_mapel' : 'per_siswa'` | v14 | Deteksi mode otomatis — jangan pindah ke tempat lain |
| `ujian-sekolah/input-nilai-us.html` | `renderTablePerSiswa` dan `renderTablePerMapel` | v14 | Dua renderer terpisah — jangan digabung |
| `ujian-sekolah/input-nilai-us.html` | `viewMode === 'per_siswa' ? el.dataset.mapel : el.dataset.siswa` | v14 | Key terpadu di `onNilaiChange` |
| `ujian-sekolah/input-nilai-us.html` | `document.querySelectorAll('#tbodyUS tr')` di `updateBobot` | v14 | Generalized — jangan kembalikan ke `tr[data-mapel]` |
| `ujian-sekolah/input-rata-rapor.html` | `mapelIds.includes(m.id)` | v9 | Idem |
| `siswa/mutasi.html` | `const payload = pendingPayload` | v1 | Simpan referensi lokal sebelum tutupModal() |
| `siswa/mutasi.html` | `kelasDiampuArr` | v12 | Gabungan kelas utama+mapel untuk load siswa multi-kelas |
| `penilaian/input-setoran-tt.html` | `m.startsWith('[')` di forEach lulusSet | v11 | Expand JSON array materi untuk progress bar multi-materi |
| `dashboard/guru-kelas.html` | `hasKelas6` | v1/SAJ-05 | Visibilitas menu SAJ kondisional |
| `dashboard/guru-kelas.html` | `navSAJLabel` | v1/SAJ-05 | ID elemen nav SAJ |
| `dashboard/guru-kelas.html` | `'navConfigSKL'` di array `hasKelas6` | v19 | Wajib ada agar menu Konfigurasi SKL muncul di sidebar guru kelas 6. Lihat §10. |
| `ujian-sekolah/config-skl.html` | `AUTH.requireLogin(['admin','guru_kelas'])` | v19 | Wajib ada. Tanpa `guru_kelas`, guru kelas 6 diredirect ke login. Lihat §10. |
| `ujian-sekolah/input-nilai-us.html` | `<input type="hidden" id="bobotTertulis">` dan `<input type="hidden" id="bobotPraktik">` | v19 | Wajib `type="hidden"`. Jika dikembalikan ke `type="number"`, bobot bisa diedit lokal tanpa tersimpan. Lihat §11. |
| `ujian-sekolah/input-nilai-us.html` | `updateBobot()` dipanggil setelah `config['skl_bobot_us_praktik']` diapply di `init()` | v19 | Wajib ada. Tanpanya, header tabel hardcoded 60%/40% meski config SKL berbeda. Lihat §11. |
| `dashboard/guru-mapel.html` | `isPureTTGuru` (menggantikan `!isTTGuru`) di blok SAJ menu | v20 | Wajib. `!isTTGuru` memblokir guru PAI/B.Arab/KMH yang sekaligus mengajar TT. Gunakan `isPureTTGuru` yang hanya blokir guru yang benar-benar hanya mengajar TT. Lihat §12. |
| `dashboard/guru-mapel.html` | `// ANTIREGRESI v20: jangan kembalikan ke !isTTGuru` | v20 | Penanda komentar wajib ada. Lihat §12. |
| `siswa/edit-siswa-kelas.html` | `rawRowsCache = await SHEETS.read('SISWA!A:P')` hanya di `muatData()` — tidak di fungsi save | v21 | Wajib. Re-read saat save menyebabkan error 403. Lihat §14. |
| `siswa/edit-siswa-kelas.html` | `// FIX: tidak ada SHEETS.read() di sini; pakai rawRowsCache` di `simpanBaris()` dan `simpanSemua()` | v21 | Penanda komentar wajib ada agar pola tidak dibalik. Lihat §14. |
| `siswa/edit-siswa-kelas.html` | `perbaruiCache(id, data)` dipanggil setelah setiap save berhasil | v21 | Wajib. Menjaga cache sinkron tanpa re-read. Lihat §14. |
| `siswa/edit-siswa-kelas.html` | `SHEETS.valuesBatchWrite` dengan range per-kolom (`SISWA!D${r}`, `SISWA!M${r}:O${r}`, `SISWA!P${r}`) | v21 | Targeted write — tidak overwrite baris penuh. Lihat §13. |
| `dashboard/guru-kelas.html` | Nav item `edit-siswa-kelas.html` di seksi "Data Siswa" sidebar | v21 | Jalur navigasi ke halaman edit. Tidak masuk array `hasKelas6` (tampil untuk semua guru kelas). |
| `index.html` | `style="display:none;"` pada `#statusLoading` | v22 | Wajib ada. Tanpanya elemen tampil otomatis karena `.status-msg.loading { display:flex }`. Lihat §15. |
| `index.html` | `style="display:none;"` pada `#statusError` | v22 | Wajib ada. Tanpanya elemen tampil otomatis karena `.status-msg.error { display:flex }`. Lihat §15. |
| `ujian-sekolah/preview-ismuba.html` | Komentar `// ANTIREGRESI v23` + blok `if(!m && fieldKey==='ismuba_pai')` di `getNilaiISMUBA()` | v23 | Alias search PAI/Al-Islam. Menghapusnya mengembalikan bug nilai Al-Islam kosong. Lihat §16. |
| `ujian-sekolah/leger-us.html` | Komentar `// ANTIREGRESI` + keterangan read-only di atas blok `<script>` | v24 | Wajib ada. Mengingatkan bahwa halaman ini tidak boleh memiliki operasi write. Lihat §17. |
| `ujian-sekolah/leger-us.html` | `requireLogin(['admin', 'guru_kelas'])` — bukan hanya `'guru_kelas'` | v24 | Admin harus bisa mengakses leger ini. Lihat §17. |
| `dashboard/guru-kelas.html` | `'navLegerUS'` di dalam array `hasKelas6` | v24 | Wajib masuk array; jika di luar array, menu muncul untuk semua guru kelas bukan hanya kelas 6. Lihat §17. |
| `ujian-sekolah/preview-tka.html` | Komentar `/* ANTIREGRESI v25: border ... dihilangkan */` pada `.cert-page` | v25 | Mengingatkan tidak ada frame; jangan tambahkan kembali. Lihat §18. |
| `ujian-sekolah/preview-tka.html` | `href="preview-tka.html"` pada nav-item active (self-link) | v25 | Wajib; jika kembali ke `preview-ismuba.html` maka navigasi aktif salah. Lihat §18. |
| `dashboard/guru-kelas.html` | `navISMUBA` tetap di array `hasKelas6` (walaupun saat ini mengarah ke file yang belum aktif) | v25 | Slot yang disiapkan untuk halaman ISMUBA baru — jangan dihapus dari array. Lihat §18. |
| `ujian-sekolah/preview-ismuba.html` | Komentar `// ANTIREGRESI v26` di atas blok script (read-only, sumber formula) | v26 | Wajib ada. Mengingatkan tidak ada write dan formula harus identik dengan preview-tka.html. Lihat §19. |
| `ujian-sekolah/preview-ismuba.html` | `getNilaiISMUBA()` identik dengan `preview-tka.html` termasuk alias search v23 | v26 | Jika diubah di satu file, wajib disamakan di keduanya. Lihat §19. |
| `ujian-sekolah/config-skl.html` | 10 config key Syahadah baru ada di form dan di array `KEYS_TO_SAVE` | v26 | Wajib ada keduanya. Jika hanya di form tapi tidak di array, nilai tidak tersimpan. Lihat §19. |
| `penilaian/input-nilai.html` | `const toUpdate = []; const toAppend = []; const nilaiDBLocal = {}; let _saveSeq = 0;` **sebelum** `for (const item of toSave)` di `simpanTP()` | v27 | Wajib ada sebelum loop. Jika dihapus, per-row write → error 400 untuk sheet besar atau 429 rate limit. Lihat §20. |
| `penilaian/input-nilai.html` | `// ANTIREGRESI §20: pakai append()...` di komentar blok INSERT di `simpanTP()` | v27 | Penanda wajib. Menjelaskan alasan append vs write. Jangan hapus. |
| `penilaian/input-nilai.html` | `toAppend.push(row); rows.push(row)` di cabang INSERT `simpanTP()` — bukan `SHEETS.write()` | v27 | **BERULANG** — Tanpa ini, INSERT kembali ke write() yang gagal 400 saat sheet besar. Lihat §20. |
| `penilaian/input-nilai.html` | `await SHEETS.append('NILAI!A1', toAppend)` **setelah** loop di `simpanTP()` — anchor A1 wajib | v27 | **BERULANG** — Anchor A1 wajib (lihat §3). Harus di luar loop. Lihat §20. |
| `penilaian/input-nilai.html` | Tidak ada `await SHEETS.write(...)` atau `await SHEETS.append(...)` di dalam `for (const item of toSave)` di `simpanTP()` | v27 | **BERULANG** — Per-row API call → 400 (sheet besar) atau 429 (rate limit). Lihat §9 & §20. |
| `ujian-sekolah/preview-skl.html` | `allSiswa.findIndex(s => s.id === siswa.id)` untuk `seq` di `loadPreview` — bukan `idx` | v30 | **BERULANG** — `idx` selalu 0 saat preview satu siswa → seq selalu `01`. Lihat §21. |
| `ujian-sekolah/generate-skl.html` | `noKlas`, `noBase`, `noInst`, `noBulan`, `noTahun` dari config (format 5-bagian Perwal Depok 79/2019) | v30 | Wajib. Tanpa ini, format nomor surat lama tetap dipakai. Lihat §21. |
| `ujian-sekolah/generate-skl.html` | `allSiswa.findIndex(ss => ss.id === s.id)` untuk `seq` — bukan `noUrutAwal + i` | v30 | **BERULANG** — `noUrutAwal + i` increment base number, bukan seq. Lihat §21. |
| `ujian-sekolah/generate-skl.html` | `mapelFields` hanya 8 key (pai/pp/bind/mtk/ipas/sb/pjok/bsund) — tanpa bing/tik/kka | v30 | Wajib. bing/tik/kka sudah dihapus dari SKL 2025/2026. Lihat §21. |
| `ujian-sekolah/generate-skl.html` | Validasi config pakai `cfg['skl_no_urut_awal']` — bukan `cfg['skl_no_surat_suffix']` | v30 | `skl_no_surat_suffix` sudah dihapus → selalu undefined → warning selalu muncul. Lihat §21. |
| `rapor/preview.html` | `parseInt(r[4]) >= 1 && parseInt(r[4]) <= 3` di `buildSeksiEkskul` — bukan `r[4]==='1'` | v31 | **Wajib.** Tanpa ini hanya level Layak yang tampil di rapor; Cakap (2) dan Mahir (3) tidak muncul. Lihat §22. |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §22` di dalam `buildSeksiEkskul` — blok ekstrakurikuler | v31 | Penanda wajib agar kondisi level tidak dikembalikan ke cek string `==='1'`. |
| `setup/kelola-guru.html` | `pilihRole(u.role, true)` di dalam `bukaEdit` — bukan `pilihRole(u.role)` | v32 | **Wajib.** Tanpa `true`, `pilihRole` mengosongkan semua array state sebelum render. Lihat §23. |
| `setup/kelola-guru.html` | Komentar `// ⚠️ ANTIREGRESI §23` di atas `pilihRole(u.role, true)` dalam `bukaEdit` | v32 | Penanda wajib agar argumen `true` tidak hilang saat refactor. |
| `rapor/preview.html`, `rapor/laporan-tt.html` | Fungsi `pilihTglRapor(cfg, kelas, semester)` — tidak boleh diinline dengan `config['tgl_rapor']` | v33 | **Wajib.** Tanpa fungsi ini Kelas 1–5 Sem. II selalu mencetak tanggal Kelas 6. Lihat §24. |
| `rapor/laporan-tt.html` | Fungsi `cariGuruTT(allUsers, kelas)` — tidak boleh diganti `config['_nama_guru_tt']` | v34 | **Wajib.** Tanpa filter kelas, guru TT pertama di sheet selalu muncul untuk semua kelas. Lihat §25. |
| `rapor/laporan-tt.html` | `let allUsersGlobal = []` di level modul + diisi di init | v34 | Wajib agar `cariGuruTT` bisa diakses di luar init. Lihat §25. |
| `rapor/laporan-tt.html` | Komentar `// ⚠️ ANTIREGRESI §25` di deklarasi `allUsersGlobal` dan di `bukaJendelaCetak` | v34 | Penanda wajib agar refactor tidak menghapus filter kelas. |

---

| `assets/js/sheets.js` | `read('SISWA!A:P')` di `getSiswa()` — bukan `A:O` | v37 | Wajib. Tanpa ini kolom P (`no_peserta_ismuba`) tidak terbaca. Lihat §26. |
| `assets/js/sheets.js` | `r[15]` untuk `no_peserta_ismuba` di return object `getSiswa()` | v37 | Wajib. Sinkron dengan range read A:P. Lihat §26. |
| `assets/js/sheets.js` | `siswa.no_peserta_ismuba \|\| ''` sebagai elemen ke-16 di `row` di `addSiswa()` | v37 | Wajib. Tanpa ini kolom P selalu kosong saat tambah siswa baru. Lihat §26. |
| `assets/js/sheets.js` | `append('SISWA!A1', [row])` di `addSiswa()` — anchor `A1` wajib | v37 |
| `assets/js/sheets.js` | `siswa.sort((a, b) => (a[1] \|\| '').localeCompare(b[1] \|\| '', 'id'))` di `getSiswa()` — tepat sebelum `return` | v38 | Wajib. Tanpanya urutan siswa mengikuti posisi baris di sheet — siswa baru selalu di akhir atau posisi acak. Lihat §27. |
 Wajib. Tanpa anchor, data siswa baru ditulis ke kolom acak dan tidak terbaca `getSiswa`. Lihat §3 dan §26. |
| `rapor/laporan-tt.html` | Refresh `currentUser.kelasList` dari `freshUser` di init — bukan hanya `currentUser.mapel` | v39 | **Wajib.** Tanpa ini dropdown kelas pakai data session lama → guru_mapel TT tidak dapat kelas yang benar. Lihat §28. |
| `rapor/laporan-tt.html` | Refresh `currentUser.kelas_mapel` dan `currentUser.kelasMapelList` dari `freshUser` di init | v39 | Wajib. Sinkron dengan refresh kelasList. Lihat §28. |
| `rapor/laporan-tt.html` | Komentar `// ⚠️ ANTIREGRESI §28` di blok refresh `freshUser` | v39 | Penanda wajib agar baris refresh kelasList tidak dihapus saat salin-tempel dari halaman lain. |
| `assets/js/sheets.js` | `kelasList` di `getUsers()` dibangun dengan IIFE gabungan kolom E + `kelasMapelRaw` (kolom K) menggunakan `new Set` — identik dengan `auth.js` | v43 | **Wajib.** Tanpa ini, `freshUser.kelasList` yang di-sync (§28) hanya berisi kelas E → guru_kelas TT merangkap kehilangan kelas K. Lihat §30. |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §30` di baris `kelasList` di `getUsers()` | v43 | Penanda wajib agar field tidak disederhanakan kembali ke `r[4]` saja. |
| `rapor/preview.html` | Pencarian wali kelas memakai `u.kelas?.split(',').map(s=>s.trim()).includes(activeKelas)` — bukan `u.kelasList` | v44 | **Wajib.** `kelasList` mencakup kelas tambahan (kolom K); wali kelas hanya ditentukan dari kelas utama (kolom E). Lihat §31. |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §31` di blok `users.find()` pencarian wali kelas | v44 | Penanda wajib agar query tidak kembali memakai `kelasList`. |
| `rapor/laporan-tt.html` | `cariGuruTT()`: cabang `if (u.role==='guru_kelas')` pakai E+K; cabang `else` pakai kolom K jika tidak kosong, fallback ke kolom E | v45 | **Wajib.** Tanpa ini, guru_mapel multi-mapel false-match sebagai guru TT di kelas non-TT. Lihat §32. |
| `setup/kelola-guru.html` | Fungsi `renderKelasTTSeksi()`, `renderKelasTTCheckbox()`, `toggleKelasTT()` hadir dan dipanggil | v45 | Penanda wajib. UI harus memberi admin cara mengisi kelas TT khusus untuk guru_mapel. |
| `setup/kelola-guru.html` | `simpanGuru()`: `kelas_mapel` untuk `guru_mapel` = `kelasTTDipilih.join(',')` | v45 | Penanda wajib. Tanpa ini data tidak tersimpan ke kolom K. |
| `rapor/laporan-tt.html` | `isTTGuru()` — alias lengkap: `m === 'tahsin-tahfizh'` dan `m.replace(/[^a-z]/g,'').includes('tahsin')` | v39 | Wajib identik dengan `guru-mapel.html`. Format mapel bervariasi di sheet. Lihat §28. |
| `dashboard/guru-mapel.html` | Refresh `currentUser.kelasList`, `currentUser.kelas_mapel`, `currentUser.kelasMapelList` dari `freshUser` | v39 | Wajib. Tanpa ini `hasKelas6` (menu SAJ) pakai data session lama. Lihat §28. |
| `dashboard/guru-mapel.html` | Komentar `// ⚠️ ANTIREGRESI §28` di blok refresh `freshUser` | v39 | Penanda wajib. |
| `rapor/laporan-tt.html` | `materiLulus` dibangun dengan `forEach` + expand `startsWith('[')` — bukan `new Set(setoranLulus.map(s=>s.materi))` | v40 | **Wajib.** Tanpa expand, setoran multi-materi (JSON array) tidak dikenali → progress 0% dan semua detail `—`. Lihat §29. |
| `rapor/laporan-tt.html` | Komentar `// ⚠️ ANTIREGRESI §29` di blok `materiLulus` di `buildLaporanQuran` | v40 | Penanda wajib agar pola expand tidak diganti kembali ke `.map`. |
| `rapor/preview.html` | Fungsi `faseKini(kelas)` — menghitung fase siswa saat ini dari nomor kelas; JANGAN diganti `d.fase` dari sheet | v52 | **Wajib.** Kolom fase di sheet KELAS diisi manual dan bisa salah (contoh: Kelas 2B terset "B" padahal harusnya "A"). Lihat §33. |
| `rapor/preview.html` | `${faseKini(d.kelas)}` di 2 call site identitas (screen + print) — bukan `${d.fase}` | v52 | **Wajib.** Mengembalikan ke `d.fase` menyebabkan fase tampil salah jika data sheet tidak akurat. Lihat §33. |
| `rapor/preview.html` | Komentar `// ⚠️ ANTIREGRESI §33` di deklarasi `faseKini` | v52 | Penanda wajib agar fungsi tidak dihapus atau diganti `d.fase`. |
| `rapor/leger-guru-mapel.html` | `requireLogin(['guru_mapel', 'guru_kelas'])` — kedua role diizinkan | v53→v54 | **Wajib.** Banyak guru kelas yang merangkap guru mapel; hanya `'guru_mapel'` menolak mereka. Lihat §34. |
| `rapor/leger-guru-mapel.html` | Dropdown mapel dibangun dari `currentUser.mapel` exclude TT — jika hanya 1 mapel, dropdown disembunyikan | v53 | Wajib. Guru hanya boleh melihat mapel yang diampu. |
| `rapor/leger-guru-mapel.html` | Cabang `if (currentUser.role === 'guru_kelas')` untuk `allKelasGuru` — pakai `kelasMapelList` (kolom K saja) | v54 | **Wajib.** `guru_kelas` tidak boleh melihat leger kelas walinya via halaman ini — hanya kelas tambahan (kolom K). Lihat §34. |
| `rapor/leger-guru-mapel.html` | Guard `allKelasGuru.length === 0` untuk `guru_kelas` — pesan informatif, bukan dropdown kosong | v54 | Wajib. Tanpa ini dropdown kelas tampil kosong tanpa keterangan. Lihat §34. |
| `rapor/leger-guru-mapel.html` | `dashHref` kondisional — `guru_kelas` → `guru-kelas.html`, `guru_mapel` → `guru-mapel.html` | v54 | Wajib. Link Dashboard dan topbar harus mengarah ke dashboard masing-masing role. |
| `rapor/leger-guru-mapel.html` | Dropdown kelas dari `kelasList` (E+K, §30) untuk `guru_mapel` — bukan hanya kolom E | v53 | Wajib. Guru mapel yang mengajar di kelas tambahan (kolom K) harus bisa memilihnya. |
| `dashboard/guru-mapel.html` | Seksi "Laporan" di sidebar dengan link `leger-guru-mapel.html` | v53 | Penanda wajib agar guru mapel bisa menemukan halaman ini dari dashboard. |
| `dashboard/guru-kelas.html` | `navLegerMapel` (`display:none`) + JS kondisional `kelasMapelList.length > 0 && mapelBidStudi.length > 0` | v54 | **Wajib.** Menu hanya muncul untuk guru kelas yang benar-benar merangkap guru mapel. Lihat §34. |
| `assets/js/sheets.js` | `luluskanSiswa()` memakai `s.id` langsung sebagai `id_siswa` di ALUMNI — tidak ada `_generateId` di jalur ini | v55 | **Wajib.** Generate ID baru akan memutus seluruh riwayat nilai alumni secara permanen. Lihat §35. |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §35` di deklarasi `luluskanSiswa` | v55 | Penanda wajib agar pola ID tidak diubah saat refactor. |
| `assets/js/sheets.js` | `'TP_KKTP!A3:W10000'` ada di array `sheetsToReset` dalam `resetTahunAjaranBaru()` | v55 | **Wajib (by design).** TP_KKTP disengaja ikut direset — guru menyusun ulang tiap tahun ajaran. Lihat §36. |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §36` di deklarasi `resetTahunAjaranBaru` | v55 | Penanda wajib agar TP_KKTP tidak dipindah ke daftar "dipertahankan" tanpa konfirmasi ulang. |
| `assets/js/sheets.js` | `resetTahunAjaranBaru()`: `duplicateSheetAs()` dipanggil dan hasilnya dicek SEBELUM `clearRange()` untuk sheet yang sama | v56 | **KRITIS.** Tanpa ini, data tahun lama hilang permanen — bertentangan dengan kebutuhan eksplisit pemilik sistem. Lihat §37. |
| `assets/js/sheets.js` | `continue` (skip) jika `dup.status === 'error'` sebelum `clearRange` dipanggil | v56 | **KRITIS.** Fail-safe — lebih baik data ganda sementara daripada data hilang. Lihat §37. |
| `assets/js/sheets.js` | `duplicateSheetAs()` mengembalikan `status: 'sudah_ada'` jika tab arsip sudah ada — tidak overwrite | v56 | Wajib. Mencegah arsip tahun yang sama tertimpa jika reset dijalankan dua kali. |
| `assets/js/sheets.js` | Komentar `// ⚠️ ANTIREGRESI §37` di deklarasi `resetTahunAjaranBaru` dan `duplicateSheetAs` | v56 | Penanda wajib agar pola arsip-dulu tidak dihapus saat refactor. |
| `assets/js/sheets.js` | `getTahunArsipTersedia()` dan `readArsip()` tersedia dan diekspor | v56 | Wajib. Tanpa ini data arsip tidak bisa diakses dari dalam sistem — bertentangan dengan tujuan fitur. |
| `rapor/preview.html` | Bagian D memakai class `rpr-bagian-d` (bukan `abs-catatan-grid` yang dead code) | v57 | **KRITIS.** Tanpa class yang benar-benar dipakai di HTML, CSS page-break tidak pernah berlaku. Lihat §38. |
| `rapor/preview.html` | Pembungkus Keputusan memakai class `rpr-keputusan-wrap`; pembungkus TTD+tanggal memakai `rpr-ttd-wrap` | v57 | **KRITIS.** Melindungi pembungkus luar, bukan hanya div di dalamnya. Lihat §38. |
| `rapor/preview.html` | Ada pembungkus gabungan `rpr-footer-group` yang menyatukan Bagian D + Keputusan + TTD | v57 | Wajib. Pertahanan berlapis mencegah garis potong di sela antar bagian. Lihat §38. |
| `rapor/preview.html` | CSS print: `rpr-bagian-d`, `rpr-keputusan-wrap`, `rpr-keputusan`, `rpr-ttd-wrap`, `rpr-ttd`, `rpr-footer-group` semuanya `page-break-inside:avoid;break-inside:avoid` | v57 | Wajib. Semua enam class harus konsisten ada, tidak boleh sebagian dihapus saat refactor. |

---

### §39 — Nomor Seri Syahadah ISMUBA Per-Siswa (v58)

Nomor seri syahadah ISMUBA bersifat **per-siswa**, disimpan di kolom Q sheet SISWA (field `no_seri_syahadah`). Jangan dikembalikan ke skema prefix global.

| File | Yang HARUS ada | Sejak | Alasan |
|------|---------------|-------|--------|
| `assets/js/sheets.js` | `read('SISWA!A:Q')` di `getSiswa()` — bukan `A:P` | v58 | Wajib. Tanpa ini kolom Q (`no_seri_syahadah`) tidak terbaca. |
| `assets/js/sheets.js` | `no_seri_syahadah: r[16]` di return object `getSiswa()` | v58 | Wajib. Sinkron dengan range read A:Q. |
| `assets/js/sheets.js` | `siswa.no_seri_syahadah \|\| ''` sebagai elemen ke-17 di `row` di `addSiswa()` | v58 | Wajib. Tanpa ini kolom Q selalu kosong saat tambah siswa baru. |
| `ujian-sekolah/preview-ismuba.html` | `const noSertif = siswa.no_seri_syahadah \|\| ''` — bukan `noSertifPfx + noPeserta` | v58 | **KRITIS.** Nomor seri adalah data unik per-siswa; prefix global tidak bisa menghasilkan nomor yang benar. |
| `ujian-sekolah/preview-ismuba.html` | `<div class="shd-no-sertif">No. ${noSertif}</div>` ada di pg1 dan pg2, dibungkus kondisi `noSertif ?` | v58 | Wajib. Nomor harus muncul di kedua halaman; kondisi mencegah div kosong jika data belum diisi. |
| `ujian-sekolah/preview-ismuba.html` | CSS `.shd-no-sertif{text-align:right;font-size:11pt;margin-bottom:4pt}` | v58 | Wajib. Tanpa ini nomor tampil tanpa posisi rata kanan yang sesuai juknis. |
| `ujian-sekolah/config-skl.html` | Field `ismuba_no_sertif_prefix` **tidak boleh ada** di form dan `CONFIG_KEYS` | v58 | Wajib. Field ini sudah dihapus — mengembalikannya akan menimbulkan kebingungan skema lama vs baru. |

---

### §40 — Tinggi cert-page Harus Dikunci ke Satu Halaman A4 (v64)

`.cert-page` WAJIB memiliki `height:267mm` (bukan `min-height`, bukan tanpa height). Jangan dikembalikan ke `min-height:0` atau dihapus.

| File | Yang HARUS ada | Sejak | Alasan |
|------|---------------|-------|--------|
| `ujian-sekolah/preview-ismuba.html` | `.cert-page` memiliki `height:267mm` | v64 | **KRITIS.** Tanpa ini, saat cetak batch, konten pg1 siswa berikutnya (termasuk nomor surat) meluber ke bawah pg2 siswa sebelumnya. Angka 267mm = 297mm (A4) − 15mm (margin atas) − 15mm (margin bawah) sesuai `@page{margin:15mm}`. Jika margin `@page` diubah, angka ini HARUS diperbarui. |
| `ujian-sekolah/preview-ismuba.html` | `.cert-page` memiliki `box-sizing:border-box` | v64 | Wajib agar padding dalam (10mm atas/bawah) tidak menambah di luar 267mm. |
| `ujian-sekolah/preview-ismuba.html` | `.cert-page` memiliki `overflow:hidden` | v64 | Wajib agar konten yang melebihi tinggi tidak meluber ke halaman berikutnya. |

### §41 — Nomor Ijazah Per-Siswa & Struktur Kelompok A/B Transkrip Nilai (v66)

Transkrip Nilai adalah dokumen **terpisah** dari SKL (Surat Keterangan Lulus), dengan struktur berbeda (Kelompok A/B + Muatan Lokal, termasuk Bahasa Inggris/Bahasa Sunda/TIK/KKA) dan Nomor Surat sendiri. Jangan digabung dengan `preview-skl.html` atau disamakan formatnya.

Nomor Ijazah bersifat **per-siswa**, disimpan di kolom R sheet SISWA (field `no_ijazah`), diisi & disimpan **langsung dari halaman Transkrip** — bukan dari form Data Siswa. Jangan dikembalikan ke skema field global atau dipindah ke `setup/data-siswa.html` tanpa memastikan `data-siswa.html` tetap menulis dengan range tetap `SISWA!A:P` (agar tidak menimpa kolom Q/R).

| File | Yang HARUS ada | Sejak | Alasan |
|------|---------------|-------|--------|
| `assets/js/sheets.js` | `read('SISWA!A:R')` di `getSiswa()` — bukan `A:Q` | v66 | Wajib. Tanpa ini kolom R (`no_ijazah`) tidak terbaca. |
| `assets/js/sheets.js` | `no_ijazah: r[17]` di return object `getSiswa()` | v66 | Wajib. Sinkron dengan range read A:R. |
| `setup/data-siswa.html` | `updateSiswa()` tetap menulis dengan range tetap `SISWA!A${idx+1}:P${idx+1}` — TIDAK diperluas ke Q/R | v66 | **KRITIS.** Jika range diperluas tanpa membawa nilai `no_seri_syahadah`/`no_ijazah` yang sudah ada, data akan tertimpa kosong setiap kali admin edit data siswa dari halaman itu. |
| `ujian-sekolah/preview-transkrip.html` | `saveNoIjazah()` membaca ulang `SISWA!A:R` untuk menemukan nomor baris sebelum `write('SISWA!R${idx+1}', ...)` — bukan memakai index dari `allSiswa` yang sudah difilter/di-sort ulang | v66 | **KRITIS.** Nomor baris di sheet harus dicari fresh; memakai index array lokal (yang sudah disortir/difilter untuk tampilan) akan menulis ke baris siswa yang salah. |
| `ujian-sekolah/preview-transkrip.html` | Konstanta `TRS_KEL_A`, `TRS_KEL_B`, `TRS_MULOK` terpisah dari `LAMP_DEF` di `preview-skl.html` — TIDAK saling dipakai ulang | v66 | Wajib. Struktur Transkrip (Kelompok A/B + Muatan Lokal a–d) berbeda total dari struktur SKL (8 mapel datar, §21). Menyatukan definisi akan merusak salah satu format saat salah satu diubah. |
| `ujian-sekolah/preview-transkrip.html` | Item `d. Koding dan Kecerdasan Artifisial` (`key:'kka'`) ada di `TRS_MULOK`, urutan **setelah** `c. Teknologi Informasi dan Komunikasi` | v66 | Wajib. Permintaan eksplisit — KKA harus tampil tepat di bawah TIK/Informatika. |
| `ujian-sekolah/config-skl.html` | `map_bing`, `map_tik`, `map_kka` ada di `SKL_KEYS` (aktif kembali sejak v66) | v66 | **Wajib.** Field ini sempat dihapus dari `SKL_KEYS` di §21 karena SKL tidak lagi memakainya — tapi Transkrip Nilai butuh ketiganya. Jangan hapus lagi tanpa memeriksa dulu apakah `preview-transkrip.html` masih ada. |
| `ujian-sekolah/config-skl.html` | Field `transkrip_no_urut_awal`, `transkrip_no_kode2`, `transkrip_no_kode3`, `transkrip_no_kode4`, `transkrip_tahun` — terpisah dari `skl_no_*` | v66 | Wajib. Format Nomor Transkrip berbeda dari Nomor SKL (urut naik penuh per siswa: 133,134,135,…, bukan sub-urut `.01` per siswa dari basis yang sama). Jangan disatukan. |

---

*Dokumen ini dibuat 07 Mei 2026 — terakhir diperbarui 03 Juli 2026 (v66). Wajib diperbarui setiap kali ditemukan pola regresi baru.*
*Sistem: SD Muhammadiyah 01 Kukusan — Aplikasi Penilaian*
