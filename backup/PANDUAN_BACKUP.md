# 🛡️ Panduan Autobackup Database — Sistem Penilaian

## Cara Kerja

Backup **tidak** dijalankan dari aplikasi web (`penilaian`), tapi dari
**Google Apps Script** yang dipasang langsung di spreadsheet database.
Ini dipilih karena:

- Berjalan otomatis di server Google setiap hari jam 23:00 WIB, **tidak
  bergantung ada/tidaknya orang yang membuka aplikasi** di browser.
- Tidak butuh perubahan apa pun di `assets/js/auth.js` atau `sheets.js`
  (scope OAuth aplikasi tetap sama, tidak ada yang perlu login ulang).
- Hasil backup = **salinan penuh spreadsheet** (semua sheet, format, rumus),
  bukan cuma data mentah — jadi kalau perlu restore, tinggal pakai
  spreadsheet-nya langsung.

Setiap backup adalah 1 file Google Sheets terpisah di folder Drive
**"Backup Penilaian SDM01KKS"**, dengan nama:

```
BACKUP_penilaian_2026-07-03_2300
BACKUP_penilaian_2026-07-04_2300
...
```

Backup yang lebih tua dari **3 bulan (90 hari)** otomatis dihapus (masuk Trash Drive,
masih bisa dipulihkan manual dari Trash selama 30 hari jika perlu).

---

## 🔧 Setup (dilakukan sekali saja)

1. Buka spreadsheet database di Google Sheets.
2. Menu **Extensions → Apps Script**.
3. Salin seluruh isi `backup/BackupPenilaian.gs` ke editor tersebut.
4. Di dropdown fungsi (toolbar atas), pilih `backupDatabase` → klik **▶ Run**.
   - Akan muncul permintaan izin (akses Drive) → klik **Advanced → Go to
     project (unsafe)** kalau muncul warning "unverified" → **Allow**.
   - Ini normal karena script milik sendiri, bukan aplikasi pihak ketiga.
   - Setelah berhasil, cek Google Drive — folder "Backup Penilaian SDM01KKS"
     dengan 1 file backup pertama harus sudah muncul.
5. Pilih fungsi `createWeeklyTrigger` → klik **▶ Run** sekali.
   - Ini memasang jadwal otomatis. Cek di menu **Triggers**
     (ikon jam di sidebar kiri Apps Script editor) — harus ada 1 trigger
     `backupDatabase` berjalan mingguan tiap Jumat.
     sidebar kiri Apps Script editor) — harus ada 1 trigger `backupDatabase`
     berjalan harian.
6. Selesai. Tidak perlu disentuh lagi kecuali ingin ubah jadwal/retensi.

> **Siapa yang harus menjalankan setup ini?** Sebaiknya akun admin/pemilik
> spreadsheet, karena backup akan tersimpan di Drive akun yang menjalankan
> trigger tersebut.

---

## ♻️ Cara Restore

Ada dua skenario, tergantung seberapa parah datanya rusak.

### A. Hanya sebagian data yang salah/hilang (paling umum)

1. Buka folder "Backup Penilaian SDM01KKS" di Drive, pilih backup dengan
   tanggal **sebelum** masalah terjadi.
2. Buka file backup tersebut, buka sheet yang datanya perlu dipulihkan
   (misal `NILAI_US`).
3. Klik kanan tab sheet tersebut → **Copy to → Existing spreadsheet** →
   pilih spreadsheet database yang aktif.
4. Di spreadsheet aktif, sheet akan masuk sebagai tab baru (misal
   `NILAI_US (2)`) — bandingkan datanya, lalu salin manual bagian yang perlu
   ke sheet asli, atau ganti nama tab lama → beri nama tab baru sesuai nama
   asli (pastikan urutan kolom sama persis).

Cara ini aman karena **tidak mengubah ID spreadsheet**, jadi tidak ada
perubahan kode (`auth.js`) yang diperlukan.

### B. Database rusak total / perlu kembali sepenuhnya ke titik tertentu

1. Beri nama baru pada spreadsheet database yang bermasalah, misalnya
   `penilaian-DB — RUSAK (arsip 2026-07-03)`, supaya tidak tertukar.
2. Buka backup yang dipilih, klik **File → Make a copy**, beri nama sama
   persis dengan nama spreadsheet database asli.
3. Buka spreadsheet salinan baru tersebut, salin **Spreadsheet ID**-nya dari
   URL (bagian antara `/d/` dan `/edit`).
4. Update konstanta `SPREADSHEET_ID` di `assets/js/auth.js` dengan ID baru
   tersebut, lalu deploy (push ke repo seperti biasa).
5. Pastikan spreadsheet baru ini sudah di-share ke semua email yang ada di
   sheet `USERS` (kolom B) dengan akses **Editor** — jika backup dibuat lewat
   script ini, permission sudah otomatis disalin dari spreadsheet asli, jadi
   biasanya langkah ini sudah otomatis beres.

> ⚠️ Skenario B mengubah kode aplikasi (`auth.js`). Sebaiknya dicatat di
> `CHANGELOG.md` sebagai insiden + tanggal restore, dan dikonfirmasi dulu ke
> semua guru bahwa ada perubahan data ke titik backup tertentu (ada
> kemungkinan input di antara waktu backup dan waktu kerusakan hilang).

---

## Mengubah Konfigurasi

Semua bisa diubah di bagian atas `BackupPenilaian.gs`:

| Konstanta | Fungsi | Default |
|---|---|---|
| `BACKUP_RETENTION_DAYS` | Berapa hari backup disimpan sebelum dihapus otomatis | `7` |
| `BACKUP_FOLDER_NAME` | Nama folder tujuan di Drive | `Backup Penilaian SDM01KKS` |
| Jadwal jam berapa | Ubah `.atHour(23)` di `createDailyTrigger()`, lalu jalankan ulang `createDailyTrigger` (otomatis mengganti trigger lama) | `23:00 WIB` |

Setelah mengubah `BACKUP_RETENTION_DAYS` atau jadwal, cukup jalankan ulang
fungsi `createDailyTrigger` — trigger lama otomatis dihapus & diganti yang
baru, tidak akan dobel.
