# PANDUAN PENGGUNAAN SISTEM PANTAUAN KESELAMATAN & KESIHATAN PASTI KUALA LANGAT

Sistem Pantauan Keselamatan & Kesihatan PASTI Kuala Langat adalah sebuah aplikasi pengurusan digital yang direka khusus untuk memantau status keselamatan kebakaran dan kemudahan kecemasan di semua cawangan PASTI di daerah Kuala Langat. 

Sistem ini membantu memastikan semua standard keselamatan (pintu kecemasan, lampu kecemasan, lampu "EXIT", dan tarikh luput pemadam api) dipatuhi demi keselamatan murid-murid dan warga PASTI.

---

## 📌 RINGKASAN CIRI & STATUS AKSES

Sistem ini mempunyai dua mod capaian utama:

| Mod Capaian | Pengguna Sasaran | Ciri-ciri Utama |
| :--- | :--- | :--- |
| **Akses Awam (Mod Awam)** | Guru Besar / Guru PASTI | 1. Melapor status keselamatan bulanan cawangan.<br>2. Mengemas kini maklumat hubungan & nama Guru Besar cawangan.<br>3. Semak status laporan & maklum balas cawangan.<br>4. Memantau baki tempoh sah pemadam api. |
| **Akses Pentadbir (Admin)** | Penyelia PASTI Daerah / Urus Setia | 1. Log masuk selamat (Google Auth).<br>2. Paparan Dashboard Statistik Keselamatan keseluruhan daerah.<br>3. Menjana/mengemas kini status kelulusan & tindakan keselamatan.<br>4. Pengurusan Senarai Cawangan PASTI (PastiManager).<br>5. Pemantauan visual tarikh luput pemadam api.<br>6. Simulasi notifikasi sistem ke Bot Telegram.<br>7. Pengurusan Arkib Data (Data Management). |

---

## 1. PANDUAN AKSES AWAM (GURU BESAR / GURU PASTI)

Mod Awam direka seringkas mungkin supaya setiap guru atau kakitangan PASTI boleh menghantar maklum balas keselamatan tanpa perlu mendaftar akaun berasingan.

### A. Cara Menghantar Borang Maklum Balas Keselamatan
1. **Pilih Cawangan**: Buka tab **Borang Maklum Balas** daripada menu sebelah kiri. Pilih cawangan PASTI anda daripada senarai juntai bawah (*dropdown*).
2. **Kemaskini Maklumat Guru**: Masukkan nama **Guru Besar** semasa dan **Nombor Telefon** yang boleh dihubungi. (Sistem akan mengemas kini rekod cawangan secara automatik apabila borang dihantar).
3. **Status Kelengkapan Keselamatan**:
   - Nyatakan sama ada **Pintu Kecemasan** berfungsi dengan baik dan bebas daripada halangan.
   - Nyatakan status **Lampu Tanda KELUAR (EXIT)** berfungsi atau tidak.
   - Nyatakan status **Lampu Kecemasan** berfungsi atau tidak.
4. **Maklumat Pemadam Api**:
   - Masukkan tarikh luput pemadam api utama di premis anda menggunakan pemilih kalendar.
   - Jika mempunyai lebih daripada satu pemadam api, klik butang **"Tambah Pemadam Api"** untuk merekodkan pemadam api tambahan berserta tarikh luput masing-masing.
5. **Hantar**: Klik butang **"Hantar Laporan Keselamatan"**.
6. **Simulasi Bot**: Sebaik sahaja borang dihantar, sistem akan menghantar satu simulasi isyarat notifikasi keselamatan (Telegram). Anda boleh menyemak ini di tab **Simulasi Bot Telegram**.

### B. Cara Menyemak Status Laporan (Rekod Awam)
1. Pergi ke tab **📋 Rekod Laporan (Awam)**.
2. Gunakan bar carian (*Search*) untuk menapis mengikut nama PASTI anda.
3. Anda akan melihat kad ringkasan status keselamatan cawangan anda:
   - Penanda hijau untuk kelengkapan yang lengkap/berfungsi (Pintu Kecemasan, Lampu Keluar, Lampu Kecemasan).
   - Penanda merah atau amaran jika terdapat kelengkapan yang tiada atau rosak.
   - **Status Notifikasi Bot Telegram**: Menunjukkan sama ada maklumat kecemasan cawangan anda telah berjaya diproses dan disalurkan ke saluran Telegram daerah.

---

## 2. PANDUAN AKSES PENTADBIR (ADMIN)

Untuk memasuki Mod Pentadbir, anda perlu log masuk menggunakan akaun Google yang sah. Pentadbir utama sistem adalah pemilik e-mel: `muhaiminzeeismail@gmail.com`.

