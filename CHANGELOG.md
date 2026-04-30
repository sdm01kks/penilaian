# CHANGELOG — Sistem Penilaian SD Muhammadiyah 01 Kukusan

---

## ⚠️ PANDUAN ANTI-REGRESI — Wajib Dibaca Sebelum Merge File

> Regresi berulang terjadi karena file lama (yang belum mengandung fix) dijadikan basis untuk pekerjaan baru, lalu hasil pekerjaan baru menimpa file yang sudah berisi fix.
> **Pola ini sudah terjadi 3 kali:** A-01b, A-03b, dan R-01 di bawah.

### ✅ Checklist Sebelum Mengerjakan File yang Pernah Diubah

Setiap kali akan mengedit file yang sudah tercatat di CHANGELOG ini, lakukan langkah berikut:

1. **Gunakan file terbaru dari repo** — jangan gunakan file yang diunduh/disimpan sebelum sesi terakhir sebagai basis pekerjaan baru.
2. **Cari nama file di CHANGELOG** — baca semua fix yang pernah dilakukan pada file tersebut.
3. **Verifikasi fix lama masih ada** — grep atau cari penanda kode kunci (lihat kolom "Penanda Kode" di tabel di bawah) di file yang akan diedit. Jika tidak ada → file yang digunakan adalah versi lama, **jangan lanjutkan**.
4. **Setelah selesai mengedit** — grep ulang semua penanda kode untuk memastikan tidak ada yang hilang.

### 🔍 Penanda Kode Kritis per File

| File | Fix | Penanda Kode — harus selalu ada |
|------|-----|----------------------------------|
| `rapor/preview.html` | R-01 | `faseAPlaceholder` |
| `rapor/preview.html` | R-01 | `faseADesc` |
| `rapor/preview.html` | R-01 | `isBahAsb` |
| `rapor/preview.html` | (fase naik kelas) | `faseKelas(` |
| `rapor/preview.html` | (tinggal kelas) | `tingkatanKelas(` |
| `rapor/preview.html` | (print no-break) | `class="no-break"` |
| `assets/js/auth.js` | A-03b | `Array.isArray(requiredRole)` |
| `dashboard/admin.html` | A-01b | `src="../assets/js/auth.js"` |

---

## [2026-04-30] — v4c-fix2 · Sesi 8 · Regresi Placeholder ISMUBA Fase A

### 🐛 Bug yang Diperbaiki

---

### R-01 · `rapor/preview.html` · Placeholder keterangan ISMUBA Fase A hilang akibat merge file lama — TINGGI

**File:** `rapor/preview.html`  
**Dampak:** Tinggi — untuk siswa kelas 1 dan 2, bagian A.2 Muatan Yayasan (Bahasa Arab & Kemuhammadiyahan) kembali menampilkan tabel kosong tanpa keterangan apapun, padahal fix ini sudah dikerjakan di sesi sebelumnya.  
**Versi penyebab:** `preview_baru.html` — file yang digunakan sebagai basis pekerjaan baru (penambahan NBM wali kelas) adalah versi yang belum mengandung fix placeholder ISMUBA dari sesi sebelumnya.

**Akar masalah:**  
Fix placeholder ISMUBA (sesi sebelumnya) diterapkan pada satu salinan `preview.html`. Secara terpisah, perbaikan NBM wali kelas dikerjakan pada salinan lain (`preview_baru.html`) yang berasal dari versi sebelum fix ISMUBA. Ketika `preview_baru.html` dijadikan file resmi, tiga blok kode yang membentuk fitur placeholder ISMUBA hilang seluruhnya:

| # | Lokasi | Yang hilang |
|---|--------|-------------|
| 1 | `buildSeksiMapel()` | Kondisi `if (isISMUBA && parseInt(activeKelas) <= 2)` + pembuatan objek `faseAPlaceholder` |
| 2 | `buildRowMapel()` | Handler `item.faseAPlaceholder` → render `<em>faseADesc</em>` (screen) |
| 3 | `buildRowPrint()` | Handler `item.faseAPlaceholder` → render `<em>faseADesc</em>` (cetak PDF) |

**Kode yang hilang dan dikembalikan:**

