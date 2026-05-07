# ANTIREGRESI.md — Panduan Pencegahan Regresi

> **Tujuan dokumen ini:** Setiap perbaikan bug di masa lalu pernah merusak fungsi lain yang sebelumnya sudah bekerja (regresi). Dokumen ini merangkum pola-pola regresi yang sudah terjadi, zona-zona risiko tinggi, dan checklist wajib yang harus dilakukan sebelum dan sesudah setiap perubahan kode.

---

## 🔴 Riwayat Regresi yang Pernah Terjadi

| Versi | File yang Diubah | Fungsi yang Rusak | Pola Penyebab |
|-------|-----------------|-------------------|---------------|
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

## ✅ Checklist Universal Sebelum Commit / Deploy

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

### Umum:
- [ ] Perubahan apapun di `sheets.js` → update `CHANGELOG.md` dengan penanda kode di bagian 🔍
- [ ] Jika menemukan pola regresi baru → tambahkan ke dokumen ini

---

## 📌 Penanda Kode Kumulatif (Semua Versi)

Tabel ini merangkum semua penanda kode yang wajib ada dan **tidak boleh dihapus** tanpa alasan yang jelas.

| File | Penanda Kode | Ditambahkan | Keterangan |
|------|-------------|-------------|------------|
| `assets/js/sheets.js` | `saveNilaiUSBatch,` (di blok return) | v13 | Hotfix — pernah hilang dan menyebabkan error save nilai US |
| `assets/js/sheets.js` | `append('SETORAN_TT!A1', [row])` | v10 | Anchor A1 wajib agar data tidak ditulis ke kolom acak |
| `assets/js/sheets.js` | `// Tahun sengaja tidak difilter` | v10 | Format tahun tidak konsisten — filter tahun sengaja dihilangkan |
| `assets/js/sheets.js` | `String(r[0]\|\|'').trim() === String(id).trim()` | v10 | Trim wajib agar findIndex tidak mismatch karena spasi |
| `ujian-sekolah/input-nilai-us.html` | `mapelIds.includes(m.id)` | v9 | Filter mapel berdasarkan ID (bukan nama) |
| `ujian-sekolah/input-rata-rapor.html` | `mapelIds.includes(m.id)` | v9 | Idem |
| `siswa/mutasi.html` | `const payload = pendingPayload` | v1 | Simpan referensi lokal sebelum tutupModal() |
| `siswa/mutasi.html` | `kelasDiampuArr` | v12 | Gabungan kelas utama+mapel untuk load siswa multi-kelas |
| `penilaian/input-setoran-tt.html` | `m.startsWith('[')` di forEach lulusSet | v11 | Expand JSON array materi untuk progress bar multi-materi |
| `dashboard/guru-kelas.html` | `hasKelas6` | v1/SAJ-05 | Visibilitas menu SAJ kondisional |
| `dashboard/guru-kelas.html` | `navSAJLabel` | v1/SAJ-05 | ID elemen nav SAJ |

---

*Dokumen ini dibuat 07 Mei 2026 — wajib diperbarui setiap kali ditemukan pola regresi baru.*
*Sistem: SD Muhammadiyah 01 Kukusan — Aplikasi Penilaian*
