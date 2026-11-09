# Backend Engine — FTTH & HFC Isolation Forest Anomaly Detection
PT. Anugerah Terang Persada

## Arsitektur & Spesifikasi
- **Framework**: FastAPI (Python 3.10+)
- **ML Algorithm**: Scikit-Learn `IsolationForest`
- **Data Preprocessing**: Pandas & NumPy
- **Fitur Model**:
  - `recording_duration_mins`: Durasi pengerjaan lapangan (FINISH - START).
  - `start_hour`: Jam kedatangan teknisi di lokasi.
  - `finish_hour`: Jam penyelesaian tiket.
  - `sch_to_start_hours`: Deviasi waktu dari jadwal ke waktu mulai.
  - `tech_daily_frequency`: Beban volume harian teknisi.
  - `report_to_close_mins`: Rentang waktu pelaporan hingga penutupan tiket.
- **Perlindungan Data Pelanggan**:
  - Nama Pelanggan, Alamat, CUST_ACCT, dan Nomor Telepon **TIDAK PERNAH** dimasukkan ke dalam fitur komputasi Machine Learning.

## Cara Menjalankan Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat virtual environment (opsional tetapi disarankan):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan server FastAPI:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
5. Akses dokumentasi interaktif Swagger di:
   `http://localhost:8000/docs`

## Endpoint API
- `GET /api/health`: Status diagnostik kesehatan server dan engine Python.
- `GET /api/model/info`: Metadata konfigurasi model dan skema fitur.
- `POST /api/ml/predict`: Menjalankan evaluasi Isolation Forest Scikit-Learn pada data WO batch.
