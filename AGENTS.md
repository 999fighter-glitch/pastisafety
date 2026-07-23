# Arahan & Panduan Pembangunan (Untuk AI Agent)

Dokumen ini mengandungi panduan khusus mengenai struktur binaan (build system), penyelesaian konflik Vite/React, serta perintah pelaksanaan (commands) yang diperlukan untuk menjalankan dan membina aplikasi ini bagi deployment lancar ke **AppDeploy.ai** atau platform Docker/Cloud Run kontena.

---

## 1. STRUKTUR & KEPENDUDUKAN PEMBINAAN (BUILD SYSTEM)

Aplikasi ini menggunakan seni bina **Full-Stack (Vite + Express)** dengan TypeScript.
- **Frontend**: SPA berasaskan React + Vite + Tailwind CSS.
- **Backend (Server)**: Express (`server.ts`) yang bertindak sebagai API server sekaligus menghidangkan aset statik frontend dalam persekitaran produksi.

### Isu Utama & Resolusi Konflik Persekitaran (ESM vs CommonJS)
Persekitaran runtime Node.js mengehadkan penggunaan pemboleh ubah CommonJS seperti `__dirname` dan `__filename` dalam fail berspesifikasi ES Modules (ESM). Bagi menyelesaikan isu kompilasi dan konflik laluan antara Vite, React, dan Express semasa proses *build*:

1. **Vite Config (`vite.config.ts`)**:
   Laluan diselesaikan menggunakan `fileURLToPath` dari modul `'url'` untuk menjana `__dirname` secara manual dalam format ESM sebelum dihantar ke konfigurasi alias:
   ```typescript
   import { fileURLToPath } from 'url';
   import path from 'path';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

2. **Kompilasi Pelayan (`server.ts`)**:
   Backend dikompilasi menggunakan bundler seperti `esbuild` menjadi fail tunggal CommonJS (`dist/server.cjs`) sebelum dijalankan di pelayan produksi. Ini mengelakkan sebarang isu resolusi modul luaran yang tidak serasi.

---

## 2. SKRIPT & PERINTAH UTAMA (`package.json`)

Setiap AI Agent hendaklah mengekalkan skrip pembinaan standard berikut bagi memastikan kelancaran binaan automatik di AppDeploy.ai:

- **Membangunkan Aplikasi (Build)**:
  ```bash
  npm run build
  ```
  *Nota: Membina kod frontend ke dalam direktori `dist/` dan membundel `server.ts` kepada `dist/server.cjs` menggunakan esbuild.*

- **Melakukan Semakan Ralat (Linter)**:
  ```bash
  npm run lint
  ```
  *Nota: Melakukan pemeriksaan statik TypeScript bagi mengelakkan ralat kompilasi sebelum kod dihantar ke pelayan.*

- **Menjalankan Pelayan Produksi (Start)**:
  ```bash
  npm run start
  ```
  *Nota: Memulakan pelayan dari fail bundel pengeluaran `node dist/server.cjs`.*

---

## 3. KAEDAH INTEGRASI FIREBASE & PEMBOLEH UBAH PERSEKITARAN (`.env`)

Pangkalan data disokong oleh Firebase. Untuk mengelakkan ralat muatan semasa peralihan pelayan:
- Gunakan nilai dinamik dari `(import.meta as any).env` dalam kod klien (`src/firebase.ts`) dengan sandaran automatik ke fail `firebase-applet-config.json` sekiranya pemboleh ubah `.env` tidak dikesan:
  ```typescript
  const metaEnv = (import.meta as any).env || {};
  const config = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
    ...
  };
  ```

Sila pastikan pemboleh ubah persekitaran `.env` berikut diisytiharkan dalam platform AppDeploy.ai sekiranya ingin menukar ke projek Firebase peribadi:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
