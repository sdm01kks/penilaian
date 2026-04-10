/**
 * sheets.js — Modul Google Sheets API Bersama
 * SD Muhammadiyah 01 Kukusan — Sistem Penilaian
 *
 * Semua operasi baca/tulis ke Google Sheets melalui file ini.
 * Membutuhkan auth.js untuk token akses.
 */

const SHEETS = (() => {

  const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  /* ══════════════════════════════════════════════════════
     FUNGSI DASAR
  ══════════════════════════════════════════════════════ */

  /**
   * Baca data dari satu range.
   * @param {string} range - Contoh: 'SISWA!A:L' atau 'CONFIG!A2:B20'
   * @returns {Array} Array of arrays (baris × kolom)
   */
  async function read(range) {
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();
    const url   = `${BASE_URL}/${id}/values/${encodeURIComponent(range)}`;

    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 401) {
        AUTH.logout(false);
        throw new Error('Sesi berakhir. Silakan login ulang.');
      }
      if (res.status === 403) {
        throw new Error('Tidak ada izin akses ke database.');
      }
      throw new Error(`Sheets read error ${res.status}: ${range}`);
    }

    const data = await res.json();
    return data.values || [];
  }

  /**
   * Baca beberapa range sekaligus (lebih efisien).
   * @param {string[]} ranges - Array of range strings
   * @returns {Object} { rangeName: rows[] }
   */
  async function readBatch(ranges) {
    const id     = AUTH.getSpreadsheetId();
    const token  = AUTH.getToken();
    const params = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const url    = `${BASE_URL}/${id}/values:batchGet?${params}`;

    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets batchRead error ${res.status}`);
    }

    const data   = await res.json();
    const result = {};
    (data.valueRanges || []).forEach((vr, i) => {
      result[ranges[i]] = vr.values || [];
    });
    return result;
  }

  /**
   * Tulis data ke range tertentu (overwrite).
   * @param {string} range  - Contoh: 'SISWA!A2:L2'
   * @param {Array}  values - Array of arrays
   */
  async function write(range, values) {
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();

    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');

    const url = `${BASE_URL}/${id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method:  'PUT',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets write error ${res.status}: ${range}`);
    }

    return res.json();
  }

  /**
   * Tambah baris baru di akhir range (append).
   * @param {string} range  - Sheet name, misal: 'SISWA'
   * @param {Array}  values - Array of arrays
   */
  async function append(range, values) {
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();

    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');

    const url = `${BASE_URL}/${id}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets append error ${res.status}: ${range}`);
    }

    return res.json();
  }

  /**
   * Hapus baris berdasarkan index (0-based).
   * @param {number} sheetId   - ID tab (bukan nama)
   * @param {number} rowIndex  - Index baris yang dihapus (0-based)
   */
  async function deleteRow(sheetId, rowIndex) {
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();

    if (!token) throw new Error('Tidak ada token.');

    const url = `${BASE_URL}/${id}:batchUpdate`;
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension:  'ROWS',
              startIndex: rowIndex,
              endIndex:   rowIndex + 1,
            }
          }
        }]
      }),
    });

    if (!res.ok) throw new Error(`Sheets deleteRow error ${res.status}`);
    return res.json();
  }

  /* ══════════════════════════════════════════════════════
     FUNGSI TINGGI — Data Spesifik Aplikasi
  ══════════════════════════════════════════════════════ */

  /**
   * Ambil konfigurasi sekolah dari sheet CONFIG.
   * @returns {Object} key-value config
   */
  async function getConfig() {
    const rows   = await read('CONFIG!A:B');
    const config = {};
    rows.slice(1).forEach(r => {
      if (r[0]) config[r[0]] = r[1] || '';
    });
    return config;
  }

  /**
   * Update satu nilai konfigurasi.
   * @param {string} key
   * @param {string} value
   */
  async function setConfig(key, value) {
    const rows = await read('CONFIG!A:B');
    const idx  = rows.findIndex((r, i) => i > 0 && r[0] === key);

    if (idx === -1) {
      // Tambah baris baru
      await append('CONFIG', [[key, value]]);
    } else {
      // Update baris yang ada (idx adalah index di array, +1 untuk Excel row)
      await write(`CONFIG!B${idx + 1}`, [[value]]);
    }
  }

  /**
   * Ambil daftar kelas dari sheet KELAS.
   * @returns {Array} Array of { id, nama, tingkat, fase }
   */
  async function getKelas() {
    const rows = await read('KELAS!A:E');
    return rows.slice(1)
      .filter(r => r[0] && r[1])
      .map(r => ({
        id:         r[0] || '',
        nama:       r[1] || '',
        tingkat:    r[2] || '',
        fase:       r[3] || '',
        keterangan: r[4] || '',
      }));
  }

  /**
   * Ambil daftar siswa, opsional filter per kelas.
   * @param {string|null} kelas - Filter kelas, null = semua
   * @returns {Array}
   */
  async function getSiswa(kelas = null) {
    const rows = await read('SISWA!A:L');
    let siswa  = rows.slice(1).filter(r => r[0] && r[1]);

    if (kelas) {
      siswa = siswa.filter(r => (r[4] || '') === kelas);
    }

    return siswa.map(r => ({
      id:              r[0]  || '',
      nama:            r[1]  || '',
      nis:             r[2]  || '',
      nisn:            r[3]  || '',
      kelas:           r[4]  || '',
      agama:           r[5]  || 'Islam',
      alamat:          r[6]  || '',
      nama_ayah:       r[7]  || '',
      nama_ibu:        r[8]  || '',
      pekerjaan_ayah:  r[9]  || '',
      pekerjaan_ibu:   r[10] || '',
      no_hp:           r[11] || '',
    }));
  }

  /**
   * Tambah siswa baru.
   * @param {Object} siswa
   */
  async function addSiswa(siswa) {
    const id = await _generateId('SISWA', 'S');
    const row = [
      id,
      siswa.nama        || '',
      siswa.nis         || '',
      siswa.nisn        || '',
      siswa.kelas       || '',
      siswa.agama       || 'Islam',
      siswa.alamat      || '',
      siswa.nama_ayah   || '',
      siswa.nama_ibu    || '',
      siswa.pekerjaan_ayah || '',
      siswa.pekerjaan_ibu  || '',
      siswa.no_hp       || '',
    ];
    await append('SISWA', [row]);
    return id;
  }

  /**
   * Ambil daftar user (guru) dari sheet USERS.
   * @param {string|null} role - Filter role
   */
  async function getUsers(role = null) {
    const rows = await read('USERS!A:I');
    let users  = rows.slice(1).filter(r => r[0] && r[1]);

    if (role) users = users.filter(r => (r[3] || '') === role);

    return users.map(r => ({
      id:       r[0] || '',
      email:    r[1] || '',
      nama:     r[2] || '',
      role:     r[3] || '',
      kelas:    r[4] || '',
      mapel:    r[5] || '',
      status:   r[6] || '',
      ditambah: r[7] || '',
      tanggal:  r[8] || '',
    }));
  }

  /**
   * Tambah user baru (guru).
   */
  async function addUser(user) {
    const id      = await _generateId('USERS', 'U');
    const tanggal = new Date().toLocaleDateString('id-ID');
    const row     = [
      id,
      user.email  || '',
      user.nama   || '',
      user.role   || 'guru_kelas',
      user.kelas  || '',
      user.mapel  || '',
      'aktif',
      AUTH.getUser()?.id_user || 'admin',
      tanggal,
    ];
    await append('USERS', [row]);
    return id;
  }

  /**
   * Ambil daftar mapel dari sheet MAPEL.
   */
  async function getMapel() {
    const rows = await read('MAPEL!A:F');
    return rows.slice(1)
      .filter(r => r[0] && r[1])
      .map(r => ({
        id:           r[0] || '',
        nama:         r[1] || '',
        kelompok:     r[2] || '',
        urutan:       parseInt(r[3]) || 0,
        berlaku_fase: r[4] || 'semua',
        keterangan:   r[5] || '',
      }))
      .sort((a, b) => a.urutan - b.urutan);
  }

  /**
   * Ambil TP dan KKTP, opsional filter per mapel/kelas.
   */
  async function getTPKKTP({ id_mapel, kelas, fase } = {}) {
    const rows = await read('TP_KKTP!A:V');
    let data   = rows.slice(1).filter(r => r[0] && r[1]);

    if (id_mapel) data = data.filter(r => r[1] === id_mapel);
    if (kelas)    data = data.filter(r => r[3] === kelas);
    if (fase)     data = data.filter(r => r[2] === fase);

    return data.map(r => ({
      id_tp:     r[0]  || '',
      id_mapel:  r[1]  || '',
      fase:      r[2]  || '',
      kelas:     r[3]  || '',
      nomor_tp:  r[4]  || '',
      nama_tp:   r[5]  || '',
      end_tp:    r[6]  || '',
      tipe:      r[7]  || 'pengetahuan',
      bobot_slm: parseInt(r[8])  || 60,
      bobot_sas: parseInt(r[9])  || 40,
      level: [
        { min: parseInt(r[10])||0,  maks: parseInt(r[11])||60, deskripsi: r[12]||'' },
        { min: parseInt(r[13])||61, maks: parseInt(r[14])||75, deskripsi: r[15]||'' },
        { min: parseInt(r[16])||76, maks: parseInt(r[17])||85, deskripsi: r[18]||'' },
        { min: parseInt(r[19])||86, maks: parseInt(r[20])||100,deskripsi: r[21]||'' },
      ],
    }));
  }

  /**
   * Ambil data 8 DPL dari sheet DPL.
   */
  async function getDPL() {
    const rows = await read('DPL!A:N');
    return rows.slice(1)
      .filter(r => r[0] && r[1])
      .map(r => ({
        id:    r[0] || '',
        nama:  r[1] || '',
        level: [
          { min: parseInt(r[2])||0,  maks: parseInt(r[3])||60, deskripsi: r[4]||'' },
          { min: parseInt(r[5])||61, maks: parseInt(r[6])||75, deskripsi: r[7]||'' },
          { min: parseInt(r[8])||76, maks: parseInt(r[9])||85, deskripsi: r[10]||'' },
          { min: parseInt(r[11])||86,maks: parseInt(r[12])||100,deskripsi: r[13]||'' },
        ],
      }));
  }

  /**
   * Ambil nilai siswa, filter per kelas & semester.
   */
  async function getNilai({ id_siswa, id_mapel, kelas, semester, tahun } = {}) {
    const rows = await read('NILAI!A:K');
    let data   = rows.slice(1).filter(r => r[0]);

    if (id_siswa) data = data.filter(r => r[1] === id_siswa);
    if (id_mapel) data = data.filter(r => r[3] === id_mapel);
    if (kelas)    data = data.filter(r => r[4] === kelas);
    if (semester) data = data.filter(r => r[5] === semester);
    if (tahun)    data = data.filter(r => r[6] === tahun);

    return data.map(r => ({
      id:             r[0]  || '',
      id_siswa:       r[1]  || '',
      id_tp:          r[2]  || '',
      id_mapel:       r[3]  || '',
      kelas:          r[4]  || '',
      semester:       r[5]  || '',
      tahun_pelajaran:r[6]  || '',
      nilai_slm:      parseFloat(r[7]) || 0,
      nilai_sas:      parseFloat(r[8]) || 0,
      nilai_akhir:    parseFloat(r[9]) || 0,
      level_kktp:     r[10] || '',
    }));
  }

  /**
   * Simpan nilai siswa (upsert — update jika ada, tambah jika tidak ada).
   */
  async function saveNilai(nilai) {
    // Cek apakah sudah ada
    const existing = await getNilai({
      id_siswa: nilai.id_siswa,
      id_tp:    nilai.id_tp,
      semester: nilai.semester,
      tahun:    nilai.tahun_pelajaran,
    });

    const row = [
      nilai.id || '',
      nilai.id_siswa       || '',
      nilai.id_tp          || '',
      nilai.id_mapel       || '',
      nilai.kelas          || '',
      nilai.semester       || '',
      nilai.tahun_pelajaran|| '',
      nilai.nilai_slm      || '',
      nilai.nilai_sas      || '',
      nilai.nilai_akhir    || '',
      nilai.level_kktp     || '',
    ];

    if (existing.length > 0) {
      // TODO: update baris yang ada (perlu row index)
      await append('NILAI', [row]);
    } else {
      const id = await _generateId('NILAI', 'NL');
      row[0]   = id;
      await append('NILAI', [row]);
    }
  }

  /**
   * Ambil ekskul dari sheet EKSKUL.
   */
  async function getEkskul() {
    const rows = await read('EKSKUL!A:D');
    return rows.slice(1)
      .filter(r => r[0] && r[1])
      .map(r => ({
        id:          r[0] || '',
        nama:        r[1] || '',
        jenis:       r[2] || '',
        keterangan:  r[3] || '',
      }));
  }

  /**
   * Ambil data absensi siswa.
   */
  async function getAbsensi({ id_siswa, kelas, semester, tahun } = {}) {
    const rows = await read('ABSENSI!A:J');
    let data   = rows.slice(1).filter(r => r[0]);

    if (id_siswa) data = data.filter(r => r[1] === id_siswa);
    if (kelas)    data = data.filter(r => r[2] === kelas);
    if (semester) data = data.filter(r => r[3] === semester);
    if (tahun)    data = data.filter(r => r[4] === tahun);

    return data.map(r => ({
      id:                r[0]  || '',
      id_siswa:          r[1]  || '',
      kelas:             r[2]  || '',
      semester:          r[3]  || '',
      tahun_pelajaran:   r[4]  || '',
      sakit:             parseInt(r[5])  || 0,
      izin:              parseInt(r[6])  || 0,
      tanpa_keterangan:  parseInt(r[7])  || 0,
      catatan_wali:      r[8]  || '',
      keputusan:         r[9]  || '',
    }));
  }

  /* ══════════════════════════════════════════════════════
     FUNGSI KALKULASI NILAI
  ══════════════════════════════════════════════════════ */

  /**
   * Hitung nilai akhir dari SLM dan SAS.
   * @param {number[]} nilaiSLM  - Array nilai per TP
   * @param {number}   nilaiSAS
   * @param {number}   bobotSLM  - Persentase (misal 60)
   * @param {number}   bobotSAS  - Persentase (misal 40)
   * @returns {number} Nilai akhir dibulatkan
   */
  function hitungNilaiAkhir(nilaiSLM, nilaiSAS, bobotSLM = 60, bobotSAS = 40) {
    if (!nilaiSLM || nilaiSLM.length === 0) return nilaiSAS || 0;

    const rataSLM   = nilaiSLM.reduce((a, b) => a + b, 0) / nilaiSLM.length;
    const nilaiAkhir = (rataSLM * bobotSLM / 100) + (nilaiSAS * bobotSAS / 100);
    return Math.round(nilaiAkhir);
  }

  /**
   * Tentukan level KKTP berdasarkan nilai dan konfigurasi level.
   * @param {number} nilai
   * @param {Array}  levels - Array of { min, maks, deskripsi }
   * @param {string} tipe   - 'pengetahuan' | 'kinerja'
   * @returns {{ index, namaLevel, deskripsi }}
   */
  function tentukanLevel(nilai, levels, tipe = 'pengetahuan') {
    const namaLevels = tipe === 'kinerja'
      ? ['Mulai Berkembang', 'Layak', 'Cakap', 'Mahir']
      : ['Perlu Bimbingan', 'Cukup', 'Baik', 'Sangat Baik'];

    for (let i = 0; i < levels.length; i++) {
      const lv = levels[i];
      if (nilai >= lv.min && nilai <= lv.maks) {
        return {
          index:      i,
          namaLevel:  namaLevels[i],
          deskripsi:  lv.deskripsi,
        };
      }
    }

    // Fallback: level tertinggi jika nilai = 100
    const last = levels.length - 1;
    return {
      index:     last,
      namaLevel: namaLevels[last],
      deskripsi: levels[last]?.deskripsi || '',
    };
  }

  /**
   * Generate deskripsi rapor otomatis dari semua nilai TP.
   * @param {string}  namaSiswa
   * @param {Array}   nilaiPerTP - [{ nilai_slm, tp: { level, nama_tp } }]
   * @returns {string} Kalimat deskripsi rapor
   */
  function generateDeskripsi(namaSiswa, nilaiPerTP) {
    if (!nilaiPerTP || nilaiPerTP.length === 0) return '';

    // Urutkan berdasarkan nilai
    const sorted  = [...nilaiPerTP].sort((a, b) => b.nilai_slm - a.nilai_slm);
    const tertinggi = sorted[0];
    const terendah  = sorted[sorted.length - 1];

    const nama = namaSiswa.split(' ')[0]; // Ambil nama pertama saja

    if (sorted.length === 1) {
      return `Ananda ${nama} ${tertinggi.deskripsi}.`;
    }

    return `Ananda ${nama} ${tertinggi.deskripsi} dan ${terendah.deskripsi}.`;
  }

  /* ══════════════════════════════════════════════════════
     HELPER INTERNAL
  ══════════════════════════════════════════════════════ */

  /**
   * Generate ID unik berdasarkan isi sheet yang ada.
   * @param {string} sheetName
   * @param {string} prefix - Misal 'S' → S001, S002, ...
   */
  async function _generateId(sheetName, prefix) {
    try {
      const rows  = await read(`${sheetName}!A:A`);
      const count = rows.slice(1).filter(r => r[0]).length;
      const num   = String(count + 1).padStart(3, '0');
      return `${prefix}${num}`;
    } catch (_) {
      // Fallback: gunakan timestamp
      return `${prefix}${Date.now()}`;
    }
  }

  /* ── Expose publik API ───────────────────────────────── */
  return {
    // CRUD dasar
    read,
    readBatch,
    write,
    append,
    deleteRow,

    // Data spesifik
    getConfig,
    setConfig,
    getKelas,
    getSiswa,
    addSiswa,
    getUsers,
    addUser,
    getMapel,
    getTPKKTP,
    getDPL,
    getNilai,
    saveNilai,
    getEkskul,
    getAbsensi,

    // Kalkulasi
    hitungNilaiAkhir,
    tentukanLevel,
    generateDeskripsi,
  };

})();
