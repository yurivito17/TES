/**
 * JELAJAH TERRA — PANDUAN PEMASANGAN
 * Hasil proyek: code.gs dan index.html. Tidak memerlukan library atau build.
 *
 * 1. Buat Google Sheets khusus pendaftaran. Biarkan akses General access = Restricted;
 *    bagikan hanya kepada admin berwenang. Jangan publikasikan spreadsheet.
 *    Tab tersembunyi/proteksi range TIDAK membatasi akses baca data kesehatan.
 * 2. Buat proyek di script.google.com (atau Extensions > Apps Script dari Sheets).
 *    Isi file script dengan kode code.gs ini. Jika editor membuat Code.gs,
 *    nama tersebut juga boleh: nama file script tidak memengaruhi pemanggilan fungsi.
 *    Buat file HTML bernama index (editor menampilkan index.html), isi dari index.html.
 * 3. Project Settings > Script Properties > Add script property:
 *    nama SPREADSHEET_ID, nilai ID dari URL Sheets di antara /d/ dan /edit.
 *    Jangan menaruh ID atau kredensial dalam HTML. Set zona waktu proyek Asia/Jakarta.
 * 4. Ubah TRIP_CONFIG di bawah. Gunakan tripId baru untuk SETIAP keberangkatan;
 *    jangan gunakan ulang ID lama. Isi informasi faktual dari pengelola, termasuk
 *    fasilitas dan persyaratan. Setelah siap, isExample=false dan registrationOpen=true.
 * 5. Pilih setup_ di dropdown fungsi editor lalu Run. Izinkan akses spreadsheet
 *    menggunakan akun admin yang berhak mengeditnya. Aman dijalankan ulang; jika
 *    header berbeda, perbaiki secara manual atau pilih sheetName BARU. Jangan
 *    menghapus data peserta untuk mengatasi kesalahan header.
 * 6. Deploy > New deployment > Web app: Execute as = Me (admin), akses = Anyone
 *    bila kebijakan akun mengizinkan. Peserta tidak memerlukan login Google.
 *    Jika opsi itu tidak tersedia, minta admin Workspace mengizinkannya; jangan
 *    membuat Sheets publik sebagai jalan pintas. Hanya halaman web yang publik.
 * 7. Buka URL deployment /exec; uji dengan data fiktif sebelum memasang tautan
 *    di bio/link Instagram. Coba juga browser Instagram dan browser HP biasa.
 * 8. Setelah perubahan kode/konfigurasi: Deploy > Manage deployments > Edit >
 *    Version: New version > Deploy. URL deployment yang sama tetap digunakan.
 *    Membuka /dev saja tidak memperbarui versi /exec yang dilihat peserta.
 *
 * CHECKLIST UJI DI DEPLOYMENT (gunakan data fiktif):
 * [ ] Normal: satu baris, nomor sama di Sheets/konfirmasi, status Menunggu konfirmasi.
 * [ ] Wajib kosong, email/telepon salah, tanggal invalid/masa depan: ditolak;
 *     ulangi melalui google.script.run untuk memastikan backend juga menolak.
 * [ ] Semua pilihan Ya mewajibkan detail. Ganti ke Tidak: detail tidak disimpan.
 * [ ] Klik ganda/retry memakai kunci sama: satu baris dan nomor yang sama.
 *     Untuk simulasi respons hilang: kirim payload fiktif yang sama dua kali
 *     dengan submissionKey UUID sama melalui google.script.run.submitRegistration.
 * [ ] Dua trip dengan email/WA sama boleh masuk (ganti konfigurasi + deploy).
 * [ ] Simpan SPREADSHEET_ID yang benar, ubah sementara ke ID tidak valid lalu kirim:
 *     pesan umum, isian tetap ada, tidak ada konfirmasi sukses. Pulihkan ID dan retry.
 * [ ] Input =1+1, +SUM(1,1), @SUM(1,1) dan <img src=x onerror=alert(1)> pada
 *     kolom teks: tersimpan sebagai teks, tidak menjadi formula atau HTML aktif.
 * [ ] HP: tidak meluber, label/error terbaca, keyboard sesuai, fokus ke konfirmasi.
 * [ ] setup_ dua kali tidak menggandakan header/menghapus data. Sheets tetap privat.
 *
 * Batas: verifikasi lokal tidak menggantikan uji izin, kuota, deployment, dan
 * penyimpanan di akun Google. Tidak ada pengiriman pesan otomatis/pembayaran.
 * Kelola akses dan masa simpan data peserta secara internal sesuai kebutuhan.
 */

