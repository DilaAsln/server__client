const logArea = document.getElementById("log");

const clientMessageInput = document.getElementById("client-message");
const clientKeyInput = document.getElementById("client-key");
const clientPubkeyInput = document.getElementById("client-pubkey");
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

async function fetch_server_public_key() {
    try {
        let response = await fetch(`http://${HOST}:${PORT}/get-public-key`);
        let publicKey = await response.text();
        
        document.getElementById('client-pubkey').value = publicKey;

        console.log("Public key alındı ve textarea'ya yazıldı.");
    } catch (error) {
        console.error("Public key alınırken hata oluştu:", error);
    }
}

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

  await fetch_server_public_key();
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
  return text.toUpperCase().replace(/[^A-Z]/g, "");
}

function getMatrixKey(keyString) {
  const parts = keyString.split(",").map((p) => parseInt(p.trim()));
  if (parts.length !== 4 || parts.some(isNaN)) {
    throw new Error("Hill Cipher anahtarı 4 tam sayıdan oluşmalıdır.");
  }
  return [
    [parts[0] % 26, parts[1] % 26],
    [parts[2] % 26, parts[3] % 26],
  ];
}

function updateKeyPlaceholder() {
  const algorithm = clientAlgorithmSelect.value;
  let placeholderText = "";

  clientKeyInput.disabled = false;
  serverKeyInput.disabled = false;

  clientPubkeyInput.style.display = "none";
  clientPubkeyInput.disabled = true;

  if (algorithm === "aes_rsa") {
    clientKeyInput.placeholder = "AES anahtarı otomatik üretilir (16 byte)";
    serverKeyInput.placeholder = "RSA ile şifrelenmiş AES anahtarı (Base64)";

    clientKeyInput.disabled = true;
    serverKeyInput.disabled = true;

    clientPubkeyInput.style.display = "block";
    clientPubkeyInput.disabled = false;
    clientPubkeyInput.placeholder =
      "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
    return;
  }

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


function caesarEncrypt(text, key) {
  const shift = parseInt(key);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0)) {
      const base = "A".charCodeAt(0);
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
  let result = "";
  const base = "A".charCodeAt(0);

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
  let result = "";
  const base = "A".charCodeAt(0);

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
  let result = "";

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
  let result = "";

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
  const parts = key.split(",");
  const a = parseInt(parts[0].trim());
  const b = parseInt(parts[1].trim());
  const normalizedText = normalizeText(text);
  let result = "";

  for (let i = 0; i < normalizedText.length; i++) {
    const x = normalizedText.charCodeAt(i) - "A".charCodeAt(0);
    const enc = (a * x + b) % 26;
    result += String.fromCharCode(enc + "A".charCodeAt(0));
  }
  return result;
}

function affineDecrypt(text, key) {
  const parts = key.split(",");
  const a = parseInt(parts[0].trim());
  const b = parseInt(parts[1].trim());
  const normalizedText = normalizeText(text);
  let result = "";

  const aInv = modInverse(a, 26);
  if (aInv === 0) {
    throw new Error("Affine: 'a' anahtarı 26 ile aralarında asal olmalı (tersi yok).");
  }

  for (let i = 0; i < normalizedText.length; i++) {
    const y = normalizedText.charCodeAt(i) - "A".charCodeAt(0);
    const dec = (aInv * (y - b + 26)) % 26;
    result += String.fromCharCode(dec + "A".charCodeAt(0));
  }
  return result;
}

function railfenceEncrypt(text, key) {
  const rails = parseInt(key);
  const normalizedText = normalizeText(text);
  if (rails <= 1 || !normalizedText) return normalizedText;

  const rail = Array(rails)
    .fill(null)
    .map(() => Array(normalizedText.length).fill("\n"));
  let row = 0,
    col = 0,
    dirDown = false;

  for (const char of normalizedText) {
    if (row === 0 || row === rails - 1) dirDown = !dirDown;
    rail[row][col++] = char;
    row += dirDown ? 1 : -1;
  }

  let result = "";
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < normalizedText.length; c++) {
      if (rail[r][c] !== "\n") result += rail[r][c];
    }
  }
  return result;
}

