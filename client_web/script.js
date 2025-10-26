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

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
    document.querySelector('.tab-button[data-tab="client"]').click();
});


function log(msg) {
  const now = new Date().toLocaleTimeString();
  logArea.textContent += `[${now}] ${msg}\n`; 
  logArea.scrollTop = logArea.scrollHeight; 
}

function modInverse(a, m) {
    a = a % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) return x;
    }
    return 0;
}

function normalizeText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
}

function getMatrixKey(keyString) {
    const parts = keyString.split(',').map(p => parseInt(p.trim()));
    if (parts.length !== 4 || parts.some(isNaN)) {
        throw new Error("Hill Cipher anahtarı 4 tam sayıdan oluşmalıdır.");
    }
    return [
        [parts[0] % 26, parts[1] % 26],
        [parts[2] % 26, parts[3] % 26]
    ];
}

function caesarEncrypt(text, key) {
    const shift = parseInt(key);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {
            const base = 'A'.charCodeAt(0);
            result += String.fromCharCode((charCode - base + shift) % 26 + base);
        } else {
            result += text[i];
        }
    }
    return result;
}

function caesarDecrypt(text, key) {
    const shift = parseInt(key);
    const inverseShift = 26 - (shift % 26);
    return caesarEncrypt(text, inverseShift);
}

function vigenereEncrypt(text, key) {
    const normalizedKey = normalizeText(key);
    const normalizedText = normalizeText(text);
    let result = '';
    const base = 'A'.charCodeAt(0);
    
    for (let i = 0; i < normalizedText.length; i++) {
        const charCode = normalizedText.charCodeAt(i);
        const keyChar = normalizedKey.charCodeAt(i % normalizedKey.length);
        
        const shift = keyChar - base;
        const encryptedCode = (charCode - base + shift) % 26 + base;
        
        result += String.fromCharCode(encryptedCode);
    }
    return result;
}

function vigenereDecrypt(text, key) {
    const normalizedKey = normalizeText(key);
    const normalizedText = normalizeText(text);
    let result = '';
    const base = 'A'.charCodeAt(0);
    
    for (let i = 0; i < normalizedText.length; i++) {
        const charCode = normalizedText.charCodeAt(i);
        const keyChar = normalizedKey.charCodeAt(i % normalizedKey.length);
        
        const shift = keyChar - base;
        const decryptedCode = (charCode - base - shift + 26) % 26 + base;
        
        result += String.fromCharCode(decryptedCode);
    }
    return result;
}

function substitutionEncrypt(text, key) {
    const normalizedText = normalizeText(text);
    const normalizedKey = key.toUpperCase();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = '';
    
    if (normalizedKey.length !== 26 || new Set(normalizedKey).size !== 26) {
        throw new Error("Substitution anahtarı 26 eşsiz harf içermelidir.");
    }

    for (let i = 0; i < normalizedText.length; i++) {
        const index = alphabet.indexOf(normalizedText[i]);
        result += normalizedKey[index];
    }
    return result;
}

function substitutionDecrypt(text, key) {
    const normalizedText = normalizeText(text);
    const normalizedKey = key.toUpperCase();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = '';
    
    if (normalizedKey.length !== 26 || new Set(normalizedKey).size !== 26) {
        throw new Error("Substitution anahtarı 26 eşsiz harf içermelidir.");
    }
        
    for (let i = 0; i < normalizedText.length; i++) {
        const index = normalizedKey.indexOf(normalizedText[i]);
        result += alphabet[index];
    }
    return result;
}

function affineEncrypt(text, key) {
    const parts = key.split(',');
    const a = parseInt(parts[0].trim());
    const b = parseInt(parts[1].trim());
    const normalizedText = normalizeText(text);
    let result = '';

    for (let i = 0; i < normalizedText.length; i++) {
        const x = normalizedText.charCodeAt(i) - 'A'.charCodeAt(0);
        const enc = (a * x + b) % 26;
        result += String.fromCharCode(enc + 'A'.charCodeAt(0));
    }
    return result;
}

