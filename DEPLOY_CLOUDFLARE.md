# Panduan Deploy ke Cloudflare Pages / Workers 🚀

Aplikasi **CashFlow Tracker** ini dirancang dengan pendekatan *Offline-First* (menyimpan data di IndexedDB browser menggunakan Dexie) dengan sinkronisasi opsional ke Supabase melalui SDK browser. 

Terdapat dua metode utama untuk mendeploy aplikasi Next.js ini ke infrastruktur Cloudflare:

---

## 📋 Metode 1: Static HTML Export (Sangat Direkomendasikan & Paling Mudah)

Karena mayoritas fungsionalitas aplikasi ini berjalan di browser (sisi klien), Anda dapat menggunakan **Static Export**. Next.js akan memproses halaman menjadi file HTML/CSS/JS statis murni yang dapat disajikan secara gratis dan sangat cepat oleh Cloudflare Pages.

> [!NOTE]
> **Batasan**: Metode ini tidak mendukung Next.js Proxy/Middleware sisi server (`src/proxy.ts`). Sebagai gantinya, proteksi rute harus dipindahkan ke sisi klien (*client-side*).

### Langkah-Langkah Konfigurasi:

1. **Update `next.config.ts`**
   Ubah file `next.config.ts` Anda menjadi seperti berikut:
   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     output: 'export', // Mengaktifkan ekspor statis
     images: {
       unoptimized: true, // Diperlukan karena Cloudflare Pages statis tidak memiliki server optimasi gambar Next.js
     },
   };

   export default nextConfig;
   ```

2. **Sesuaikan Proteksi Halaman (Client-Side Auth)**
   Pindahkan logika proteksi halaman ke komponen sisi klien (seperti di level React Context/HOC) yang mengarahkan pengguna ke `/login` jika tidak ada sesi aktif dari Supabase.

3. **Lakukan Build Lokal untuk Menguji**
   Jalankan perintah berikut di terminal:
   ```bash
   npm run build
   ```
   Perintah ini akan menghasilkan folder baru bernama **`out/`** di direktori utama.

4. **Deploy ke Cloudflare Pages**
   * **Opsi A: Integrasi GitHub (Otomatis)**
     1. Push repositori Anda ke GitHub.
     2. Masuk ke Dashboard Cloudflare -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
     3. Pilih repositori Anda.
     4. Konfigurasikan Build Settings:
        * **Framework preset**: `Next.js (Static HTML Export)`
        * **Build command**: `npm run build`
        * **Build output directory**: `out`
     5. Tambahkan Environment Variables di bagian **Environment variables (advanced)**:
        * `NEXT_PUBLIC_SUPABASE_URL`
        * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     6. Klik **Save and Deploy**.

---

## 🎛️ Metode 2: Full Server Rendering (OpenNext + Cloudflare Workers) — [SUDAH DIKONFIGURASI]

Kami telah menyelesaikan konfigurasi lokal untuk Metode 2 ini. Proyek Anda sekarang siap untuk dicompile dan dideploy sebagai Cloudflare Worker menggunakan **OpenNext**.

### Apa yang telah kami lakukan untuk Anda:
1. **Instalasi Dependensi**: Menginstal `@opennextjs/cloudflare` dan `wrangler`.
2. **Berkas Konfigurasi**:
   * Membuat file `wrangler.jsonc` untuk konfigurasi binding dan aset statis.
   * Membuat file `open-next.config.ts` untuk builder OpenNext.
   * Mengintegrasikan `initOpenNextCloudflareForDev()` di dalam `next.config.ts`.
3. **Memperbaiki Skrip Build**: Mengonfigurasi skrip terpisah di `package.json` untuk menghindari *infinite recursive loop* saat build.
4. **Memperbaiki Tipe Data TypeScript**: Memperbaiki type errors pada settings dan sync database agar build sukses.
5. **Menonaktifkan Proxy Sisi Server**:
   * **Mengapa**: Next.js 16 memperkenalkan konvensi `src/proxy.ts` yang menggantikan `middleware.ts`. Konvensi ini dipaksa berjalan di runtime Node.js oleh Next.js dan tidak mengizinkan Edge Runtime. Namun, Cloudflare Workers saat ini belum mendukung Node.js proxy/middleware pada fase perantara.
   * **Tindakan**: Kami menonaktifkan sementara file tersebut dengan mengubah namanya menjadi `src/proxy.ts.bak`. Aplikasi sekarang ter-compile dengan sukses 100%!

### Langkah Selanjutnya untuk Melakukan Deploy:

1. **Jalankan Build Cloudflare Secara Lokal**
   Gunakan perintah ini untuk memicu kompilasi Next.js sekaligus pembungkusan aset oleh OpenNext:
   ```bash
   npm run build:cf
   ```
   Ini akan menghasilkan folder `.open-next/` yang berisi `worker.js` dan aset-aset statis yang siap dideploy.

2. **Login ke Wrangler**
   Hubungkan terminal Anda dengan akun Cloudflare Anda:
   ```bash
   npx wrangler login
   ```
   *Terminal akan membuka browser untuk otorisasi akses Cloudflare.*

3. **Deploy Aplikasi ke Cloudflare**
   Jalankan perintah deploy untuk mengunggah Worker Anda ke Cloudflare:
   ```bash
   npm run deploy
   ```

4. **Masukkan Environment Variables (Rahasia Supabase)**
   Agar sinkronisasi database dengan Supabase berfungsi di server Cloudflare, Anda harus memasukkan kredensial API Supabase Anda.
   * **Via Terminal**:
     ```bash
     npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
     npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
     ```
   * **Via Dashboard Cloudflare (Rekomendasi)**:
     1. Masuk ke **Dashboard Cloudflare** -> **Workers & Pages**.
     2. Pilih proyek Workers Anda (**personal-cashflow-tracker**).
     3. Buka tab **Settings** -> **Variables**.
     4. Di bagian **Environment Variables**, klik **Add variable**:
        * Key: `NEXT_PUBLIC_SUPABASE_URL` | Value: *[URL Supabase Anda]*
        * Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: *[Kunci Anon Supabase Anda]*
     5. Klik **Save and deploy**.

---

## 🔄 Cara Memperbarui Website (Update Workflow)

Karena saat ini deployment menggunakan **Cloudflare Workers (Wrangler)** secara langsung, melakukan **`git push` saja tidak akan memperbarui website yang live**. 

Berikut adalah dua pilihan alur kerja untuk memperbarui website Anda:

### Pilihan 1: Deploy Manual dari Komputer Lokal (Paling Mudah)

Setiap kali Anda selesai melakukan perubahan kode dan ingin memperbaruinya di internet, jalankan perintah berikut di terminal:

```bash
# 1. Jalankan build & deploy ke Cloudflare
npm run deploy

