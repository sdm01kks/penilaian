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
