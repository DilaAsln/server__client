# 🔐 Kriptografi Laboratuvarı – Çoklu Şifreleme Sistemi (Client–Server)

Bu proje, **istemci–sunucu mimarisi** ile çalışan; **metin** ve **dosya** üzerinde **şifreleme/deşifreleme** yapabilen bir kriptografi uygulamasıdır.  
Projede hem **klasik şifreler** (Caesar, Vigenère vb.) hem de **modern şifreler** (AES/DES) ve **asimetrik şifreleme** (RSA) birlikte kullanılmıştır.

---

## ✨ Özellikler

- ✅ Metin şifreleme / deşifreleme  
- ✅ Dosya şifreleme / deşifreleme  
  - `file_routes` + `file_crypto` + `file_algorithms`
- ✅ Çoklu algoritma desteği  
  - Tüm metin algoritmaları tek bir merkezden: `encryptor.py`
- ✅ AES / DES desteği  
  - Manuel (kütüphanesiz) sürüm  
  - Kütüphaneli sürüm
- ✅ RSA (PEM anahtar dosyaları)  
  - Byte düzeyinde RSA şifreleme/deşifreleme yardımcıları

---

## 🧩 Desteklenen Algoritmalar

### 🔸 Klasik Şifreler
- Caesar  
- Vigenere  
- Substitution  
- Affine  
- Rail Fence  
- Hill (2x2 matris anahtar)  
- Playfair  
- Columnar Transposition  
- Route Cipher  
- Polybius  
- Pigpen  

### 🔸 Modern Şifreler
- AES (manuel) → `aes_manual.py`  
- DES (manuel) → `des_manual.py`  
- AES (kütüphaneli) → `AES_lib.py`  
- DES (kütüphaneli) → `DES_lib.py`  

### 🔸 Asimetrik
- RSA → `rsa.py` + `src/rsa_keys/public.pem` & `src/rsa_keys/private.pem`

---

## 🏗️ Proje Yapısı

# 🔐 Kriptografi Laboratuvarı – Çoklu Şifreleme Sistemi (Client–Server)

Bu proje, **istemci–sunucu mimarisi** ile çalışan; **metin** ve **dosya** üzerinde **şifreleme/deşifreleme** yapabilen bir kriptografi uygulamasıdır.  
Projede hem **klasik şifreler** (Caesar, Vigenère vb.) hem de **modern şifreler** (AES/DES) ve **asimetrik şifreleme** (RSA) birlikte kullanılmıştır.

---

## ✨ Özellikler

- ✅ Metin şifreleme / deşifreleme  
- ✅ Dosya şifreleme / deşifreleme  
  - `file_routes` + `file_crypto` + `file_algorithms`
- ✅ Çoklu algoritma desteği  
  - Tüm metin algoritmaları tek bir merkezden: `encryptor.py`
- ✅ AES / DES desteği  
  - Manuel (kütüphanesiz) sürüm  
  - Kütüphaneli sürüm
- ✅ RSA (PEM anahtar dosyaları)  
  - Byte düzeyinde RSA şifreleme/deşifreleme yardımcıları

---

## 🧩 Desteklenen Algoritmalar

### 🔸 Klasik Şifreler
- Caesar  
- Vigenere  
- Substitution  
- Affine  
- Rail Fence  
- Hill (2x2 matris anahtar)  
- Playfair  
- Columnar Transposition  
- Route Cipher  
- Polybius  
- Pigpen  

### 🔸 Modern Şifreler
- AES (manuel) → `aes_manual.py`  
- DES (manuel) → `des_manual.py`  
- AES (kütüphaneli) → `AES_lib.py`  
- DES (kütüphaneli) → `DES_lib.py`  

### 🔸 Asimetrik
- RSA → `rsa.py` + `src/rsa_keys/public.pem` & `src/rsa_keys/private.pem`

---

## 🏗️ Proje Yapısı

server_client/
├── app.py                     # Sunucu uygulaması (ana giriş noktası)
├── routes/
│   └── file_routes.py         # Dosya şifreleme / deşifreleme endpointleri
│
├── src/
│   ├── encryptor.py           # Metin algoritmalarını yöneten merkez katman
│   ├── aes_manual.py          # AES manuel şifreleme / deşifreleme
│   ├── des_manual.py          # DES manuel şifreleme / deşifreleme
│   ├── AES_lib.py             # AES kütüphane tabanlı şifreleme
│   ├── DES_lib.py             # DES kütüphane tabanlı şifreleme
│   ├── rsa.py                 # RSA işlemleri
│   ├── rsa_keys/              # RSA public / private key dosyaları
│   ├── file_crypto.py         # Dosya şifreleme yardımcı fonksiyonları
│   └── file_algorithms/       # Dosya bazlı AES / DES algoritmaları
│
├── client_gui.py              # İstemci (client) arayüzü
├── server_gui.py              # Sunucu arayüzü (opsiyonel)
│
├── templates/
│   └── index.html             # Web arayüzü
│
└── static/
    ├── script.js              # Frontend JavaScript
    └── style.css              # Stil dosyası


---

## ▶️ Kurulum ve Çalıştırma

Aşağıdaki adımları sırasıyla uygulayarak projeyi çalıştırabilirsiniz.

1️⃣ Sanal Ortamı Aktif Et

source venv/bin/activate


2️⃣ Gerekli Paketleri Yükle

Projede kullanılan kütüphaneleri yüklemek için:

pip install flask pycryptodome


3️⃣ Sunucuyu Başlat

Flask tabanlı sunucuyu çalıştırmak için:

python app.py


4️⃣ Uygulamayı Tarayıcıda Aç

Sunucu çalıştıktan sonra aşağıdaki adres üzerinden uygulamaya erişebilirsiniz:

http://127.0.0.1:5000


🧠 Notlar

- encryptor.py, algoritma adına göre encrypt() / decrypt() fonksiyonları ile yönlendirme yapar.
- AES/DES manuel sürümde kullanıcıdan anahtar girişi zorunludur.
- aes_lib / des_lib deşifre işlemleri text["ciphertext"] ve text["encrypted_key"] alanlarını bekler.
  (Bu nedenle ilgili parametreler string değil, sözlük (dict) yapısındadır.)

