# CHANGELOG — Sistem Penilaian SD Muhammadiyah 01 Kukusan

---

## [2025-04-29] — Perbaikan Bug Pembagian Tugas Guru

### 🐛 Bug yang Diperbaiki

---

### BUG-001 · `sheets.js` · `getUsers()` tidak membaca kolom K (kelas_mapel)

**File:** `assets/js/sheets.js`  
**Fungsi:** `getUsers()`  
**Dampak:** Kritis — menyebabkan seluruh fitur pembagian tugas tidak bisa di-load

**Akar masalah:**  
`getUsers()` membaca range `USERS!A:J` (10 kolom, A–J). Padahal `kelas_mapel` tersimpan di kolom K (index 10).
Karena kolom K tidak pernah dibaca, objek user yang dikembalikan tidak memiliki field `kelas_mapel` maupun `kelasMapelList`.

**Akibat:**
- Di `kelola-guru.html`, fungsi `bukaEdit()` mencoba membaca `u.kelasMapelList` dan `u.kelasMapel` → selalu `undefined`
- Checkbox kelas tambahan pada form edit guru tidak pernah tercentang, meski data sudah tersimpan di Google Sheet
- Jika admin men-save tanpa sadar, `kelas_mapel` yang ada di sheet akan tertimpa menjadi kosong

**Perbaikan:**
- Range diubah dari `'USERS!A:J'` menjadi `'USERS!A:K'`
- Ditambahkan tiga field baru ke objek yang dikembalikan:
  - `kelas_mapel` — string raw (e.g. `"5B,6C"`)
  - `kelasMapel` — alias untuk kompatibilitas kelola-guru.html
  - `kelasMapelList` — array hasil split (e.g. `["5B", "6C"]`)

---

### BUG-002 · `sheets.js` · `addUser()` tidak menyimpan kolom K (kelas_mapel)

**File:** `assets/js/sheets.js`  
**Fungsi:** `addUser()`  
**Dampak:** Tinggi — guru baru yang ditambahkan tidak pernah memiliki data kelas_mapel di sheet

**Akar masalah:**  
`addUser()` hanya menulis 10 kolom (A–J) ke Google Sheet. Kolom K (`kelas_mapel`) tidak disertakan dalam array `row`, sehingga selalu kosong untuk guru yang baru dibuat.

Berbeda dengan `updateUser()` di `kelola-guru.html` yang sudah menulis hingga kolom K dengan `USERS!A:K`, fungsi `addUser()` di `sheets.js` tertinggal dan tidak konsisten.

**Perbaikan:**
- Ditambahkan `user.kelas_mapel || ''` sebagai elemen ke-11 di array `row`

---

### BUG-003 · `auth.js` · Session tidak menyimpan `kelasList` gabungan

**File:** `assets/js/auth.js`  
**Fungsi:** `_verifikasiAkses()`  
**Dampak:** Tinggi — guru_kelas merangkap tidak dapat mengakses kelas tambahan di halaman mapel-tp, input-setoran-tt, input-absensi, dll.

**Akar masalah:**  
Session data yang disimpan ke `sessionStorage` tidak memiliki field `kelasList`. Banyak halaman (mapel-tp.html, input-setoran-tt.html, input-ekskul.html, rapor/preview.html, dll.) menggunakan pola:
```js
const arr = (currentUser.kelasList || currentUser.kelas?.split(',') || [])
```
Karena `kelasList` tidak ada, fallback ke `currentUser.kelas?.split(',')` — yang hanya berisi kelas utama guru, tidak termasuk `kelas_mapel`.

Akibatnya, guru_kelas yang merangkap sebagai guru mapel di kelas lain:
- Tidak bisa memilih kelas tambahan di dropdown filter
- Tidak bisa setup TP untuk kelas tambahan
- Tidak bisa menginput setoran tahsin-tahfizh untuk kelas tambahan

**Perbaikan:**
- Ditambahkan komputasi `kelasListGabung` yang menggabungkan kelas utama dan kelas_mapel menggunakan `Set` (untuk menghindari duplikasi)
- `kelasList` ditambahkan ke `userData` yang disimpan ke session

---

### 💡 Catatan Teknis: Sheet "Guru" di Google Sheets

