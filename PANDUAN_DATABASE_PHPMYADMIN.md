# Panduan Database Asli MySQL/phpMyAdmin - Kopi Nusantara

Project ini sudah diperbaiki agar data utama tidak lagi bergantung pada `localStorage`, `server-db.json`, atau Netlify Blobs. Data sekarang disimpan ke database MySQL yang bisa dilihat dan dikelola lewat phpMyAdmin.

## Data yang masuk database

1. `menus` — data menu, harga, kategori, status tersedia/habis, dan rekomendasi hari ini.
2. `orders` — data utama pesanan pelanggan.
3. `order_items` — detail item pada setiap pesanan.
4. `expenses` — data pengeluaran untuk laporan keuangan.

## 1. Jalankan XAMPP

Aktifkan:

- Apache
- MySQL

Lalu buka phpMyAdmin di browser:

```txt
http://localhost/phpmyadmin
```

## 2. Import database

1. Masuk ke phpMyAdmin.
2. Klik menu **Import**.
3. Pilih file:

```txt
database/kopi_nusantara.sql
```

4. Klik **Go/Kirim**.

Setelah berhasil, akan muncul database:

```txt
kopi_nusantara
```

## 3. Buat file `.env`

Duplikat file `.env.example`, lalu ubah namanya menjadi `.env`.

Isi default untuk XAMPP biasanya seperti ini:

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kopi_nusantara
```

Jika MySQL kamu memakai password, isi bagian `DB_PASSWORD`.

## 4. Install dependency baru

Jalankan di folder project `Nusantara`:

```bash
npm install
```

Dependency yang ditambahkan:

```txt
mysql2
dotenv
```

## 5. Jalankan project

Cara paling stabil untuk HP dan laptop admin adalah build lalu jalankan server:

```bash
npm run build
npm start
```

Buka di laptop:

```txt
http://localhost:3001
```

Untuk HP pelanggan, pastikan HP dan laptop satu WiFi. Buka IP laptop dengan port 3001, contoh:

```txt
http://192.168.1.5:3001#meja=1
```

Dashboard admin:

```txt
http://192.168.1.5:3001#admin
```

## 6. Cek koneksi database

Buka:

```txt
http://localhost:3001/api/health
```

Jika berhasil, tampil pesan:

```json
{
  "ok": true,
  "message": "API aktif dan database MySQL terhubung."
}
```

## Catatan penting

- Jangan membuka frontend langsung dari `npm run dev` saja jika ingin data masuk database. API MySQL berjalan dari `server.js` di port 3001.
- Jika tetap memakai `npm run dev`, server API tetap harus dijalankan dengan `npm run server` pada terminal lain.
- phpMyAdmin hanya berjalan lokal/XAMPP. Jika deploy ke Netlify, database MySQL lokal tidak akan ikut online.