function railfenceDecrypt(text, key) {
  const rails = parseInt(key);
  const normalizedText = normalizeText(text);
  if (rails <= 1 || !normalizedText) return normalizedText;

  const rail = Array(rails)
    .fill(null)
    .map(() => Array(normalizedText.length).fill("\n"));
  let row = 0,
    col = 0,
    dirDown = false;

  for (let i = 0; i < normalizedText.length; i++) {
    if (row === 0 || row === rails - 1) dirDown = !dirDown;
    rail[row][col++] = "*";
    row += dirDown ? 1 : -1;
  }

  let textIndex = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < normalizedText.length; c++) {
      if (rail[r][c] === "*" && textIndex < normalizedText.length) {
        rail[r][c] = normalizedText[textIndex++];
      }
    }
  }

  let result = "";
  row = 0;
  col = 0;
  dirDown = false;

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
    normalizedText += "X";
  }

  const keyMatrix = getMatrixKey(keyString);
  let result = "";

  for (let i = 0; i < normalizedText.length; i += 2) {
    const p1 = normalizedText.charCodeAt(i) - "A".charCodeAt(0);
    const p2 = normalizedText.charCodeAt(i + 1) - "A".charCodeAt(0);

    const c1 = (keyMatrix[0][0] * p1 + keyMatrix[0][1] * p2) % 26;
    const c2 = (keyMatrix[1][0] * p1 + keyMatrix[1][1] * p2) % 26;

    result += String.fromCharCode(c1 + "A".charCodeAt(0));
    result += String.fromCharCode(c2 + "A".charCodeAt(0));
  }
  return result;
}

function hillDecrypt(text, keyString) {
  const normalizedText = normalizeText(text);
  if (normalizedText.length % 2 !== 0) {
    throw new Error("Hill Cipher deşifre için metin çift uzunlukta olmalıdır.");
  }

  const keyMatrix = getMatrixKey(keyString);

  let determinant = keyMatrix[0][0] * keyMatrix[1][1] - keyMatrix[0][1] * keyMatrix[1][0];
  determinant = (determinant % 26 + 26) % 26;

  const detInv = modInverse(determinant, 26);
  if (detInv === 0) {
    throw new Error("Hill Cipher: Anahtar matris tersinir değil! Başka bir anahtar deneyin.");
  }

  const invKeyMatrix = [
    [(keyMatrix[1][1] * detInv) % 26, ((-keyMatrix[0][1] * detInv) % 26 + 26) % 26],
    [((-keyMatrix[1][0] * detInv) % 26 + 26) % 26, (keyMatrix[0][0] * detInv) % 26],
  ];

  let result = "";

  for (let i = 0; i < normalizedText.length; i += 2) {
    const c1 = normalizedText.charCodeAt(i) - "A".charCodeAt(0);
    const c2 = normalizedText.charCodeAt(i + 1) - "A".charCodeAt(0);

    const p1 = (invKeyMatrix[0][0] * c1 + invKeyMatrix[0][1] * c2) % 26;
    const p2 = (invKeyMatrix[1][0] * c1 + invKeyMatrix[1][1] * c2) % 26;

    result += String.fromCharCode(p1 + "A".charCodeAt(0));
    result += String.fromCharCode(p2 + "A".charCodeAt(0));
  }
  return result;
}

function columnarEncrypt(text, key) {
    const keyStr = key.toUpperCase().replace(' ', '');
    let normalizedText = normalizeText(text);
    const keyOrder = [...keyStr].map((_, i) => i).sort((a, b) => keyStr[a].localeCompare(keyStr[b]));
    
    const numCols = keyStr.length;
    const numRows = Math.ceil(normalizedText.length / numCols);
    
    const cipherMatrix = Array(numCols).fill('');
    
    for (let i = 0; i < normalizedText.length; i++) {
        const col = i % numCols;
        cipherMatrix[col] += normalizedText[i];
    }
        
    let result = '';
    for (const index of keyOrder) {
        result += cipherMatrix[index];
    }
        
    return result;
}

