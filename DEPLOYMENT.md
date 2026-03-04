
# Panduan Deployment Menggunakan GitHub (Cara Mudah & Modern)

Panduan ini akan membantu Anda men-deploy aplikasi "One Last Note" menggunakan GitHub. Cara ini jauh lebih mudah daripada upload manual (ZIP) karena untuk update selanjutnya Anda cukup melakukan `git push` dan `git pull`.

## Persiapan Awal

Pastikan Anda memiliki:
1.  Akun **GitHub** (https://github.com).
2.  Server VPS (Ubuntu/Debian) yang sudah bisa diakses via SSH.
3.  Project "One Last Note" di komputer lokal Anda.

---

## Langkah 1: Upload Project ke GitHub

Lakukan ini di komputer/laptop Anda (Local).

1.  **Buat Repository Baru di GitHub**:
    *   Buka GitHub dan buat repository baru (klik tombol `+` di pojok kanan atas -> **New repository**).
    *   Beri nama, misalnya `one-last-note`.
    *   Pilih **Private** (agar kode dan data rahasia aman).
    *   Jangan centang "Add a README file" (karena kita sudah punya).
    *   Klik **Create repository**.

2.  **Hubungkan Project Lokal ke GitHub**:
    Buka terminal di folder project Anda (di VS Code atau CMD), lalu jalankan perintah berikut satu per satu:

    ```bash
    # Inisialisasi git (jika belum pernah)
    git init

    # Tambahkan semua file ke staging area
    git add .

    # Commit perubahan pertama
    git commit -m "First commit: Initial project upload"

    # Hubungkan ke repository GitHub yang baru dibuat
    # Ganti URL_REPO_ANDA dengan link repository GitHub Anda (contoh: https://github.com/username/one-last-note.git)
    git remote add origin https://github.com/USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA.git

    # Rename branch utama ke 'main'
    git branch -M main

    # Upload (Push) ke GitHub
    git push -u origin main
    ```

    *Catatan: Jika diminta login, masukkan username & password/token GitHub Anda.*

---

## Langkah 2: Setup di Server (VPS)

Sekarang masuk ke server VPS Anda menggunakan SSH (misal via PuTTY atau Terminal).

1.  **Install Node.js & Git (Jika belum ada)**:
    ```bash
    # Update server
    sudo apt update && sudo apt upgrade -y

    # Install Git
    sudo apt install git -y

    # Install Node.js (Versi 18 LTS atau 20 LTS disarankan)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs

    # Cek versi (pastikan muncul)
    node -v
    npm -v
    git --version
    ```

2.  **Install PM2 (Process Manager)**:
    PM2 berguna agar aplikasi tetap jalan walaupun server restart atau terminal ditutup.
    ```bash
    sudo npm install -g pm2
    ```

3.  **Clone Repository dari GitHub**:
    Masuk ke folder `/var/www` (atau folder home Anda) dan download projectnya.

    ```bash
    cd /var/www
    # Clone project (akan diminta username/password GitHub karena repo Private)
    sudo git clone https://github.com/USERNAME_GITHUB_ANDA/NAMA_REPO_ANDA.git one-last-note

    # Masuk ke folder project
    cd one-last-note
    ```

    *Tips: Agar tidak perlu masukkan password terus, Anda bisa setting SSH Key di GitHub, tapi HTTPS biasa juga tidak masalah.*

4.  **Setup Environment Variables (.env)**:
    File `.env` tidak ikut di-upload ke GitHub demi keamanan. Anda harus membuatnya manual di server.

    ```bash
    # Buat file .env.local
    sudo nano .env.local
    ```

    Paste isi konfigurasi berikut (sesuaikan dengan data Supabase Anda yang sudah jalan di TJKT 2):

    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
    NEXTAUTH_URL=http://IP_SERVER_ANDA_ATAU_DOMAIN
    NEXTAUTH_SECRET=rahasia_banget_12345
    ```

    Simpan dengan `Ctrl+O`, `Enter`, lalu `Ctrl+X`.

5.  **Install & Build Aplikasi**:
    ```bash
    # Install dependencies
    sudo npm install

    # Build aplikasi Next.js
    sudo npm run build
    ```

6.  **Jalankan Aplikasi dengan PM2**:
    ```bash
    # Start aplikasi di port 3000
    sudo pm2 start npm --name "one-last-note" -- start

    # Simpan list proses agar auto-start saat boot
    sudo pm2 save
    sudo pm2 startup
    ```

    Aplikasi sekarang sudah berjalan di `http://IP_SERVER_ANDA:3000`.

---

## Langkah 3: Cara Update (Deploy Ulang)

Ini adalah bagian yang Anda cari. Setiap kali Anda ada perubahan kode (misal fix bug login tadi), lakukan langkah ini:

### 1. Di Komputer Lokal (Laptop Anda)
Setelah selesai edit kodingan:

```bash
# Tambahkan file yang berubah
git add .

# Simpan perubahan (Commit)
git commit -m "Fix login bug and update roles"

# Kirim ke GitHub (Push)
git push
```

### 2. Di Server (VPS)
Masuk ke server via SSH, lalu jalankan:

```bash
# Masuk ke folder project
cd /var/www/one-last-note

# Ambil kode terbaru dari GitHub
sudo git pull

# Install ulang dependencies (jika ada library baru, kalau tidak ada skip aja)
sudo npm install

# Build ulang aplikasi (Wajib jika ada perubahan codingan Next.js)
sudo npm run build

# Restart aplikasi agar perubahan diterapkan
sudo pm2 restart one-last-note
```

**Selesai!** Web sudah terupdate dengan versi terbaru tanpa perlu upload-upload file manual lagi.

---

## Masalah Umum (Troubleshooting)

1.  **Lupa Password GitHub saat `git push`**:
    GitHub sekarang menggunakan "Personal Access Token" (PAT) sebagai password. Anda harus generate token di Settings > Developer Settings > Personal Access Tokens.

2.  **Permission Denied saat `git pull` di server**:
    Gunakan `sudo` di depan perintah git jika folder project dibuat menggunakan sudo. Atau ubah kepemilikan folder ke user Anda:
    `sudo chown -R $USER:$USER /var/www/one-last-note`

3.  **Aplikasi Error setelah Update**:
    Cek log errornya dengan:
    `sudo pm2 logs one-last-note`