### A. Cara Log Masuk Admin
1. Klik butang **"Admin Login"** di bahagian paling bawah menu sebelah kiri.
2. Satu tetingkap pop-up Google akan muncul. Pilih akaun Google anda untuk mendaftar masuk.
3. Setelah berjaya, menu sebelah kiri akan berkembang untuk memaparkan tab kawalan eksklusif pentadbir: **Dashboard**, **Pengurusan Kontak PASTI**, **Data Management**, dan **Kalendar & Pemadam Api**.

### B. Penggunaan Dashboard Pentadbir
Dashboard memberi gambaran makro mengenai tahap keselamatan seluruh PASTI di Kuala Langat.
* **Kad Ringkasan (Stats)**:
  - **Jumlah Rekod**: Jumlah keseluruhan laporan yang dihantar oleh semua cawangan.
  - **PASTI Berdaftar**: Bilangan cawangan PASTI yang wujud dalam pangkalan data.
  - **Status Baik**: Cawangan yang melaporkan semua standard keselamatan (pintu kecemasan, lampu exits, dll.) berada dalam keadaan lengkap dan baik.
  - **Amaran / Pending**: Cawangan yang mempunyai kelengkapan keselamatan yang rosak/tidak lengkap atau pemadam api yang sudah luput.
* **Tindakan Laporan**:
  - Di senarai laporan, pentadbir boleh mengklik suis/toggle secara terus untuk mengemas kini status kelengkapan premis sekiranya audit fizikal telah dilakukan.
  - Klik butang **Padam** (ikon tong sampah) untuk membuang laporan yang bertindan atau tidak sah.

### C. Pengurusan Cawangan PASTI (PastiManager)
Menu ini membolehkan pentadbir menambah, memadam atau mengemas kini senarai cawangan rasmi PASTI di Kuala Langat.
1. **Tambah Cawangan Baru**: Masukkan nama cawangan (contoh: *PASTI Al-Hidayah*), nama Guru Besar, dan nombor telefon.
2. **Kemas kini**: Edit butiran cawangan sedia ada sekiranya berlaku pertukaran Guru Besar atau nombor telefon rasmi.
3. **Padam**: Padam cawangan daripada pangkalan data jika cawangan ditutup atau digabungkan.

### D. Pemantauan Pemadam Api (Extinguisher Monitor)
Ciri ini memaparkan laporan tarikh luput pemadam api di semua cawangan secara grafik:
* **Status Sah (Selamat - Hijau)**: Pemadam api yang tempoh sahnya masih panjang.
* **Akan Tamat Tempoh (Kuning)**: Pemadam api yang akan luput dalam masa 30 hari lagi (memerlukan tindakan segera untuk diselenggara semula).
* **Tamat Tempoh (Bahaya - Merah)**: Pemadam api yang telah melebihi tarikh luput. Cawangan ini akan ditandakan dengan amaran kecemasan kritikal.

### E. Urus Data & Arkib (Admin Data Management)
Menu kawalan teknikal dan log keselamatan:
1. **Notifikasi Sistem (Inbox)**: Memaparkan log masa nyata (*real-time logs*) aktiviti penghantaran, kemas kini status keselamatan cawangan, serta rekod log masuk pemilik akaun.
2. **Utiliti Pangkalan Data (Database Utilities)**:
   - **Reset Submissions**: Padam semua rekod laporan keselamatan bulanan untuk memulakan pusingan audit baharu (cth: bulan baharu).
   - **Populate Demo Branches**: Memasukkan senarai cawangan PASTI Kuala Langat secara pukal sebagai data ujian awal.

---

## 3. KAEDAH PENYELENGGARAAN & INTEGRASI

### API & Konfigurasi Firebase (Khusus untuk AppDeploy.ai atau Cloud Run)
Sistem ini disokong sepenuhnya oleh pangkalan data **Google Cloud Firestore** dan **Firebase Authentication**. 

Untuk beroperasi di platform penghosan luar seperti **AppDeploy.ai** dengan lancar, sistem telah dilengkapi dengan keupayaan dwi-pembacaan konfigurasi:
1. Pembacaan fail `firebase-applet-config.json` secara automatik.
2. Sokongan penuh pemboleh ubah persekitaran (*environment variables*) bertaraf klien (Vite Client Variables).

#### Senarai Pemboleh Ubah Persekitaran (.env):
Jika anda mahu menyambungkan sistem ini ke projek Firebase anda yang tersendiri, sila isikan pemboleh ubah berikut di dalam fail `.env` atau panel konfigurasi AppDeploy.ai:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_DATABASE_ID=(optional_for_multiple_databases)
```

Sistem akan mengesan pemboleh ubah di atas secara automatik melalui modular `src/firebase.ts` dan beralih ke projek Firebase pilihan anda tanpa memerlukan sebarang perubahan kod.