function columnarDecrypt(text, key) {
    const keyStr = key.toUpperCase().replace(' ', '');
    let normalizedText = normalizeText(text);

    const keyOrder = [...keyStr]
        .map((_, i) => i)
        .sort((a, b) => keyStr[a].localeCompare(keyStr[b]));

    const numCols = keyStr.length;
    const lenText = normalizedText.length;
    const numRows = Math.ceil(lenText / numCols);

    let colLengths = Array(numCols).fill(Math.floor(lenText / numCols));
    const extra = lenText % numCols;

    for (let i = 0; i < extra; i++) {
        colLengths[i] += 1;
    }

    const cipherMatrix = Array(numCols).fill('');
    let currentIndex = 0;

    for (let i = 0; i < numCols; i++) {
        const colIndex = keyOrder[i];
        const length = colLengths[colIndex];
        cipherMatrix[colIndex] =
            normalizedText.slice(currentIndex, currentIndex + length);
        currentIndex += length;
    }

    let result = '';
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (r < cipherMatrix[c].length) {
                result += cipherMatrix[c][r];
            }
        }
    }

    return result;
}


function routeEncrypt(text, key) {
  const numCols = parseInt(key);
  if (numCols <= 1 || isNaN(numCols)) throw new Error("Route Cipher anahtarı 1'den büyük bir sayı olmalıdır.");

  let normalizedText = normalizeText(text);
  const numRows = Math.ceil(normalizedText.length / numCols);

  const matrix = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("X"));
  let textIndex = 0;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (textIndex < normalizedText.length) {
        matrix[r][c] = normalizedText[textIndex];
        textIndex++;
      }
    }
  }

  let result = "";
  for (let c = 0; c < numCols; c++) {
    if (c % 2 === 0) {
      for (let r = 0; r < numRows; r++) result += matrix[r][c];
    } else {
      for (let r = numRows - 1; r >= 0; r--) result += matrix[r][c];
    }
  }
  return result;
}

function routeDecrypt(text, key) {
  const numCols = parseInt(key);
  if (numCols <= 1 || isNaN(numCols)) throw new Error("Route Cipher anahtarı 1'den büyük bir sayı olmalıdır.");

  let normalizedText = normalizeText(text);
  const numRows = Math.ceil(normalizedText.length / numCols);
  const lenText = normalizedText.length;

  const matrix = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill("\n"));
  let textIndex = 0;

  for (let c = 0; c < numCols; c++) {
    if (c % 2 === 0) {
      for (let r = 0; r < numRows; r++) {
        if (textIndex < lenText) matrix[r][c] = normalizedText[textIndex++];
      }
    } else {
      for (let r = numRows - 1; r >= 0; r--) {
        if (textIndex < lenText) matrix[r][c] = normalizedText[textIndex++];
      }
    }
  }

  let result = "";
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (matrix[r][c] !== "\n" && matrix[r][c] !== "X") result += matrix[r][c];
    }
  }
  return result;
}

const PIGPEN_MAP = {
    'A': '⍝', 'B': '⎯', 'C': '⊥', 'D': '≡', 'E': '⊖', 'F': '⊗', 'G': '⎬', 'H': '⎮', 'I': '☍',
    'J': '⧗', 'K': '⧘', 'L': '⧙', 'M': '⧚', 'N': '⧝', 'O': '⧞', 'P': '⧟', 'Q': '⧰',
    'R': '⧱', 'S': '⧲', 'T': '⧳', 'U': '⧴', 'V': '⧵', 'W': '⧶', 'X': '⧷', 'Y': '⧸', 'Z': '⧺'
};

