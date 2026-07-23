# Panduan Lengkap Deployment ke Netlify, GitHub & Firebase

Panduan langkah demi langkah untuk menghantar kod ke **GitHub**, mendeploy aplikasi ke **Netlify**, mengekalkan **Firebase Firestore**, serta memastikan bot **Telegram** berfungsi menerusi fungsi Server-Side (Netlify Serverless Functions).

---

## 🔑 Di Mana Nak Letak Rahsia / Secret Values (Pembolehubah Persekitaran)

Untuk mengelakkan ralat keselamatan dan kebocoran token di client browser, pembolehubah persekitaran dibahagikan kepada 2 jenis di **Netlify**:

### 1. **Client-Side Variables (Tersedia untuk Frontend React)**
Simpan nilai ini dalam **Netlify Site Settings > Environment Variables** (atau `.env` tempatan):
* `VITE_FIREBASE_API_KEY` = `AIzaSyCPxMzfNbRDyROU0VKjVTOu9r5rX2VC5RA`
* `VITE_FIREBASE_AUTH_DOMAIN` = `sustained-sandbox-w5xj8.firebaseapp.com`
* `VITE_FIREBASE_PROJECT_ID` = `sustained-sandbox-w5xj8`
* `VITE_FIREBASE_STORAGE_BUCKET` = `sustained-sandbox-w5xj8.firebasestorage.app`
* `VITE_FIREBASE_MESSAGING_SENDER_ID` = `144890475919`
* `VITE_FIREBASE_APP_ID` = `1:144890475919:web:543357ce2343892fe447fa`
* `VITE_FIREBASE_DATABASE_ID` = `ai-studio-8f3dbb41-3cc2-4a80-9f09-efcd98f45929`

> ⚠️ **PENTING:** Pembolehubah berawalan `VITE_` akan dimasukkan dalam bundel JavaScript yang boleh dibaca oleh pelayar web (selamat untuk Firebase Public Key jika Security Rules Firestore sudah dikonfigurasi).

---

### 2. **Server-Side Secret Variables (HANYA untuk Netlify Serverless Backend)**
Simpan nilai berahsia ini di **Netlify Environment Variables**:
* `TELEGRAM_BOT_TOKEN` = *(Token bot Telegram anda daripada @BotFather, contoh: `7890123456:AAEx...`)*
* `TELEGRAM_CHAT_ID` = *(Chat ID atau Group ID anda, contoh: `-100123456789`)*

> 🔒 **KESELAMATAN:** Token Telegram ini **TIDAK AKAN BISA DILIHAT** oleh pengguna pelayar web biasa. Netlify Serverless Function (`/api/send-telegram`) akan membaca token ini di bahagian pelayan secara selamat.

---

## 🛠️ LANGKAH 1: Muat Naik & Simpan Kod ke GitHub

1. Buat repository baharu di **GitHub** (contoh: `pasti-kuala-langat-system`).
2. Jalankan perintah git berikut di terminal projek tempatan anda:

```bash
git init
git add .
git commit -m "Binaan sedia Netlify + Telegram Bot Serverless + Firebase"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/pasti-kuala-langat-system.git
git push -u origin main
```

---

## 🚀 LANGKAH 2: Deploy ke Netlify

1. Log masuk ke akaun **[Netlify](https://app.netlify.com)**.
2. Klik **Add new site** > **Import an existing project**.
3. Pilih **GitHub** dan berikan kebenaran untuk memilih repository `pasti-kuala-langat-system`.
4. Konfigurasi Tetapan Build:
   * **Build Command:** `npm run build`
   * **Publish Directory:** `dist`
   * **Functions Directory:** `netlify/functions`
5. Buka tab **Site configuration > Environment variables**, dan masukkan semua pembolehubah di atas (`VITE_FIREBASE_*`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
6. Klik **Deploy Site**. Netlify akan membina aplikasi frontend React dan fungsi serverless Telegram secara automatik!

---

## ⚡ Ciri-ciri Keselamatan & Integrasi
* **Firebase Firestore**: Kekal digunakan secara terus sebagai pangkalan data utama.
* **Server-Side Telegram Integration**: Mesej dihantar melalui Netlify Serverless Function `/api/send-telegram` tanpa mendedahkan Bot Token di pelayar.
* **Bot Config Panel**: Anda juga boleh menukar Bot Token & Chat ID secara terus dalam aplikasi di tab **Simulasi Bot Telegram** yang disimpan ke pangkalan data Firebase secara fleksibel.
