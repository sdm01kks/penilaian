/**
 * BackupPenilaian.gs
 * Sistem Penilaian SD Muhammadiyah 01 Kukusan
 *
 * Autobackup mingguan (tiap Jumat) seluruh spreadsheet database ke folder Drive terpisah.
 * Menyimpan backup hingga 3 bulan ke belakang (backup lebih tua otomatis dihapus).
 *
 * CARA PASANG:
 * 1. Buka spreadsheet database → menu Extensions > Apps Script
 * 2. Hapus isi Code.gs default, ganti dengan seluruh isi file ini
 *    (atau tambahkan sebagai file baru bernama BackupPenilaian.gs)
 * 3. Jalankan fungsi `backupDatabase` sekali secara manual (tombol ▶ di toolbar
 *    Apps Script) → akan muncul dialog izin, klik "Allow"/"Izinkan"
 *    (ini hanya untuk otorisasi awal, backup pertama akan langsung dibuat)
 * 4. Jalankan fungsi `createWeeklyTrigger` sekali secara manual → ini memasang
 *    jadwal otomatis mingguan, tiap Jumat jam 23:00 WIB
 * 5. Selesai. Backup akan berjalan sendiri tiap hari meski tidak ada yang
 *    membuka aplikasi maupun spreadsheet-nya.
 *
 * CEK HASIL:
 * Lihat folder "Backup Penilaian SDM01KKS" di Google Drive akun yang
 * menjalankan script ini (biasanya akun pemilik spreadsheet).
 */

/* ══════════════════════════════════════════════════════
   KONFIGURASI
   ══════════════════════════════════════════════════════ */

const BACKUP_SPREADSHEET_ID = '1uQ_b5B7er05pv2BcplHnhg3ZdOrCm9FUOXkhdZ4g3PA';
const BACKUP_FOLDER_NAME    = 'Backup Penilaian SDM01KKS';
const BACKUP_RETENTION_DAYS = 90; // ≈ 3 bulan
const BACKUP_TIMEZONE       = 'Asia/Jakarta';

/* ══════════════════════════════════════════════════════
   FUNGSI UTAMA — dipanggil oleh trigger mingguan
   ══════════════════════════════════════════════════════ */

function backupDatabase() {
  const originalFile = DriveApp.getFileById(BACKUP_SPREADSHEET_ID);
  const folder        = _getOrCreateBackupFolder(BACKUP_FOLDER_NAME);

  const timestamp  = Utilities.formatDate(new Date(), BACKUP_TIMEZONE, 'yyyy-MM-dd_HHmm');
  const backupName = `BACKUP_penilaian_${timestamp}`;

  const backupFile = originalFile.makeCopy(backupName, folder);

  _copyPermissions(BACKUP_SPREADSHEET_ID, backupFile.getId());
  _cleanupOldBackups(folder, BACKUP_RETENTION_DAYS);

  Logger.log('Backup selesai: ' + backupName + ' (' + backupFile.getId() + ')');
}

/* ══════════════════════════════════════════════════════
   PEMASANGAN TRIGGER — dijalankan SEKALI SAJA secara manual
   ══════════════════════════════════════════════════════ */

function createWeeklyTrigger() {
  // Hindari trigger dobel jika fungsi ini tidak sengaja dijalankan lagi
  _removeExistingTriggers('backupDatabase');

  ScriptApp.newTrigger('backupDatabase')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(23)
    .nearMinute(0)
    .inTimezone(BACKUP_TIMEZONE)
    .create();

  Logger.log('Trigger mingguan backupDatabase berhasil dipasang (Jumat, 23:00 WIB).');
}

/* ══════════════════════════════════════════════════════
   FUNGSI BANTUAN INTERNAL
   ══════════════════════════════════════════════════════ */

function _getOrCreateBackupFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

// Menyalin daftar editor & viewer dari spreadsheet asli ke file backup,
// supaya backup langsung siap dipakai (semua guru/admin bisa buka) tanpa
// perlu share ulang manual saat restore.
function _copyPermissions(sourceId, targetId) {
  try {
    const sourceFile = DriveApp.getFileById(sourceId);
    const targetFile = DriveApp.getFileById(targetId);

    sourceFile.getEditors().forEach(user => {
      try { targetFile.addEditor(user); } catch (e) { /* pemilik/diri sendiri, abaikan */ }
    });
    sourceFile.getViewers().forEach(user => {
      try { targetFile.addViewer(user); } catch (e) { /* abaikan */ }
    });
  } catch (e) {
    Logger.log('Gagal menyalin permission: ' + e.message);
  }
}

function _cleanupOldBackups(folder, retentionDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf('BACKUP_penilaian_') === 0 && file.getDateCreated() < cutoff) {
      file.setTrashed(true);
    }
  }
}

function _removeExistingTriggers(functionName) {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(t);
    }
  });
}
