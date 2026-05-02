## [2026-05-02] — v8 · Sesi 12 · Perbaikan Generate Dokumen SKL & Fuzzy Matching Mapel

### 🐛 Perbaikan Bug

---

### v8-01 · `ujian-sekolah/generate-skl.html` · Error "PizZip is not defined" & ZIP kosong

**Root cause 1 — CDN diblokir:**
Script CDN (`cdnjs.cloudflare.com`) tidak dapat dimuat di lingkungan hosting yang memblokir domain eksternal. Akibatnya semua library (`PizZip`, `docxtemplater`, `JSZip`, `FileSaver`) tidak terdefinisi → setiap generate langsung error.

**Solusi:** Semua library dipindahkan ke folder `ujian-sekolah/libs/` dan dimuat secara lokal.

| File | Sumber | Ukuran |
|------|--------|--------|
| `libs/pizzip.min.js` | PizZip 3.1.6 | 79 KB |
| `libs/docxtemplater.min.js` | Docxtemplater 3.50.0 | 101 KB |
| `libs/jszip.min.js` | JSZip 3.10.1 | 96 KB |
| `libs/FileSaver.min.js` | FileSaver.js 2.0.5 | 3 KB |

**Root cause 2 — Salah nama global `Docxtemplater`:**
Bundle `docxtemplater.min.js` mengekspos `window.docxtemplater` (huruf kecil semua), bukan `window.Docxtemplater`. Kode lama memakai `new Docxtemplater(...)` → `ReferenceError: Docxtemplater is not defined`.

**Solusi:** `fillDocx()` diperbarui:
```javascript
const Docx = window.docxtemplater || window.Docxtemplater;
const zip  = new window.PizZip(templateBuf);
const doc  = new Docx(zip, { ... });
```
Juga ditambahkan pesan error yang jelas jika library tetap tidak termuat.

**Root cause 3 — `JSZip` dan `saveAs` juga butuh `window.` prefix:**
`new JSZip()` dan `saveAs(blob, ...)` diganti menjadi `new window.JSZip()` dan `window.saveAs(blob, ...)` agar konsisten dan tidak tergantung pada scope variabel global.

---

### v8-02 · `ujian-sekolah/generate-skl.html` & `preview-skl.html` · Fuzzy matching nama mata pelajaran

**Masalah:**
Beberapa mata pelajaran (PJOK, Bahasa Sunda, TIK/Informatika) tidak muncul nilainya karena pencocokan nama menggunakan **exact match case-insensitive** — nama di konfigurasi SKL harus persis sama dengan nama di sheet MAPEL.

Contoh kegagalan:
- Konfigurasi: `"Pendidikan Jasmani, Olahraga, dan Kesehatan"`
- Sheet MAPEL: `"Penjasorkes"` atau `"PJOK"`
- Hasil: tidak cocok → nilai kosong

**Solusi — fungsi `findMapelFuzzy(namaCfg)`:**

Empat tahap pencocokan secara berurutan (berhenti di tahap pertama yang berhasil):

1. **Exact match** — nama config = nama mapel (case-insensitive)
2. **Config contains mapel** — nama config mengandung nama mapel (untuk config yang lebih panjang dari nama mapel di database)
3. **Mapel contains config** — nama mapel mengandung nama config (kebalikannya)
4. **Keyword match** — setiap kata panjang (>3 huruf, bukan stopword) dari config harus ada di nama mapel. Stopword: `dan, atau, budi, pekerti, jasmani, olahraga`

**Contoh hasil:**

| Konfigurasi | Nama di MAPEL | Tahap cocok |
|------------|---------------|-------------|
| `Pendidikan Jasmani, Olahraga, dan Kesehatan` | `PJOK` | — |
| `PJOK` | `Pendidikan Jasmani Olahraga Kesehatan` | Tahap 3 |
| `Penjasorkes` | `PJOK` | — (perlu manual) |
| `Bahasa dan Sastra Sunda` | `B. Sunda` | Tahap 4: `bahasa`, `sastra`, `sunda` |
| `Informatika/TIK` | `Informatika` | Tahap 3 |
| `Koding dan Kecerdasan Artifisial` | `KKA` | — (perlu manual) |

**Rekomendasi:** Untuk mapel dengan singkatan tidak standar (PJOK, KKA, B.Sunda), isi kolom **Pemetaan Mata Pelajaran** di Konfigurasi SKL dengan **nama persis** seperti di sheet MAPEL.

Fungsi diterapkan di:
- `generate-skl.html` — fungsi `getMapelNilai()` dan blok hitung `semuaNilai`
- `preview-skl.html` — fungsi `nilaiByKey()`

---

### 📋 Ringkasan File yang Diubah (v8)

| File | Status | Keterangan |
|------|--------|------------|
| `ujian-sekolah/generate-skl.html` | **Diubah** | CDN → lokal, fix Docxtemplater lowercase, fuzzy matching |
| `ujian-sekolah/preview-skl.html` | **Diubah** | Fuzzy matching nama mapel |
| `ujian-sekolah/libs/pizzip.min.js` | **Baru** | PizZip 3.1.6 lokal |
| `ujian-sekolah/libs/docxtemplater.min.js` | **Baru** | Docxtemplater 3.50.0 lokal |
| `ujian-sekolah/libs/jszip.min.js` | **Baru** | JSZip 3.10.1 lokal |
| `ujian-sekolah/libs/FileSaver.min.js` | **Baru** | FileSaver.js 2.0.5 lokal |

### ⚠️ Deployment

Folder `ujian-sekolah/libs/` harus ikut di-deploy bersama file HTML. Keempat file `.js` di dalamnya wajib ada agar generate DOCX berfungsi.

### 🔍 Penanda Kode Baru — Anti-Regresi

| File | Penanda |
|------|---------|
| `ujian-sekolah/generate-skl.html` | `libs/pizzip.min.js` |
| `ujian-sekolah/generate-skl.html` | `window.docxtemplater` |
| `ujian-sekolah/generate-skl.html` | `findMapelFuzzy` |
| `ujian-sekolah/preview-skl.html` | `findMapelFuzzy` |

---

*Dibuat: 2 Mei 2026 (v8) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