// Nama trip dan jarak sesuai permintaan. Detail lainnya CONTOH untuk percobaan;
// konfirmasikan kepada pengelola sebelum membuka pendaftaran sungguhan.
const TRIP_CONFIG = {
  tripId: 'CONTOH-daolong-2027-01-17',
  name: 'Hiking Bukit Daolong',
  distanceKm: 3,
  description: 'Luangkan waktu untuk menikmati udara terbuka, menyusuri jalur bukit, dan berbagi cerita bersama Jelajah Terra. Detail rute dan titik kumpul akan dikonfirmasi oleh admin.',
  duration: '2–3 jam (estimasi contoh, mengikuti kondisi dan ritme peserta)',
  date: '2027-01-17', // Tanggal kalender YYYY-MM-DD; tidak dikonversi melalui UTC.
  location: 'Bukit Daolong — titik kumpul menyusul (contoh)',
  price: 125000, // CONTOH harga rupiah per peserta, bukan harga resmi.
  included: [
    'Pendamping perjalanan selama hiking (contoh)',
    'Air mineral dan kudapan ringan (contoh)',
    'Dokumentasi bersama selama kegiatan (contoh)'
  ],
  requirements: [
    'Mengenakan sepatu dengan daya cengkeram yang sesuai jalur (contoh)',
    'Membawa botol minum, perlengkapan hujan, dan kebutuhan pribadi (contoh)',
    'Menyampaikan kondisi kesehatan, alergi, serta kebutuhan obat kepada tim (contoh)',
    'Mengikuti arahan pemandu dan membawa kembali sampah pribadi (contoh)'
  ],
  isExample: true,
  registrationOpen: false,
  sheetName: 'Pendaftaran'
};
const TIME_ZONE_ = 'Asia/Jakarta';
const STATUS_ = 'Menunggu konfirmasi';
const CONSENT_ = 'Saya menyatakan informasi yang saya isi benar dan menyetujui penggunaannya oleh tim Jelajah Terra untuk administrasi serta persiapan kegiatan ini.';
const HEADERS_ = [
  'Waktu pendaftaran', 'Nomor pendaftaran', 'Kunci pengiriman unik', 'ID trip',
  'Nama trip', 'Tanggal trip', 'Harga', 'Nama lengkap', 'Tanggal lahir',
  'WhatsApp', 'Email', 'Kota domisili', 'Ada kondisi kesehatan',
  'Detail kondisi kesehatan', 'Ada alergi', 'Detail alergi', 'Ada penggunaan obat',
  'Detail obat', 'Kebutuhan khusus', 'Nama kontak darurat', 'Hubungan kontak darurat',
  'Nomor kontak darurat', 'Persetujuan penggunaan data', 'Waktu persetujuan',
  'Status pendaftaran'
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Pendaftaran — Jelajah Terra')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Hanya metadata kegiatan, tidak pernah mengembalikan daftar peserta.
function getTrip() {
  try {
    checkConfig_();
    const c = TRIP_CONFIG;
    return { ok: true, trip: {
      tripId: c.tripId, name: c.name, date: c.date, location: c.location,
      distanceKm: c.distanceKm, description: c.description, duration: c.duration,
      price: c.price, included: c.included, requirements: c.requirements,
      isExample: c.isExample, registrationOpen: c.registrationOpen && !c.isExample,
      consentText: CONSENT_
    }};
  } catch (_) {
    return { ok: false, message: 'Informasi kegiatan belum tersedia. Silakan hubungi admin.' };
  }
}

function submitRegistration(payload) {
  let lock;
  try {
    checkConfig_();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, message: 'Data formulir tidak valid. Muat ulang halaman.' };
    }
    if (payload.tripId !== TRIP_CONFIG.tripId) {
      return { ok: false, message: 'Informasi kegiatan telah berubah. Muat ulang halaman sebelum mendaftar.' };
    }
    const key = payload.submissionKey;
    if (typeof key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      return { ok: false, message: 'Kunci pengiriman tidak valid. Muat ulang halaman.' };
    }
    lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      return { ok: false, message: 'Pendaftaran sedang ramai. Tunggu sebentar lalu kirim ulang.' };
    }
    const sheet = registrationSheet_();
    // Cari hanya kunci acak; nomor WA/email tidak membatasi pendaftaran trip lain.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const matches = sheet.getRange(2, 3, lastRow - 1, 1).createTextFinder(key)
        .matchEntireCell(true).matchCase(true).useRegularExpression(false).findAll();
      for (let i = 0; i < matches.length; i++) {
        const stored = sheet.getRange(matches[i].getRow(), 2, 1, 3).getValues()[0];
        if (stored[2] === TRIP_CONFIG.tripId) {
          return { ok: true, registrationNumber: String(stored[0]), status: STATUS_ };
        }
      }
    }
    // Retry yang sudah tersimpan tetap berhasil meskipun admin menutup pendaftaran.
    if (!TRIP_CONFIG.registrationOpen || TRIP_CONFIG.isExample) {
      return { ok: false, message: 'Pendaftaran belum dibuka atau sudah ditutup. Silakan hubungi admin.' };
    }
    const validation = validate_(payload);
    if (Object.keys(validation.errors).length) {
      return { ok: false, message: 'Periksa kembali kolom yang ditandai.', errors: validation.errors };
    }
    const p = validation.data;
    const now = Utilities.formatDate(new Date(), TIME_ZONE_, 'yyyy-MM-dd HH:mm:ss');
    const number = 'JT-' + Utilities.formatDate(new Date(), TIME_ZONE_, 'yyyyMMdd') + '-' + Utilities.getUuid().toUpperCase();
    const row = [now, number, key, TRIP_CONFIG.tripId, TRIP_CONFIG.name,
      TRIP_CONFIG.date, TRIP_CONFIG.price, p.fullName, p.birthDate,
      p.whatsapp, p.email, p.city, p.healthCondition, p.healthDetails,
      p.allergy, p.allergyDetails, p.medication, p.medicationDetails,
      p.specialNeeds, p.emergencyName, p.emergencyRelationship, p.emergencyPhone,
      CONSENT_, now, STATUS_];
    // Semua string diperlakukan sebagai teks; awalan formula juga di-escape.
    const target = sheet.getRange(lastRow + 1, 1, 1, HEADERS_.length);
    target.setNumberFormat('@');
    target.setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush(); // Jangan memberi sukses sebelum operasi penyimpanan selesai.
    return { ok: true, registrationNumber: number, status: STATUS_ };
  } catch (_) {
    // Tidak membocorkan ID spreadsheet, stack trace, identitas, atau informasi kesehatan.
    return { ok: false, message: 'Pendaftaran belum dapat dipastikan tersimpan. Isian Anda tetap ada. Silakan kirim ulang; pengiriman yang sama tidak membuat baris ganda.' };
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

// Akhiran _ membuat fungsi admin/helper tidak dapat dipanggil via google.script.run.
function setup_() {
  checkConfig_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const book = spreadsheet_();
    let sheet = book.getSheetByName(TRIP_CONFIG.sheetName);
    if (!sheet) sheet = book.insertSheet(TRIP_CONFIG.sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS_.length).setValues([HEADERS_]);
      sheet.setFrozenRows(1);
    }
    checkHeaders_(sheet);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id || !id.trim()) throw new Error('Isi Script Property SPREADSHEET_ID.');
  return SpreadsheetApp.openById(id.trim());
}
function registrationSheet_() {
  const sheet = spreadsheet_().getSheetByName(TRIP_CONFIG.sheetName);
  if (!sheet) throw new Error('Jalankan setup_ dari editor terlebih dahulu.');
  checkHeaders_(sheet);
  return sheet;
}
function checkHeaders_(sheet) {
  const actual = sheet.getRange(1, 1, 1, HEADERS_.length).getValues()[0];
  if (sheet.getLastColumn() !== HEADERS_.length || HEADERS_.some((h, i) => actual[i] !== h)) {
    throw new Error('Header sheet berbeda. Gunakan sheetName baru atau periksa header tanpa menimpa data.');
  }
}
function checkConfig_() {
  const c = TRIP_CONFIG;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(c.tripId) || !validDate_(c.date) ||
      !Number.isFinite(c.distanceKm) || c.distanceKm <= 0 ||
      typeof c.description !== 'string' || !c.description.trim() || c.description.length > 1000 ||
      typeof c.duration !== 'string' || !c.duration.trim() || c.duration.length > 160 ||
      typeof c.name !== 'string' || !c.name.trim() || typeof c.location !== 'string' || !c.location.trim() ||
      !Number.isFinite(c.price) || c.price < 0 || !Number.isInteger(c.price) ||
      !Array.isArray(c.included) || !c.included.length || !Array.isArray(c.requirements) || !c.requirements.length ||
      !c.included.concat(c.requirements).every(x => typeof x === 'string' && x.trim()) ||
      typeof c.isExample !== 'boolean' || typeof c.registrationOpen !== 'boolean' ||
      typeof c.sheetName !== 'string' || !c.sheetName.trim()) {
    throw new Error('Periksa konfigurasi trip.');
  }
}
function validDate_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const y = Number(value.slice(0, 4)), m = Number(value.slice(5, 7)), d = Number(value.slice(8, 10));
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1];
}
function normalizePhone_(value) {
  if (!/^[+\d\s().-]+$/.test(value)) return null;
  let n = value.replace(/[\s().-]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('08')) n = '62' + n.slice(1);
  return /^628\d{8,11}$/.test(n) ? '+' + n : null;
}
function validate_(source) {
  const data = {}, errors = {};
  function text(name, label, max, required) {
    const raw = source[name];
    const value = typeof raw === 'string' ? raw.trim() : '';
    data[name] = value;
    if (raw != null && typeof raw !== 'string') errors[name] = label + ' tidak valid.';
    else if (required && !value) errors[name] = label + ' wajib diisi.';
    else if (value.length > max) errors[name] = label + ' maksimal ' + max + ' karakter.';
    else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) errors[name] = label + ' mengandung karakter tidak valid.';
    return value;
  }
  text('fullName', 'Nama lengkap', 120, true);
  const birth = text('birthDate', 'Tanggal lahir', 10, true);
  if (!validDate_(birth) || birth > Utilities.formatDate(new Date(), TIME_ZONE_, 'yyyy-MM-dd')) {
    errors.birthDate = 'Isi tanggal lahir yang valid dan tidak di masa depan.';
  }
  ['whatsapp', 'emergencyPhone'].forEach(name => {
    const value = text(name, 'Nomor telepon', 30, true);
    const normalized = normalizePhone_(value);
    if (!normalized) errors[name] = 'Gunakan nomor Indonesia: 08…, 628…, atau +628….';
    else data[name] = normalized;
  });
  const email = text('email', 'Email', 254, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Isi alamat email yang valid.';
  text('city', 'Kota domisili', 120, false);
  [['healthCondition', 'healthDetails'], ['allergy', 'allergyDetails'], ['medication', 'medicationDetails']].forEach(pair => {
    const answer = source[pair[0]];
    if (answer !== 'Ya' && answer !== 'Tidak') errors[pair[0]] = 'Pilih Ya atau Tidak.';
    data[pair[0]] = answer;
    if (answer === 'Ya') text(pair[1], 'Penjelasan', 1000, true);
    else data[pair[1]] = ''; // Abaikan detail tersembunyi dan field tambahan.
  });
  text('specialNeeds', 'Kebutuhan khusus', 1000, false);
  text('emergencyName', 'Nama kontak darurat', 120, true);
  text('emergencyRelationship', 'Hubungan dengan peserta', 80, true);
  if (source.consent !== true) errors.consent = 'Persetujuan diperlukan untuk mengirim pendaftaran.';
  return { data: data, errors: errors };
}
function safeCell_(value) {
  return typeof value === 'string' && /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
}
