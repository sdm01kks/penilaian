# 🗂️ Struktur Repositori — Sistem Penilaian SDM01KKS

Panduan ini menjelaskan **setiap file dan folder** dalam proyek, serta **di mana meletakkan** file yang baru diterima dari hasil perbaikan/pengembangan.

---

## 📁 Peta Folder Lengkap

```
penilaian/                          ← root repositori (nama folder di GitHub)
│
├── index.html                      ← Halaman login utama (Google SSO)
├── README.md                       ← Dokumentasi proyek
├── CHANGELOG.md                    ← Log semua perbaikan & fitur baru  ← PENTING
├── STRUKTUR_REPO.md                ← File ini
│
├── assets/
│   └── js/
│       ├── auth.js                 ← Autentikasi Google, session, requireLogin()
│       └── sheets.js               ← Semua operasi baca/tulis ke Google Sheets
│
├── dashboard/
│   ├── admin.html                  ← Dashboard utama admin
│   ├── guru-kelas.html             ← Dashboard utama guru kelas / wali kelas
│   └── guru-mapel.html             ← Dashboard utama guru bidang studi
│
├── setup/
│   ├── data-siswa.html             ← Admin: input & edit data siswa lengkap
│   ├── kelola-guru.html            ← Admin: tambah, edit, nonaktifkan akun guru
│   ├── mapel-tp.html               ← Guru: setup Tujuan Pembelajaran & KKTP
│   ├── tahsin-tahfizh.html         ← Guru: setup target & target Tahsin-Tahfizh
│   ├── kokurikuler.html            ← Admin: setup Dimensi Profil Lulusan (DPL)
│   ├── ekskul.html                 ← Admin: data ekstrakurikuler
│   ├── ekskul-kktp.html            ← Admin: KKTP per ekstrakurikuler
│   └── profil-sekolah.html         ← Admin: konfigurasi nama sekolah, semester, dll.
│
├── penilaian/
│   ├── input-nilai.html            ← Guru: input nilai SLM & SAS per siswa
│   ├── input-dpl.html              ← Guru: input capaian kokurikuler (DPL)
│   ├── input-ekskul.html           ← Guru: input capaian ekstrakurikuler
│   ├── input-absensi.html          ← Guru: input absensi & catatan wali kelas
│   └── input-setoran-tt.html       ← Guru: input setoran Tahsin-Tahfizh
│
├── rapor/
│   ├── preview.html                ← Guru/Admin: preview & cetak rapor
│   ├── laporan-tt.html             ← Guru/Admin: laporan setoran Tahsin-Tahfizh
│   ├── leger-kelas.html            ← Guru kelas: leger nilai semua siswa
│   └── leger-mapel.html            ← Guru mapel: leger nilai per mapel
│
└── siswa/                          ← ⚠️ FOLDER BARU — buat jika belum ada
    ├── mutasi.html                 ← Guru kelas: ajukan mutasi masuk/keluar
    └── verifikasi-mutasi.html      ← Admin: verifikasi & putuskan pengajuan mutasi
```

---

## 📦 Panduan Upload File per Sesi Perbaikan

### Sesi v1 — Perbaikan Bug Pembagian Tugas Guru (29 Apr 2025)

| File yang Diterima | Letakkan di | Timpa file lama? |
|--------------------|-------------|-----------------|
| `sheets.js` | `assets/js/sheets.js` | ✅ Ya |
| `auth.js`   | `assets/js/auth.js`   | ✅ Ya |

---

### Sesi v2 — Tambahan Menu Laporan & Rapor di Dashboard Admin (29 Apr 2025)

| File yang Diterima | Letakkan di | Timpa file lama? |
|--------------------|-------------|-----------------|
| `admin.html` | `dashboard/admin.html` | ✅ Ya |

---

### Sesi v3 — Fitur Pengajuan Mutasi Siswa (29 Apr 2025)

| File yang Diterima | Letakkan di | Timpa file lama? |
|--------------------|-------------|-----------------|
| `sheets.js` | `assets/js/sheets.js` | ✅ Ya |
| `mutasi.html` | `siswa/mutasi.html` | 🆕 Baru (buat folder `siswa/` dulu) |
| `verifikasi-mutasi.html` | `siswa/verifikasi-mutasi.html` | 🆕 Baru |
| `guru-kelas.html` | `dashboard/guru-kelas.html` | ✅ Ya |
| `admin.html` | `dashboard/admin.html` | ✅ Ya |

> ⚠️ **Persiapan Google Sheets:**
> Tambahkan sheet baru bernama `MUTASI` di spreadsheet database.
> Header baris 1 (kolom A–K):
> `id_mutasi | jenis | id_siswa | nama_siswa | kelas | id_guru | nama_guru | tanggal_pengajuan | status | catatan_admin | tanggal_keputusan`

---

## 🔑 File Kritis — Jangan Salah Tempat

| File | Peran | Akibat jika salah letak |
|------|-------|------------------------|
| `assets/js/auth.js` | Autentikasi & session user | Semua halaman tidak bisa login |
| `assets/js/sheets.js` | Koneksi ke Google Sheets | Semua data tidak bisa dibaca/ditulis |
| `index.html` | Halaman masuk | Guru tidak bisa login |

---

## 🏷️ Konvensi Penamaan

| Prefix | Arti |
|--------|------|
| `S...` | ID Siswa (contoh: `Slm3xyz`) |
| `U...` | ID User/Guru (contoh: `Ulm3xyz`) |
| `MT...` | ID Mutasi (contoh: `MTlm3xyz`) |
| `NL...` | ID Nilai (contoh: `NLlm3xyz`) |
| `ST...` | ID Setoran Tahsin-Tahfizh |

---

## 📋 Sheet Google Sheets yang Dipakai Aplikasi

| Nama Sheet | Digunakan untuk | Kolom |
|-----------|-----------------|-------|
| `USERS` | Data akun guru | A–K |
| `SISWA` | Data siswa | A–L |
| `KELAS` | Daftar kelas | A–C |
| `MAPEL` | Daftar mata pelajaran | A–E |
| `TP_KKTP` | Tujuan Pembelajaran & KKTP | A–J |
| `NILAI` | Nilai siswa per TP | A–M |
| `DPL` | Dimensi Profil Lulusan | A–H |
| `SETORAN_TT` | Setoran Tahsin-Tahfizh | A–M |
| `MUTASI` | Pengajuan mutasi siswa | A–K ← *baru di v3* |
| `CONFIG` | Konfigurasi sekolah & semester | A–B |
| `Guru` | (Tidak dipakai aplikasi, legacy) | — |

---

## 🔄 Alur Kerja Pengembangan

```
Laporan Bug / Permintaan Fitur
        ↓
Claude menganalisis & membuat perbaikan
        ↓
Test suite dijalankan (node test_*.js)
        ↓
File yang berubah dikemas & diserahkan
        ↓
Upload manual sesuai panduan di atas
        ↓
CHANGELOG.md diperbarui (disertakan di output)
```

---

*Terakhir diperbarui: 29 April 2025 (v3) | SD Muhammadiyah 01 Kukusan*
