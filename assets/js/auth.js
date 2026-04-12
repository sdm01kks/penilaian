/**
 * auth.js — Modul Autentikasi Bersama
 * SD Muhammadiyah 01 Kukusan — Sistem Penilaian
 *
 * Digunakan oleh semua halaman aplikasi.
 * Sertakan file ini SEBELUM scripts lain di setiap halaman.
 */

const AUTH = (() => {

  /* ── Konfigurasi ─────────────────────────────────────── */
  const CLIENT_ID      = '137247296524-a55lkift7fn0m7o0ikrv90kqtncvicjh.apps.googleusercontent.com';
  const SPREADSHEET_ID = '1uQ_b5B7er05pv2BcplHnhg3ZdOrCm9FUOXkhdZ4g3PA';
  const SCOPES         = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly openid email profile';

  /* ── Redirect setelah login ──────────────────────────── */
  const REDIRECT = {
    admin:      '../dashboard/admin.html',
    guru_kelas: '../dashboard/guru-kelas.html',
    guru_mapel: '../dashboard/guru-mapel.html',
  };

  /* ── State internal ──────────────────────────────────── */
  let _tokenClient  = null;
  let _tokenExpiry  = 0;
  let _refreshTimer = null;

  /* ══════════════════════════════════════════════════════
     FUNGSI PUBLIK
  ══════════════════════════════════════════════════════ */

  /**
   * Inisialisasi Google Identity Services.
   * Panggil setelah GIS script selesai dimuat.
   */
  function init(onReadyCallback) {
    if (typeof google === 'undefined') {
      console.error('AUTH: Google Identity Services belum dimuat.');
      return;
    }

    _tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      callback:  _onTokenReceived,
      error_callback: (err) => {
        console.error('AUTH token error:', err);
        _triggerEvent('auth:error', { message: 'Login dibatalkan atau gagal. Silakan coba lagi.' });
      },
    });

    if (typeof onReadyCallback === 'function') onReadyCallback();
  }

  /**
   * Memulai proses login Google.
   * Gunakan di halaman login (index.html).
   */
  function login() {
    if (!_tokenClient) {
      console.error('AUTH: tokenClient belum diinisialisasi. Panggil AUTH.init() dulu.');
      return;
    }
    // Minta token baru dengan popup Google
    _tokenClient.requestAccessToken({ prompt: 'select_account' });
  }

  /**
   * Logout — hapus session dan redirect ke halaman login.
   */
  function logout(confirmFirst = true) {
    if (confirmFirst && !confirm('Yakin ingin keluar dari sistem?')) return;

    clearTimeout(_refreshTimer);

    // Bersihkan session terlebih dahulu sebelum revoke
    // agar jika revoke gagal, user tetap ter-logout
    sessionStorage.removeItem('sdm01_user');
    sessionStorage.removeItem('sdm01_token');
    sessionStorage.removeItem('sdm01_token_expiry');

    // Revoke token Google secara silent (tidak menunggu hasilnya)
    try {
      const token = getToken();
      if (token && typeof google !== 'undefined' && google.accounts?.oauth2?.revoke) {
        google.accounts.oauth2.revoke(token, () => {});
      }
      if (typeof google !== 'undefined' && google.accounts?.id?.disableAutoSelect) {
        google.accounts.id.disableAutoSelect();
      }
    } catch (_) {
      // Silent — jangan tampilkan error saat logout
    }

    // Hitung path ke root (index.html) relatif dari halaman saat ini
    const depth = window.location.pathname
      .replace(/\/[^/]*$/, '')
      .split('/')
      .filter(Boolean).length;
    const ups    = Math.max(0, depth - 1);
    const prefix = ups > 0 ? '../'.repeat(ups) : './';

    // Redirect — gunakan replace agar tidak bisa back ke halaman terproteksi
    window.location.replace(prefix + 'index.html');
  }

  /**
   * Cek apakah user sudah login dan session masih valid.
   * Jika tidak valid, redirect ke halaman login.
   * @param {string} requiredRole - 'admin' | 'guru_kelas' | 'guru_mapel' | null (semua role)
   * @returns {object|null} data user jika valid
   */
  function requireLogin(requiredRole = null) {
    const user  = getUser();
    const token = getToken();

    if (!user || !token) {
      _redirectToLogin();
      return null;
    }

    // Cek role jika diperlukan
    if (requiredRole && user.role !== requiredRole) {
      // Arahkan ke dashboard yang sesuai
      const dest = REDIRECT[user.role];
      if (dest && !window.location.href.includes(dest.replace('../', ''))) {
        window.location.href = dest;
      }
      return null;
    }

    // Jadwalkan refresh token
    _scheduleTokenRefresh();

    return user;
  }

  /**
   * Dapatkan data user dari session.
   * @returns {object|null}
   */
  function getUser() {
    try {
      const saved = sessionStorage.getItem('sdm01_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) { return null; }
  }

  /**
   * Dapatkan access token dari session.
   * @returns {string|null}
   */
  function getToken() {
    return sessionStorage.getItem('sdm01_token') || null;
  }

  /**
   * Dapatkan Spreadsheet ID.
   */
  function getSpreadsheetId() {
    return SPREADSHEET_ID;
  }

  /* ══════════════════════════════════════════════════════
     FUNGSI INTERNAL
  ══════════════════════════════════════════════════════ */

  /**
   * Callback setelah token diterima dari Google.
   */
  async function _onTokenReceived(tokenResponse) {
    if (tokenResponse.error) {
      _triggerEvent('auth:error', {
        message: 'Login gagal: ' + (tokenResponse.error_description || tokenResponse.error)
      });
      return;
    }

    const accessToken = tokenResponse.access_token;
    const expiresIn   = tokenResponse.expires_in || 3600;

    // Simpan token & waktu kadaluarsa
    sessionStorage.setItem('sdm01_token', accessToken);
    sessionStorage.setItem('sdm01_token_expiry', Date.now() + (expiresIn - 60) * 1000);

    _triggerEvent('auth:token_received', {});

    // Ambil info profil user
    try {
      _triggerEvent('auth:loading', { message: 'Memverifikasi akun…' });

      const profil = await _fetchGoogleProfile(accessToken);
      await _verifikasiAkses(profil.email, profil.name, accessToken);

    } catch (err) {
      console.error('AUTH _onTokenReceived error:', err);
      _triggerEvent('auth:error', {
        message: 'Terjadi kesalahan saat verifikasi. Coba lagi.'
      });
    }
  }

  /**
   * Ambil profil Google dari token.
   */
  async function _fetchGoogleProfile(token) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Gagal mengambil profil Google: ' + res.status);
    return res.json();
  }

  /**
   * Verifikasi apakah email terdaftar di sheet USERS.
   */
  async function _verifikasiAkses(email, nama, token) {
    // Baca sheet USERS — gunakan token user untuk read
    const url  = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent('USERS!A:G')}`;
    const res  = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Tidak ada akses ke database. Pastikan Spreadsheet sudah dibagikan dengan benar.');
      }
      throw new Error(`Sheets API error: ${res.status}`);
    }

    const data = await res.json();
    const rows = data.values || [];

    // Cari email (kolom B, index 1), skip baris header
    const userRow = rows.slice(1).find(r =>
      r[1] && r[1].trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!userRow) {
      _triggerEvent('auth:denied', {
        message: `Akun ${email} belum terdaftar di sistem. Hubungi administrator sekolah.`
      });
      return;
    }

    const status = (userRow[6] || '').toLowerCase();
    if (status !== 'aktif') {
      _triggerEvent('auth:denied', {
        message: `Akun ${email} sedang dinonaktifkan. Hubungi administrator.`
      });
      return;
    }

    // Simpan data user ke session
    const userData = {
      id_user:   userRow[0] || '',
      email:     userRow[1] || email,
      nama:      userRow[2] || nama,
      role:      userRow[3] || '',
      kelas:     userRow[4] || '',
      mapel:     userRow[5] || '',
      status:    userRow[6] || '',
      loginTime: new Date().toISOString(),
    };

    sessionStorage.setItem('sdm01_user', JSON.stringify(userData));

    // Catat login ke SYNC_LOG (silent)
    _catatLogin(userData, token);

    // Jadwalkan refresh token
    _scheduleTokenRefresh();

    // Trigger sukses → halaman login akan redirect
    _triggerEvent('auth:success', { user: userData });
  }

  /**
   * Catat login ke sheet SYNC_LOG.
   */
  async function _catatLogin(user, token) {
    try {
      const now    = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const logId  = `LOG-${Date.now()}`;
      const values = [[logId, user.id_user, user.nama, user.kelas, now, 'LOGIN']];
      const url    = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent('SYNC_LOG!A:F')}:append?valueInputOption=USER_ENTERED`;

      await fetch(url, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });
    } catch (_) { /* silent — log tidak kritis */ }
  }

  /**
   * Jadwalkan refresh token otomatis sebelum kadaluarsa.
   */
  function _scheduleTokenRefresh() {
    clearTimeout(_refreshTimer);

    const expiry = parseInt(sessionStorage.getItem('sdm01_token_expiry') || '0');
    const now    = Date.now();
    const delay  = expiry - now;

    if (delay <= 0) return;

    // Refresh 2 menit sebelum kadaluarsa
    const refreshDelay = Math.max(delay - 120000, 60000);

    _refreshTimer = setTimeout(() => {
      if (_tokenClient) {
        // Refresh tanpa prompt (silent)
        _tokenClient.requestAccessToken({ prompt: '' });
      }
    }, refreshDelay);
  }

  /**
   * Redirect ke halaman login.
   */
  function _redirectToLogin() {
    const depth = window.location.pathname
      .replace(/\/[^/]*$/, '')
      .split('/')
      .filter(Boolean).length;

    const ups    = Math.max(0, depth - 1);
    const prefix = ups > 0 ? '../'.repeat(ups) : './';
    window.location.href = prefix + 'index.html';
  }

  /**
   * Trigger custom event di window.
   */
  function _triggerEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /* ── Expose publik API ───────────────────────────────── */
  return {
    init,
    login,
    logout,
    requireLogin,
    getUser,
    getToken,
    getSpreadsheetId,
    CLIENT_ID,
    SPREADSHEET_ID,
  };

})();
