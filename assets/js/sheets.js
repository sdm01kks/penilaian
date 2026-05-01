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

    // Ensure range includes cell reference for append (Google Sheets API requirement)
    const safeRange = range.includes('!') ? range : range + '!A:ZZ';
    const url = `${BASE_URL}/${id}/values/${encodeURIComponent(safeRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
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
    rows.slice(2).forEach(r => {
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
    return rows.slice(2)
      .filter(r => r[0] && r[1] && r[0] !== 'id_kelas')
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
    const rows = await read('SISWA!A:O');
    let siswa  = rows.slice(2).filter(r => r[0] && r[1] && r[0] !== 'id_siswa');

    if (kelas) {
      siswa = siswa.filter(r => (r[4] || '') === kelas);
    }

    const stripNum = (v) => String(v || '').replace(/^'+/, '').trim();  // hapus prefix apostrof

    // Deduplikasi: jika ada ID yang sama (akibat race condition lama),
    // ambil baris TERAKHIR (yang paling baru) untuk setiap ID
    const seenIds = new Map();
    siswa.forEach((r, i) => { if (r[0]) seenIds.set(r[0], r); });
    siswa = [...seenIds.values()];

    return siswa.map(r => ({
      id:              r[0]  || '',
      nama:            r[1]  || '',
      nis:             stripNum(r[2]),
      nisn:            stripNum(r[3]),
      kelas:           r[4]  || '',
      agama:           r[5]  || 'Islam',
      alamat:          r[6]  || '',
      nama_ayah:       r[7]  || '',
      nama_ibu:        r[8]  || '',
      pekerjaan_ayah:  r[9]  || '',
      pekerjaan_ibu:   r[10] || '',
      no_hp:           r[11] || '',
      tempat_lahir:    r[12] || '',
      tgl_lahir:       r[13] || '',
      nama_wali:       r[14] || '',
    }));
  }

  /**
   * Tambah siswa baru.
   * @param {Object} siswa
   */
  async function addSiswa(siswa) {
    const id = await _generateId('SISWA', 'S');
    // Prefix NISN dan No HP dengan apostrof agar Google Sheets menyimpan sebagai teks
    // (mencegah angka nol di depan hilang)
    const fmtNum = (v) => {
      const s = String(v || '').trim();
      return s ? "'" + s : '';   // apostrof di awal = force text di Sheets
    };
    const row = [
      id,
      siswa.nama           || '',
      fmtNum(siswa.nis),
      fmtNum(siswa.nisn),
      siswa.kelas          || '',
      siswa.agama          || 'Islam',
      siswa.alamat         || '',
      siswa.nama_ayah      || '',
      siswa.nama_ibu       || '',
      siswa.pekerjaan_ayah || '',
      siswa.pekerjaan_ibu  || '',
      fmtNum(siswa.no_hp),
      siswa.tempat_lahir || '',
      siswa.tgl_lahir    || '',
      siswa.nama_wali    || '',
    ];
    await append('SISWA', [row]);
    return id;
  }

  /**
   * Ambil daftar user (guru) dari sheet USERS.
   * @param {string|null} role - Filter role
   */
  async function getUsers(role = null) {
    // FIX 2025-04-29: Baca hingga kolom K (bukan A:J) agar kelas_mapel (kolom K) ikut terbaca
    const rows = await read('USERS!A:K');
    let users  = rows.slice(2).filter(r => r[0] && r[1] && r[0] !== 'id_user');

    if (role) users = users.filter(r => (r[3] || '') === role);

    return users.map(r => {
      const mapelRaw      = r[5]  || '';
      const kelasMapelRaw = r[10] || '';  // kolom K: kelas lain sbg guru mapel (guru_kelas merangkap)
      return {
        id:              r[0] || '',
        email:           r[1] || '',
        nama:            r[2] || '',
        role:            r[3] || '',
        kelas:           r[4] || '',
        mapel:           mapelRaw,
        mapelList:       mapelRaw ? mapelRaw.split(',').map(s=>s.trim()).filter(Boolean) : [],
        kelasList:       r[4] ? String(r[4]).split(',').map(s=>s.trim()).filter(Boolean) : [],
        status:          r[6] || '',
        ditambah:        r[7] || '',
        tanggal:         r[8] || '',
        nbm:             r[9] || '',
        // FIX: kelas_mapel dan kelasMapelList sebelumnya tidak ada di sini
        kelas_mapel:     kelasMapelRaw,
        kelasMapel:      kelasMapelRaw,  // alias untuk kompatibilitas kelola-guru.html
        kelasMapelList:  kelasMapelRaw ? kelasMapelRaw.split(',').map(s=>s.trim()).filter(Boolean) : [],
      };
    });
  }

  /**
   * Tambah user baru (guru).
   */
  async function addUser(user) {
    const id      = await _generateId('USERS', 'U');
    const tanggal = new Date().toLocaleDateString('id-ID');
    const row     = [
      id,
      user.email       || '',
      user.nama        || '',
      user.role        || 'guru_kelas',
      user.kelas       || '',
      user.mapel       || '',
      'aktif',
      AUTH.getUser()?.id_user || 'admin',
      tanggal,
      user.nbm         || '',
      // FIX 2025-04-29: tambahkan kolom K (kelas_mapel) yang sebelumnya tidak disimpan saat addUser
      user.kelas_mapel || '',
    ];
    await append('USERS', [row]);
    return id;
  }

  /**
   * Ambil daftar mapel dari sheet MAPEL.
   */
  async function getMapel() {
    const rows = await read('MAPEL!A:F');
    return rows.slice(2)
      .filter(r => r[0] && r[1] && r[0] !== 'id_mapel')
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
    const rows = await read('TP_KKTP!A:W');
    let data   = rows.slice(2).filter(r => r[0] && r[1] && r[0] !== 'id_tp' && r[0].trim() !== '');

    if (id_mapel) data = data.filter(r => r[1] === id_mapel);
    if (kelas) {
      // Normalisasi: ekstrak angka tingkatan dari nama kelas
      // "6B" → "6", "6" → "6", "1A" → "1"
      const tingkatanQuery = String(kelas).replace(/[^0-9]/g, '');
      data = data.filter(r => {
        const tingkatanRow = String(r[3] || '').replace(/[^0-9]/g, '');
        return tingkatanRow === tingkatanQuery;
      });
    }
    if (fase) data = data.filter(r => r[2] === fase);

    // Deduplikasi berdasarkan id_tp — ambil entri terbaru (index tertinggi)
    const seen = new Map();
    data.forEach((r, i) => {
      const id = r[0];
      if (!seen.has(id) || i > seen.get(id).idx) {
        seen.set(id, { r, idx: i });
      }
    });
    data = [...seen.values()].map(v => v.r);

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
      cp: r[22] || '',  // Capaian Pembelajaran per TP (kolom W)
    }));
  }

  /**
   * Ambil data 8 DPL dari sheet DPL.
   */
  async function getDPL({ tingkatan } = {}) {
    const rows = await read('DPL!A:O');
    let data = rows.slice(2).filter(r => r[0] && r[1] && r[0] !== 'id_dpl');

    // Col O (index 14) = tingkatan. Kosong = berlaku semua (backward compat)
    if (tingkatan) {
      const t = String(tingkatan).replace(/[^0-9]/g, '');
      data = data.filter(r => {
        const rowT = String(r[14] || '').replace(/[^0-9]/g, '');
        return rowT === '' || rowT === t;
      });
    }

    return data.map(r => ({
      id:        r[0] || '',
      nama:      r[1] || '',
      tingkatan: r[14] || '',
      level: [
        { min: parseInt(r[2])||0,   maks: parseInt(r[3])||60,  deskripsi: r[4]||'' },
        { min: parseInt(r[5])||61,  maks: parseInt(r[6])||75,  deskripsi: r[7]||'' },
        { min: parseInt(r[8])||76,  maks: parseInt(r[9])||85,  deskripsi: r[10]||'' },
        { min: parseInt(r[11])||86, maks: parseInt(r[12])||100, deskripsi: r[13]||'' },
      ],
    }));
  }

  /**
   * Ambil nilai siswa, filter per kelas & semester.
   * FIX C-01 (v4 2026-04-30): Tambah id_tp ke destructuring & filter.
   */
  async function getNilai({ id_siswa, id_tp, id_mapel, kelas, semester, tahun } = {}) {
    const rows = await read('NILAI!A:K');
    let data   = rows.slice(2).filter(r => r[0] && r[0] !== 'id_nilai');

    if (id_siswa) data = data.filter(r => r[1] === id_siswa);
    if (id_tp)    data = data.filter(r => r[2] === id_tp);   // FIX C-01
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
   * FIX B-01 (v4 2026-04-30): Implementasi UPDATE baris yang tepat via write().
   *   Sebelumnya selalu memanggil append() meski data sudah ada → duplikasi masif.
   *   Kini: baca raw rows → cari index baris → write() ke baris itu, atau append() jika baru.
   */
  async function saveNilai(nilai) {
    // Baca semua baris NILAI untuk mencari posisi baris yang ada
    const rows = await read('NILAI!A:K');

    // Cari baris yang cocok: id_siswa + id_tp + semester + tahun_pelajaran (FIX C-01 memastikan id_tp dipakai)
    let existingRowIndex = -1;  // 0-based index di array rows[]
    let existingId       = '';
    for (let i = 2; i < rows.length; i++) {  // skip 2 baris header
      const r = rows[i];
      if (
        r[0] && r[0] !== 'id_nilai' &&
        r[1] === nilai.id_siswa &&
        r[2] === nilai.id_tp &&
        r[5] === nilai.semester &&
        r[6] === nilai.tahun_pelajaran
      ) {
        existingRowIndex = i;
        existingId       = r[0];
        break;
      }
    }

    const buildRow = (id) => [
      id,
      nilai.id_siswa         || '',
      nilai.id_tp            || '',
      nilai.id_mapel         || '',
      nilai.kelas            || '',
      nilai.semester         || '',
      nilai.tahun_pelajaran  || '',
      nilai.nilai_slm        !== undefined ? nilai.nilai_slm  : '',
      nilai.nilai_sas        !== undefined ? nilai.nilai_sas  : '',
      nilai.nilai_akhir      !== undefined ? nilai.nilai_akhir: '',
      nilai.level_kktp       || '',
    ];

    if (existingRowIndex >= 0) {
      // UPDATE — tulis ke baris yang sudah ada (1-based sheet row = index + 1)
      const sheetRow = existingRowIndex + 1;
      await write(`NILAI!A${sheetRow}:K${sheetRow}`, [buildRow(existingId)]);
      return existingId;
    } else {
      // INSERT — baris baru
      const id = await _generateId('NILAI', 'NL');
      await append('NILAI', [buildRow(id)]);
      return id;
    }
  }

  /**
   * Ambil ekskul dari sheet EKSKUL.
   */
  async function getEkskul() {
    const rows = await read('EKSKUL!A:N');
    return rows.slice(2)
      .filter(r => r[0] && r[1] && r[0] !== 'id_ekskul')
      .map(r => ({
        id:          r[0] || '',
        nama:        r[1] || '',
        jenis:       r[2] || '',
        keterangan:  r[3] || '',
        level: [
          { min: parseInt(r[4])||0,  maks: parseInt(r[5])||60,  deskripsi: r[6]||'' },
          { min: parseInt(r[7])||61, maks: parseInt(r[8])||85,  deskripsi: r[9]||'' },
          { min: parseInt(r[10])||86,maks: parseInt(r[11])||100, deskripsi: r[12]||'' },
        ],
      }));
  }

  /**
   * Ambil data absensi siswa.
   */
  async function getAbsensi({ id_siswa, kelas, semester, tahun } = {}) {
    const rows = await read('ABSENSI!A:J');
    let data   = rows.slice(2).filter(r => r[0] && r[0] !== 'id_nilai');

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
  /* ══════════════════════════════════════════════════════
     MUTASI SISWA — Sheet MUTASI (A:K)
     A=id_mutasi, B=jenis(masuk/keluar), C=id_siswa,
     D=nama_siswa, E=kelas, F=id_guru, G=nama_guru,
     H=tanggal_pengajuan, I=status, J=catatan_admin,
     K=tanggal_keputusan
  ══════════════════════════════════════════════════════ */

  /**
   * Ambil semua pengajuan mutasi.
   * @param {{ status, id_guru, kelas }} filter - opsional
   */
  async function getMutasi({ status = null, id_guru = null, kelas = null } = {}) {
    const rows = await read('MUTASI!A:K');
    let data   = rows.filter(r => r[0] && String(r[0]).startsWith('MT'));
    if (status)   data = data.filter(r => (r[8]  || '') === status);
    if (id_guru)  data = data.filter(r => (r[5]  || '') === id_guru);
    if (kelas)    data = data.filter(r => (r[4]  || '') === kelas);
    return data.map(r => ({
      id:                r[0]  || '',
      jenis:             r[1]  || '',   // 'masuk' | 'keluar'
      id_siswa:          r[2]  || '',   // diisi untuk jenis keluar
      nama_siswa:        r[3]  || '',
      kelas:             r[4]  || '',
      id_guru:           r[5]  || '',
      nama_guru:         r[6]  || '',
      tanggal_pengajuan: r[7]  || '',
      status:            r[8]  || 'pending',  // pending | disetujui | ditolak
      catatan_admin:     r[9]  || '',
      tanggal_keputusan: r[10] || '',
    }));
  }

  /**
   * Tambah pengajuan mutasi baru (oleh guru kelas).
   */
  async function addMutasi(data) {
    const id      = await _generateId('MUTASI', 'MT');
    const tanggal = new Date().toLocaleDateString('id-ID');
    const row     = [
      id,
      data.jenis        || '',
      data.id_siswa     || '',
      data.nama_siswa   || '',
      data.kelas        || '',
      data.id_guru      || '',
      data.nama_guru    || '',
      tanggal,
      'pending',
      '',   // catatan_admin
      '',   // tanggal_keputusan
    ];
    await append('MUTASI', [row]);
    return id;
  }

  /**
   * Update status pengajuan mutasi (oleh admin).
   * @param {string} id       - id_mutasi
   * @param {string} status   - 'disetujui' | 'ditolak'
   * @param {string} catatan  - catatan admin (opsional)
   */
  async function updateMutasiStatus(id, status, catatan = '') {
    const rows = await read('MUTASI!A:K');
    const idx  = rows.findIndex(r => r[0] === id);
    if (idx < 0) throw new Error(`Pengajuan mutasi tidak ditemukan: ${id}`);
    const tanggal = new Date().toLocaleDateString('id-ID');
    // Pertahankan data baris, hanya ubah kolom I, J, K
    const r       = rows[idx];
    const row     = [
      r[0]||'', r[1]||'', r[2]||'', r[3]||'', r[4]||'',
      r[5]||'', r[6]||'', r[7]||'',
      status, catatan, tanggal,
    ];
    await write(`MUTASI!A${idx + 1}:K${idx + 1}`, [row]);
  }

  async function _generateId(sheetName, prefix) {
    // Gunakan timestamp + random agar tidak ada duplikasi saat import massal
    const ts  = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 6);
    return `${prefix}${ts}${rnd}`;
  }

  /**
   * Ambil data setoran Tahsin-Tahfizh dari sheet SETORAN_TT.
   * @param {{ kelas, semester, tahun, id_siswa }} filter
   */
  async function getSetoranTT({ kelas, semester, tahun, id_siswa } = {}) {
    const rows = await read('SETORAN_TT!A:M');
    // Robust: skip header rows by checking ID pattern (ST prefix), works with 1 OR 2 header rows
    let data   = rows.filter(r => r[0] && String(r[0]).startsWith('ST'));
    console.log('[SETORAN_TT] total rows from sheet:', rows.length, '| data rows:', data.length);

    if (kelas)    data = data.filter(r => r[2] === kelas);
    if (semester) data = data.filter(r => r[3] === semester);
    if (tahun)    data = data.filter(r => r[4] === tahun);
    if (id_siswa) data = data.filter(r => r[1] === id_siswa);

    return data.map(r => ({
      id:              r[0]  || '',
      id_siswa:        r[1]  || '',
      kelas:           r[2]  || '',
      semester:        r[3]  || '',
      tahun_pelajaran: r[4]  || '',
      tanggal:         r[5]  || '',
      jenis:           r[6]  || '',   // 'iqro' | 'quran'
      materi:          r[7]  || '',   // key segmen e.g. "114-1-6"
      materi_label:    r[8]  || '',   // label tampilan
      nilai_tahsin:    parseInt(r[9])  || 0,
      status_hafalan:  r[10] || '',   // 'lulus' | 'ulang'
      catatan:         r[11] || '',
      nilai_aspek:     r[12] ? JSON.parse(r[12] || '{}') : {},
    }));
  }

  /**
   * Simpan satu setoran Tahsin-Tahfizh baru ke sheet SETORAN_TT.
   * @param {Object} setoran
   * @returns {string} id yang dihasilkan
   */
  async function saveSetoranTT(setoran) {
    const id  = 'ST' + Date.now().toString(36).toUpperCase()
                     + Math.random().toString(36).slice(2,5).toUpperCase();
    const row = [
      id,
      setoran.id_siswa        || '',
      setoran.kelas           || '',
      setoran.semester        || '',
      setoran.tahun_pelajaran || '',
      setoran.tanggal         || new Date().toLocaleDateString('id-ID'),
      setoran.jenis           || 'quran',
      setoran.materi          || '',
      setoran.materi_label    || '',
      setoran.nilai_tahsin    ?? '',
      setoran.status_hafalan  || '',
      setoran.catatan         || '',
      setoran.nilai_aspek     ? JSON.stringify(setoran.nilai_aspek) : '',
    ];
    await append('SETORAN_TT', [row]);
    return id;
  }

  /**
   * Update setoran Tahsin-Tahfizh yang sudah ada (partial update).
   * @param {string} id      - ID setoran yang akan diupdate
   * @param {Object} setoran - Field yang akan diperbarui
   */
  async function updateSetoranTT(id, setoran) {
    const rows = await read('SETORAN_TT!A:M');
    // Robust: don't use i>=2, find by ID value directly
    const idx  = rows.findIndex(r => r[0] === id);
    if (idx === -1) throw new Error(`Setoran tidak ditemukan: ${id} (total rows: ${rows.length})`);
    console.log('[updateSetoranTT] found at row index', idx, '→ sheet row', idx+1);

    const ex = rows[idx];  // data existing sebagai fallback
    const row = [
      id,
      setoran.id_siswa        !== undefined ? setoran.id_siswa        : (ex[1]  || ''),
      setoran.kelas           !== undefined ? setoran.kelas           : (ex[2]  || ''),
      setoran.semester        !== undefined ? setoran.semester        : (ex[3]  || ''),
      setoran.tahun_pelajaran !== undefined ? setoran.tahun_pelajaran : (ex[4]  || ''),
      setoran.tanggal         !== undefined ? setoran.tanggal         : (ex[5]  || ''),
      setoran.jenis           !== undefined ? setoran.jenis           : (ex[6]  || ''),
      setoran.materi          !== undefined ? setoran.materi          : (ex[7]  || ''),
      setoran.materi_label    !== undefined ? setoran.materi_label    : (ex[8]  || ''),
      setoran.nilai_tahsin    !== undefined ? setoran.nilai_tahsin    : (ex[9]  || ''),
      setoran.status_hafalan  !== undefined ? setoran.status_hafalan  : (ex[10] || ''),
      setoran.catatan         !== undefined ? setoran.catatan         : (ex[11] || ''),
      setoran.nilai_aspek     !== undefined
        ? JSON.stringify(setoran.nilai_aspek)
        : (ex[12] || ''),
    ];

    // idx = index 0-based di array rows; baris sheet = idx + 1 (1-based)
    await write(`SETORAN_TT!A${idx + 1}:M${idx + 1}`, [row]);
  }

  /**
   * Hapus setoran Tahsin-Tahfizh berdasarkan ID.
   * @param {number} sheetId - Numeric ID tab SETORAN_TT (dari Google Sheets)
   * @param {string} id      - ID setoran yang akan dihapus
   */
  async function deleteSetoranTT(sheetId, id) {
    const rows = await read('SETORAN_TT!A:A');
    const idx  = rows.findIndex(r => r[0] === id);
    if (idx === -1) throw new Error(`Setoran tidak ditemukan: ${id}`);
    console.log('[deleteSetoranTT] found at row index', idx, '→ sheet row', idx+1);

    // idx sudah 0-based, sesuai dengan format yang diharapkan deleteRow
    await deleteRow(sheetId, idx);
  }

  /* ══════════════════════════════════════════════════════
     UJIAN SEKOLAH / SUMATIF AKHIR JENJANG
     Sheet NILAI_RAPOR_RERATA (A:G):
       A=id, B=id_siswa, C=id_mapel, D=kelas,
       E=semester (7–12), F=tahun_pelajaran, G=nilai
     Sheet NILAI_US (A:G):
       A=id, B=id_siswa, C=id_mapel, D=kelas,
       E=tahun_pelajaran, F=nilai_tertulis, G=nilai_praktik
  ══════════════════════════════════════════════════════ */

  /**
   * Ambil nilai rata-rata rapor dari sheet NILAI_RAPOR_RERATA.
   * @param {{ id_siswa, id_mapel, kelas, semester }} filter
   */
  async function getNilaiRaporRerata({ id_siswa, id_mapel, kelas, semester } = {}) {
    const rows = await read('NILAI_RAPOR_RERATA!A:G');
    let data = rows.slice(2).filter(r => r[0] && r[0] !== 'id_nilai_rapor' && String(r[0]).startsWith('NR'));

    if (id_siswa) data = data.filter(r => r[1] === id_siswa);
    if (id_mapel) data = data.filter(r => r[2] === id_mapel);
    if (kelas)    data = data.filter(r => r[3] === kelas);
    if (semester) data = data.filter(r => String(r[4]) === String(semester));

    return data.map(r => ({
      id:              r[0] || '',
      id_siswa:        r[1] || '',
      id_mapel:        r[2] || '',
      kelas:           r[3] || '',
      semester:        r[4] || '',
      tahun_pelajaran: r[5] || '',
      nilai:           r[6] !== '' && r[6] !== undefined ? parseFloat(r[6]) : null,
    }));
  }

  /**
   * Simpan nilai rata-rata rapor (upsert per siswa+mapel+semester).
   * @param {Object} item — { id_siswa, id_mapel, kelas, semester, tahun_pelajaran, nilai }
   * @returns {string} id yang digunakan
   */
  async function saveNilaiRaporRerata(item) {
    const rows = await read('NILAI_RAPOR_RERATA!A:G');

    let existingRowIndex = -1;
    let existingId       = '';
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (
        r[0] && String(r[0]).startsWith('NR') &&
        r[1] === item.id_siswa &&
        r[2] === item.id_mapel &&
        String(r[4]) === String(item.semester)
      ) {
        existingRowIndex = i;
        existingId       = r[0];
        break;
      }
    }

    const buildRow = (id) => [
      id,
      item.id_siswa        || '',
      item.id_mapel        || '',
      item.kelas           || '',
      String(item.semester || ''),
      item.tahun_pelajaran || '',
      item.nilai !== null && item.nilai !== undefined ? item.nilai : '',
    ];

    if (existingRowIndex >= 0) {
      const sheetRow = existingRowIndex + 1;
      await write(`NILAI_RAPOR_RERATA!A${sheetRow}:G${sheetRow}`, [buildRow(existingId)]);
      return existingId;
    } else {
      const id = 'NR' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      await append('NILAI_RAPOR_RERATA', [buildRow(id)]);
      return id;
    }
  }

  /**
   * Simpan banyak nilai rata-rata rapor sekaligus (batch upsert).
   * @param {Array} items — array of { id_siswa, id_mapel, kelas, semester, tahun_pelajaran, nilai }
   */
  async function saveNilaiRaporReataBatch(items) {
    for (const item of items) {
      await saveNilaiRaporRerata(item);
    }
  }

  /**
   * Ambil nilai ujian sekolah dari sheet NILAI_US.
   * @param {{ id_siswa, id_mapel, kelas, tahun }} filter
   */
  async function getNilaiUS({ id_siswa, id_mapel, kelas, tahun } = {}) {
    const rows = await read('NILAI_US!A:G');
    let data = rows.slice(2).filter(r => r[0] && r[0] !== 'id_nilai_us' && String(r[0]).startsWith('NU'));

    if (id_siswa) data = data.filter(r => r[1] === id_siswa);
    if (id_mapel) data = data.filter(r => r[2] === id_mapel);
    if (kelas)    data = data.filter(r => r[3] === kelas);
    if (tahun)    data = data.filter(r => r[4] === tahun);

    return data.map(r => ({
      id:              r[0] || '',
      id_siswa:        r[1] || '',
      id_mapel:        r[2] || '',
      kelas:           r[3] || '',
      tahun_pelajaran: r[4] || '',
      nilai_tertulis:  r[5] !== '' && r[5] !== undefined ? parseFloat(r[5]) : null,
      nilai_praktik:   r[6] !== '' && r[6] !== undefined ? parseFloat(r[6]) : null,
    }));
  }

  /**
   * Simpan nilai ujian sekolah (upsert per siswa+mapel+kelas).
   * @param {Object} item — { id_siswa, id_mapel, kelas, tahun_pelajaran, nilai_tertulis, nilai_praktik }
   * @returns {string} id yang digunakan
   */
  async function saveNilaiUS(item) {
    const rows = await read('NILAI_US!A:G');

    let existingRowIndex = -1;
    let existingId       = '';
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (
        r[0] && String(r[0]).startsWith('NU') &&
        r[1] === item.id_siswa &&
        r[2] === item.id_mapel &&
        r[3] === item.kelas
      ) {
        existingRowIndex = i;
        existingId       = r[0];
        break;
      }
    }

    const buildRow = (id) => [
      id,
      item.id_siswa        || '',
      item.id_mapel        || '',
      item.kelas           || '',
      item.tahun_pelajaran || '',
      item.nilai_tertulis !== null && item.nilai_tertulis !== undefined ? item.nilai_tertulis : '',
      item.nilai_praktik  !== null && item.nilai_praktik  !== undefined ? item.nilai_praktik  : '',
    ];

    if (existingRowIndex >= 0) {
      const sheetRow = existingRowIndex + 1;
      await write(`NILAI_US!A${sheetRow}:G${sheetRow}`, [buildRow(existingId)]);
      return existingId;
    } else {
      const id = 'NU' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      await append('NILAI_US', [buildRow(id)]);
      return id;
    }
  }

  // ── Expose publik API ───────────────────────────────── 
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
    getSetoranTT,
    saveSetoranTT,
    updateSetoranTT,
    deleteSetoranTT,

    // Mutasi siswa
    getMutasi,
    addMutasi,
    updateMutasiStatus,

    // Ujian Sekolah / Sumatif Akhir Jenjang
    getNilaiRaporRerata,
    saveNilaiRaporRerata,
    saveNilaiRaporReataBatch,
    getNilaiUS,
    saveNilaiUS,

    // Kalkulasi
    hitungNilaiAkhir,
    tentukanLevel,
    generateDeskripsi,
  };

})();
