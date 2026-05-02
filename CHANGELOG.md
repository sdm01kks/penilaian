## [2026-05-03] — v11 · Sesi 15 · Preview SKL: Kop HTML, Margin A4, Nama PDF, Satu Garis Pemisah

### 🐛 Perbaikan & Peningkatan

---

### v11-01 · `ujian-sekolah/preview-skl.html` · Penulisan ulang kop surat & layout cetak

**File:** `ujian-sekolah/preview-skl.html`  
Halaman ditulis ulang sepenuhnya untuk mengatasi semua masalah tampilan cetak.

---

**A. Kop surat menggunakan HTML/CSS — bukan gambar penuh**

Sebelumnya kop surat di-embed sebagai satu gambar PNG (kop + teks + garis), sehingga teks berwarna putih dan background abu-abu ikut tercetak.

Sesudah: kop surat dibangun ulang sebagai HTML murni:
- **Logo** → gambar PNG logo Muhammadiyah saja (hanya bagian kiri, 54×54px), di-embed base64
- **Teks** → ditulis langsung dalam HTML dengan font Times New Roman, warna biru tua `#003087` (sesuai asli)
- **Layout** → flex row: logo di kiri, blok teks di kanan (centered)
- **Struktur teks:**
  ```
  MAJELIS PENDIDIKAN DASAR DAN MENENGAH
  DAN PENDIDIKAN NON FORMAL
  PIMPINAN DAERAH MUHAMMADIYAH KOTA DEPOK
  SEKOLAH DASAR MUHAMMADIYAH 01 KUKUSAN  ← ukuran lebih besar
  Status : Terakreditasi A
  JL. KH. Ahmad Dahlan No. 11 RT 06 RW 05 ...
  Email: ... Telepon: (021) 786 2947
  NSS : 101020528026        NPSN : 20228835
  ```
- **Tidak ada background warna** di area kop

---

**B. Satu garis pemisah (bukan dua)**

Sebelumnya ada dua elemen garis setelah kop. Diganti menjadi satu garis tebal `border-top: 4px solid #000` saja, persis seperti format baku.

---

**C. Lebar kop = lebar garis pemisah = lebar penuh halaman**

Kop surat dan garis pemisah kini menggunakan `width: 100%` sehingga sejajar.

---

**D. Margin A4: 15mm di semua sisi**

Ditambahkan CSS print rule `@page { size: A4 portrait; margin: 15mm }` agar saat Cetak/PDF, margin tepat 15mm di semua sisi sesuai ketentuan.

---

**E. Setiap halaman muat dalam 1 lembar A4**

Font diturunkan ke 11pt, line-height dikurangi, dan padding biodata/gap tanda tangan dioptimalkan agar:
- Surat Keterangan Kelulusan (halaman 1) muat 1 lembar A4
- Surat Keterangan Lulus + tabel lampiran (halaman 2) muat 1 lembar A4

---

**F. Nama file PDF otomatis mengandung nama siswa**

Tombol "🖨️ Cetak / PDF" sekarang memanggil `cetakSKL()` bukan `window.print()` langsung.

```javascript
function cetakSKL() {
  const siswa = allSiswa.find(s => s.id === selSiswaId);
  document.title = 'SKL_' + siswa.nama.replace(/\s+/g,'_') + '_' + activeKelas;
  window.print();
  setTimeout(() => { document.title = oldTitle; }, 2000);
}
```

Saat satu siswa dipilih: `document.title` diubah ke `SKL_NAMA_SISWA_KELAS` sebelum `window.print()`, lalu dikembalikan. Browser/OS menggunakan `document.title` sebagai nama file default saat Simpan sebagai PDF.

Jika dipilih "Semua Siswa": title = `SKL_Kelas_6A` (atau nama kelas yang aktif).

---

**G. Judul "Preview & Cetak SKL" di topbar dihilangkan dari cetakan**

Elemen `.page-header` diberi class `no-print` sehingga tidak muncul saat dicetak. Dokumen yang dicetak dimulai langsung dari kop surat.

---

### v11-02 · `ujian-sekolah/templates/tpl_skl.docx` & `tpl_lampiran.docx` · Konfirmasi isi lengkap

Template diverifikasi mengandung seluruh isi surat:
- `tpl_skl.docx`: **8 field**, **78 teks body** (termasuk "SURAT KETERANGAN KELULUSAN", "Yang bertanda tangan...", "Berdasarkan Hasil Rapat...", "-------- LULUS --------", dll.)
- `tpl_lampiran.docx`: **18 field**, **60 teks body** (termasuk "SURAT KETERANGAN LULUS", paragraf pembuka, dasar kelulusan, penutup, tanda tangan)

---

### 📋 Ringkasan File yang Diubah (v11)

| File | Status | Keterangan |
|------|--------|------------|
| `ujian-sekolah/preview-skl.html` | **Ditulis ulang** | Kop HTML, 15mm margin, nama PDF, satu garis |
| `ujian-sekolah/templates/tpl_skl.docx` | **Diperbarui** | Isi surat lengkap, 8 field |
| `ujian-sekolah/templates/tpl_lampiran.docx` | **Diperbarui** | Isi surat lengkap, 18 field |

### ⚠️ Catatan Deploy

- Kedua file `.docx` di folder `ujian-sekolah/templates/` **harus diganti** dengan versi dari patch ini.
- File `preview-skl.html` adalah file mandiri (self-contained) — logo sudah di-embed base64, tidak perlu file gambar terpisah.

---

*Dibuat: 3 Mei 2026 (v11) | Sistem: SD Muhammadiyah 01 Kukusan — Penilaian*
