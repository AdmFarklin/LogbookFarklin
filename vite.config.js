import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PENTING: ganti '/logbook-apoteker/' dengan nama repository GitHub Anda,
// contoh jika repo bernama "logbook-farmasi-klinis" maka base menjadi
// '/logbook-farmasi-klinis/'. Ini wajib diisi benar agar aset (JS/CSS)
// termuat dengan benar saat dihosting di GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: '/LogbookFarklin/',
})
