# Medic Frontend

Frontend untuk aplikasi manajemen data medis dengan enkripsi RC5 menggunakan HTML, CSS (Tailwind CDN), dan JavaScript vanilla.

## Fitur

- **Authentication**: Login dan registrasi pengguna
- **Data Medis CRUD**: Kelola data medis pasien (Create, Read, Update, Delete) dengan enkripsi RC5
- **RC5 Encryption**: Enkripsi/dekripsi otomatis untuk field sensitif
- **Search & Filter**: Pencarian dan filter data medis
- **Logout**: Fungsi logout yang aman

## RC5 Encryption

### Field yang Dienkripsi
- `nama` - Nama pasien
- `alamat` - Alamat pasien  
- `nomor_hp` - Nomor HP pasien
- `keluhan` - Keluhan pasien
- `diagnosa` - Diagnosa dokter
- `tindakan` - Tindakan medis
- `resep_obat` - Resep obat
- `dokter_penanggung_jawab` - Nama dokter

### Spesifikasi RC5
- **Word Size**: 32 bits
- **Rounds**: 12
- **Key**: "medic-secret-key-2025"
- **Block Size**: 64 bits
- **Padding**: PKCS7
- **Output**: Base64 encoded

## Struktur File

```
fe-medic/
├── index.html          # Halaman login
├── register.html       # Halaman registrasi
├── data-medis.html     # Halaman manajemen data medis (CRUD)
├── js/
│   ├── auth.js         # Utilities untuk authentication
│   ├── data-medis.js   # Logika untuk manajemen data medis
│   └── rc5.js          # Implementasi algoritma RC5
└── README.md          # Dokumentasi
```

## API Endpoints

Frontend ini terhubung ke API backend dengan endpoint berikut:

### Authentication
- `POST http://127.0.0.1:8000/api/login` - Login pengguna
- `POST http://127.0.0.1:8000/api/register` - Registrasi pengguna baru
- `POST http://127.0.0.1:8000/api/logout` - Logout pengguna (memerlukan autentikasi)

### Data Medis CRUD
- `GET http://127.0.0.1:8000/api/data-medis` - Ambil semua data medis
- `POST http://127.0.0.1:8000/api/data-medis` - Tambah data medis baru
- `GET http://127.0.0.1:8000/api/data-medis/{id}` - Ambil data medis berdasarkan ID
- `PUT http://127.0.0.1:8000/api/data-medis/{id}` - Update data medis
- `DELETE http://127.0.0.1:8000/api/data-medis/{id}` - Hapus data medis

## Cara Menjalankan

1. Pastikan backend API sudah berjalan di `http://127.0.0.1:8000`

2. Buka file `index.html` langsung di browser atau deploy ke web server

3. Akses aplikasi melalui browser:
   - Login: `index.html`
   - Register: `register.html`
   - Data Medis: `data-medis.html`

## Fitur Authentication

- **Token-based Authentication**: Menggunakan localStorage untuk menyimpan token JWT
- **Auto-redirect**: Otomatis redirect ke data medis jika sudah login, atau ke login jika belum
- **Error Handling**: Menampilkan pesan error yang jelas untuk berbagai skenario
- **Loading States**: Indikator loading pada tombol saat proses request
- **Session Management**: Otomatis logout jika token expired

## Teknologi yang Digunakan

- **HTML5**: Struktur halaman
- **Tailwind CSS**: Styling melalui CDN
- **JavaScript (Vanilla)**: Logika frontend dan API calls
- **Fetch API**: Untuk komunikasi dengan backend
- **localStorage**: Penyimpanan token dan data user

## Catatan

- Aplikasi ini menggunakan JavaScript vanilla tanpa framework
- Styling menggunakan Tailwind CSS melalui CDN
- Responsive design yang berfungsi baik di desktop dan mobile
- Error handling yang komprehensif untuk berbagai skenario

## Struktur Data

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register Request
```json
{
  "name": "John Doe",
  "email": "user@example.com", 
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Expected API Response Format

#### Login/Register Success
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

#### Data Medis Request (POST/PUT)
```json
{
  "nama": "John Doe",
  "nomor_riwayat": "RM003",
  "tanggal_lahir": "1992-02-02",
  "jenis_kelamin": "L",
  "alamat": "Jalan Merdeka No.3",
  "nomor_hp": "081212345678",
  "keluhan": "Sakit kepala",
  "diagnosa": "Migrain",
  "tindakan": "Pemeriksaan lanjutan",
  "resep_obat": "Paracetamol",
  "dokter_penanggung_jawab": "dr. Citra",
  "tanggal_periksa": "2025-07-18"
}
```

#### Data Medis Response (GET)
```json
{
  "data": [
    {
      "id": 1,
      "nama": "Pasien Dummy Satu",
      "nomor_riwayat": "RM003",
      "tanggal_lahir": "1992-02-02",
      "jenis_kelamin": "L",
      "alamat": "Jalan C No.3",
      "nomor_hp": "081212345678",
      "keluhan": "Sakit kepala",
      "diagnosa": "Migrain",
      "tindakan": "Pemeriksaan lanjutan",
      "resep_obat": "Paracetamol",
      "dokter_penanggung_jawab": "dr. Citra",
      "tanggal_periksa": "2025-07-18",
      "created_at": "2025-07-20T10:00:00Z",
      "updated_at": "2025-07-20T10:00:00Z"
    }
  ]
}
```
