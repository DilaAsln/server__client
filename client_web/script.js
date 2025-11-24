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
document.addEventListener('DOMContentLoaded', updateKeyPlaceholder);

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

function updateKeyPlaceholder() {
    const algorithm = clientAlgorithmSelect.value;
    let placeholderText = "";

    switch (algorithm) {
        case 'caesar':
            placeholderText = "Sayı girin (Örn: 3)";
            break;
        case 'vigenere':
            placeholderText = "Kelime girin (Örn: SECRETKEY)";
            break;
        case 'substitution':
            placeholderText = "26 harfli tam alfabe (Örn: ZEBRASCDFGHIJKLMNOPQTUVWXY)";
            break;
        case 'affine':
            placeholderText = "İki sayı (Örn: 5, 8)";
            break;
        case 'railfence':
            placeholderText = "Ray sayısı girin (Örn: 3)";
            break;
        case 'hill':
            placeholderText = "Virgülle ayrılmış 4 sayı (Örn: 5, 8, 17, 3)";
            break;
        case 'columnar':
            placeholderText = "Anahtar kelime (Örn: CIPHER)";
            break;
        case 'playfair':
            placeholderText = "Anahtar kelime (Örn: PLAYFAIR)";
            break;
        case 'route':
            placeholderText = "Sütun sayısı (Örn: 4)";
            break;
        case 'pigpen':
            placeholderText = "Bu algoritma anahtar gerektirmez";
            break;
        case 'polybius':
            placeholderText = "Tablo boyutu (Örn: 55 veya 66)";
            break;
        default:
            placeholderText = "Anahtarınızı girin...";
            break;
    }
    
    clientKeyInput.placeholder = placeholderText;
    serverKeyInput.placeholder = placeholderText; 
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
    const keyOrder = [...keyStr].map((_, i) => i).sort((a, b) => keyStr[a].localeCompare(keyStr[b]));
    
    const numCols = keyStr.length;
    const lenText = normalizedText.length;
    const numRows = Math.ceil(lenText / numCols);
    
    let colLengths = Array(numCols).fill(numRows);
    const lenFullCols = lenText % numCols;
    
    if (lenFullCols !== 0) {
        for (let i = 0; i < numCols; i++) {
            if (i >= lenFullCols) {
                colLengths[keyOrder[i]] -= 1;
            }
        }
    }

    const cipherMatrix = Array(numCols).fill('');
    let currentIndex = 0;
    
    for (let i = 0; i < numCols; i++) {
        const colIndex = keyOrder[i];
        const length = colLengths[colIndex];
        cipherMatrix[colIndex] = normalizedText.substring(currentIndex, currentIndex + length);
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
    
    const matrix = Array(numRows).fill(null).map(() => Array(numCols).fill('X'));
    let textIndex = 0;
    
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (textIndex < normalizedText.length) {
                matrix[r][c] = normalizedText[textIndex];
                textIndex++;
            }
        }
    }
        
    let result = '';
    for (let c = 0; c < numCols; c++) {
        if (c % 2 === 0) {
            for (let r = 0; r < numRows; r++) {
                result += matrix[r][c];
            }
        } else {
            for (let r = numRows - 1; r >= 0; r--) {
                result += matrix[r][c];
            }
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
    
    const matrix = Array(numRows).fill(null).map(() => Array(numCols).fill('\n'));
    let textIndex = 0;
    
    for (let c = 0; c < numCols; c++) {
        if (c % 2 === 0) {
            for (let r = 0; r < numRows; r++) {
                if (textIndex < lenText) {
                    matrix[r][c] = normalizedText[textIndex];
                    textIndex++;
                }
            }
        } else {
            for (let r = numRows - 1; r >= 0; r--) {
                if (textIndex < lenText) {
                    matrix[r][c] = normalizedText[textIndex];
                    textIndex++;
                }
            }
        }
    }
        
    let result = '';
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (matrix[r][c] !== '\n' && matrix[r][c] !== 'X') {
                result += matrix[r][c];
            }
        }
    }
    return result;
}

const PIGPEN_MAP = {
    'A': '11', 'B': '12', 'C': '13', 'D': '21', 'E': '22', 'F': '23', 'G': '31', 'H': '32', 'I': '33', 
    'J': '41', 'K': '42', 'L': '43', 'M': '51', 'N': '52', 'O': '53', 'P': '61', 'Q': '62', 'R': '63',
    'S': '71', 'T': '72', 'U': '73', 'V': '81', 'W': '82', 'X': '83', 'Y': '91', 'Z': '92'
};