```javascript
// 1. buildSeksiMapel() — deteksi dan buat placeholder
if (!tpMapel.length) {
  if (isISMUBA && parseInt(activeKelas) <= 2) {
    const isBahAsb = mapel.nama?.toLowerCase().includes('arab');
    const faseADesc = isBahAsb
      ? 'Belum menjadi fokus tersendiri di Fase A (kelas 1 dan 2). Pengenalan kosakata dan ungkapan bahasa Arab dasar diintegrasikan dalam mata pelajaran Al-Islam dan kegiatan Tahsin-Tahfizh.'
      : 'Belum menjadi fokus tersendiri di Fase A (kelas 1 dan 2). Nilai-nilai ke-Muhammadiyahan ditanamkan melalui pembiasaan dan keteladanan dalam keseharian di sekolah.';
    return { mapel: {...mapel, nama: mapel.nama}, nilaiAkhir: null, descBest: '', descWorst: '', faseAPlaceholder: true, faseADesc };
  }
  return null;
}

// 2. buildRowMapel() dan buildRowPrint() — render placeholder
const desc = item.faseAPlaceholder
  ? `<em>${item.faseADesc}</em>`
  : '<span style="color:#999;font-style:italic">Belum ada nilai</span>';
```

**Deteksi mapel berbasis nama** (bukan ID) memastikan tidak tergantung urutan MP12/MP13 di sheet:
- Nama mengandung `"arab"` → deskripsi Bahasa Arab
- Selainnya → deskripsi Kemuhammadiyahan

**Jaminan tidak merusak kelas 3–6:** Kelas 3–6 memiliki TP nyata → `tpMapel.length > 0` → kondisi baru tidak pernah dicapai.

**Pencegahan ke depan:**  
Lihat **Panduan Anti-Regresi** di bagian atas dokumen ini. Penanda kode yang harus selalu ada di `rapor/preview.html`: `faseAPlaceholder`, `faseADesc`, `isBahAsb`.

---

### 📋 Ringkasan File yang Diubah (v4c-fix2)

| File | Perubahan |
|------|-----------|
| `rapor/preview.html` | Kembalikan 3 blok kode placeholder ISMUBA Fase A yang hilang akibat merge file lama |

---

*Dibuat: 30 April 2026 (v4c-fix2) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2026-04-30] — v4c-fix · Sesi 7 · Perbaikan Regresi Akibat FIX A-01 & A-03

### 🐛 Bug yang Diperbaiki

---

### A-01b · `dashboard/admin.html` · `AUTH` tidak terdefinisi → dashboard admin tidak bisa dimuat — KRITIS

**File:** `dashboard/admin.html`  
**Dampak:** Kritis — admin tidak bisa login; dashboard berhenti di "Memuat data dashboard" dengan error `ReferenceError: AUTH is not defined` di console  
**Versi penyebab:** FIX A-01 (v4 2026-04-30)

**Akar masalah:**  
FIX A-01 mengganti cek sesi manual di `admin.html` dengan `AUTH.requireLogin('admin')` dan `AUTH.getToken()`, tetapi **lupa menambahkan `<script src="../assets/js/auth.js"></script>`** sebelum inline script. Akibatnya seluruh objek `AUTH` tidak pernah dimuat → `ReferenceError` saat `window.load` dijalankan.

Perbandingan dengan halaman lain yang sudah benar:
```html
<!-- guru-kelas.html & guru-mapel.html — pola yang benar -->
<script src="../assets/js/auth.js"></script>
<script src="../assets/js/sheets.js"></script>
<script>
  window.addEventListener('load', async () => {
    currentUser = AUTH.requireLogin('guru_kelas');
    ...
  });
</script>

<!-- admin.html setelah FIX A-01 — pola yang keliru -->
<!-- ← auth.js tidak pernah disertakan! -->
<script>
  window.addEventListener('load', async () => {
    currentUser = AUTH.requireLogin('admin'); // ← ReferenceError!
    ...
  });
</script>
```

Selain itu, fungsi `logout()` di `admin.html` masih menggunakan kode manual lama:
```js
// ❌ Lama — tidak revoke token, redirect path tidak dihitung dengan benar
function logout() {
  if (!confirm('Yakin ingin keluar?')) return;
  sessionStorage.clear();
  google.accounts.id.disableAutoSelect();
  window.location.href = '../index.html';
}
```

**Perbaikan:**
- Tambahkan `<script src="../assets/js/auth.js"></script>` sebelum inline `<script>` block
- Ganti fungsi `logout()` manual dengan `AUTH.logout()` agar konsisten dengan halaman lain dan mendapatkan manfaat token revoke + path calculation yang benar dari modul auth