const PIGPEN_INV_MAP = {
    '⍝': 'A', '⎯': 'B', '⊥': 'C', '≡': 'D', '⊖': 'E', '⊗': 'F', '⎬': 'G', '⎮': 'H', '☍': 'I',
    '⧗': 'J', '⧘': 'K', '⧙': 'L', '⧚': 'M', '⧝': 'N', '⧞': 'O', '⧟': 'P', '⧰': 'Q',
    '⧱': 'R', '⧲': 'S', '⧳': 'T', '⧴': 'U', '⧵': 'V', '⧶': 'W', '⧷': 'X', '⧸': 'Y', '⧺': 'Z'
};

function pigpenEncrypt(text) {
    text = text.toUpperCase().replace(/[^A-Z]/g, ''); 
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += PIGPEN_MAP[text[i]] || ''; 
    }
    return result;
}

function pigpenDecrypt(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += PIGPEN_INV_MAP[text[i]] || ''; 
    }
    return result;
}



function playfairPrepare(text) {
  let t = normalizeText(text).replace(/J/g, "I");
  return t;
}

function playfairBuildMatrix(key) {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // J yok
  let k = playfairPrepare(key);

  
  let seen = new Set();
  let merged = "";
  for (const ch of k) {
    if (!seen.has(ch) && alphabet.includes(ch)) {
      seen.add(ch);
      merged += ch;
    }
  }
  for (const ch of alphabet) {
    if (!seen.has(ch)) {
      seen.add(ch);
      merged += ch;
    }
  }

  const matrix = [];
  for (let i = 0; i < 25; i += 5) {
    matrix.push(merged.slice(i, i + 5).split(""));
  }

  const pos = {};
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      pos[matrix[r][c]] = { r, c };
    }
  }

  return { matrix, pos };
}

function playfairToPairs(text) {
  let t = playfairPrepare(text);

  const pairs = [];
  let i = 0;
  while (i < t.length) {
    const a = t[i];
    let b = t[i + 1];

    if (!b) {
      b = "X";
      i += 1;
    } else if (a === b) {
      b = "X";
      i += 1;
    } else {
      i += 2;
    }

    pairs.push([a, b]);
  }
  return pairs;
}

function playfairEncrypt(text, key) {
  const { matrix, pos } = playfairBuildMatrix(key);
  const pairs = playfairToPairs(text);

  let out = "";
  for (const [a, b] of pairs) {
    const pa = pos[a];
    const pb = pos[b];

    if (pa.r === pb.r) {
      out += matrix[pa.r][(pa.c + 1) % 5];
      out += matrix[pb.r][(pb.c + 1) % 5];
    }

    else if (pa.c === pb.c) {
      out += matrix[(pa.r + 1) % 5][pa.c];
      out += matrix[(pb.r + 1) % 5][pb.c];
    }

    else {
      out += matrix[pa.r][pb.c];
      out += matrix[pb.r][pa.c];
    }
  }
  return out;
}

function playfairDecrypt(text, key) {
  const { matrix, pos } = playfairBuildMatrix(key);
  const t = playfairPrepare(text);

  if (t.length % 2 !== 0) {
    throw new Error("Playfair: Şifreli metin çift uzunlukta olmalı.");
  }

  let out = "";
  for (let i = 0; i < t.length; i += 2) {
    const a = t[i];
    const b = t[i + 1];
    const pa = pos[a];
    const pb = pos[b];

    if (!pa || !pb) {
      throw new Error("Playfair: Şifreli metinde geçersiz karakter var.");
    }


    if (pa.r === pb.r) {
      out += matrix[pa.r][(pa.c + 4) % 5]; // -1 mod 5
      out += matrix[pb.r][(pb.c + 4) % 5];
    }
    else if (pa.c === pb.c) {
      out += matrix[(pa.r + 4) % 5][pa.c];
      out += matrix[(pb.r + 4) % 5][pb.c];
    }
    else {
      out += matrix[pa.r][pb.c];
      out += matrix[pb.r][pa.c];
    }
  }

  return out;
}