const PIGPEN_INV_MAP = {
    '11': '□', '12': '□̇', '13': '□̈', 
    '21': '⊓', '22': '⊓̇', '23': '⊓̈', 
    '31': '⊢', '32': '⊢̇', '33': '⊢̈',
    '41': 'X', '42': 'Ẋ', '43': 'Ẍ', 
    '51': '◊', '52': '◊̇', '53': '◊̈',
    '61': '⊞', '62': '⊞̇', '63': '⊞̈', 
    '71': '⊏', '72': '⊐', '73': '△',
    '81': '∇', '82': '◯', '91': '◫', '92': '◫̇' 
};

const PIGPEN_HARF_MAP = {
    '11': 'A', '12': 'B', '13': 'C', '21': 'D', '22': 'E', '23': 'F', '31': 'G', '32': 'H', '33': 'I', 
    '41': 'J', '42': 'K', '43': 'L', '51': 'M', '52': 'N', '53': 'O', '61': 'P', '62': 'Q', '63': 'R',
    '71': 'S', '72': 'T', '73': 'U', '81': 'V', '82': 'W', '83': 'X', '91': 'Y', '92': 'Z'
};

function getPigpenShape(encryptedCode) {
    let shapes = [];
    const PIGPEN_INV_SHAPE_MAP = {'11': '□', '12': '□̇', '13': '□̈', '21': '⊓', '22': '⊓̇', '23': '⊓̈', '31': '⊢', '32': '⊢̇', '33': '⊢̈', '41': 'X', '42': 'Ẋ', '43': 'Ẍ', '51': '◊', '52': '◊̇', '53': '◊̈', '61': '⊞', '62': '⊞̇', '63': '⊞̈', '71': '⊏', '72': '⊐', '73': '△', '81': '∇', '82': '◯', '91': '◫', '92': '◫̇'};

    for (let i = 0; i < encryptedCode.length; i += 2) {
        const pair = encryptedCode.substring(i, i + 2);
        shapes.push(PIGPEN_INV_SHAPE_MAP[pair] || '?');
    }
    return shapes.join(' ');
}


function pigpenEncrypt(text, key = '') {
    let normalizedText = normalizeText(text);
    let result = '';
    for (const char of normalizedText) {
        result += PIGPEN_MAP[char] || char; 
    }
    return result;
}

function pigpenDecrypt(text, key = '') {
    let result = '';
    let i = 0;
    while (i < text.length) {
        const pair = text.substring(i, i + 2);
        result += PIGPEN_HARF_MAP[pair] || '?'; 
        i += 2;
    }
    return result;
}

function playfairEncrypt(text, key) {
    const keyStr = key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    let matrix = [];
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
    
    for (const char of keyStr) {
        if (!matrix.includes(char)) matrix.push(char);
    }
    for (const char of alphabet) {
        if (!matrix.includes(char)) matrix.push(char);
    }
    
    const matrix5x5 = Array(5).fill(null).map(() => matrix.splice(0, 5));

    let normalizedText = normalizeText(text).replace('J', 'I');
    
    let i = 0;
    while (i < normalizedText.length) {
        if (i + 1 === normalizedText.length || normalizedText[i] === normalizedText[i+1]) {
            normalizedText = normalizedText.slice(0, i + 1) + 'X' + normalizedText.slice(i + 1);
        }
        i += 2;
    }
    
    const getCoords = (char) => {
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (matrix5x5[r][c] === char) return [r, c];
            }
        }
        return [-1, -1];
    };

    let result = '';
    for (let j = 0; j < normalizedText.length; j += 2) {
        const [r1, c1] = getCoords(normalizedText[j]);
        const [r2, c2] = getCoords(normalizedText[j+1]);

        if (r1 === r2) {
            result += matrix5x5[r1][(c1 + 1) % 5] + matrix5x5[r2][(c2 + 1) % 5];
        } else if (c1 === c2) {
            result += matrix5x5[(r1 + 1) % 5][c1] + matrix5x5[(r2 + 1) % 5][c2];
        } else {
            result += matrix5x5[r1][c2] + matrix5x5[r2][c1];
        }
    }
    return result;
}

