## [2026-05-01] — v6 · Sesi 10 · Generate Dokumen SKL (.docx)

### ✨ Fitur Baru

---

### SKL-01 · `ujian-sekolah/templates/tpl_skl.docx` · Template SKL *(file baru)*

Template Word Surat Keterangan Lulus yang sudah dikonversi dari format MERGEFIELD Word menjadi sintaks `{field}` docxtemplater. Semua teks merah (placeholder) di dokumen asli kini menjadi variabel yang diisi otomatis saat generate.

**Field yang tersedia:**

| Field | Isi |
|-------|-----|
| `{no_surat}` | Nomor surat lengkap, misal `101/KET/III.4.AU/A/2025` |
| `{nama_siswa}` | Nama siswa huruf kapital |
| `{tempat_lahir}` | Tempat lahir siswa |
| `{tgl_lahir}` | Tanggal lahir format "18 Juni 2013" |
| `{nama_orang_tua}` | Nama wali/orang tua |
| `{nis}` | Nomor Induk Sekolah |
| `{nisn}` | Nomor Induk Siswa Nasional |
| `{rerata}` | Rata-rata nilai ijazah, 2 desimal pakai koma (misal `84,80`) |

---

### SKL-02 · `ujian-sekolah/templates/tpl_lampiran.docx` · Template Lampiran SKL *(file baru)*

Template Word Lampiran Nilai Ijazah, dikonversi dengan cara yang sama. Berisi tabel nilai per mata pelajaran.

**Field yang tersedia:** semua field SKL-01 di atas, ditambah:

| Field | Mata Pelajaran |
|-------|----------------|
| `{pai}` | Pendidikan Agama Islam dan Budi Pekerti |
| `{pp}` | Pendidikan Pancasila |
| `{bind}` | Bahasa Indonesia |
| `{mtk}` | Matematika |
| `{ipas}` | Ilmu Pengetahuan Alam dan Sosial |
| `{sb}` | Seni Budaya |
| `{pjok}` | Pend. Jasmani, Olahraga, dan Kesehatan |
| `{bing}` | Bahasa Inggris |
| `{bsund}` | Bahasa dan Sastra Sunda (Mulok) |
| `{tik}` | Informatika/TIK |
| `{kka}` | Koding dan Kecerdasan Artifisial |

Nilai di lampiran menggunakan **bilangan bulat** (dibulatkan), bukan desimal.

**Catatan teknis:** Field `{kka}` sebelumnya hardcoded angka merah `84` di template asli (tanpa MERGEFIELD). Telah dikonversi menjadi placeholder `{kka}` secara programatik. Field dengan nilai `null`/kosong akan tampil sebagai string kosong (bukan error).

---

### SKL-03 · `ujian-sekolah/config-skl.html` · Halaman Konfigurasi SKL *(file baru)*

**Hak akses:** `admin` saja.

Halaman pengaturan terpusat untuk semua data statis yang digunakan dalam dokumen SKL. Data disimpan ke sheet `CONFIG` via `SHEETS.setConfig()`.

**Empat seksi konfigurasi:**

**1. Nomor Surat SKL**
- `skl_no_urut_awal` — nomor urut dimulai (tiga digit). Setiap siswa mendapat nomor urut yang berbeda secara berurutan. Preview nomor surat ditampilkan langsung.
- `skl_no_surat_suffix` — bagian tetap setelah nomor urut, misal `/KET/III.4.AU/A/2025`.

**2. Tanggal & Tahun Ajaran**
- `skl_tahun_ajaran` — format strip: `2024-2025`
- `skl_tahun_ajaran_slash` — format slash: `2024/2025`
- `skl_tgl_rapat` — tanggal rapat dewan guru (teks bebas)
- `skl_tgl_penetapan` — tanggal penetapan/tanda tangan SKL

**3. Kepala Sekolah & Sekolah**
- `skl_kepsek_nama` — nama kepala sekolah
- `skl_kepsek_nbm` — NBM kepala sekolah
- `skl_no_sk` — nomor SK kelulusan kepala sekolah
- `skl_kota` — kota penetapan (default: Depok)

**4. Pemetaan Mata Pelajaran**
Memetakan field template (`pai`, `pp`, dst.) ke nama mapel di database sheet MAPEL. Pencocokan bersifat case-insensitive. Jika mapel tidak ada di sekolah, kosongkan.

