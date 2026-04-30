## [2026-04-30] — v5 · Sesi 9 · Fitur Ujian Sekolah / Sumatif Akhir Jenjang (SAJ)

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

*Dibuat: 30 April 2026 (v5) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
