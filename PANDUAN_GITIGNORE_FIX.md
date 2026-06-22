# Perbaikan `.gitignore`

Project ini sudah disesuaikan dengan ketentuan:

```txt
node_modules
dist
.env
```

Folder/file yang sudah dihapus dari paket ZIP:

- `node_modules`
- `dist`
- `.env`

File `.env.example` tetap disimpan sebagai contoh konfigurasi.

## Setelah extract ZIP

Masuk ke folder project:

```bash
cd Nusantara
npm install
npm run dev
```

## Jika file sebelumnya sudah terlanjur masuk GitHub

Jalankan di terminal:

```bash
git rm -r --cached node_modules
git rm -r --cached dist
git rm --cached .env
git add .
git commit -m "fix gitignore build"
git push
```

Kalau ada perintah yang menampilkan pesan `pathspec ... did not match`, artinya file/folder tersebut memang sudah tidak ter-track Git dan bisa lanjut ke perintah berikutnya.
