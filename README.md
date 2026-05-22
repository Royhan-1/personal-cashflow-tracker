# CashFlow Tracker 💰

CashFlow Tracker adalah aplikasi web manajemen keuangan pribadi yang modern, responsif, dan kaya fitur. Dirancang untuk membantu Anda memantau dan merencanakan keuangan Anda dengan mudah. Aplikasi ini memiliki antarmuka yang sangat unik menggunakan gaya desain **Neobrutalism**, mendukung mode terang (*Light Mode*) dan mode gelap (*Inverted Dark Mode*). Seluruh data Anda disimpan secara aman di perangkat Anda sendiri (*Local Storage*), memastikan privasi data tanpa perlu login atau terhubung ke database eksternal.

## ✨ Fitur Utama

- **📊 Dashboard Interaktif**: Ringkasan lengkap mengenai saldo, sisa anggaran, dan tren cashflow dalam 6 bulan terakhir.
- **💸 Pencatatan Transaksi**: Catat pemasukan dan pengeluaran Anda dengan sistem kategorisasi yang intuitif.
- **🔄 Transaksi Berulang (Recurring)**: Atur transaksi yang terjadi secara rutin (harian, mingguan, bulanan, tahunan) agar ditambahkan ke sistem secara otomatis.
- **🎯 Manajemen Anggaran**: Tetapkan target anggaran per kategori setiap bulannya untuk mengontrol pengeluaran.
- **📈 Laporan & Analitik**: Analisis pengeluaran dan pemasukan Anda melalui grafik batang, *doughnut*, dan tren garis interaktif.
- **💱 Multi-Mata Uang**: Dukungan penuh untuk berbagai mata uang utama global (IDR, USD, EUR, GBP, JPY, dll), memungkinkan konversi nilai saat berganti mata uang utama.
- **📑 Ekspor PDF & Data**: Cetak laporan bulanan dalam format PDF yang rapi, serta fitur *Export/Import JSON* untuk melakukan *backup* mandiri.
- **🎨 Neobrutalism Design**: UI modern tanpa sudut melengkung, dengan *border* tegas, *shadow* tebal, dan *font* geometris (Space Grotesk) yang memastikan sistem tidak terlihat membosankan.

## 🛠️ Teknologi yang Digunakan

- **Framework**: Next.js (App Router) & React
- **Bahasa**: TypeScript
- **Styling**: Vanilla CSS (Sistem *Design Token* khusus Neobrutalism)
- **State Management**: React Context API & `localStorage`
- **Charts**: Chart.js & `react-chartjs-2`
- **Ekspor Dokumen**: `jspdf` & `jspdf-autotable`
- **Ikon**: `lucide-react`

## 🚀 Cara Menjalankan Secara Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan *development server***:
   ```bash
   npm run dev
   ```

3. **Mulai Menggunakan**: Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🔒 Privasi Data
CashFlow Tracker adalah aplikasi *offline-first*. Semua data yang Anda masukkan disimpan sepenuhnya di dalam peramban web (*browser*) Anda menggunakan `localStorage`. Sistem ini tidak mengirimkan data transaksi apapun ke *server*, menjadikannya 100% aman dan menjaga privasi pengguna.
