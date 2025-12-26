const logArea = document.getElementById("log");

const clientMessageInput = document.getElementById("client-message");
const clientKeyInput = document.getElementById("client-key");
const clientAlgorithmSelect = document.getElementById("client-algorithm");
const encryptBtn = document.getElementById("encryptBtn");
const clientDecryptBtn = document.getElementById("clientDecryptBtn");

const serverEncryptedTextarea = document.getElementById("server-encrypted");
const serverKeyInput = document.getElementById("server-key");
const serverAlgorithmSelect = document.getElementById("server-algorithm");
const serverDecryptBtn = document.getElementById("serverDecryptBtn");
const clearServerBtn = document.getElementById("clearServerBtn");

encryptBtn.addEventListener("click", handleClientEncrypt);
clientDecryptBtn.addEventListener("click", handleClientLocalDecrypt);
serverDecryptBtn.addEventListener("click", handleServerDecrypt);
clearServerBtn.addEventListener("click", clearServerFields);
clientAlgorithmSelect.addEventListener("change", updateKeyPlaceholder);
serverAlgorithmSelect.addEventListener("change", updateKeyPlaceholder);
document.addEventListener("DOMContentLoaded", updateKeyPlaceholder);

const MODERN_CIPHERS = ["aes_lib", "des_lib"];

document.addEventListener("DOMContentLoaded", async function () {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });

  document.querySelector('.tab-button[data-tab="client"]').click();
});