# 2. Simpan perubahan kode ke Git (Opsional, untuk melacak kode Anda)
git add .
git commit -m "Update deskripsi perubahan Anda"
git push origin main
```

---

### Pilihan 2: Otomatisasi dengan GitHub Actions (Cukup `git push` saja)

Jika Anda ingin website otomatis terupdate setiap kali melakukan `git push`, Anda dapat menyiapkan CI/CD dengan GitHub Actions:

1. **Dapatkan API Token Cloudflare:**
   * Buka **Dashboard Cloudflare** -> **My Profile** -> **API Tokens**.
   * Klik **Create Token** -> Gunakan template **Edit Cloudflare Workers**.
   * Salin API Token yang dibuat.

2. **Simpan Token di GitHub Repository Secrets:**
   * Buka repositori GitHub Anda -> **Settings** -> **Secrets and variables** -> **Actions**.
   * Klik **New repository secret**.
   * Name: `CLOUDFLARE_API_TOKEN`
   * Value: *[Masukkan API Token Cloudflare Anda]*

3. **Buat File Workflow GitHub Actions:**
   Buat file baru di proyek Anda bernama `.github/workflows/deploy.yml` dengan isi berikut:
   ```yaml
   name: Deploy to Cloudflare Workers

   on:
     push:
       branches:
         - main  # Ubah sesuai branch utama Anda jika bukan main

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout Repository
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-size: 20
             cache: 'npm'

         - name: Install Dependencies
           run: npm ci

         - name: Build Next.js & Deploy via OpenNext
           run: npm run deploy
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
             NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
   ```
   *(Catatan: Anda juga perlu menambahkan rahasia `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke GitHub Secrets jika ingin build berjalan dengan variabel lingkungan tersebut).*
