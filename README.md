# 🏫 Sistem Penilaian & Rapor Digital
### SD Muhammadiyah 01 Kukusan — Kurikulum Merdeka

> Aplikasi berbasis web untuk pengelolaan penilaian sumatif dan laporan hasil belajar siswa, dirancang khusus untuk SD Muhammadiyah 01 Kukusan dengan mengikuti kerangka **Kurikulum Merdeka**.

---

## 📋 Tentang Aplikasi

Sistem ini memungkinkan **admin**, **guru kelas**, dan **guru bidang studi** untuk mengelola seluruh proses penilaian — mulai dari input nilai SLM & SAS, penghitungan nilai akhir otomatis, penyusunan deskripsi capaian kompetensi, hingga preview dan cetak rapor — dari perangkat apa pun (laptop, tablet, atau HP) tanpa perlu menginstal software apapun.

**Tidak ada data yang tersimpan di perangkat lokal.** Semua data tersimpan dengan aman di Google Drive sekolah.

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🔐 **Login Aman** | Autentikasi via akun Google — tidak ada password tambahan |
| 👥 **Manajemen User** | Admin dapat mendaftarkan & mengelola akun guru |
| 📊 **Input Nilai Otomatis** | SLM + SAS → Nilai Akhir dihitung otomatis berdasarkan bobot |
| 📝 **Deskripsi Otomatis** | Deskripsi rapor dihasilkan dari KKTP secara otomatis |
| 🌱 **Kokurikuler & DPL** | Input capaian 8 Dimensi Profil Lulusan |
| 🏆 **Ekstrakurikuler** | Catatan naratif per kegiatan per siswa |
| 🖨️ **Preview & Cetak Rapor** | Tampilan rapor sesuai format baku sekolah |
| 🔄 **Sync Data** | Tarik data siswa & konfigurasi terbaru dari database |
| ⚠️ **Notifikasi Kelengkapan** | Peringatan otomatis jika data krusial belum diinput |

---

## 👥 Hierarki Pengguna

```
ADMIN (Wakasek Kurikulum)
├── Kelola identitas sekolah & konfigurasi semester
├── Kelola daftar kelas & data siswa
├── Tambah/nonaktifkan akun guru
├── Input & validasi semua rapor
└── Semua fitur guru

GURU KELAS (Wali Kelas)
├── Sync data siswa kelasnya
├── Input nilai mapel yang dipegangnya
├── Input kokurikuler, ekskul, absensi
├── Preview & cetak rapor
└── Hanya kelas sendiri

GURU BIDANG STUDI (Guru Mapel)
├── Input CP, TP, KKTP mapelnya
├── Input nilai SLM & SAS semua kelas yang diampu
└── Nilai langsung tersimpan ke database
```

---

## 🗂️ Struktur Penilaian

### Jenis Penilaian
- **SLM** (Sumatif Lingkup Materi) — per Tujuan Pembelajaran
- **SAS** (Sumatif Akhir Semester) — 1x per semester

### Formula Nilai Akhir
```
Nilai Akhir = (Rata-rata SLM × Bobot SLM%) + (SAS × Bobot SAS%)
```
> ⚠️ Rekomendasi: Bobot SLM > Bobot SAS (karena SLM mengukur proses)

### KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
Setiap TP memiliki tipe penilaian dan 4 level:

| Tipe | Level 1 | Level 2 | Level 3 | Level 4 |
|---|---|---|---|---|
| **Pengetahuan** | Perlu Bimbingan | Cukup | Baik | Sangat Baik |
| **Kinerja** | Mulai Berkembang | Layak | Cakap | Mahir |

### Formula Deskripsi Rapor (Otomatis)
```
"Ananda [nama] [deskripsi TP nilai tertinggi] dan [deskripsi TP nilai terendah]"
```

---

## 🗃️ Arsitektur Sistem

```
GitHub Pages (Frontend)          Google Drive (Backend)
┌─────────────────────┐          ┌────────────────────────┐
│  index.html         │  OAuth   │  Google Sheets         │
│  dashboard/         │ ◄──────► │  ├── CONFIG            │
│  setup/             │  Sheets  │  ├── KELAS             │
│  penilaian/         │   API    │  ├── USERS             │
│  rapor/             │          │  ├── GURU              │
│  assets/            │          │  ├── SISWA             │
└─────────────────────┘          │  ├── MAPEL             │
                                 │  ├── TP_KKTP           │
                                 │  ├── DPL               │
                                 │  ├── EKSKUL            │
                                 │  ├── NILAI             │
                                 │  ├── KOKURIKULER       │
                                 │  ├── EKSKUL_SISWA      │
                                 │  ├── ABSENSI           │
                                 │  └── SYNC_LOG          │
                                 └────────────────────────┘
```