Sheet bernama `Guru` di database Google Sheets tidak direferensikan oleh kode aplikasi manapun. Aplikasi menggunakan sheet `USERS` sebagai sumber data guru. Sheet `Guru` kemungkinan adalah:
- Sheet legacy/manual dari sebelum aplikasi ini dibuat, atau
- Sheet ringkasan/tampilan yang dibuat manual oleh admin

Sheet `Guru` bisa dimanfaatkan sebagai **mirror read-only** data dari `USERS` menggunakan formula Google Sheets (misalnya `=QUERY(USERS!A:K,...)`) untuk keperluan pantauan admin tanpa modifikasi kode.

---

### ✅ Tidak Ada Perubahan pada Logic yang Sudah Berjalan

Perbaikan ini bersifat **additive** (menambahkan yang kurang), bukan mengubah yang sudah ada:
- `input-nilai.html` — sudah membaca `currentUser.kelas_mapel` langsung, tetap berjalan
- `kelola-guru.html` — `updateUser()` sudah membaca/menulis A:K dengan benar, tetap berjalan
- Semua halaman lain yang hanya membaca `currentUser.kelas` — tidak terpengaruh

---

### 📋 Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `assets/js/sheets.js` | `getUsers()`: range A:J → A:K; tambah field `kelas_mapel`, `kelasMapel`, `kelasMapelList` |
| `assets/js/sheets.js` | `addUser()`: tambah kolom K (`kelas_mapel`) ke row yang ditulis |
| `assets/js/auth.js` | `_verifikasiAkses()`: tambah `kelasList` (gabungan kelas+kelas_mapel) ke session data |

---

*Dibuat: 29 April 2025 | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2025-04-29 v2] — Tambahan Menu Laporan & Rapor di Dashboard Admin

### ✨ Fitur Baru

---

### FEAT-001 · `dashboard/admin.html` · Menu navigasi "Laporan & Rapor"

**File:** `dashboard/admin.html`  
**Lokasi perubahan:** Sidebar nav

Ditambahkan seksi baru **"Laporan & Rapor"** di antara seksi "Pantau & Validasi" dan "Log", berisi dua item navigasi:

| Item | Tujuan | Akses Admin |
|------|--------|-------------|
| 🖨️ Preview & Cetak Rapor | `../rapor/preview.html` | Semua kelas |
| 📋 Laporan Tahsin-Tahfizh | `../rapor/laporan-tt.html` | Semua kelas |

Kedua halaman target sudah mendukung role `admin` dengan akses penuh ke semua kelas (tidak ada perubahan pada file tersebut).

---

### FEAT-002 · `dashboard/admin.html` · Action card baru di "Aksi Cepat"

**File:** `dashboard/admin.html`  
**Lokasi perubahan:** Grid Aksi Cepat

Ditambahkan dua kartu aksi baru:

- **📄 Preview & Cetak Rapor** — menuju `rapor/preview.html`
- **📋 Laporan Tahsin-Tahfizh** — menuju `rapor/laporan-tt.html`

---

### FEAT-003 · `dashboard/admin.html` · Tombol "Laporan TT" di kartu status kelas

**File:** `dashboard/admin.html`  
**Lokasi perubahan:** Footer `kelas-status-card` (template dinamis)

Ditambahkan tombol **📋 Laporan TT** di setiap kartu status kelas, di samping tombol "Cetak/Preview Rapor" dan "Input Nilai" yang sudah ada.

---

### 📋 Ringkasan Hak Akses Laporan setelah Perubahan ini

| Halaman | Admin | Guru Kelas | Guru Mapel TT |
|---------|-------|------------|---------------|
| Preview & Cetak Rapor (`rapor/preview.html`) | ✅ Semua kelas | ✅ Kelas sendiri | ✗ Tidak ada akses |
| Laporan Tahsin-Tahfizh (`rapor/laporan-tt.html`) | ✅ Semua kelas | ✅ Kelas sendiri | ✅ Kelas yang diampu |

---

### 📋 Ringkasan File yang Diubah (v2)

| File | Perubahan |
|------|-----------|
| `dashboard/admin.html` | Tambah seksi nav "Laporan & Rapor", 2 action card baru, tombol Laporan TT di kelas-status-card |

*Dibuat: 29 April 2025 (v2) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2025-04-29 v3] — Fitur Pengajuan Mutasi Siswa (Guru Kelas & Admin)

### ✨ Fitur Baru

