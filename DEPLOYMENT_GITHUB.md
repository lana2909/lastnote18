# Deployment Guide - One Last Note (Self-Hosted Proxmox CT)

Panduan ini untuk deployment di server sendiri (Proxmox CT/LXC/VM) menggunakan Git.
Metode ini jauh lebih efisien karena Anda hanya perlu `git pull` untuk update.

---

## Prasyarat di Server (Proxmox CT)

Pastikan server Anda sudah terinstall:
1.  **Git**: `sudo apt install git`
2.  **Node.js 18+**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
3.  **PM2 (Process Manager)**: `sudo npm install -g pm2`
4.  **Nginx (Reverse Proxy)**: `sudo apt install nginx`

---

## Langkah 1: Persiapkan Repository GitHub (Di Laptop/PC Anda)

Sebelum deploy, pastikan kode di lokal sudah naik ke GitHub.

1.  Buka terminal di folder proyek ini.
2.  Inisialisasi Git dan push ke GitHub:
    ```powershell
    # Hapus folder .git lama jika ada (opsional, biar bersih)
    # rmdir /s /q .git

    git init
    git add .
    git commit -m "Initial commit for self-hosted deployment"
    git branch -M main
    
    # Ganti USERNAME dengan username GitHub Anda
    git remote add origin https://github.com/USERNAME/lastnote18.git
    
    git push -u origin main
    ```

---

## Langkah 2: Clone di Server (Proxmox CT)

Masuk ke terminal server Anda (via SSH atau Console Proxmox).

1.  Masuk ke direktori web (misal `/var/www`):
    ```bash
    cd /var/www
    ```

2.  Clone repository:
    ```bash
    # Ganti URL dengan repo Anda
    sudo git clone https://github.com/USERNAME/lastnote18.git
    ```

3.  Masuk ke folder proyek:
    ```bash
    cd lastnote18
    ```

4.  Install dependensi:
    ```bash
    npm install
    ```

---

## Langkah 3: Konfigurasi Environment Variables

Buat file `.env` di server:

```bash
nano .env
```

Isi dengan konfigurasi berikut (sesuaikan dengan data Supabase Anda):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth Configuration
# Ganti dengan domain server Anda atau IP jika belum ada domain
NEXTAUTH_URL=http://IP_ADDRESS_SERVER_ANDA_ATAU_DOMAIN
NEXTAUTH_SECRET=buat_string_acak_yang_panjang_dan_rahasia_disini
```

Simpan dengan `Ctrl+X`, lalu `Y`, lalu `Enter`.

---

## Langkah 4: Build & Jalankan dengan PM2

1.  Build aplikasi Next.js:
    ```bash
    npm run build
    ```

    **Troubleshooting Build Error (Fonts Timeout):**
    Jika Anda mengalami error `FetchError: request to ... fonts.gstatic.com ... failed` saat build, itu karena server tidak bisa mengakses Google Fonts. Solusinya sudah diterapkan di kode terbaru (menggunakan konfigurasi font yang lebih aman). Cukup pastikan Anda sudah `git pull` kode terbaru.

2.  Jalankan aplikasi menggunakan PM2:
    ```bash
    pm2 start npm --name "lastnote18" -- start
    ```

3.  Simpan konfigurasi PM2 agar otomatis jalan saat restart server:
    ```bash
    pm2 save
    pm2 startup
    # Copy paste perintah yang muncul di layar dan jalankan
    ```

Sekarang aplikasi berjalan di port **3000** (http://localhost:3000).

---

## Langkah 5: Setup Nginx (Reverse Proxy)

Agar bisa diakses via port 80 (HTTP) atau domain tanpa mengetik `:3000`.

1.  Buat konfigurasi Nginx:
    ```bash
    sudo nano /etc/nginx/sites-available/lastnote18
    ```

2.  Isi dengan konfigurasi berikut:
    ```nginx
    server {
        listen 80;
        server_name domain-anda.com; # Atau IP server jika belum ada domain (misal: 192.168.1.100)

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  Aktifkan situs:
    ```bash
    sudo ln -s /etc/nginx/sites-available/lastnote18 /etc/nginx/sites-enabled/
    sudo nginx -t # Cek apakah ada error
    sudo systemctl restart nginx
    ```

Sekarang Anda bisa akses web melalui browser dengan mengetik IP Server atau Domain Anda.

---

## Cara Update Aplikasi (Git Pull)

Jika Anda melakukan perubahan kode di laptop/PC dan sudah di-push ke GitHub:

1.  Masuk ke folder proyek di server:
    ```bash
    cd /var/www/lastnote18
    ```

2.  Tarik perubahan terbaru:
    ```bash
    git pull origin main
    ```

3.  Install dependensi baru (jika ada):
    ```bash
    npm install
    ```

4.  Build ulang:
    ```bash
    npm run build
    ```

5.  Restart aplikasi PM2:
    ```bash
    pm2 restart lastnote18
    ```

Selesai! Aplikasi sudah terupdate.