function affineDecrypt(text, key) {
    const parts = key.split(',');
    const a = parseInt(parts[0].trim());
    const b = parseInt(parts[1].trim());
    const normalizedText = normalizeText(text);
    let result = '';

    const aInv = modInverse(a, 26);
    if (aInv === 0) {
        throw new Error("Affine: 'a' anahtarı 26 ile aralarında asal olmalı (tersi yok).");
    }

    for (let i = 0; i < normalizedText.length; i++) {
        const y = normalizedText.charCodeAt(i) - 'A'.charCodeAt(0);
        const dec = (aInv * (y - b + 26)) % 26;
        result += String.fromCharCode(dec + 'A'.charCodeAt(0));
    }
    return result;
}

function railfenceEncrypt(text, key) {
    const rails = parseInt(key);
    const normalizedText = normalizeText(text);
    if (rails <= 1 || !normalizedText) return normalizedText;

    const rail = Array(rails).fill(null).map(() => Array(normalizedText.length).fill('\n'));
    let row = 0, col = 0, dirDown = false;

    for (const char of normalizedText) {
        if (row === 0 || row === rails - 1) dirDown = !dirDown;
        rail[row][col++] = char;
        row += dirDown ? 1 : -1;
    }

    let result = '';
    for (let r = 0; r < rails; r++) {
        for (let c = 0; c < normalizedText.length; c++) {
            if (rail[r][c] !== '\n') result += rail[r][c];
        }
    }
    return result;
}

function railfenceDecrypt(text, key) {
    const rails = parseInt(key);
    const normalizedText = normalizeText(text);
    if (rails <= 1 || !normalizedText) return normalizedText;

    const rail = Array(rails).fill(null).map(() => Array(normalizedText.length).fill('\n'));
    let row = 0, col = 0, dirDown = false;

    for (let i = 0; i < normalizedText.length; i++) {
        if (row === 0 || row === rails - 1) dirDown = !dirDown;
        rail[row][col++] = '*';
        row += dirDown ? 1 : -1;
    }

    let textIndex = 0;
    for (let r = 0; r < rails; r++) {
        for (let c = 0; c < normalizedText.length; c++) {
            if (rail[r][c] === '*' && textIndex < normalizedText.length) {
                rail[r][c] = normalizedText[textIndex++];
            }
        }
    }

    let result = '';
    row = 0; col = 0; dirDown = false;
    
    for (let i = 0; i < normalizedText.length; i++) {
        if (row === 0 || row === rails - 1) dirDown = !dirDown;
        result += rail[row][col++];
        row += dirDown ? 1 : -1;
    }
    return result;
}

function hillEncrypt(text, keyString) {
    let normalizedText = normalizeText(text);
    if (normalizedText.length % 2 !== 0) {
        normalizedText += 'X';
    }

    const keyMatrix = getMatrixKey(keyString);
    let result = '';

    for (let i = 0; i < normalizedText.length; i += 2) {
        const p1 = normalizedText.charCodeAt(i) - 'A'.charCodeAt(0);
        const p2 = normalizedText.charCodeAt(i + 1) - 'A'.charCodeAt(0);

        const c1 = (keyMatrix[0][0] * p1 + keyMatrix[0][1] * p2) % 26;
        const c2 = (keyMatrix[1][0] * p1 + keyMatrix[1][1] * p2) % 26;

        result += String.fromCharCode(c1 + 'A'.charCodeAt(0));
        result += String.fromCharCode(c2 + 'A'.charCodeAt(0));
    }
    return result;
}

