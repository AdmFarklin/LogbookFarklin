-- =====================================================================
-- LOGBOOK APOTEKER FARMASI KLINIS — Skema Supabase
-- Jalankan file ini sekali di Supabase Dashboard > SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fungsi pembantu: auto-update kolom updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. PROFILES — data apoteker/admin, extend auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'apoteker' check (role in ('apoteker', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Buat baris profile otomatis setiap ada user baru daftar/di-invite
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. WARDS — daftar ruangan + level asesmen (sesuai JUKNIS)
-- ---------------------------------------------------------------------
create table public.wards (
  id bigint generated always as identity primary key,
  name text not null unique,
  level smallint not null check (level in (1, 2, 3))
);

alter table public.wards enable row level security;

create policy "wards_select_all_authenticated"
  on public.wards for select
  to authenticated
  using (true);

create policy "wards_admin_write"
  on public.wards for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.wards (name, level) values
  ('Cendrawasih', 1),
  ('Perinatologi', 1),
  ('Tiung - Asesmen Awal', 1),
  ('Enggang 3 - Asesmen Awal', 1),
  ('Elang', 2),
  ('Punai 3', 2),
  ('Enggang 2', 2),
  ('VIP', 2),
  ('Nuri', 2),
  ('Isolasi Punai', 2),
  ('Murai', 2),
  ('Enggang 3 - Asesmen Lanjutan (Belum Pulang)', 2),
  ('Tiung - Asesmen Lanjutan (Belum Pulang)', 2),
  ('ICU', 3),
  ('ICCU', 3),
  ('PICU', 3),
  ('NICU', 3),
  ('HCU', 3),
  ('Intermediate Cendrawasih', 3);

-- ---------------------------------------------------------------------
-- 3. ASSESSMENTS — catatan asesmen harian pasien
-- ---------------------------------------------------------------------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  pharmacist_id uuid not null references public.profiles (id),
  ward_id bigint not null references public.wards (id),
  nama_pasien text not null,
  catatan_klinis text,        -- diagnosa, DPJP, terapi terkini (freeform, seperti kolom asli)
  riwayat_alergi text,
  riwayat_obat text,
  drp_terkonfirmasi text,
  feedback_usul text,
  status text not null check (status in ('Asesmen Baru', 'Asesmen Ulang', 'Pulang', 'Konfirmasi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assessments_tanggal_idx on public.assessments (tanggal desc);
create index assessments_pharmacist_idx on public.assessments (pharmacist_id);

alter table public.assessments enable row level security;

-- Semua apoteker & admin bisa melihat logbook satu sama lain
create policy "assessments_select_all_authenticated"
  on public.assessments for select
  to authenticated
  using (true);

-- Hanya bisa menambah catatan atas nama diri sendiri
create policy "assessments_insert_own"
  on public.assessments for insert
  to authenticated
  with check (pharmacist_id = auth.uid());

-- Ubah/hapus: pemilik catatan atau admin
create policy "assessments_update_own_or_admin"
  on public.assessments for update
  to authenticated
  using (
    pharmacist_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "assessments_delete_own_or_admin"
  on public.assessments for delete
  to authenticated
  using (
    pharmacist_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create trigger set_assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. ANTIBIOTIC_MONITORING — pemantauan lama penggunaan antibiotik
-- ---------------------------------------------------------------------
create table public.antibiotic_monitoring (
  id uuid primary key default gen_random_uuid(),
  nama_pasien text not null,
  ward_id bigint references public.wards (id),
  nama_antibiotik text not null,
  tanggal_mulai date not null,
  catatan text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index antibiotic_active_idx on public.antibiotic_monitoring (is_active, tanggal_mulai);

alter table public.antibiotic_monitoring enable row level security;

create policy "antibiotic_select_all_authenticated"
  on public.antibiotic_monitoring for select
  to authenticated
  using (true);

create policy "antibiotic_insert_own"
  on public.antibiotic_monitoring for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "antibiotic_update_own_or_admin"
  on public.antibiotic_monitoring for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "antibiotic_delete_own_or_admin"
  on public.antibiotic_monitoring for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create trigger set_antibiotic_updated_at
  before update on public.antibiotic_monitoring
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Catatan setelah menjalankan schema ini:
-- 1. Undang pengguna lewat Supabase Dashboard > Authentication > Users > Invite.
--    Baris di tabel `profiles` akan terbuat otomatis lewat trigger di atas.
-- 2. Jadikan salah satu user sebagai admin, contoh:
--      update public.profiles set role = 'admin' where id = 'UUID-USER-TERSEBUT';
-- 3. (Opsional) perbarui full_name di tabel profiles jika perlu.
-- =====================================================================