**5. Proporsi Nilai Ijazah**
- `skl_bobot_rapor` — bobot rata-rata rapor (%) dalam nilai ijazah
- `skl_bobot_us` — bobot nilai ujian sekolah (%) dalam nilai ijazah
- `skl_bobot_us_tertulis` — bobot ujian tertulis dalam nilai US
- `skl_bobot_us_praktik` — bobot ujian praktik dalam nilai US

Total bobot divalidasi sebelum disimpan (harus 100%).

---

### SKL-04 · `ujian-sekolah/generate-skl.html` · Halaman Generate Dokumen SKL *(file baru)*

**Hak akses:** `admin`, `guru_kelas` (kelas 6).

Halaman utama untuk membuat file `.docx` SKL dan Lampiran per siswa, kemudian mengunduhnya sebagai arsip ZIP.

**Library yang digunakan (CDN, tanpa instalasi):**
- `PizZip 3.1.6` — membaca file DOCX (ZIP-based)
- `Docxtemplater 3.50.0` — mengisi template `{field}`
- `JSZip 3.10.1` — menggabungkan banyak DOCX ke satu ZIP
- `FileSaver.js 2.0.5` — mengunduh file dari browser

**Alur kerja:**
1. Pilih kelas → daftar siswa kelas 6 muncul sebagai card checklist
2. Centang siswa yang akan digenerate (atau "Pilih Semua")
3. Pilih jenis dokumen: SKL, Lampiran, atau keduanya
4. Klik **Generate & Unduh ZIP** → sistem:
   - Mengambil nilai rata-rata rapor dan nilai US dari database
   - Menghitung nilai ijazah per mapel (formula sesuai bobot di config)
   - Mengisi template dengan data siswa
   - Menampilkan progress real-time per siswa
5. Klik **Unduh ZIP** → file diunduh

**Logika nilai:**
- `Nilai US mapel = (Tertulis × bobotT%) + (Praktik × bobotP%)`
- `Nilai Ijazah mapel = (Rata-rata Rapor × bobotR%) + (Nilai US × bobotU%)`
- SKL → `rerata` = rata-rata nilai ijazah seluruh mapel, format `84,80` (2 desimal, koma)
- Lampiran → nilai per mapel dibulatkan ke bilangan bulat

**Penomoran surat:** Siswa pertama di daftar mendapat nomor `no_urut_awal`, siswa berikutnya `+1`, dst. Urutan mengikuti urutan alfabet nama.

**Format nama file output:**
- SKL: `SKL_101_AFIFA_NAHDA_HAIRA.docx`
- Lampiran: `Lampiran_101_AFIFA_NAHDA_HAIRA.docx`
- ZIP: `SKL_6A_2026-05-01.zip`

**Peringatan data tidak lengkap:**
- Siswa dengan TTL kosong ditandai `⚠️ TTL kosong` pada card
- Siswa dengan nama wali kosong ditandai `⚠️ nama wali kosong`
- Field kosong pada output DOCX akan tampil sebagai teks kosong (tidak crash)

---

### SKL-05 · `assets/js/sheets.js` · Tiga kolom baru di sheet SISWA (M, N, O)

**File:** `assets/js/sheets.js`

Tiga field baru ditambahkan ke struktur data siswa untuk kebutuhan dokumen SKL:

| Kolom Sheet | Field JS | Keterangan |
|-------------|----------|------------|
| M | `tempat_lahir` | Tempat lahir siswa |
| N | `tgl_lahir` | Tanggal lahir format `YYYY-MM-DD` (dari `<input type="date">`) |
| O | `nama_wali` | Nama wali/orang tua untuk dokumen resmi |

**Perubahan fungsi:**
- `getSiswa()` — range baca diperluas `SISWA!A:L` → `SISWA!A:O`, objek return ditambah 3 field baru
- `addSiswa()` — row yang di-append diperluas dengan 3 kolom baru (kolom M, N, O)

**Backward compatible:** Siswa yang sudah ada di sheet (kolom M–O kosong) akan mengembalikan string kosong untuk ketiga field baru, tidak error.

---

### SKL-06 · `setup/data-siswa.html` · Form input TTL dan nama wali

**File:** `setup/data-siswa.html`

Ditambahkan tiga field baru di formulir input/edit data siswa, di bawah seksi Nomor HP dengan pemisah visual:

```
── Data Kelahiran & Wali ──────────────────────────
Tempat Lahir        [input text]
Tanggal Lahir       [input date]
Nama Wali / Orang Tua (untuk dokumen SKL/ijazah)
                    [input text]
```

