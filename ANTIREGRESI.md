# ANTIREGRESI.md — Panduan Pencegahan Regresi

> **Tujuan dokumen ini:** Setiap perbaikan bug di masa lalu pernah merusak fungsi lain yang sebelumnya sudah bekerja (regresi). Dokumen ini merangkum pola-pola regresi yang sudah terjadi, zona-zona risiko tinggi, dan checklist wajib yang harus dilakukan sebelum dan sesudah setiap perubahan kode.

---

## 🔴 Riwayat Regresi yang Pernah Terjadi

| Versi | File yang Diubah | Fungsi yang Rusak | Pola Penyebab |
|-------|-----------------|-------------------|---------------|
| v19 | `ujian-sekolah/config-skl.html`, `dashboard/guru-kelas.html`, `ujian-sekolah/input-nilai-us.html` | Akses Konfigurasi SKL guru kelas 6 + sinkronisasi bobot | `requireLogin` hanya mengizinkan `admin`; menu tidak ada di dashboard; input bobot editable di halaman yang salah; `updateBobot()` tidak dipanggil setelah config dimuat |
| v18 | `penilaian/input-nilai.html` | `eksekusiImport` — gagal 429 | Per-row API call (`append` dipanggil satu kali per siswa per TP di dalam loop) → rate limit Google Sheets API |
| v10 | `assets/js/sheets.js` | `saveNilaiUSBatch` | Blok `return { … }` diedit tapi satu fungsi terlewat tidak diekspor |
| v8 | `ujian-sekolah/input-nilai-us.html` | Filter mapel guru_mapel | Asumsi salah tentang format data (`currentUser.mapel` berisi ID, bukan nama) — langsung digantikan v9 |

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
| `sheets.js` | `append('NILAI_US'` — **TIDAK boleh ada** (harus pakai `NILAI_US!A1` atau via `toAppend` batch) |

> Catatan: fungsi `saveNilaiUSBatch` menggunakan `append('NILAI_US', toAppend)` (tanpa anchor) karena merupakan batch append — ini masih berisiko jika sheet pernah memiliki data di kolom jauh. Pertimbangkan mengganti ke `append('NILAI_US!A1', toAppend)` di masa depan.

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

### Umum:
- [ ] Perubahan apapun di `sheets.js` → update `CHANGELOG.md` dengan penanda kode di bagian 🔍
- [ ] Jika menemukan pola regresi baru → tambahkan ke dokumen ini

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

---

*Dokumen ini dibuat 07 Mei 2026 — terakhir diperbarui 20 Mei 2026 (v19). Wajib diperbarui setiap kali ditemukan pola regresi baru.*
*Sistem: SD Muhammadiyah 01 Kukusan — Aplikasi Penilaian*