---

### A-03b · `assets/js/auth.js` + 4 halaman setup · Pembatasan role keliru → guru bidang studi terkunci dari halaman TP — TINGGI

**File:** `assets/js/auth.js`, `setup/mapel-tp.html`, `setup/tahsin-tahfizh.html`, `setup/ekskul-kktp.html`, `setup/kokurikuler.html`  
**Dampak:** Tinggi — guru_mapel tidak bisa mengakses `mapel-tp.html` (setup TP mata pelajaran yang diampunya); guru TT (juga role guru_mapel) tidak bisa mengakses `setup/tahsin-tahfizh.html`  
**Versi penyebab:** FIX A-03 (v4c 2026-04-30) — *jika diterapkan sesuai deskripsi CHANGELOG*

**Akar masalah — dua lapisan:**

**Lapisan 1 — `requireLogin()` tidak mendukung array:**  
`AUTH.requireLogin()` di `auth.js` menggunakan perbandingan string sederhana:
```js
// ❌ Tidak mendukung multi-role
if (requiredRole && user.role !== requiredRole) { redirect... }
```
Jika dipanggil dengan array (`requireLogin(['admin', 'guru_mapel'])`), kondisi `user.role !== ['admin','guru_mapel']` selalu `true` → semua user diredirect, termasuk yang seharusnya diizinkan.

**Lapisan 2 — Pemetaan role per halaman keliru:**  
FIX A-03 mendeskripsikan penggantian `requireLogin()` → `requireLogin('admin')` secara seragam di 4 halaman. Ini benar untuk `ekskul-kktp.html` dan `kokurikuler.html`, tetapi **salah** untuk:
- `mapel-tp.html` — halaman ini dirancang eksplisit untuk `admin`, `guru_mapel`, dan `guru_kelas` (ada branch `if (currentUser.role === 'guru_mapel')` untuk filter mapel yang diampu)
- `tahsin-tahfizh.html` — guru TT (role `guru_mapel`) perlu mengakses halaman ini untuk setup KKTP, target hafalan, dan bobot TT miliknya

**Perbaikan:**

**1. `auth.js` — normalisasi `requiredRole` ke array:**
```js
// ✅ Mendukung string maupun array
if (requiredRole) {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowedRoles.includes(user.role)) { redirect... }
}
```

**2. Pemetaan role yang benar per halaman:**

| Halaman | Sebelum (salah) | Sesudah (benar) | Alasan |
|---------|-----------------|-----------------|--------|
| `setup/mapel-tp.html` | `requireLogin()` | `requireLogin(['admin', 'guru_mapel', 'guru_kelas'])` | Ketiga role punya logika di halaman ini |
| `setup/tahsin-tahfizh.html` | `requireLogin()` | `requireLogin(['admin', 'guru_mapel'])` | Guru TT adalah guru_mapel |
| `setup/ekskul-kktp.html` | `requireLogin()` | `requireLogin(['admin', 'guru_kelas'])` | Kode internal sudah memblokir guru_mapel secara eksplisit |
| `setup/kokurikuler.html` | `requireLogin()` | `requireLogin(['admin', 'guru_kelas'])` | Nav halaman hanya menangani dua role ini |

---

### 📋 Ringkasan File yang Diubah (v4c-fix)

| File | Perubahan |
|------|-----------|
| `dashboard/admin.html` | Tambah `<script src="../assets/js/auth.js">` yang terlewat; ganti `logout()` manual → `AUTH.logout()` |
| `assets/js/auth.js` | `requireLogin()`: normalisasi `requiredRole` ke array — support string & array |
| `setup/mapel-tp.html` | `requireLogin()` → `requireLogin(['admin', 'guru_mapel', 'guru_kelas'])` |
| `setup/tahsin-tahfizh.html` | `requireLogin()` → `requireLogin(['admin', 'guru_mapel'])` |
| `setup/ekskul-kktp.html` | `requireLogin()` → `requireLogin(['admin', 'guru_kelas'])` |
| `setup/kokurikuler.html` | `requireLogin()` → `requireLogin(['admin', 'guru_kelas'])` |

### ✅ Matriks Akses Halaman Setup (setelah v4c-fix)