---

### FEAT-004 · `assets/js/sheets.js` · Tiga fungsi baru untuk sheet MUTASI

**File:** `assets/js/sheets.js`

Ditambahkan tiga fungsi baru beserta definisi sheet `MUTASI` (kolom A–K):

| Kolom | Field | Keterangan |
|-------|-------|------------|
| A | id_mutasi | ID unik (prefix `MT`) |
| B | jenis | `masuk` atau `keluar` |
| C | id_siswa | ID siswa (diisi untuk jenis keluar) |
| D | nama_siswa | Nama lengkap siswa |
| E | kelas | Kelas yang terdampak |
| F | id_guru | ID guru pengaju |
| G | nama_guru | Nama guru pengaju |
| H | tanggal_pengajuan | Diisi otomatis |
| I | status | `pending` / `disetujui` / `ditolak` |
| J | catatan_admin | Catatan/alasan dari admin |
| K | tanggal_keputusan | Diisi otomatis saat diputuskan |

**Fungsi yang ditambahkan:**
- `getMutasi({ status, id_guru, kelas })` — ambil pengajuan dengan filter opsional
- `addMutasi(data)` — tambah pengajuan baru, status otomatis `pending`
- `updateMutasiStatus(id, status, catatan)` — update keputusan admin

Ketiganya sudah dieksport di bagian `return {}`.

---

### FEAT-005 · `siswa/mutasi.html` · Halaman pengajuan mutasi untuk guru kelas

**File:** `siswa/mutasi.html` *(file baru)*

Halaman khusus guru kelas dengan tiga tab:

**Tab ➡️ Mutasi Keluar:**
- Dropdown nama siswa diambil langsung dari database (`getSiswa`) — tidak perlu mengetik manual
- Pratinjau data siswa terpilih (nama, NISN, kelas) sebelum submit
- Tombol submit disabled selama belum ada siswa dipilih
- Modal konfirmasi muncul sebelum data dikirim

**Tab ⬅️ Mutasi Masuk:**
- Input nama lengkap dengan validasi (hanya huruf, minimal 3 karakter)
- Dropdown pilih kelas tujuan dari database
- Modal konfirmasi sebelum pengiriman

**Tab 📋 Riwayat Pengajuan:**
- Menampilkan semua pengajuan dari guru yang sedang login
- Badge status berwarna: ⏳ Menunggu / ✅ Disetujui / ❌ Ditolak
- Catatan admin (jika ada) ikut ditampilkan

---

### FEAT-006 · `siswa/verifikasi-mutasi.html` · Halaman verifikasi mutasi untuk admin

**File:** `siswa/verifikasi-mutasi.html` *(file baru)*

Halaman khusus admin dengan tampilan kartu per pengajuan:

- **Statistik ringkas** (pending / disetujui / ditolak / total)
- **Filter** berdasarkan status, jenis, dan pencarian nama
- **Tombol Setujui / Tolak** per pengajuan, dengan input catatan admin
- **Modal konfirmasi** sebelum keputusan dieksekusi
- **Efek otomatis saat Setujui:**
  - Mutasi Masuk → `addSiswa()` dipanggil, siswa baru masuk ke kelas
  - Mutasi Keluar → baris SISWA dikosongkan (pola konsisten dengan `hapusSiswa`)
- Pengajuan yang sudah diputuskan tidak menampilkan tombol aksi lagi

---

### FEAT-007 · `dashboard/guru-kelas.html` · Nav & action card Pengajuan Mutasi

**File:** `dashboard/guru-kelas.html`

- Ditambahkan seksi nav baru **"Data Siswa"** dengan item **🔄 Pengajuan Mutasi** → `../siswa/mutasi.html`
- Ditambahkan action card **"Pengajuan Mutasi Siswa"** di grid Aksi Cepat

---

### FEAT-008 · `dashboard/admin.html` · Nav & action card Verifikasi Mutasi

**File:** `dashboard/admin.html`

- Ditambahkan seksi nav baru **"Kelola Data"** dengan item **🔄 Verifikasi Mutasi** → `../siswa/verifikasi-mutasi.html`
- Ditambahkan action card **"Verifikasi Mutasi Siswa"** di grid Aksi Cepat
- Badge merah muncul di nav jika ada pengajuan pending

---

### 📋 Ringkasan Hak Akses Fitur Mutasi