---

## 📚 Mata Pelajaran

| Kelompok | Mata Pelajaran |
|---|---|
| **Wajib** | PAI & Budi Pekerti, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, PJOK, Seni Budaya*, Bahasa Inggris, TIK, Koding & KA |
| **Muatan Lokal** | Bahasa Sunda |
| **ISMUBA** | Bahasa Arab, Kemuhammadiyahan |

> *Seni Budaya bergantian per semester: **Seni Musik** (Ganjil) / **Seni Rupa** (Genap)

---

## 🌱 Kokurikuler — 8 Dimensi Profil Lulusan

Minimal **3 dari 8 DPL** diukur setiap semester:

1. Keimanan dan Ketakwaan
2. Kewargaan
3. Penalaran Kritis
4. Kreativitas
5. Kolaborasi
6. Kemandirian
7. Kesehatan
8. Komunikasi

---

## 🏗️ Struktur Repo

```
penilaian/
│
├── index.html                 ← Halaman login
│
├── /dashboard/
│   ├── admin.html             ← Dashboard admin
│   ├── guru-kelas.html        ← Dashboard wali kelas
│   └── guru-mapel.html        ← Dashboard guru bidang studi
│
├── /setup/
│   ├── profil-sekolah.html    ← Identitas sekolah (admin)
│   ├── data-siswa.html        ← Input data siswa (admin)
│   ├── mapel-tp.html          ← Input CP, TP, KKTP
│   ├── kokurikuler.html       ← KKTP 8 DPL
│   └── ekskul.html            ← Daftar ekskul
│
├── /penilaian/
│   ├── input-nilai.html       ← Input nilai SLM + SAS
│   ├── input-dpl.html         ← Input level DPL
│   ├── input-ekskul.html      ← Deskripsi ekskul siswa
│   └── input-absensi.html     ← Absensi + catatan
│
├── /rapor/
│   └── preview.html           ← Preview & cetak rapor
│
├── /assets/
│   ├── css/style.css
│   └── js/
│       ├── auth.js            ← Login & session
│       ├── sheets.js          ← Google Sheets API
│       ├── kalkulasi.js       ← Hitung nilai akhir
│       └── deskripsi.js       ← Generate deskripsi KKTP
│
├── README.md
└── PANDUAN-GURU.md
```

---

## ⚙️ Setup untuk Developer

### Prasyarat
- Akun Google dengan akses ke Google Cloud Console
- Repo ini di GitHub dengan GitHub Pages aktif
- Google Sheets database (lihat file `SDM01KKS_Database.xlsx`)

### Konfigurasi
1. Buka `index.html`
2. Temukan bagian `CONFIG` di JavaScript:
```javascript
const CONFIG = {
  CLIENT_ID:      'GANTI_DENGAN_CLIENT_ID_ANDA',
  SPREADSHEET_ID: 'GANTI_DENGAN_ID_SPREADSHEET_ANDA',
  ...
};
```
3. Ganti `CLIENT_ID` dengan OAuth Client ID dari Google Cloud Console
4. Ganti `SPREADSHEET_ID` dengan ID Google Sheets database sekolah

### Menemukan Spreadsheet ID
Buka Google Sheets → lihat URL:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

---

## 🔒 Keamanan

- **Tidak ada password** yang tersimpan di aplikasi atau database
- Login menggunakan sistem OAuth 2.0 Google yang terenkripsi
- Hanya email yang terdaftar di sheet `USERS` yang dapat masuk
- Data tersimpan di Google Drive sekolah — bukan di server pihak ketiga
- Tidak ada data siswa yang tersimpan di perangkat pengguna

---

## 📞 Kontak & Dukungan

**Administrator Sistem:**
- Arif Azwar Anas, S.Pd — Wakasek Kurikulum
- SD Muhammadiyah 01 Kukusan, Depok

**Jika mengalami kendala akses:** Hubungi administrator sekolah untuk mendaftarkan akun Google Anda.

---

## 📄 Lisensi

Sistem ini dikembangkan khusus untuk **SD Muhammadiyah 01 Kukusan**.
Hak cipta © 2025–2026. Seluruh hak dilindungi.

---

*بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم*

*Semoga sistem ini bermanfaat dalam meningkatkan kualitas pendidikan dan mempermudah kerja para guru. Aamiin.*
