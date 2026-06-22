# Perubahan Responsive Tampilan HP

Project sudah disesuaikan agar tampilan neobrutalism tetap rapi saat dibuka di layar HP.

## Yang diperbaiki

1. **Navbar mobile**
   - Logo dibuat tidak memaksa lebar layar kecil.
   - Menu mobile tetap nyaman ditekan.
   - Navigasi tidak membuat halaman melebar ke kanan.

2. **Landing page**
   - Hero section memakai tinggi `100svh` agar aman di browser HP.
   - Ukuran judul, gambar, tombol, spacing, dan shadow diperkecil di layar kecil.
   - Section About, Menu, Gallery, dan CTA dibuat lebih padat namun tetap neobrutalism.

3. **Menu pelanggan / QR order**
   - Header meja lebih ringkas.
   - Kategori menu menjadi horizontal scroll di HP.
   - Card menu lebih pas untuk layar kecil.
   - Sticky cart dibuat lebih kecil dan aman di bawah layar HP.
   - Modal detail menu dan keranjang memakai tinggi layar HP (`svh`) agar tidak terpotong.

4. **Dashboard Admin**
   - Sidebar admin berubah menjadi horizontal scroll menu di HP.
   - Konten dashboard diberi padding lebih kecil di layar kecil.
   - Tabel admin memakai horizontal scroll agar tidak memaksa tampilan desktop.
   - Modal tambah/edit menu lebih aman untuk layar kecil.

5. **CSS global responsive**
   - Shadow neobrutalism diperkecil di HP.
   - Judul section dan tag dibuat lebih aman agar tidak overflow.
   - Input dibuat `16px` di HP supaya browser tidak melakukan auto-zoom.

## Cara menjalankan

```bash
npm install
npm run dev
```

## Build test

Sudah dites dengan:

```bash
npm run build
```

Hasil build berhasil.
