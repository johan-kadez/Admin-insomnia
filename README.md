# STORE ADMIN

Panel admin untuk mengelola toko.

## Isi
- `index.html` — login + panel
- `style.css` — tampilan admin
- `admin.js` — authentication, dashboard, produk, order
- `firebase-config.js` — konfigurasi Firebase

## Login
Admin menggunakan Firebase Authentication (Email/Password).

Jangan menaruh password admin di JavaScript.

## Admin UID
Firestore Rules menentukan siapa yang boleh menjadi admin berdasarkan UID Firebase Authentication.

Pada file `firebase/firestore.rules`, ganti:

`REPLACE_WITH_ADMIN_UID`

dengan UID akun admin Firebase.

## Firebase
Gunakan Firebase project yang SAMA dengan Store.

Isi `firebase-config.js` dengan config Web Firebase:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

Jangan pernah memasukkan service-account JSON ke repository frontend.

## Deploy GitHub + Vercel
1. Buat repository GitHub bernama `store-admin`.
2. Upload semua file di folder ini ke root repository.
3. Import repository tersebut ke Vercel.
4. Deploy sebagai website Admin.

Contoh:
`https://store-admin.vercel.app`

## Catatan
Keamanan sebenarnya berada di Firebase Authentication + Firestore Security Rules, bukan karena URL admin disembunyikan.