function polybiusEncrypt(text, key) {
  const mode = String(key || "").trim();
  if (mode !== "55" && mode !== "66") {
    throw new Error("Polybius anahtarı '55' veya '66' olmalı.");
  }

  let t = normalizeText(text);

  if (mode === "55") {
    t = t.replace(/J/g, "I");
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    let out = "";
    for (const ch of t) {
      const idx = alphabet.indexOf(ch);
      if (idx === -1) continue;

      const row = Math.floor(idx / 5) + 1;
      const col = (idx % 5) + 1;
      out += `${row}${col}`;
    }
    return out;
  }

  const alphabet66 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (const ch of t.replace(/[^A-Z0-9]/g, "")) {
    const idx = alphabet66.indexOf(ch);
    if (idx === -1) continue;
    const row = Math.floor(idx / 6) + 1;
    const col = (idx % 6) + 1;
    out += `${row}${col}`;
  }
  return out;
}

function polybiusDecrypt(text, key) {
  const mode = String(key || "").trim(); 
  if (mode !== "55" && mode !== "66") {
    throw new Error("Polybius anahtarı '55' veya '66' olmalı.");
  }

  const digits = (text || "").replace(/\D/g, "");
  if (digits.length % 2 !== 0) {
    throw new Error("Polybius: Şifreli metin çift sayıda rakam içermeli.");
  }

  if (mode === "55") {
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; 
    let out = "";
    for (let i = 0; i < digits.length; i += 2) {
      const row = parseInt(digits[i], 10);
      const col = parseInt(digits[i + 1], 10);
      if (row < 1 || row > 5 || col < 1 || col > 5) {
        throw new Error("Polybius(55): Geçersiz koordinat.");
      }
      const idx = (row - 1) * 5 + (col - 1);
      out += alphabet[idx];
    }
    return out;
  }

  const alphabet66 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < digits.length; i += 2) {
    const row = parseInt(digits[i], 10);
    const col = parseInt(digits[i + 1], 10);
    if (row < 1 || row > 6 || col < 1 || col > 6) {
      throw new Error("Polybius(66): Geçersiz koordinat.");
    }
    const idx = (row - 1) * 6 + (col - 1);
    out += alphabet66[idx];
  }
  return out;
}



function bytesToB64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function b64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pkcs7Pad(dataBytes, blockSize = 16) {
  const padLen = blockSize - (dataBytes.length % blockSize);
  const out = new Uint8Array(dataBytes.length + padLen);
  out.set(dataBytes, 0);
  out.fill(padLen, dataBytes.length);
  return out;
}

function pkcs7Unpad(dataBytes, blockSize = 16) {
  if (dataBytes.length === 0) throw new Error("Padding hatası");
  const padLen = dataBytes[dataBytes.length - 1];
  if (padLen < 1 || padLen > blockSize) throw new Error("Padding hatası");

  for (let i = dataBytes.length - padLen; i < dataBytes.length; i++) {
    if (dataBytes[i] !== padLen) throw new Error("Padding hatası");
  }
  return dataBytes.slice(0, dataBytes.length - padLen);
}

function normalizeKeyBytes(keyStr, size) {
  const enc = new TextEncoder();
  const b = enc.encode(keyStr || "");
  if (b.length === size) return b;

  if (b.length < size) {
    const out = new Uint8Array(size);
    out.set(b);
    return out;
  }
  return b.slice(0, size);
}

async function aesCbcEncryptPkcs7(message, keyBytes16) {
  const enc = new TextEncoder();
  const msgBytes = enc.encode(message);

  const padded = pkcs7Pad(msgBytes, 16);

  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);

  const aesKey = await crypto.subtle.importKey("raw", keyBytes16, { name: "AES-CBC" }, false, ["encrypt"]);

  const ctBuffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, padded);

  const ct = new Uint8Array(ctBuffer);

  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);

  return bytesToB64(combined);
}