| Halaman | Admin | Guru Kelas | Guru Mapel |
|---------|:-----:|:----------:|:----------:|
| `setup/mapel-tp.html` | ✅ | ✅ | ✅ |
| `setup/tahsin-tahfizh.html` | ✅ | ✗ | ✅ |
| `setup/ekskul-kktp.html` | ✅ | ✅ | ✗ |
| `setup/kokurikuler.html` | ✅ | ✅ | ✗ |
| `setup/data-siswa.html` | ✅ | ✗ | ✗ |
| `setup/ekskul.html` | ✅ | ✗ | ✗ |
| `setup/kelola-guru.html` | ✅ | ✗ | ✗ |
| `setup/profil-sekolah.html` | ✅ | ✗ | ✗ |

---

*Dibuat: 30 April 2026 (v4c-fix) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*

---

## [2026-04-30] — v4c · Sesi 7 · Pembatasan Role Halaman Setup

### 🐛 Bug yang Diperbaiki

---

### A-03 · `setup/*.html` · Halaman setup tidak ada pembatasan role — TINGGI

**File:** `setup/ekskul-kktp.html`, `setup/kokurikuler.html`, `setup/mapel-tp.html`, `setup/tahsin-tahfizh.html`  
**Dampak:** Tinggi — guru mapel bisa mengakses dan mengubah konfigurasi TP, KKTP, kokurikuler, dan pengaturan TT

**Akar masalah:**  
4 dari 8 halaman di `/setup` memanggil `AUTH.requireLogin()` tanpa parameter role.
`requireLogin()` tanpa parameter hanya mengecek apakah user sudah login, tidak membatasi role.
Guru mapel yang mengetahui URL halaman setup bisa langsung mengakses dan memodifikasi konfigurasi sekolah.

**Halaman yang sudah benar (tidak diubah):**  
`data-siswa.html`, `ekskul.html`, `kelola-guru.html`, `profil-sekolah.html` — sudah pakai `requireLogin('admin')`.

**Perbaikan:**  
Ganti `AUTH.requireLogin()` → `AUTH.requireLogin('admin')` di 4 halaman di atas.
`AUTH.requireLogin('admin')` akan otomatis redirect ke dashboard yang sesuai jika role bukan admin.

---



### 🐛 Bug yang Diperbaiki

---

### D-01 · `leger-mapel.html` · `getTPKKTP()` dalam loop — N serial HTTP requests — TINGGI

**File:** `rapor/leger-mapel.html`  
**Dampak:** Tinggi — pada jaringan mobile 500ms latency, +1–2 detik loading per tingkatan yang diampu guru

**Akar masalah:**  
Loop `for (const t of tingkatanUniq)` memanggil `await SHEETS.getTPKKTP({ id_mapel, kelas: t })` satu per satu.
Guru yang mengampu di 6 tingkatan kelas menghasilkan 6 serial HTTP requests.

**Perbaikan:**  
- Ganti loop dengan satu pemanggilan `SHEETS.getTPKKTP({ id_mapel: idMapel })` — ambil semua TP untuk mapel tersebut sekaligus
- Filter berdasarkan `tingkatanUniq` dilakukan di JavaScript (tidak ada network call tambahan)
- Deduplikasi `id_tp` tetap dipertahankan sebagai jaga-jaga

---

### D-02 · `laporan-tt.html` · CSS Print dual-property tidak konsisten — TINGGI

**File:** `rapor/laporan-tt.html`  
**Dampak:** Tinggi — tanda tangan terpotong saat cetak PDF di Chromebook / WebKit lama

**Akar masalah:**  
Beberapa selector CSS hanya menggunakan properti modern (`break-inside`, `break-after`, `break-before`)
tanpa fallback `page-break-*` yang dikenali WebKit lama. Sebagian selector lain hanya punya `page-break-*`
tanpa properti modern. Konsistensi dual-property tidak diterapkan merata.

**Perbaikan — semua selector kini memiliki kedua properti:**

