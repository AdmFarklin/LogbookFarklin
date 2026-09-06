# Logbook Apoteker Farmasi Klinis

Aplikasi web untuk mencatat asesmen pasien harian oleh apoteker klinis dan memonitor
lama penggunaan antibiotik pasien. Backend memakai **Supabase** (Postgres + Auth + Row
Level Security), frontend memakai **React + Vite**, dan hosting statis memakai
**GitHub Pages** (deploy otomatis lewat GitHub Actions).

## Ringkasan fitur (tahap 1)

- Login apoteker/admin (Supabase Auth)
- Semua apoteker bisa **melihat** logbook satu sama lain
- Setiap apoteker hanya bisa **mengubah/menghapus** catatan miliknya sendiri (admin bisa mengubah/menghapus semua, untuk koreksi)
- Form asesmen pasien harian: ruangan (otomatis menunjukkan level asesmen 1/2/3), nama pasien, diagnosa/DPJP/terapi, riwayat alergi, riwayat obat, DRP terkonfirmasi, feedback/usul, status (asesmen baru/ulang/pulang/konfirmasi)
- Monitoring antibiotik: nama pasien, nama antibiotik (input bebas), tanggal mulai → sistem otomatis menghitung **hari ke berapa** dan menandai **butuh review** pada hari ke-5, 7, 10, dan 14, serta menandai **evaluasi lanjutan** jika sudah lewat hari ke-14
- Halaman Admin (placeholder) — disiapkan untuk fitur tarik laporan harian/mingguan/bulanan yang **hanya bisa diakses admin**, menyusul di tahap berikutnya

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql).
   File ini membuat semua tabel, kebijakan keamanan (RLS), dan mengisi daftar ruangan awal.
3. Buka **Authentication > Users > Invite user**, undang setiap apoteker dan admin
   dengan email masing-masing. Baris di tabel `profiles` akan otomatis terbuat.
4. (Opsional) Perbarui `full_name` di tabel `profiles` supaya nama tampil rapi di aplikasi.
5. Jadikan satu atau lebih user sebagai admin lewat SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = 'UUID-USER-INI';
   ```
   UUID bisa dilihat di **Authentication > Users**.
6. Catat dua nilai ini dari **Project Settings > API**:
   - `Project URL` → jadi `VITE_SUPABASE_URL`
   - `anon public` key → jadi `VITE_SUPABASE_ANON_KEY`

   Kunci `anon` ini memang akan ikut terekspos di kode frontend — ini normal dan aman
   untuk Supabase **selama Row Level Security aktif dengan benar** (sudah diatur di
   `schema.sql`). Jangan pernah memakai `service_role` key di frontend.

## 2. Jalankan di komputer lokal (opsional, untuk development)

```bash
npm install
cp .env.example .env
# isi .env dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY Anda
npm run dev
```

## 3. Deploy ke GitHub Pages

1. Buat repository baru di GitHub, push seluruh folder ini ke branch `main`.
2. Ubah `base` di [`vite.config.js`](./vite.config.js) sesuai nama repository Anda,
   misalnya jika nama repo adalah `logbook-farmasi-klinis`:
   ```js
   base: '/logbook-farmasi-klinis/',
   ```
3. Di GitHub, buka **Settings > Secrets and variables > Actions > New repository secret**,
   tambahkan dua secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Buka **Settings > Pages**, pada bagian **Source** pilih **GitHub Actions**.
5. Push ke branch `main` — workflow di `.github/workflows/deploy.yml` akan otomatis
   build dan deploy. Setelah selesai, aplikasi bisa diakses di
   `https://<username-anda>.github.io/<nama-repo>/`.

## Struktur folder

```
supabase/schema.sql       -> skema database & RLS (jalankan di Supabase SQL Editor)
.github/workflows/deploy.yml -> pipeline build + deploy ke GitHub Pages
src/supabaseClient.js     -> koneksi ke Supabase
src/context/AuthContext.jsx -> status login & profil pengguna
src/pages/                -> halaman: Login, Dashboard, Assessments, Antibiotics, Admin
src/lib/antibiotic.js     -> logika hitung hari ke- & status review antibiotik
```

## Rencana lanjutan (belum dibangun)

- Fitur admin untuk menarik & mengekspor rekap laporan harian/mingguan/bulanan
- Modul PIO (Pelayanan Informasi Obat) dan MESO (Monitoring Efek Samping Obat), sesuai JUKNIS
- Halaman untuk admin mengelola daftar ruangan tanpa harus lewat SQL