async function aesEncryptAsync(text, keyStr) {
  const keyBytes = normalizeKeyBytes(keyStr, 16);
  return await aesCbcEncryptPkcs7(text, keyBytes);
}

async function aesDecryptAsync(ciphertextB64, keyStr) {
  const all = b64ToBytes(ciphertextB64);
  if (all.length < 16) throw new Error("Geçersiz AES ciphertext");

  const iv = all.slice(0, 16);
  const ct = all.slice(16);
  if (ct.length % 16 !== 0) throw new Error("Geçersiz AES ciphertext");

  const keyBytes = normalizeKeyBytes(keyStr, 16);

  const aesKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"]);

  const ptBuffer = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, ct);

  const pt = new Uint8Array(ptBuffer);
  const unpadded = pkcs7Unpad(pt, 16);
  return new TextDecoder().decode(unpadded);
}


function desEncrypt(text, key) {
  return CryptoJS.DES.encrypt(text, key).toString();
}

function desDecrypt(ciphertext, key) {
  const bytes = CryptoJS.DES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function pemToArrayBuffer(pem) {
  const b64 = (pem || "")
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importRsaPublicKey(pem) {
  const spki = pemToArrayBuffer(pem);
  return crypto.subtle.importKey("spki", spki, { name: "RSA-OAEP", hash: "SHA-1" }, false, ["encrypt"]);
}

async function rsaOaepEncryptBytes(pubKeyObj, bytesU8) {
  const ctBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKeyObj, bytesU8);
  return bytesToB64(new Uint8Array(ctBuffer));
}


async function handleClientEncrypt() {
  const message = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!message) {
    log("HATA: Mesaj boş olamaz!");
    return;
  }

  if (algorithm !== "pigpen" && algorithm !== "aes_rsa" && !key) {
    log("HATA: Mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Şifreleme İşlemi ---");

    if (algorithm === "aes_rsa") {
      const pem = clientPubkeyInput.value.trim();
      if (!pem) {
        log("HATA: RSA public key (PEM) gerekli!");
        return;
      }

      const rsaKey = await importRsaPublicKey(pem);

      const sessionKey = new Uint8Array(16);
      crypto.getRandomValues(sessionKey);

      const rsaEncKeyB64 = await rsaOaepEncryptBytes(rsaKey, sessionKey);
      const aesCipherB64 = await aesCbcEncryptPkcs7(message, sessionKey);

      const packet = `METHOD:AES_RSA:${rsaEncKeyB64}:${aesCipherB64}`;

      log(`Algoritma: AES_RSA`);
      log(`Mesaj: ${message}`);
      log(`✓ METHOD Paketi: ${packet}`);

      transferToServer(aesCipherB64, rsaEncKeyB64, "aes_rsa");
      return;
    }

    if (algorithm === "aes") {
      const encrypted = await aesEncryptAsync(message, key);

      log(`Algoritma: ${algorithm}`);
      log(`Mesaj: ${message}`);
      log(`Anahtar: ${key || "Yok"}`);
      log(`✓ Şifrelenmiş Mesaj: ${encrypted}`);

      transferToServer(encrypted, key, algorithm);
      return;
    }

    const encrypted = encrypt(message, key, algorithm);

    if (encrypted) {
      log(`Algoritma: ${algorithm}`);
      log(`Mesaj: ${message}`);
      log(`Anahtar: ${key || "Yok"}`);
      log(`✓ Şifrelenmiş Mesaj: ${encrypted}`);

      transferToServer(encrypted, key, algorithm);
    }
  } catch (e) {
    log(`HATA: Şifreleme Hatası: ${e.message}`);
  }
}