| Selector | Sebelum | Sesudah |
|---|---|---|
| `.lpr-section-title` | `page-break-after: avoid` | + `break-after: avoid` |
| `.lpr-stat` | `break-inside: avoid` | + `page-break-inside: avoid` |
| `.hafalan-item` | `break-inside: avoid` | + `page-break-inside: avoid` |
| `.narasi-box` | `break-inside: avoid` | + `page-break-inside: avoid` |
| `.aspek-item` | `break-inside: avoid` | + `page-break-inside: avoid` |
| `.ttd-section` | `page-break-inside/before` | + `break-inside: avoid; break-before: auto` |
| `.page-break-after` | `page-break-after: always` | + `break-after: always` |
| `.no-break` | `break-inside: avoid` | + `page-break-inside: avoid` |
| `.keep-with-next` | `break-after: avoid` | + `page-break-after: avoid` |

---



### 🐛 Bug yang Diperbaiki

---

### C-01 · `sheets.js` · `getNilai()` tidak filter `id_tp` — KRITIS

**File:** `assets/js/sheets.js`  
**Fungsi:** `getNilai()`  
**Dampak:** Kritis — cek duplikat di `saveNilai()` tidak akurat (prasyarat B-01)

**Akar masalah:**  
Parameter `id_tp` tidak ada di destructuring `getNilai({ id_siswa, id_mapel, kelas, semester, tahun })`.
Saat `saveNilai()` memanggil `getNilai({ id_siswa, id_tp, semester, tahun })`, parameter `id_tp` diabaikan diam-diam.
Akibatnya cek duplikat hanya berdasarkan `id_siswa + semester + tahun` — bukan per TP.

**Perbaikan:**  
- Tambah `id_tp` ke destructuring parameter
- Tambah filter `if (id_tp) data = data.filter(r => r[2] === id_tp)`

---

### B-01 · `sheets.js` · `saveNilai()` selalu APPEND — duplikasi nilai masif — KRITIS

**File:** `assets/js/sheets.js`  
**Fungsi:** `saveNilai()`  
**Dampak:** Kritis — setiap simpan ulang nilai membuat baris baru; sheet NILAI penuh duplikat

**Akar masalah:**  
Cabang `if (existing.length > 0)` mengandung komentar `TODO: update baris yang ada` namun tetap memanggil `append()`.
Selain itu, karena C-01 menyebabkan cek duplikat tidak akurat per TP, `existing` sering salah deteksi.

**Perbaikan:**  
- Ganti logika dengan pembacaan raw rows (`read('NILAI!A:K')`)
- Cari baris yang cocok berdasarkan `id_siswa + id_tp + semester + tahun_pelajaran` (4-key unique key)
- Jika ditemukan: `write()` ke baris yang tepat (1-based sheet row = array index + 1), pertahankan `id_nilai` lama
- Jika tidak ditemukan: `append()` baris baru dengan ID yang di-generate
- Fungsi kini mengembalikan `id_nilai` (string) untuk keperluan caller

**Catatan pasca-fix:**  
Sheet NILAI mungkin sudah memiliki duplikat dari bug yang ada sebelum perbaikan ini.
Lakukan audit: cari baris dengan kombinasi `id_siswa + id_tp + semester + tahun_pelajaran` yang sama
dan hapus yang lebih lama. Bisa dilakukan via Google Sheets formula atau Apps Script.

---

### A-02 · `auth.js` · `requireLogin()` tidak cek token expired — KRITIS

**File:** `assets/js/auth.js`  
**Fungsi:** `requireLogin()`  
**Dampak:** Tinggi — guru bisa lolos cek sesi meski token > 1 jam, lalu logout mendadak saat operasi Sheets API gagal 401

**Akar masalah:**  
Token expiry disimpan di `sessionStorage` sebagai `sdm01_token_expiry` saat login (`_onTokenReceived`),
namun `requireLogin()` tidak pernah membacanya. Cek hanya melihat keberadaan `user` dan `token` string,
bukan validitas waktunya.

**Perbaikan:**  
- Baca `sdm01_token_expiry` dari sessionStorage di awal `requireLogin()`
- Tambah kondisi: `if (!user || !token || (expiry > 0 && Date.now() > expiry)) → _redirectToLogin()`
- Guard `expiry > 0` memastikan halaman yang belum punya data expiry tidak ter-redirect paksa (backward compat)

---

### A-01 · `admin.html` · Bypass `AUTH.requireLogin()` — KRITIS

**File:** `dashboard/admin.html`  
**Dampak:** Keamanan — token refresh timer tidak dijadwalkan; perilaku berbeda dari dashboard guru

