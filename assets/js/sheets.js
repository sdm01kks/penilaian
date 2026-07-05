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
   * Tulis banyak range sekaligus dalam satu request (values:batchUpdate).
   * @param {Array} pairs — array of [range, values] atau {range, values}
   */
  async function valuesBatchWrite(pairs) {
    if (!pairs || !pairs.length) return;
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();
    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');

    const url = `${BASE_URL}/${id}/values:batchUpdate`;
    const data = pairs.map(p => Array.isArray(p)
      ? { range: p[0], values: p[1] }
      : { range: p.range, values: p.values }
    );

    const res = await fetch(url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets valuesBatchWrite error ${res.status}`);
    }
    return res.json();
  }

  /**
   * Kosongkan beberapa range sekaligus (values:batchClear) — tidak menghapus
   * sheet/format, hanya isi selnya. Dipakai sebelum menulis ulang data hasil
   * restore backup, supaya baris lama yang lebih panjang dari data backup
   * tidak tersisa (data "hantu").
   * @param {string[]} ranges
   */
  async function valuesBatchClear(ranges) {
    if (!ranges || !ranges.length) return;
    const id    = AUTH.getSpreadsheetId();
    const token = AUTH.getToken();
    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');

    const url = `${BASE_URL}/${id}/values:batchClear`;
    const res = await fetch(url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranges }),
    });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets valuesBatchClear error ${res.status}`);
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
     FUNGSI LINTAS SPREADSHEET — untuk baca file backup (ID berbeda
     dari spreadsheet database aktif). Semua fungsi lain di atas selalu
     memakai AUTH.getSpreadsheetId(); fungsi-fungsi ini menerima
     spreadsheetId secara eksplisit sebagai parameter.
  ══════════════════════════════════════════════════════ */

  /**
   * Ambil daftar nama sheet/tab dari sebuah spreadsheet (apapun ID-nya).
   * @param {string} spreadsheetId
   * @returns {string[]} nama-nama sheet
   */
  async function getSheetNames(spreadsheetId) {
    const token = AUTH.getToken();
    const url   = `${BASE_URL}/${spreadsheetId}?fields=sheets.properties.title`;
    const res   = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets getSheetNames error ${res.status}`);
    }
    const data = await res.json();
    return (data.sheets || []).map(s => s.properties.title);
  }

  /**
   * Baca semua sheet dari sebuah spreadsheet (apapun ID-nya) sekaligus.
   * Sengaja pakai valueRenderOption=UNFORMATTED_VALUE & dateTimeRenderOption=
   * SERIAL_NUMBER (bukan default FORMATTED_VALUE) — supaya angka & tanggal
   * terbaca sebagai nilai mentah persis apa adanya, bukan string yang sudah
   * diformat sesuai locale. Ini KRUSIAL untuk backup/restore: kalau baca
   * pakai FORMATTED_VALUE lalu tulis ulang, angka desimal & tanggal berisiko
   * salah parse kalau locale spreadsheet berubah/tidak konsisten.
   * @param {string} spreadsheetId
   * @returns {Object} { namaSheet: rows[] }
   */
  async function readAllSheetsFrom(spreadsheetId) {
    const names = await getSheetNames(spreadsheetId);
    if (!names.length) return {};

    const token  = AUTH.getToken();
    const params = names.map(n => `ranges=${encodeURIComponent(n)}`).join('&')
      + `&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`;
    const url    = `${BASE_URL}/${spreadsheetId}/values:batchGet?${params}`;
    const res    = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets readAllSheetsFrom error ${res.status}`);
    }
    const data   = await res.json();
    const result = {};
    (data.valueRanges || []).forEach((vr, i) => { result[names[i]] = vr.values || []; });
    return result;
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
    // FIX v37: Baca hingga kolom P (bukan A:O) agar no_peserta_ismuba (kolom P) ikut terbaca
    // FIX v58: Baca hingga kolom Q agar no_seri_syahadah (kolom Q) ikut terbaca
    // FIX vTRANSKRIP: Baca hingga kolom R agar no_ijazah (kolom R) ikut terbaca —
    // dipakai oleh ujian-sekolah/preview-transkrip.html. Kolom ini diisi & disimpan
    // langsung dari halaman Transkrip (lihat saveNoIjazah() di file tsb), BUKAN dari
    // form Data Siswa. setup/data-siswa.html menulis dengan range tetap SISWA!A:P
    // sehingga kolom Q dan R tidak pernah tertimpa oleh halaman itu — aman.
    const rows = await read('SISWA!A:R');
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

    // FIX v38: urutkan berdasarkan nama (abjad A–Z) agar siswa baru yang di-append
    // ke baris terakhir sheet tidak muncul di posisi acak — urutan konsisten di semua halaman.
    siswa.sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'id'));

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
      tempat_lahir:        r[12] || '',
      tgl_lahir:           r[13] || '',
      nama_wali:           r[14] || '',
      no_peserta_ismuba:   r[15] || '',  // kolom P — FIX v37
      no_seri_syahadah:    r[16] || '',  // kolom Q — FIX v58
      no_ijazah:           r[17] || '',  // kolom R — FIX vTRANSKRIP
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
      siswa.tempat_lahir         || '',
      siswa.tgl_lahir            || '',
      siswa.nama_wali            || '',
      siswa.no_peserta_ismuba    || '',  // kolom P — FIX v37
      siswa.no_seri_syahadah     || '',  // kolom Q — FIX v58
    ];
    // FIX v37: gunakan anchor !A1 agar Google Sheets API selalu mencari batas tabel
    // mulai dari kolom A (ANTIREGRESI §3). Tanpa anchor, jika ada data di kolom jauh,
    // baris baru ditulis di sana dan tidak terbaca oleh getSiswa('SISWA!A:Q').
    await append('SISWA!A1', [row]);
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
        // ⚠️ ANTIREGRESI §30: kelasList WAJIB gabungan kolom E + kolom K — identik dengan auth.js.
        // Di auth.js: kelasList = [...kelasUtamaArr, ...kelasMapelArr].
        // Jika getUsers() hanya pakai kolom E, maka freshUser.kelasList yang di-sync ke
        // currentUser (§28) akan menimpa kelasList session dengan versi yang kehilangan
        // kelas tambahan kolom K → guru_kelas TT merangkap kehilangan akses dropdown kelas TT.
        kelasList:       (() => {
          const e = r[4] ? String(r[4]).split(',').map(s=>s.trim()).filter(Boolean) : [];
          const k = kelasMapelRaw ? kelasMapelRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
          return [...new Set([...e, ...k])];
        })(),
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
    const rows = await read('EKSKUL!A:O');
    return rows.slice(2)
      .filter(r => r[0] && r[1] && r[0] !== 'id_ekskul')
      .map(r => ({
        id:          r[0]  || '',
        nama:        r[1]  || '',
        jenis:       r[2]  || '',
        keterangan:  r[3]  || '',
        level: [
          { min: parseInt(r[4])||0,  maks: parseInt(r[5])||60,  deskripsi: r[6]||'' },
          { min: parseInt(r[7])||61, maks: parseInt(r[8])||85,  deskripsi: r[9]||'' },
          { min: parseInt(r[10])||86,maks: parseInt(r[11])||100, deskripsi: r[12]||'' },
        ],
        tidak_ikut_deskripsi: r[13] || '',
        id_pembina:  r[14] || '',   // kolom O — ID user pembina ekskul
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
     FUNGSI BACKUP & RESTORE
     Backup dibuat otomatis oleh Google Apps Script terpisah
     (lihat backup/BackupPenilaian.gs) — mingguan tiap Jumat, disimpan
     3 bulan. Fungsi di sini hanya untuk MEMBACA daftar & MELAKUKAN
     restore dari dalam aplikasi (khusus admin).
  ══════════════════════════════════════════════════════ */

  const BACKUP_NAME_PREFIX = 'BACKUP_penilaian_';

  /**
   * Ubah nomor kolom (1-indexed) jadi huruf kolom Sheets, misal 1→A, 27→AA.
   */
  function _colToLetter(n) {
    let s = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s || 'A';
  }

  /**
   * Ambil ukuran grid (jumlah baris & kolom) tiap sheet dari sebuah
   * spreadsheet. Dipakai restore untuk tahu area "sisa" yang perlu
   * dibersihkan setelah data backup ditulis.
   */
  async function getSheetGridSize(spreadsheetId) {
    const token = AUTH.getToken();
    const url = `${BASE_URL}/${spreadsheetId}`
      + `?fields=${encodeURIComponent('sheets.properties(title,gridProperties(rowCount,columnCount))')}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Sheets getSheetGridSize error ${res.status}`);
    }
    const data = await res.json();
    const map  = {};
    (data.sheets || []).forEach(s => { map[s.properties.title] = s.properties.gridProperties || {}; });
    return map;
  }

  /**
   * Ambil daftar backup yang tersedia di Drive (dibuat oleh
   * BackupPenilaian.gs), diurutkan dari yang terbaru.
   * @returns {Array} [{ id, name, createdTime, label }]
   */
  async function listBackups() {
    const token = AUTH.getToken();
    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');

    const q = [
      `name contains '${BACKUP_NAME_PREFIX}'`,
      `mimeType = 'application/vnd.google-apps.spreadsheet'`,
      `trashed = false`,
    ].join(' and ');

    const url = `https://www.googleapis.com/drive/v3/files`
      + `?q=${encodeURIComponent(q)}`
      + `&fields=${encodeURIComponent('files(id,name,createdTime)')}`
      + `&orderBy=${encodeURIComponent('createdTime desc')}`
      + `&pageSize=100`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) {
      if (res.status === 401) { AUTH.logout(false); }
      throw new Error(`Drive listBackups error ${res.status}`);
    }

    const data = await res.json();
    return (data.files || []).map(f => ({
      id:          f.id,
      name:        f.name,
      createdTime: f.createdTime,
      label: new Date(f.createdTime).toLocaleString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
      }) + ' WIB',
    }));
  }

  /**
   * Pulihkan seluruh data dari sebuah titik backup ke spreadsheet aktif.
   * MENIMPA seluruh isi sheet yang namanya cocok antara backup & spreadsheet
   * aktif (hanya isi sel, bukan format/rumus/tab lain di luar itu).
   * Hanya dipanggil dari halaman yang sudah dijaga AUTH.requireLogin('admin').
   *
   * URUTAN SENGAJA: TULIS DULU, BARU BERSIHKAN SISA.
   * Kalau urutannya dibalik (kosongkan dulu baru tulis), dan proses gagal
   * di tengah jalan (token kedaluwarsa, koneksi putus, tab ditutup), hasilnya
   * sheet akan KOSONG TOTAL tanpa data lama maupun baru — kehilangan data
   * permanen. Dengan menulis dulu, begitu langkah pertama selesai, data
   * sudah benar; langkah pembersihan sisa cuma kosmetik (kalau gagal,
   * paling buruk ada baris/kolom sisa lama yang perlu dibersihkan manual,
   * BUKAN kehilangan data).
   *
   * @param {string} backupSpreadsheetId
   * @param {function} [onProgress] - dipanggil dengan (tahap: string)
   * @returns {Object} { restored: string[], dilewati: string[], pembersihanGagal: boolean }
   */
  async function restoreFromBackup(backupSpreadsheetId, onProgress = () => {}) {
    onProgress('Membaca isi backup…');
    const backupData   = await readAllSheetsFrom(backupSpreadsheetId);
    const backupSheets = Object.keys(backupData);

    if (!backupSheets.length) {
      throw new Error('File backup ini kosong atau tidak bisa dibaca — restore dibatalkan, tidak ada perubahan dilakukan.');
    }

    onProgress('Membandingkan dengan sheet aktif…');
    const liveSheets = await getSheetNames(AUTH.getSpreadsheetId());
    const liveSet     = new Set(liveSheets);

    const restored = backupSheets.filter(n => liveSet.has(n));
    const dilewati  = backupSheets.filter(n => !liveSet.has(n));

    if (!restored.length) {
      throw new Error('Tidak ada sheet yang cocok antara backup dan spreadsheet aktif — restore dibatalkan, tidak ada perubahan dilakukan.');
    }

    onProgress('Memeriksa ukuran sheet aktif…');
    const gridSizes = await getSheetGridSize(AUTH.getSpreadsheetId());

    // 1) TULIS DULU — titik aman: begitu ini selesai, data sudah benar.
    onProgress('Menulis data dari backup…');
    const pairs = restored.map(name => ({
      range:  `${name}!A1`,
      values: backupData[name].length ? backupData[name] : [['']],
    }));
    await valuesBatchWrite(pairs);

    // 2) BARU bersihkan sisa data lama di luar area yang baru ditulis
    //    (kalau sheet lama lebih panjang/lebar dari data backup).
    //    Kegagalan di sini TIDAK dianggap fatal — data utama sudah aman.
    onProgress('Membersihkan sisa data lama…');
    let pembersihanGagal = false;
    try {
      const tailRanges = [];
      restored.forEach(name => {
        const rows = backupData[name];
        const newRows = rows.length;
        const newCols = newRows ? Math.max(...rows.map(r => r.length)) : 0;
        const grid    = gridSizes[name] || {};
        const oldRows = grid.rowCount    || 0;
        const oldCols = grid.columnCount || 0;

        if (oldRows > newRows) {
          tailRanges.push(`${name}!A${newRows + 1}:${_colToLetter(Math.max(oldCols, 1))}${oldRows}`);
        }
        if (oldCols > newCols && newRows > 0) {
          tailRanges.push(`${name}!${_colToLetter(newCols + 1)}1:${_colToLetter(oldCols)}${newRows}`);
        }
      });
      if (tailRanges.length) {
        await valuesBatchClear(tailRanges);
      }
    } catch (e) {
      pembersihanGagal = true;
      console.warn('Restore: gagal membersihkan sisa data lama (data utama tetap aman/benar):', e);
    }

    onProgress('Selesai.');
    return { restored, dilewati, pembersihanGagal };
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

    const normKelas    = (kelas    || '').trim();
    const normSemester = (semester || '').trim();
    const normSiswa    = (id_siswa || '').trim();
    if (normKelas)    data = data.filter(r => (r[2]||'').trim() === normKelas);
    if (normSemester) data = data.filter(r => (r[3]||'').trim() === normSemester);
    // Tahun sengaja tidak difilter - format bisa beda (2025/2026 vs 2025-2026)
    if (normSiswa)    data = data.filter(r => (r[1]||'').trim() === normSiswa);
    console.log('[getSetoranTT] filter kelas:', normKelas, '| sem:', normSemester, '| result:', data.length,
      '| sample r[2],r[3]:', data.slice(0,2).map(r=>[(r[2]||''), (r[3]||'')]));

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
    await append('SETORAN_TT!A1', [row]);  // A1 anchor agar tidak nyasar ke kolom jauh
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
    const idx  = rows.findIndex(r => String(r[0]||'').trim() === String(id).trim());
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
   * Simpan banyak nilai rata-rata rapor sekaligus — SATU baca, batch write.
   * @param {Array} items
   * @param {Function} onProgress callback(done, total)
   */
  async function saveNilaiRaporReataBatch(items, onProgress) {
    if (!items.length) return;
    const rows = await read('NILAI_RAPOR_RERATA!A:G');

    const lookup = {};
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (r[0] && String(r[0]).startsWith('NR')) {
        lookup[`${r[1]}|${r[2]}|${r[4]}`] = { rowIndex: i + 1, id: r[0] };
      }
    }

    const toUpdate = [];
    const toAppend = [];
    let nextRow = rows.length + 1;

    for (const item of items) {
      const k = `${item.id_siswa}|${item.id_mapel}|${item.semester}`;
      const buildRow = (id) => [
        id, item.id_siswa||'', item.id_mapel||'', item.kelas||'',
        String(item.semester||''), item.tahun_pelajaran||'',
        item.nilai !== null && item.nilai !== undefined ? item.nilai : '',
      ];
      if (lookup[k]) {
        const { rowIndex, id } = lookup[k];
        toUpdate.push([`NILAI_RAPOR_RERATA!A${rowIndex}:G${rowIndex}`, [buildRow(id)]]);
      } else {
        const id = 'NR' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        toAppend.push(buildRow(id));
        lookup[k] = { rowIndex: nextRow++, id };
      }
    }

    const CHUNK = 100;
    let done = 0;
    for (let i = 0; i < toUpdate.length; i += CHUNK) {
      await valuesBatchWrite(toUpdate.slice(i, i + CHUNK));
      done = Math.min(i + CHUNK, toUpdate.length);
      if (onProgress) onProgress(done, items.length);
    }
    if (toAppend.length) {
      await append('NILAI_RAPOR_RERATA', toAppend);
    }
    if (onProgress) onProgress(items.length, items.length);
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
      // FIX (ANTIREGRESI §3): anchor !A1 wajib, lihat catatan di saveNilaiUSBatch.
      await append('NILAI_US!A1', [buildRow(id)]);
      return id;
    }
  }

  /**
   * Simpan banyak nilai US sekaligus — SATU baca, batch write.
   */
  async function saveNilaiUSBatch(items, onProgress) {
    if (!items.length) return;
    const rows = await read('NILAI_US!A:G');

    const lookup = {};
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (r[0] && String(r[0]).startsWith('NU')) {
        lookup[`${r[1]}|${r[2]}|${r[3]}`] = { rowIndex: i + 1, id: r[0] };
      }
    }

    const toUpdate = [];
    const toAppend = [];
    let nextRow = rows.length + 1;

    for (const item of items) {
      const k = `${item.id_siswa}|${item.id_mapel}|${item.kelas}`;
      const buildRow = (id) => [
        id, item.id_siswa||'', item.id_mapel||'', item.kelas||'',
        item.tahun_pelajaran||'',
        item.nilai_tertulis !== null && item.nilai_tertulis !== undefined ? item.nilai_tertulis : '',
        item.nilai_praktik  !== null && item.nilai_praktik  !== undefined ? item.nilai_praktik  : '',
      ];
      if (lookup[k]) {
        const { rowIndex, id } = lookup[k];
        toUpdate.push([`NILAI_US!A${rowIndex}:G${rowIndex}`, [buildRow(id)]]);
      } else {
        const id = 'NU' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        toAppend.push(buildRow(id));
        lookup[k] = { rowIndex: nextRow++, id };
      }
    }

    const CHUNK = 100;
    let done = 0;
    for (let i = 0; i < toUpdate.length; i += CHUNK) {
      await valuesBatchWrite(toUpdate.slice(i, i + CHUNK));
      done = Math.min(i + CHUNK, toUpdate.length);
      if (onProgress) onProgress(done, items.length);
    }
    if (toAppend.length) {
      // FIX (ANTIREGRESI §3): anchor !A1 wajib agar Sheets API tidak mencari batas
      // tabel di seluruh sheet. Tanpa anchor, jika ada sisa data di kolom jauh,
      // baris nilai baru bisa ditulis di luar jangkauan NILAI_US!A:G — tersimpan
      // tanpa error, tapi tidak pernah terbaca oleh getNilaiUS()/leger-us.html.
      await append('NILAI_US!A1', toAppend);
    }
    if (onProgress) onProgress(items.length, items.length);
  }

  // ── Expose publik API ───────────────────────────────── 
  return {
    // CRUD dasar
    read,
    readBatch,
    write,
    append,
    deleteRow,
    valuesBatchClear,

    // Lintas spreadsheet (backup)
    getSheetNames,
    readAllSheetsFrom,

    // Backup & restore
    listBackups,
    restoreFromBackup,

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
    valuesBatchWrite,
    getNilaiRaporRerata,
    saveNilaiRaporRerata,
    saveNilaiRaporReataBatch,
    getNilaiUS,
    saveNilaiUS,
    saveNilaiUSBatch,

    // Kalkulasi
    hitungNilaiAkhir,
    tentukanLevel,
    generateDeskripsi,
  };

})();
