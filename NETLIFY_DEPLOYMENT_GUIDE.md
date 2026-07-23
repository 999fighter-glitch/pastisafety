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

## 💡 SEBAB MENGAPA ANDA TIDAK BOLEH TAMBAH DOMAIN DI PROJECT `sustained-sandbox-w5xj8`

Projek **`sustained-sandbox-w5xj8`** adalah **Projek Sandbox Terurus Khas AI Studio** yang dijana secara automatik oleh platform pembangunan ini untuk persekitaran preview secara percuma. 

Sebab anda tidak dapat menambah Authorized Domain pada projek ini dalam Firebase Console:
1. **Hak Milik / Ownership**: Projek sandbox ini dimiliki dan diuruskan oleh sistem persekitaran Google AI Studio, bukannya di bawah akaun Google/Firebase peribadi anda (`muhaiminzeeismail@gmail.com`).
2. **Kebenaran IAM**: Akses Firebase Console akaun peribadi anda tidak mempunyai peranan *Owner* atau *Admin* untuk mengubah suai tetapan keselamatan projek sandbox platform ini.

---

## 🛠️ PENYELESAIAN LENGKAP: Gunakan Projek Firebase Peribadi Anda Sendiri (Percuma)

Untuk hosting berterusan di Netlify dengan sokongan penuh **Google Login** dan **Firestore Database**, sila buat projek Firebase percuma di bawah akaun Gmail anda sendiri:

### Langkah 1: Cipta Projek Firebase Baharu
1. Layari **[Firebase Console](https://console.firebase.google.com/)** dan log masuk dengan akaun Gmail anda.
2. Klik **Add project** (Tambah projek) dan beri nama (contoh: `pasti-kuala-langat-db`).
3. Klik **Continue** sehingga projek selesai dicipta.

### Langkah 2: Aktifkan Firebase Authentication & Firestore
1. **Authentication**:
   * Di Firebase Console, pergi ke **Build > Authentication** > Klik **Get started**.
   * Di tab **Sign-in method**, pilih **Google** > Klik **Enable**.
   * Pilih e-mel sokongan anda dan klik **Save**.
   * Pergi ke tab **Settings > Authorized domains** > Klik **Add domain** > Masukkan domain Netlify anda (contoh: `pasti-kuala-langat-system.netlify.app`).
2. **Firestore Database**:
   * Pergi ke **Build > Firestore Database** > Klik **Create database**.
   * Pilih lokasi (contoh: `asia-southeast1` atau `us-central`).
   * Pilih **Start in test mode** atau muat naik fail `firestore.rules` dari projek ini.

### Langkah 3: Dapatkan Firebase Config & Masukkan ke Netlify Environment Variables
1. Di Firebase Console, pergi ke **Project Settings** (ikon gear ⚙️ di sebelah kiri atas) > **General**.
2. Scroll ke bawah ke bahagian *Your apps* > Klik ikon Web (`</>`).
3. Daftar nama aplikasi (contoh: `Web App Netlify`) dan salin nilai config:
   * `apiKey`
   * `authDomain`
   * `projectId`
   * `storageBucket`
   * `messagingSenderId`
   * `appId`
4. Buka **Netlify Dashboard > Site Settings > Environment Variables** dan kemaskini kunci berikut dengan nilai dari projek Firebase peribadi anda:
   * `VITE_FIREBASE_API_KEY`
   * `VITE_FIREBASE_AUTH_DOMAIN`
   * `VITE_FIREBASE_PROJECT_ID`
   * `VITE_FIREBASE_STORAGE_BUCKET`
   * `VITE_FIREBASE_MESSAGING_SENDER_ID`
   * `VITE_FIREBASE_APP_ID`
   * `VITE_FIREBASE_DATABASE_ID` = `(default)`

5. Klik **Re-deploy site** di Netlify. Kini Google Login dan Firebase Firestore akan berfungsi 100% sempurna di domain Netlify anda!

---

## 📦 CARA PINDAHKAN (MIGRATE) DATA DARI SANDBOX KE PROJEK FIREBASE BAHARU

### Adakah Data Pangkalan Data Disalin Secara Automatik?
**Jawapan: TIDAK.** Apabila anda mencipta projek Firebase baharu di bawah akaun Google anda sendiri, pangkalan data Firestore projek baharu itu bermula secara **kosong** (sifar rekod).

### 🚀 Cara Pindahkan Data Menggunakan Panel Admin Sistem (1-Klik):

Sistem ini telah dilengkapi dengan **Migration Suite (Alat Pindahan Data)** yang dibina khas di dalam **Admin Data Panel**:

#### **Langkah A: Eksport Data dari Persekitaran Sandbox**
1. Dalam aplikasi web ini, log masuk sebagai Admin/Owner (`muhaiminzeeismail@gmail.com`).
2. Pergi ke tab **Data Management (Admin)**.
3. Di bahagian **🔄 Pindahan & Salinan Pangkalan Data (Migration Suite)**, klik **"Eksport Backup JSON"**.
4. Sistem akan memuat turun fail `PASTI_Kuala_Langat_Firestore_Backup.json` yang mengandungi semua rekod cawangan PASTI, laporan keselamatan, dan statistik.

#### **Langkah B: Import Data ke Projek Firebase Baharu Anda (di Netlify)**
1. Selepas anda memasukkan Environment Variables Firebase baharu di Netlify dan laman web Netlify telah siap *Deploy*:
2. Buka URL Netlify anda di pelayar web.
3. Log masuk ke Admin Panel di laman Netlify anda.
4. Pergi ke **Data Management (Admin)**.
5. Klik butang **"Muat Naik & Pulih JSON"** dan pilih fail `PASTI_Kuala_Langat_Firestore_Backup.json` yang telah anda muat turun tadi.
6. **Selesai!** Semua koleksi `pastis`, `siteStats`, dan laporan akan dipulihkan serta-merta ke pangkalan data Firebase baharu anda.

> 💡 **Nota Tambahan (Auto-Seed 12 PASTI):**
> Jika anda tidak mahu memuat naik backup JSON dan ingin terus membina pangkalan data bersih untuk 12 cawangan PASTI Kuala Langat, anda hanya perlu klik butang **"Auto-Seed 12 PASTI"** di Admin Panel. Sistem akan menjana senarai 12 cawangan PASTI beserta kaunter statistik secara automatik!

---

## ⚡ Ciri-ciri Keselamatan & Integrasi
* **Firebase Firestore**: Kekal digunakan secara terus sebagai pangkalan data utama.
* **Server-Side Telegram Integration**: Mesej dihantar melalui Netlify Serverless Function `/api/send-telegram` tanpa mendedahkan Bot Token di pelayar.
* **Bot Config Panel**: Anda juga boleh menukar Bot Token & Chat ID secara terus dalam aplikasi di tab **Simulasi Bot Telegram** yang disimpan ke pangkalan data Firebase secara fleksibel.