function log(msg) {
  const now = new Date().toLocaleTimeString();
  logArea.textContent += `[${now}] ${msg}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

function updateKeyPlaceholder() {
  const algorithm = clientAlgorithmSelect.value;
  let placeholderText = "";

  clientKeyInput.disabled = false;
  serverKeyInput.disabled = false;

  switch (algorithm) {
    case "caesar":
      placeholderText = "Sayı girin (Örn: 3)";
      break;
    case "vigenere":
      placeholderText = "Kelime girin (Örn: SECRETKEY)";
      break;
    case "substitution":
      placeholderText = "26 harfli alfabe (Örn: ZEBRASCDFGHIJKLMNOPQTUVWXY)";
      break;
    case "affine":
      placeholderText = "İki sayı (Örn: 5, 8)";
      break;
    case "railfence":
      placeholderText = "Ray sayısı (Örn: 3)";
      break;
    case "hill":
      placeholderText = "4 sayı (Örn: 5, 8, 17, 3)";
      break;
    case "columnar":
      placeholderText = "Anahtar kelime (Örn: CIPHER)";
      break;
    case "playfair":
      placeholderText = "Anahtar kelime (Örn: PLAYFAIR)";
      break;
    case "route":
      placeholderText = "Sütun sayısı (Örn: 4)";
      break;
    case "pigpen":
      placeholderText = "Bu algoritma anahtar gerektirmez";
      clientKeyInput.disabled = true;
      break;
    case "polybius":
      placeholderText = "Tablo boyutu (Örn: 55 veya 66)";
      break;
    case "aes":
      placeholderText = "AES anahtarı (16 byte önerilir)";
      break;
    case "des":
      placeholderText = "DES anahtarı (8 byte önerilir)";
      break;
    default:
      placeholderText = "Anahtarınızı girin...";
  }

  clientKeyInput.placeholder = placeholderText;
  serverKeyInput.placeholder = placeholderText;
}

async function handleClientEncrypt() {
  const message = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!message) {
    log("HATA: Mesaj boş olamaz!");
    return;
  }

  if (algorithm !== "pigpen" && !MODERN_CIPHERS.includes(algorithm) &&
  !key) {
    log("HATA: Mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Şifreleme İşlemi ---");

    const response = await fetch('http://127.0.0.1:5000/api/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        key: key,
        algorithm: algorithm,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      const encrypted = data.encryptedMessage;

if (typeof encrypted === "object") {
  lastEncryptedObject = encrypted;

  log("Şifrelenmiş Mesaj (LIB):");
  log("ciphertext: " + encrypted.ciphertext);
  log("encrypted_key: " + encrypted.encrypted_key);

  transferToServer("[LIB ŞİFRELENMİŞ VERİ]", key, algorithm);
} else {
  lastEncryptedObject = null;

  log(`Şifrelenmiş Mesaj: ${encrypted}`);
  transferToServer(encrypted, key, algorithm);
}

    } else {
      log(`HATA: Şifreleme Hatası: ${data.message}`);
    }
  } catch (e) {
    log(`HATA: Şifreleme Hatası: ${e.message}`);
  }
}

async function handleClientLocalDecrypt() {
  const encrypted = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!encrypted || (algorithm !== "pigpen" && !MODERN_CIPHERS.includes(algorithm) && !key)) {
    log("HATA: Şifreli mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Lokal Deşifreleme ---");

    const response = await fetch('http://127.0.0.1:5000/api/decrypt', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      encryptedMessage: encrypted,
      key: key,
      algorithm: algorithm,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      const decrypted = data.decryptedMessage;
      log(`Deşifrelenmiş Mesaj: ${decrypted}`);
    } else {
      log(`HATA: Deşifreleme Hatası: ${data.message}`);
    }
  } catch (e) {
    log(`HATA: Deşifreleme Hatası: ${e.message}`);
  }
}

async function handleServerDecrypt() {
  const encrypted = serverEncryptedTextarea.value.trim();
  const key = serverKeyInput.value.trim();
  const algorithm = serverAlgorithmSelect.value;
  

  if (
  (!encrypted && !lastEncryptedObject) ||
  (!["pigpen", "aes_lib", "des_lib"].includes(algorithm) && !key)
) {


    log("HATA: Sunucuya Deşifre için veri eksik!");
    return;
  }

  try {
    log("--- SUNUCU: Deşifreleme İşlemi ---");

    const response = await fetch('http://127.0.0.1:5000/api/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      encryptedMessage: MODERN_CIPHERS.includes(algorithm)
      ? lastEncryptedObject
      : encrypted,
      key: key,
      algorithm: algorithm,
      }),

    });
    
    const data = await response.json();
    if (response.ok) {
      const decrypted = data.decryptedMessage;
      log(`✓ SERVER: Deşifre Sonucu: ${decrypted}`);
    } else {
      log(`HATA: Sunucu Deşifre Hatası: ${data.message}`);
    }
  } catch (e) {
    log(`HATA: Sunucu Deşifre Hatası: ${e.message}`);
  }
}

function transferToServer(encrypted, key, algorithm) {
  serverEncryptedTextarea.value = encrypted;
  serverKeyInput.value = key;
  serverAlgorithmSelect.value = algorithm;

  log(`→ Mesaj Sunucuya İletildi. [ALGORİTMA: ${algorithm.toUpperCase()}]`);
}

function clearServerFields() {
  serverEncryptedTextarea.value = "";
  serverKeyInput.value = "";
  log("Sunucu alanı temizlendi.");
}

function clearFields() {
  clientMessageInput.value = "";
  clientKeyInput.value = "";
  serverEncryptedTextarea.value = "";
  serverKeyInput.value = "";
  logArea.textContent = "";
  log("Tüm ekranlar temizlendi.");
}

document.getElementById("clearBtn").addEventListener("click", clearFields);



async function encryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const password = document.getElementById("filePassword").value;
  const algorithm = document.getElementById("fileAlgorithm").value;

  if (!file || !password) {
    log("HATA: Dosya ve parola zorunlu!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  formData.append("algorithm", algorithm);

  log("--- DOSYA ŞİFRELEME BAŞLADI ---");

  const response = await fetch("http://127.0.0.1:5000/api/file/encrypt", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    const blob = await response.blob();
    downloadBlob(blob, file.name + ".enc");
    log("✓ Dosya şifrelendi ve indirildi");
  } else {
    log("HATA: Dosya şifreleme başarısız");
  }
}

async function decryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const password = document.getElementById("filePassword").value;
  const algorithm = document.getElementById("fileAlgorithm").value;

  if (!file || !password) {
    log("HATA: Dosya ve parola zorunlu!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  formData.append("algorithm", algorithm);

  log("--- DOSYA DEŞİFRELEME BAŞLADI ---");

  const response = await fetch("http://127.0.0.1:5000/api/file/decrypt", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    const blob = await response.blob();
    downloadBlob(blob, file.name.replace(".enc", ""));
    log("✓ Dosya deşifrelendi ve indirildi");
  } else {
    log("HATA: Dosya deşifreleme başarısız");
  }
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