**Akar masalah:**  
`admin.html` melakukan cek sesi manual via raw `sessionStorage.getItem('sdm01_user')` dan
memeriksa role secara manual. `AUTH.requireLogin('admin')` tidak pernah dipanggil.
Akibatnya: (1) `_scheduleTokenRefresh()` tidak dijalankan, (2) cek expired A-02 tidak berlaku.

**Perbaikan:**  
- Ganti blok cek manual dengan `currentUser = AUTH.requireLogin('admin')`
- `token` diambil via `AUTH.getToken()` agar konsisten dengan modul auth

---

### Rate Limit 429 · `admin.html` · 8 request paralel → error 429 — TINGGI

**File:** `dashboard/admin.html`  
**Fungsi:** `loadDashboard()`  
**Dampak:** Tinggi — dashboard admin error 429 secara intermiten saat memuat

**Akar masalah:**  
`loadDashboard()` memanggil 8 fungsi sekaligus via `Promise.all()`.
Google Sheets API membatasi request per detik per user → error 429 intermiten.

**Perbaikan:**  
- Ganti `Promise.all([...])` dengan loop `for...of` sequential
- Tambah `await new Promise(r => setTimeout(r, 80))` (jeda 80ms) antar setiap request
- Total waktu tambahan: ~560ms — tidak signifikan untuk UX karena setiap fetch tetap lambat

---



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

---

## [2025-04-29 v3-fix2] — Perbaikan Error AUTH.init Timing (Hotfix)

### 🐛 Bug yang Diperbaiki

---

### BUG-006 · `siswa/verifikasi-mutasi.html` & `siswa/mutasi.html` · `AUTH.init()` dipanggil sebelum Google Identity Services selesai dimuat

**File:** `siswa/verifikasi-mutasi.html`, `siswa/mutasi.html`  
**Gejala:** Error di console — `AUTH: Google Identity Services belum dimuat` (auth.js:38)  
**Dampak:** Sedang — AUTH.init() gagal diam-diam; halaman tetap bisa berjalan karena `requireLogin` hanya membaca sessionStorage, namun token refresh otomatis tidak terjadwal sehingga sesi bisa kadaluarsa tanpa peringatan.

**Akar masalah:**  
Kedua halaman baru memanggil `AUTH.init()` di top-level script, lalu `document.addEventListener('DOMContentLoaded', ...)`:

```js
// ❌ POLA LAMA (salah)
AUTH.init();                              // ← Google script belum tentu siap!
document.addEventListener('DOMContentLoaded', async () => { ... });
```

Script Google Identity Services dimuat dengan atribut `async defer`, artinya eksekusinya tidak dijamin selesai sebelum `DOMContentLoaded`. Ketika `AUTH.init()` dijalankan, `typeof google === 'undefined'` masih bernilai `true`, sehingga `init()` keluar lebih awal tanpa menginisialisasi `_tokenClient`.

**Solusi:**  
Menggunakan `window.addEventListener('load', ...)` — event ini baru dijalankan **setelah semua resource** (termasuk script `async defer`) selesai dimuat. Ini adalah pola yang sudah dipakai oleh semua halaman yang berjalan dengan benar (guru-kelas.html, preview.html, dll.):

```js
// ✅ POLA BARU (benar) — konsisten dengan halaman lain
window.addEventListener('load', async () => {
  AUTH.init();    // ← Google script pasti sudah siap
  currentUser = AUTH.requireLogin('...');
  ...
});
```

---

### 📋 Ringkasan File yang Diubah (v3-fix2)

| File | Perubahan |
|------|-----------|
| `siswa/verifikasi-mutasi.html` | `AUTH.init()` + `DOMContentLoaded` → `window.addEventListener('load')` |
| `siswa/mutasi.html` | `AUTH.init()` + `DOMContentLoaded` → `window.addEventListener('load')` |

---

### 📌 Catatan: Error 429 di Dashboard Admin

Error `Sheets API 429` yang muncul terpisah di console dashboard admin adalah **rate limit Google Sheets API** — terlalu banyak request dilakukan secara bersamaan (`Promise.all` dengan 8 sheet sekaligus). Ini **bukan bug baru** dan **tidak terkait** dengan fitur mutasi. Solusinya adalah menambahkan jeda antar request (sequential fetch), namun perubahan ini berisiko memengaruhi banyak fungsi di `admin.html` dan sebaiknya dikerjakan sebagai sesi terpisah.

---

*Dibuat: 29 April 2025 (v3-fix2) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