**Perubahan teknis:**
- `populateForm()` — mengisi ketiga field saat mode edit
- `resetForm()` — menghapus nilai ketiga field saat reset
- `saveData()` — menyertakan `tempat_lahir`, `tgl_lahir`, `nama_wali` dalam objek data
- Inline edit write range: `SISWA!A:L` → `SISWA!A:O`, row data diperluas 3 kolom
- Delete (blank row): array dikosongkan diperluas dari 12 ke 15 elemen

**Catatan `nama_wali`:** Dipisahkan dari `nama_ayah`/`nama_ibu` karena di dokumen resmi (SKL/ijazah) yang muncul adalah satu nama, biasanya nama ayah atau wali yang secara resmi bertanggung jawab. Kolom `nama_ayah`, `nama_ibu`, dll. tetap ada untuk rapor.

Pada generate dokumen SKL, field `nama_orang_tua` diisi dengan prioritas: `nama_wali` → fallback ke `nama_ayah`.

---

### SKL-07 · Navbar ujian-sekolah — tambah menu Generate & Konfigurasi SKL

**File yang dimodifikasi:** `input-rata-rapor.html`, `input-nilai-us.html`, `preview-skl.html`, `dashboard/admin.html`, `dashboard/guru-kelas.html`

Dua nav item baru ditambahkan di semua sidebar modul Ujian Sekolah/SAJ:
- 📄 **Generate Dokumen SKL** → `generate-skl.html`
- ⚙️ **Konfigurasi SKL** → `config-skl.html` *(admin saja, tapi link tetap tampil — halaman akan memblokir jika bukan admin)*

Di `guru-kelas.html`, `navGenerateSKL` ditambahkan ke array toggle `hasKelas6` sehingga juga tersembunyi untuk guru non-kelas-6.

---

### ⚠️ Persiapan Tambahan

**Sheet SISWA — kolom baru (M, N, O):**
Tidak perlu membuat sheet baru, cukup tambahkan header di baris pertama kolom yang masih kosong:

| Kolom | Header |
|-------|--------|
| M | `tempat_lahir` |
| N | `tgl_lahir` |
| O | `nama_wali` |

**Folder templates:**
Letakkan kedua file template di dalam folder `ujian-sekolah/templates/`:
```
ujian-sekolah/
  templates/
    tpl_skl.docx
    tpl_lampiran.docx
```
File template ini diakses langsung dari browser via `fetch()`, pastikan server dapat menyajikan file `.docx`.

---

### 📋 Ringkasan File yang Diubah/Dibuat (v6)

| File | Status | Keterangan |
|------|--------|------------|
| `ujian-sekolah/templates/tpl_skl.docx` | **Baru** | Template SKL dengan placeholder `{field}` |
| `ujian-sekolah/templates/tpl_lampiran.docx` | **Baru** | Template Lampiran dengan placeholder `{field}` |
| `ujian-sekolah/config-skl.html` | **Baru** | Konfigurasi data statis SKL (admin only) |
| `ujian-sekolah/generate-skl.html` | **Baru** | Generate & unduh DOCX SKL per siswa dalam ZIP |
| `ujian-sekolah/input-rata-rapor.html` | **Diubah** | +nav Generate & Konfigurasi SKL |
| `ujian-sekolah/input-nilai-us.html` | **Diubah** | +nav Generate & Konfigurasi SKL |
| `ujian-sekolah/preview-skl.html` | **Diubah** | +nav Generate & Konfigurasi SKL |
| `assets/js/sheets.js` | **Diubah** | +kolom M–O (tempat_lahir, tgl_lahir, nama_wali) di getSiswa & addSiswa |
| `setup/data-siswa.html` | **Diubah** | +form fields TTL & nama wali, write range A:O |
| `dashboard/admin.html` | **Diubah** | +nav Generate & Konfigurasi SKL |
| `dashboard/guru-kelas.html` | **Diubah** | +nav Generate SKL (toggle kelas 6) |

### 🔍 Penanda Kode Baru — tambahkan ke tabel Anti-Regresi

| File | Penanda Kode — harus selalu ada |
|------|----------------------------------|
| `assets/js/sheets.js` | `tempat_lahir` (getSiswa map) |
| `assets/js/sheets.js` | `SISWA!A:O` |
| `setup/data-siswa.html` | `f_tempat_lahir` |
| `setup/data-siswa.html` | `f_nama_wali` |
| `ujian-sekolah/generate-skl.html` | `PizZip` |
| `ujian-sekolah/generate-skl.html` | `Docxtemplater` |

---

*Dibuat: 1 Mei 2026 (v6) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
