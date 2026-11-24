const sqlite3 = require("sqlite3");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Lokasi database SQLite. Coba berurutan: DB_DIR, folder data di sebelah kode, lalu tmpdir.
// Di platform deploy folder aplikasi kadang read-only, sehingga tidak bisa ditulisi.
const cariFolderData = () => {
  const kandidat = [process.env.DB_DIR, path.join(__dirname, "data"), path.join(os.tmpdir(), "kerjaku")];

  for (const dir of kandidat) {
    if (!dir) continue;
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (err) {
      console.warn(`Folder data ${dir} tidak bisa dipakai (${err.code || err.message}), coba lokasi lain.`);
    }
  }

  throw new Error("Tidak ada folder yang bisa ditulis untuk menyimpan database SQLite");
};

const FILE = path.join(cariFolderData(), "kerjaku.db");
const fileBaru = !fs.existsSync(FILE);
const db = new sqlite3.Database(FILE);

const usersAwal = [
  ["admin", "Admin", "admin@kerjaku.com", "081234567890", "admin123", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"],
  ["anggia", "Anggia", "anggia@kerjaku.com", "081298765432", "kerja123", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"],
];

const lowonganAwal = [
  ["Frontend Developer", "PT Teknologi Nusantara", "Jakarta", "Rp8.000.000", "Membuat tampilan website menggunakan React.", "https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&auto=format&fit=crop&q=80"],
  ["Mobile Developer", "Aplikasi Kita", "Bandung", "Rp7.000.000", "Membuat aplikasi Android dan iOS menggunakan Ionic.", "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&auto=format&fit=crop&q=80"],
  ["UI/UX Designer", "Kreatif Digital", "Yogyakarta", "Rp6.000.000", "Mendesain tampilan aplikasi menggunakan Figma.", "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=120&auto=format&fit=crop&q=80"],
  ["Digital Marketing", "Toko Maju", "Surabaya", "Rp5.500.000", "Mengelola iklan dan media sosial perusahaan.", "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&auto=format&fit=crop&q=80"],
  ["Staff Admin", "PT Sinar Abadi", "Bekasi", "Rp4.500.000", "Mengelola surat dan arsip kantor.", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80"],
  ["Data Analyst", "Analitika Data", "Jakarta", "Rp9.000.000", "Mengolah data dan membuat laporan untuk tim bisnis.", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80"],
];

// serialize: perintah di dalamnya dijalankan berurutan
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    avatar TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS lowongan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    description TEXT,
    logo TEXT
  )`);

  // Migrasi kolom jika tabel lama sudah ada
  db.run("ALTER TABLE users ADD COLUMN avatar TEXT", () => {});
  db.run("ALTER TABLE lowongan ADD COLUMN logo TEXT", () => {});

  db.run(`CREATE TABLE IF NOT EXISTS lamaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lowongan_id INTEGER NOT NULL REFERENCES lowongan(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv TEXT NOT NULL,
    pesan TEXT DEFAULT '',
    tanggal TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE (lowongan_id, user_id)
  )`);

  // Isi data awal hanya saat file database baru dibuat
  if (fileBaru) {
    usersAwal.forEach((u) =>
      db.run("INSERT INTO users (username, name, email, phone, password, avatar) VALUES (?, ?, ?, ?, ?, ?)", u)
    );
    lowonganAwal.forEach((l) =>
      db.run("INSERT INTO lowongan (title, company, location, salary, description, logo) VALUES (?, ?, ?, ?, ?, ?)", l)
    );
    console.log("Database baru dibuat dan diisi data awal: " + FILE);
  }
});

module.exports = db;