| Halaman | Admin | Guru Kelas | Guru Mapel |
|---------|-------|------------|------------|
| Ajukan Mutasi Masuk/Keluar (`siswa/mutasi.html`) | ✗ | ✅ Kelas sendiri | ✗ |
| Lihat Riwayat Pengajuan (`siswa/mutasi.html`) | ✗ | ✅ Milik sendiri | ✗ |
| Verifikasi & Keputusan (`siswa/verifikasi-mutasi.html`) | ✅ Semua kelas | ✗ | ✗ |

---

### 📋 Ringkasan File yang Diubah/Dibuat (v3)

| File | Status | Keterangan |
|------|--------|------------|
| `assets/js/sheets.js` | Diubah | +3 fungsi MUTASI, +export |
| `siswa/mutasi.html` | **Baru** | Halaman pengajuan untuk guru kelas |
| `siswa/verifikasi-mutasi.html` | **Baru** | Halaman verifikasi untuk admin |
| `dashboard/guru-kelas.html` | Diubah | +nav item, +action card |
| `dashboard/admin.html` | Diubah | +nav item, +action card |

### ⚠️ Persiapan di Google Sheets

Tambahkan sheet baru bernama `MUTASI` di spreadsheet database dengan **header berikut di baris 1**:

```
id_mutasi | jenis | id_siswa | nama_siswa | kelas | id_guru | nama_guru | tanggal_pengajuan | status | catatan_admin | tanggal_keputusan
```

Kolom A hingga K. Baris 2 ke bawah akan diisi otomatis oleh aplikasi.

---

*Dibuat: 29 April 2025 (v3) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2025-04-29 v3-fix] — Perbaikan Bug Redirect Mutasi (Hotfix)

### 🐛 Bug yang Diperbaiki

---

### BUG-004 · `siswa/verifikasi-mutasi.html` & `siswa/mutasi.html` · `requireLogin` menerima array, bukan string

**File:** `siswa/verifikasi-mutasi.html`, `siswa/mutasi.html`  
**Dampak:** Kritis — halaman mutasi selalu redirect ke dashboard, tidak bisa dibuka

**Akar masalah:**  
Fungsi `AUTH.requireLogin()` di `auth.js` mengandung pengecekan:
```js
if (requiredRole && user.role !== requiredRole) { redirect... }
```
Perbandingan ini mengharapkan `requiredRole` berupa **string**. Namun halaman mutasi baru memanggil dengan **array**:
```js
// ❌ SALAH — menyebabkan 'admin' !== ['admin'] selalu true
AUTH.requireLogin(['admin'])
AUTH.requireLogin(['guru_kelas'])
```
Akibatnya kondisi `user.role !== requiredRole` selalu `true` (string tidak pernah sama dengan array), sehingga **setiap user yang membuka halaman tersebut langsung diredirect ke dashboard masing-masing** — termasuk admin yang membuka verifikasi-mutasi.html.

**Perbaikan:**
```js
// ✅ BENAR — konsisten dengan semua halaman lain
AUTH.requireLogin('admin')
AUTH.requireLogin('guru_kelas')
```

---

### BUG-005 · `dashboard/admin.html` · Duplikat item "Data Siswa" di sidebar nav

**File:** `dashboard/admin.html`  
**Dampak:** Minor — item "Data Siswa" muncul dua kali di sidebar

**Akar masalah:**  
Saat menyisipkan seksi "Kelola Data" di v3, str_replace menyertakan ulang item nav "Data Siswa" yang sudah ada di seksi "Setup Sekolah". Akibatnya sidebar menampilkan dua tombol "Data Siswa".

**Perbaikan:**  
Item "Data Siswa" duplikat dihapus dari seksi "Kelola Data". Seksi tersebut kini hanya berisi item "Verifikasi Mutasi".

---

### 📋 Ringkasan File yang Diubah (v3-fix)

| File | Perubahan |
|------|-----------|
| `siswa/verifikasi-mutasi.html` | `requireLogin(['admin'])` → `requireLogin('admin')` |
| `siswa/mutasi.html` | `requireLogin(['guru_kelas'])` → `requireLogin('guru_kelas')` |
| `dashboard/admin.html` | Hapus duplikat nav item "Data Siswa" |

*Dibuat: 29 April 2025 (v3-fix) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