function playfairDecrypt(text, key) {
    const keyStr = key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    let matrix = [];
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
    
    for (const char of keyStr) {
        if (!matrix.includes(char)) matrix.push(char);
    }
    for (const char of alphabet) {
        if (!matrix.includes(char)) matrix.push(char);
    }
    
    const matrix5x5 = Array(5).fill(null).map(() => matrix.splice(0, 5));
    let normalizedText = normalizeText(text).replace('J', 'I');
    
    const getCoords = (char) => {
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (matrix5x5[r][c] === char) return [r, c];
            }
        }
        return [-1, -1];
    };

    let result = '';
    for (let j = 0; j < normalizedText.length; j += 2) {
        const [r1, c1] = getCoords(normalizedText[j]);
        const [r2, c2] = getCoords(normalizedText[j+1]);

        if (r1 === r2) {
            result += matrix5x5[r1][(c1 - 1 + 5) % 5] + matrix5x5[r2][(c2 - 1 + 5) % 5];
        } else if (c1 === c2) {
            result += matrix5x5[(r1 - 1 + 5) % 5][c1] + matrix5x5[(r2 - 1 + 5) % 5][c2];
        } else {
            result += matrix5x5[r1][c2] + matrix5x5[r2][c1];
        }
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
        case 'playfair':
            return playfairEncrypt(text, key);
        case 'columnar':
            return columnarEncrypt(text, key);
        case 'route':
            return routeEncrypt(text, key);
        case 'pigpen':
            return pigpenEncrypt(text, key);
        case 'polybius':
            return polybiusEncrypt(text, key);
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
        case 'playfair':
            return playfairDecrypt(text, key);
        case 'columnar':
            return columnarDecrypt(text, key);
        case 'route':
            return routeDecrypt(text, key);
        case 'pigpen':
            return pigpenDecrypt(text, key);
        case 'polybius':
            return polybiusDecrypt(text, key);
        default:
            throw new Error("Geçersiz algoritma seçimi!");
    }
}

function handleClientEncrypt() {
  const message = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!message || (algorithm !== 'pigpen' && !key)) {
    log("HATA: Mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Şifreleme İşlemi ---");
    const encrypted = encrypt(message, key, algorithm);

    if (encrypted) {
      log(`Algoritma: ${algorithm}`);
      log(`Mesaj: ${message}`);
      log(`Anahtar: ${key || 'Yok'}`); 
      log(`✓ Şifrelenmiş Mesaj: ${encrypted}`);

      if (algorithm === 'pigpen') {
                const shapes = getPigpenShape(encrypted);
                log(`✓ GÖRSEL Temsil: ${shapes}`);
            }

      transferToServer(encrypted, key, algorithm);
    }

  } catch (e) {
    log(`HATA: Şifreleme Hatası: ${e.message}`);
  }
}

function handleClientLocalDecrypt() {
  const encrypted = clientMessageInput.value.trim();
  const key = clientKeyInput.value.trim();
  const algorithm = clientAlgorithmSelect.value;

  if (!encrypted || (algorithm !== 'pigpen' && !key)) {
    log("HATA: Şifreli mesaj ve anahtar boş olamaz!");
    return;
  }

  try {
    log("--- İSTEMCİ: Lokal Deşifreleme ---");
    const decrypted = decrypt(encrypted, key, algorithm);
    
    log(`✓ Deşifrelenmiş Mesaj: ${decrypted}`);

  } catch (e) {
    log(`HATA: Deşifreleme Hatası: ${e.message}`);
  }
}

function handleServerDecrypt() {
  const encrypted = serverEncryptedTextarea.value.trim();
  const key = serverKeyInput.value.trim();
  const algorithm = serverAlgorithmSelect.value;

 
  if (!encrypted || (algorithm !== 'pigpen' && !key)) {
    log("HATA: Sunucuya Deşifre için veri eksik!");
    return;
  }
  
  try {
    log("--- SUNUCU: Deşifreleme İşlemi ---");
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
  serverEncryptedTextarea.value = "";
  serverKeyInput.value = "";
  logArea.value = "";
  log("Tüm ekranlar temizlendi.");
}

document.getElementById("clearBtn").addEventListener("click", clearFields);