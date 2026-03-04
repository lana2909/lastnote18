# Deployment Guide via GitHub - One Last Note (lastnote18)

Metode ini jauh lebih mudah daripada zip manual. Kita akan menggunakan GitHub untuk menyimpan kode dan Vercel (atau layanan sejenis) untuk deployment otomatis.

## Prasyarat
1.  Akun [GitHub](https://github.com)
2.  Akun [Vercel](https://vercel.com) (bisa login pakai GitHub)
3.  [Git](https://git-scm.com/downloads) terinstal di komputer Anda

---

## Langkah 1: Buat Repository GitHub

1.  Buka [GitHub.com](https://github.com) dan login.
2.  Klik tombol **+** di pojok kanan atas -> **New repository**.
3.  Isi **Repository name** dengan: `lastnote18`
4.  Pilih **Public** atau **Private** (terserah Anda).
5.  Jangan centang "Add a README file" (karena kita sudah punya).
6.  Klik **Create repository**.

---

## Langkah 2: Upload Kode ke GitHub

Buka terminal di folder proyek Anda (`d:\Data penting\Document\Karya\khususdokumentasi16\One Last Note Memory\project`) dan jalankan perintah berikut satu per satu:

```bash
# 1. Inisialisasi Git (jika belum pernah)
git init

# 2. Tambahkan semua file ke staging
git add .

# 3. Buat commit pertama
git commit -m "Initial commit: One Last Note Memory complete features"

# 4. Ubah nama branch utama ke 'main'
git branch -M main

# 5. Hubungkan folder lokal ke repository GitHub yang baru dibuat
# Ganti 'USERNAME' dengan username GitHub Anda
git remote add origin https://github.com/USERNAME/lastnote18.git

# 6. Upload kode ke GitHub
git push -u origin main
```

*Catatan: Jika diminta login, masukkan username dan password (atau Personal Access Token) GitHub Anda.*

---

## Langkah 3: Deploy ke Vercel (Paling Mudah & Gratis)

Vercel adalah platform terbaik untuk Next.js.

1.  Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login.
2.  Klik **Add New...** -> **Project**.
3.  Di bagian "Import Git Repository", cari `lastnote18` dan klik **Import**.
4.  Di halaman konfigurasi "Configure Project":
    *   **Project Name**: Biarkan `lastnote18`
    *   **Framework Preset**: Next.js (Otomatis terdeteksi)
    *   **Environment Variables**: Klik untuk membuka. Masukkan variabel dari file `.env` Anda satu per satu:
        *   `NEXT_PUBLIC_SUPABASE_URL`: (Isi dengan URL Supabase Anda)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Isi dengan Anon Key Supabase Anda)
        *   `SUPABASE_SERVICE_ROLE_KEY`: (Isi dengan Service Role Key Supabase Anda)
        *   `NEXTAUTH_URL`: Kosongkan dulu (Vercel akan mengaturnya otomatis) atau isi dengan domain Vercel nanti (misal `https://lastnote18.vercel.app`). *Saran: Saat deploy pertama, Vercel otomatis mengisi URL default, jadi aman dikosongkan atau diisi URL sementara.*
        *   `NEXTAUTH_SECRET`: (Isi dengan string acak panjang, bisa pakai hasil `openssl rand -base64 32` atau ketik acak saja yang panjang)

5.  Klik **Deploy**.

Tunggu sebentar (sekitar 1-2 menit). Vercel akan membangun proyek, menginstall dependensi, dan menayangkannya.

---

## Langkah 4: Finalisasi Konfigurasi

Setelah deploy berhasil ("Congratulations!"):

1.  Klik tombol **Continue to Dashboard**.
2.  Lihat domain yang diberikan Vercel (biasanya `https://lastnote18.vercel.app` atau `https://lastnote18-username.vercel.app`).
3.  **PENTING**: Update Environment Variable `NEXTAUTH_URL`.
    *   Masuk ke **Settings** -> **Environment Variables**.
    *   Tambahkan/Edit `NEXTAUTH_URL` dan isi dengan domain Vercel yang valid tadi (misal: `https://lastnote18.vercel.app`).
    *   (Opsional) Jika Anda punya domain sendiri, atur di menu **Domains**, lalu update `NEXTAUTH_URL` sesuai domain itu.
4.  **Redeploy** agar perubahan env var tadi aktif:
    *   Masuk ke menu **Deployments**.
    *   Klik titik tiga di deployment paling atas -> **Redeploy**.

---

## Langkah 5: Update Supabase Auth URL

Supabase perlu tahu domain website Anda agar redirect login berhasil.

1.  Buka Dashboard Supabase proyek Anda.
2.  Masuk ke **Authentication** -> **URL Configuration**.
3.  Di bagian **Site URL**, masukkan domain Vercel Anda (misal: `https://lastnote18.vercel.app`).
4.  Di bagian **Redirect URLs**, tambahkan:
    *   `https://lastnote18.vercel.app/api/auth/callback/credentials`
    *   `https://lastnote18.vercel.app`
5.  Klik **Save**.

---

## Selesai!

Website Anda sekarang sudah online.
-   Jika Anda ingin update kode, cukup edit di komputer lokal -> `git add .` -> `git commit -m "pesan"` -> `git push`. Vercel akan otomatis mendeteksi perubahan dan men-deploy ulang dalam hitungan detik/menit.

Selamat mencoba!