function hillDecrypt(text, keyString) {
    const normalizedText = normalizeText(text);
    if (normalizedText.length % 2 !== 0) {
        throw new Error("Hill Cipher deşifre için metin çift uzunlukta olmalıdır.");
    }

    const keyMatrix = getMatrixKey(keyString);
    
    let determinant = (keyMatrix[0][0] * keyMatrix[1][1] - keyMatrix[0][1] * keyMatrix[1][0]);
    determinant = (determinant % 26 + 26) % 26;
    
    const detInv = modInverse(determinant, 26); 
    if (detInv === 0) {
        throw new Error("Hill Cipher: Anahtar matris tersinir değil! Başka bir anahtar deneyin.");
    }
    
    const invKeyMatrix = [
        [(keyMatrix[1][1] * detInv) % 26, ((-keyMatrix[0][1] * detInv) % 26 + 26) % 26],
        [((-keyMatrix[1][0] * detInv) % 26 + 26) % 26, (keyMatrix[0][0] * detInv) % 26]
    ];

    let result = '';

    for (let i = 0; i < normalizedText.length; i += 2) {
        const c1 = normalizedText.charCodeAt(i) - 'A'.charCodeAt(0);
        const c2 = normalizedText.charCodeAt(i + 1) - 'A'.charCodeAt(0);

        const p1 = (invKeyMatrix[0][0] * c1 + invKeyMatrix[0][1] * c2) % 26;
        const p2 = (invKeyMatrix[1][0] * c1 + invKeyMatrix[1][1] * c2) % 26;

        result += String.fromCharCode(p1 + 'A'.charCodeAt(0));
        result += String.fromCharCode(p2 + 'A'.charCodeAt(0));
    }
    return result;
}

function encrypt(text, key, algorithm) {
    const alg = algorithm.toLowerCase();
    switch (alg) {
        case 'caesar':
            return caesarEncrypt(text, key);
        case 'vigenere':
            return vigenereEncrypt(text, key);
        case 'substitution':
            return substitutionEncrypt(text, key);
        case 'affine':
            return affineEncrypt(text, key);
        case 'railfence':
            return railfenceEncrypt(text, key);
        case 'hill':
            return hillEncrypt(text, key);
        default:
            throw new Error("Geçersiz algoritma seçimi!");
    }
}

function decrypt(text, key, algorithm) {
    const alg = algorithm.toLowerCase();
    switch (alg) {
        case 'caesar':
            return caesarDecrypt(text, key);
        case 'vigenere':
            return vigenereDecrypt(text, key);
        case 'substitution':
            return substitutionDecrypt(text, key);
        case 'affine':
            return affineDecrypt(text, key);
        case 'railfence':
            return railfenceDecrypt(text, key);
        case 'hill':
            return hillDecrypt(text, key);
        default:
            throw new Error("Geçersiz algoritma seçimi!");
    }
}

function handleClientEncrypt() {
  const message = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!message || !key) {
    log("HATA: Mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Şifreleme İşlemi ---");
    const encrypted = encrypt(message, key, algorithm);

    if (encrypted) {
      log(`Algoritma: ${algorithm}`);
      log(`Mesaj: ${message}`);
      log(`Anahtar: ${key}`);
      log(`✓ Şifrelenmiş Mesaj: ${encrypted}`);

      transferToServer(encrypted, key, algorithm);
    }

  } catch (e) {
    log(`Şifreleme Hatası: ${e.message}`);
  }
}

function handleClientLocalDecrypt() {
  const encrypted = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!encrypted || !key) {
    log("HATA: Şifreli mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Lokal Deşifreleme ---");
    const decrypted = decrypt(encrypted, key, algorithm);
    
    log(`✓ Deşifrelenmiş Mesaj: ${decrypted}`);

  } catch (e) {
    log(`Deşifreleme Hatası: ${e.message}`);
  }
}

function handleServerDecrypt() {
  const encrypted = serverEncryptedTextarea.value.trim();
  const key = serverKeyInput.value.trim();
  const algorithm = serverAlgorithmSelect.value;

  if (!encrypted || !key) {
    log("HATA: Sunucuya Deşifre için veri eksik!");
    return;
  }
  
  try {
    log("--- SUNUCU: Deşifreleme İşlemi ---");
    const decrypted = decrypt(encrypted, key, algorithm);

    log(`✓ SERVER: Deşifre Sonucu: ${decrypted}`);
    log(`← SERVER: Client'a Deşifre Sonucu Gönderildi. (Simülasyon)`);

  } catch (e) {
    log(`Sunucu Deşifre Hatası: ${e.message}`);
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
  logArea.value = "";
  log("Tüm ekranlar temizlendi.");
}

document.getElementById("clearBtn").addEventListener("click", clearFields);