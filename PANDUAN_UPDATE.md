# 📦 Panduan Update — Rilis v16 (Autobackup + Restore Backup)

Rilis ini terdiri dari **dua bagian terpisah** yang cara update-nya berbeda:

| Bagian | Di mana | Cara update |
|---|---|---|
| A. File aplikasi web | Repo GitHub `penilaian` | Upload/timpa manual seperti biasa |
| B. Script backup | Apps Script di Google Sheets (bukan di repo) | Copy-paste manual ke editor Apps Script |

Ikuti urutan di bawah: **A dulu, baru B.**

---

## A. Update File di Repo

Semua file dalam archive `rilis-v16.zip` ini **posisinya sudah sesuai struktur
repo** — tinggal ekstrak lalu timpa ke folder yang sama persis di repo Anda.

```
rilis-v16.zip
├── ANTIREGRESI.md                       ← TIMPA
├── CHANGELOG.md                         ← TIMPA
├── assets/js/sheets.js                  ← TIMPA
├── dashboard/admin.html                 ← TIMPA
├── setup/restore-backup.html            ← FILE BARU
├── setup/profil-sekolah.html            ← TIMPA
├── setup/data-siswa.html                ← TIMPA
├── setup/kelola-guru.html               ← TIMPA
├── setup/mapel-tp.html                  ← TIMPA
├── setup/kokurikuler.html               ← TIMPA
├── setup/tahsin-tahfizh.html            ← TIMPA
├── setup/ekskul.html                    ← TIMPA
└── backup/BackupPenilaian.gs            ← FILE BARU (disimpan di repo sebagai
    backup/PANDUAN_BACKUP.md               dokumentasi/arsip kode saja —
                                            BUKAN dijalankan dari repo, lihat
                                            Bagian B)
```

### Langkah di GitHub (web atau desktop, pilih salah satu)

**Lewat GitHub web:**
1. Ekstrak `rilis-v16.zip` di komputer Anda.
2. Buka repo `penilaian` di github.com.
3. Untuk setiap file di atas: masuk ke path yang sesuai (misal
   `assets/js/sheets.js`) → klik ikon pensil (Edit) → hapus semua isi lama →
   tempel isi file baru dari hasil ekstrak → **Commit changes**.
4. Untuk 2 file baru (`setup/restore-backup.html` dan folder `backup/`):
   gunakan **Add file → Upload files**, seret filenya, lalu **Commit changes**.

**Lewat GitHub Desktop / git command line (lebih cepat untuk banyak file):**
1. Ekstrak `rilis-v16.zip`.
2. Copy semua folder/file hasil ekstrak (`assets/`, `dashboard/`, `setup/`,
   `backup/`, `ANTIREGRESI.md`, `CHANGELOG.md`) ke folder lokal repo Anda,
   timpa yang sudah ada saat diminta konfirmasi.
3. `git add .`
4. `git commit -m "v16: autobackup mingguan + restore backup in-app"`
5. `git push`

> Tidak ada langkah build/deploy tambahan — begitu ter-push, halaman baru
> otomatis aktif di GitHub Pages/hosting seperti biasa.

### ✅ Cara cek berhasil
- Login sebagai admin → sidebar harus ada menu baru **"Restore Backup"**
  (di bagian bawah, section "Sistem") di semua halaman setup + dashboard admin.
- Buka menu tersebut → harus tidak error (meski daftar backup kosong itu
  normal selama Bagian B belum di-setup).

---

## B. Setup/Update Script Backup (di luar repo — WAJIB dilakukan manual)

Ini bagian yang **tidak bisa** di-upload lewat GitHub, karena letaknya di
Google Apps Script yang menempel langsung ke spreadsheet database, bukan
di file repo. Ini juga berlaku baik untuk **pemasangan pertama kali** maupun
**update dari versi backup harian sebelumnya**.

### Jika BELUM PERNAH pasang script backup sama sekali

1. Buka spreadsheet database di Google Sheets.
2. Menu **Extensions → Apps Script**.
3. Hapus semua isi editor kode (`Code.gs` bawaan) yang kosong/default.
4. Buka file `backup/BackupPenilaian.gs` dari hasil ekstrak zip di komputer
   Anda, **copy seluruh isinya**, lalu **paste** ke editor Apps Script.