async function handleClientLocalDecrypt() {
  const encrypted = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (algorithm === "aes_rsa") {
    log("AES_RSA: Lokal deşifreleme bu web simülasyonunda yapılmıyor.");
    return;
  }

  if (!encrypted || (algorithm !== "pigpen" && !key)) {
    log("HATA: Şifreli mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Lokal Deşifreleme ---");

    if (algorithm === "aes") {
      const decrypted = await aesDecryptAsync(encrypted, key);
      log(`✓ Deşifrelenmiş Mesaj: ${decrypted}`);
      return;
    }

    const decrypted = decrypt(encrypted, key, algorithm);
    log(`✓ Deşifrelenmiş Mesaj: ${decrypted}`);
  } catch (e) {
    log(`HATA: Deşifreleme Hatası: ${e.message}`);
  }
}

async function handleServerDecrypt() {
  const encrypted = serverEncryptedTextarea.value.trim();
  const key = serverKeyInput.value.trim();
  const algorithm = serverAlgorithmSelect.value;

  if (algorithm === "aes_rsa") {
    log("AES_RSA: Sunucu tarafında RSA private key gerektiği için web simülasyonunda deşifre yapılmıyor.");
    return;
  }

  if (!encrypted || (algorithm !== "pigpen" && !key)) {
    log("HATA: Sunucuya Deşifre için veri eksik!");
    return;
  }

  try {
    log("--- SUNUCU: Deşifreleme İşlemi ---");

    if (algorithm === "aes") {
      const decrypted = await aesDecryptAsync(encrypted, key);
      log(`✓ SERVER: Deşifre Sonucu: ${decrypted}`);
      log(`← SERVER: Client'a Deşifre Sonucu Gönderildi. (Simülasyon)`);
      return;
    }

    const decrypted = decrypt(encrypted, key, algorithm);
    log(`✓ SERVER: Deşifre Sonucu: ${decrypted}`);
    log(`← SERVER: Client'a Deşifre Sonucu Gönderildi. (Simülasyon)`);
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
  clientPubkeyInput.value = "";
  serverEncryptedTextarea.value = "";
  serverKeyInput.value = "";
  logArea.textContent = "";
  log("Tüm ekranlar temizlendi.");
}

document.getElementById("clearBtn").addEventListener("click", clearFields);



function encrypt(text, key, algorithm) {
  const alg = algorithm.toLowerCase();
  switch (alg) {
    case "caesar":
      return caesarEncrypt(text, key);
    case "vigenere":
      return vigenereEncrypt(text, key);
    case "substitution":
      return substitutionEncrypt(text, key);
    case "affine":
      return affineEncrypt(text, key);
    case "railfence":
      return railfenceEncrypt(text, key);
    case "hill":
      return hillEncrypt(text, key);
    case "playfair":
      return playfairEncrypt(text, key);
    case "columnar":
      return columnarEncrypt(text, key);
    case "route":
      return routeEncrypt(text, key);
    case "pigpen":
      return pigpenEncrypt(text, key);
    case "polybius":
      return polybiusEncrypt(text, key);
    case "aes":
      throw new Error("AES web sürümü async, handleClientEncrypt içinde özel işleniyor.");
    case "des":
      return desEncrypt(text, key);
    default:
      throw new Error("Geçersiz algoritma seçimi!");
  }
}

function decrypt(text, key, algorithm) {
  const alg = algorithm.toLowerCase();
  switch (alg) {
    case "caesar":
      return caesarDecrypt(text, key);
    case "vigenere":
      return vigenereDecrypt(text, key);
    case "substitution":
      return substitutionDecrypt(text, key);
    case "affine":
      return affineDecrypt(text, key);
    case "railfence":
      return railfenceDecrypt(text, key);
    case "hill":
      return hillDecrypt(text, key);
    case "playfair":
      return playfairDecrypt(text, key);
    case "columnar":
      return columnarDecrypt(text, key);
    case "route":
      return routeDecrypt(text, key);
    case "pigpen":
      return pigpenDecrypt(text, key);
    case "polybius":
      return polybiusDecrypt(text, key);
    case "aes":
      throw new Error("AES web sürümü async, handle... içinde özel işleniyor.");
    case "des":
      return desDecrypt(text, key);
    default:
      throw new Error("Geçersiz algoritma seçimi!");
  }
}
