# Panduan Deployment Menggunakan GitHub

Berikut adalah langkah-langkah untuk mendeploy aplikasi menggunakan GitHub agar lebih cepat dan mudah.

## 1. Buat Repository di GitHub
1. Buka [GitHub](https://github.com) dan login.
2. Klik tombol **New** untuk membuat repository baru.
3. Beri nama repository, misalnya `lastnote18`.
4. Pilih **Private** (disarankan) atau **Public**.
5. Jangan centang "Add a README file", ".gitignore", atau "License" (karena kita sudah punya di lokal).
6. Klik **Create repository**.

## 2. Push Kode Lokal ke GitHub
Buka terminal di komputer lokal Anda (di folder project ini), lalu jalankan perintah berikut (ganti `USERNAME` dengan username GitHub Anda):

```bash
git remote add origin https://github.com/USERNAME/lastnote18.git
git branch -M main
git push -u origin main
```

## 3. Setup di Server (VPS)
Masuk ke server Anda via SSH, lalu ikuti langkah ini.

### A. Jika Belum Pernah Clone (Pertama Kali)
Hapus folder lama (backup dulu jika perlu) dan clone ulang.

```bash
cd /var/www
rm -rf lastnote18  # Hapus folder lama
git clone https://github.com/USERNAME/lastnote18.git
cd lastnote18
```

**PENTING:** Anda akan diminta username dan password GitHub. 
- Password: Gunakan **Personal Access Token (Classic)**, bukan password login biasa.
- Cara buat token: Settings -> Developer settings -> Personal access tokens -> Tokens (classic) -> Generate new token -> Centang `repo`.

Setelah clone selesai, buat file `.env` lagi:
```bash
nano .env
```
Isi dengan:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://qwirrmytmkyfssdlijgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (isi sesuai key Anda)
SUPABASE_SERVICE_ROLE_KEY=... (isi sesuai key Anda)
NEXTAUTH_SECRET=development_secret_key_for_testing_123
NEXTAUTH_URL=https://lastnote18.syscore.web.id
TRUST_HOST=true
```

Lalu install dan build:
```bash
npm install
npm run build
pm2 delete lastnote18  # Hapus process lama biar bersih
pm2 start npm --name "lastnote18" -- start  # Jalankan ulang
```

### B. Jika Sudah Pernah Clone (Update Selanjutnya)
Untuk update selanjutnya, Anda cukup jalankan ini di server:

```bash
cd /var/www/lastnote18
git pull origin main
npm install
npm run build
pm2 restart lastnote18 --update-env
```

Selesai! Tidak perlu upload-upload zip lagi.
