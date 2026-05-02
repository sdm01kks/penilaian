## [2026-05-02] — v10 · Sesi 14 · Perbaikan Kritis Generate SKL, Input US, Tahsin Filter, Fuzzy Mapel, Ekskul

### 🐛 Perbaikan Bug

---

### v10-01 · `ujian-sekolah/templates/tpl_skl.docx` & `tpl_lampiran.docx` · Template dibangun ulang

**Masalah:** Generate SKL hanya menghasilkan data biodata + penutup, tanpa isi surat (paragraf pembuka, dasar hukum, "-------- LULUS --------", dll).

**Root cause:** Script konversi template sebelumnya menggunakan regex DOTALL yang terlalu greedy. Setelah mengganti MERGEFIELD pertama, regex "melompat" ke end tag berikutnya yang jauh, memakan seluruh isi surat di antaranya. Semua 78 paragraf body text hilang.

**Solusi:** Template dikonversi ulang dengan algoritma state-machine yang mencari posisi setiap field secara tepat:
1. Temukan `fldChar begin` → catat posisi awal run yang membungkusnya
2. Temukan `instrText(MERGEFIELD fieldname)` setelah begin
3. Temukan `fldChar separate` → lewati display runs
4. Temukan `fldChar end` → catat posisi akhir
5. Ganti seluruh blok dengan `<w:r><w:t>{fieldname}</w:t></w:r>` Times New Roman 12pt
6. Proses dari belakang ke depan agar posisi tidak bergeser

**Hasil verifikasi template baru:**
- `tpl_skl.docx`: 8 field, 78 teks body (termasuk "SURAT KETERANGAN KELULUSAN", "Yang bertanda tangan...", "Berdasarkan Hasil Rapat...", "-------- LULUS --------", dll.)
- `tpl_lampiran.docx`: 18 field (termasuk `{kka}`), semua paragraf body terjaga

---

### v10-02 · `ujian-sekolah/input-nilai-us.html` · `showProgress is not defined`

**Masalah:** Error `ReferenceError: showProgress is not defined` saat klik Simpan.

**Root cause:** Fungsi `showProgress()` dan `hideProgress()` ada di `input-rata-rapor.html` tapi tidak pernah berhasil ditambahkan ke `input-nilai-us.html` pada patch sebelumnya karena string target tidak cocok.

**Solusi:** Fungsi ditambahkan langsung sebelum `toggleSidebar` di bagian akhir script.

---

### v10-03 · `ujian-sekolah/input-rata-rapor.html` & `input-nilai-us.html` · Filter Tahsin-Tahfizh

**Masalah:** Mata pelajaran Tahsin-Tahfizh masih muncul di tabel input nilai rata-rata rapor dan nilai ujian sekolah.

**Root cause:** Filter `TAHSIN_KW` hanya ada di `preview-skl.html` dan `generate-skl.html`, belum diterapkan di halaman input.

**Solusi:** Filter ditambahkan di keduanya segera setelah `allMapel` dimuat:
```javascript
const TAHSIN_KW = ['tahsin','tahfizh','tahfidz'];
allMapel = allMapel.filter(m => {
  const n = (m.nama||'').toLowerCase();
  return !TAHSIN_KW.some(k => n.includes(k));
});
```

---

### v10-04 · `ujian-sekolah/preview-skl.html` & `generate-skl.html` · Fuzzy matching Bahasa Sunda & Informatika/TIK

**Masalah:** Nilai Bahasa Sunda dan Informatika/TIK tidak muncul di preview/generate SKL meskipun sudah diisi di konfigurasi.

**Root cause:** Fuzzy matching tidak menangani kasus:
- Config: `"Bahasa dan Sastra Sunda"` → DB: `"Bahasa Sunda"` (DB lebih pendek, config contains DB) ✓ ditangani
- Config: `"Informatika"` → DB: `"Teknologi Informasi dan Komunikasi"` (keduanya tidak saling contains) ✗ gagal

**Solusi:** `findMapelFuzzy()` diperluas dengan dua level tambahan:
- **Tahap 5 — Partial keyword:** jika setidaknya setengah kata kunci cocok (menangani kasus config pendek vs nama mapel panjang)
- **Tahap 6 — TIK special case:** deteksi khusus kata kunci `tik`, `informatika`, `teknologi informasi` dari kedua sisi

---

### v10-05 · `setup/ekskul.html` · Pembina tidak tersimpan + modal terlalu kecil

**Masalah A — Pembina tidak tersimpan:**

Root cause: ID form field adalah `f_pembina` tapi kode simpan membaca dari `form-pembina` (ID lama yang tidak ada di DOM). Akibatnya `getElementById('form-pembina')` selalu `null`, pembina tidak pernah tersimpan.

Solusi: Semua referensi `form-pembina` diganti menjadi `f_pembina`.

**Masalah B — Modal terlalu kecil:**

Sebelum: `max-width: 480px` — terlalu sempit untuk menampilkan 4 kolom KKTP beserta deskripsi panjang.

Sesudah:
- `max-width: 780px`
- Grid KKTP diubah dari `1fr 1fr 1fr 1fr` → `1fr 1fr` (2 kolom, 2 baris) — setiap level mendapat lebih banyak ruang untuk teks deskripsi

---

### 📋 Ringkasan File yang Diubah (v10)

| File | Status | Keterangan |
|------|--------|------------|
| `ujian-sekolah/templates/tpl_skl.docx` | **Dibangun ulang** | Semua 78 teks body terjaga, 8 field tepat |
| `ujian-sekolah/templates/tpl_lampiran.docx` | **Dibangun ulang** | Semua teks body terjaga, 18 field tepat |
| `ujian-sekolah/input-nilai-us.html` | **Diubah** | +`showProgress`/`hideProgress`, +filter Tahsin |
| `ujian-sekolah/input-rata-rapor.html` | **Diubah** | +filter Tahsin-Tahfizh |
| `ujian-sekolah/preview-skl.html` | **Diubah** | Fuzzy matching TIK + partial keyword |
| `ujian-sekolah/generate-skl.html` | **Diubah** | Fuzzy matching TIK + partial keyword |
| `setup/ekskul.html` | **Diubah** | Fix ID `form-pembina`→`f_pembina`, modal 780px, KKTP 2 kolom |

### ⚠️ Template DOCX harus diperbarui

Kedua file `ujian-sekolah/templates/tpl_skl.docx` dan `tpl_lampiran.docx` **wajib diganti** dengan versi baru dari patch ini. File lama menghasilkan dokumen tanpa isi surat.

---

*Dibuat: 2 Mei 2026 (v10) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