5. Simpan (ikon 💾 atau `Ctrl+S`).
6. Di dropdown pemilih fungsi (toolbar atas editor), pilih `backupDatabase`
   → klik **▶ Run**.
   - Akan muncul dialog izin akses Drive. Klik **Continue/Lanjutkan** →
     pilih akun Anda → jika muncul peringatan "Google hasn't verified this
     app", klik **Advanced/Lanjutan → Go to [nama project] (unsafe)** → **Allow/Izinkan**.
     (Ini normal, karena script ini milik Anda sendiri, bukan aplikasi pihak ketiga.)
   - Setelah selesai, cek Google Drive Anda — folder baru bernama
     **"Backup Penilaian SDM01KKS"** harus muncul berisi 1 file backup pertama.
7. Di dropdown fungsi, pilih `createWeeklyTrigger` → klik **▶ Run** sekali lagi.
   - Ini memasang jadwal otomatis: setiap **Jumat, jam 23:00 WIB**.
8. Cek: klik ikon ⏰ **Triggers** di sidebar kiri editor Apps Script — harus
   muncul 1 baris trigger dengan fungsi `backupDatabase`, jenis **Time-driven**,
   jadwal **Week timer**, hari **Friday**, jam sekitar **23:00–00:00**.
9. Selesai — tidak perlu disentuh lagi.

### Jika SUDAH PERNAH pasang script versi sebelumnya (backup harian)

Ini **update**, bukan pasang baru — jadwal lama (harian) perlu diganti ke
mingguan, dan retensi diperpanjang ke 3 bulan.

1. Buka spreadsheet database → **Extensions → Apps Script** (script yang
   sudah ada akan otomatis terbuka).
2. **Pilih semua isi kode lama** di editor (klik di dalam editor →
   `Ctrl+A`) → **hapus**.
3. Buka `backup/BackupPenilaian.gs` dari hasil ekstrak zip → copy seluruh
   isinya → paste ke editor Apps Script (menggantikan yang lama).
4. Simpan (`Ctrl+S`).
5. Di dropdown fungsi, pilih `createWeeklyTrigger` → klik **▶ Run**.
   - Fungsi ini **otomatis menghapus trigger harian yang lama** lebih dulu
     (lihat `_removeExistingTriggers` di dalam kode), baru memasang trigger
     mingguan yang baru — jadi **tidak akan dobel jalan**.
   - Tidak perlu approve izin lagi karena sudah pernah di-authorize
     sebelumnya (kecuali muncul dialog, ikuti saja seperti langkah 6 di atas).
6. Cek ulang di menu **Triggers** (ikon ⏰) — pastikan hanya ada **1 trigger**
   `backupDatabase`, dengan jadwal **Friday, sekitar 23:00**. Jika masih
   terlihat 2 trigger (harian + mingguan), hapus manual trigger yang jenis
   harian dengan klik ikon 🗑️ di sampingnya.
7. Backup lama (yang dibuat semasa jadwal harian) **tidak perlu dihapus** —
   nama filenya tetap kompatibel (`BACKUP_penilaian_...`) dan akan tetap
   muncul di halaman "Restore Backup" di aplikasi. Backup itu hanya akan
   ikut kena aturan retensi baru (dihapus otomatis kalau usianya sudah
   lewat 90 hari sejak dibuat).

### ✅ Cara cek berhasil (berlaku untuk keduanya)
- Login ke aplikasi sebagai admin → menu **Restore Backup** → daftar backup
  harus muncul minimal 1 titik (hasil langkah manual run `backupDatabase`
  di atas), dengan label tanggal/jam yang benar.
- Tunggu sampai Jumat berikutnya jam 23:00 WIB → cek folder Drive "Backup
  Penilaian SDM01KKS", harus bertambah 1 file backup baru secara otomatis
  tanpa perlu ada yang membuka spreadsheet/aplikasi.

---

## Ringkasan Perubahan v16

- Jadwal backup: ~~harian~~ → **mingguan, Jumat 23:00 WIB**
- Retensi: ~~7 hari~~ → **90 hari (≈3 bulan)**
- **Baru:** halaman `setup/restore-backup.html` — admin bisa restore data
  langsung dari aplikasi web, tanpa masuk ke Drive/Apps Script manual
- **Baru:** 5 fungsi di `sheets.js` (`listBackups`, `getSheetNames`,
  `readAllSheetsFrom`, `valuesBatchClear`, `restoreFromBackup`) — semua
  fungsi lama tidak diubah
- **Tidak ada perubahan scope OAuth** — tidak ada user yang perlu login ulang
- Detail teknis & batasan penting: lihat `ANTIREGRESI.md` §26
