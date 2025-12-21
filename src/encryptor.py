import math
from Crypto.Cipher import AES , DES , PKCS1_OAEP
from Crypto.Random import get_random_bytes
import base64
from Crypto.PublicKey import RSA
from aes_manual import aes_manual_encrypt, aes_manual_decrypt
from des_manual import des_manual_encrypt, des_manual_decrypt
import rsa

def mod_inverse(a, m):
    a = a % m
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    return 0

def get_matrix_key(key_str):
    try:
        parts = [int(p.strip()) for p in key_str.split(',')]
    except ValueError:
        raise ValueError("Hill Cipher anahtarı 4 tam sayıdan oluşmalıdır (Örn: 5,8,17,3).")
        
    if len(parts) != 4:
        raise ValueError("Hill Cipher anahtarı 4 tam sayıdan oluşmalıdır.")
        
    key_matrix = [
        [parts[0] % 26, parts[1] % 26],
        [parts[2] % 26, parts[3] % 26]
    ]
    return key_matrix

def caesar_encrypt(text, key):
    shift = int(key)
    result = ""
    for char in text:
        if 'A' <= char <= 'Z':
            base = ord('A')
            result += chr((ord(char) - base + shift) % 26 + base)
        elif 'a' <= char <= 'z':
            base = ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result

def caesar_decrypt(text, key):
    shift = int(key)
    return caesar_encrypt(text, 26 - (shift % 26))

def vigenere_encrypt(text, key):
    key = key.upper().replace(" ", "")
    text = "".join(filter(str.isalpha, text)).upper()
    key_index = 0
    result = ""
    
    for char in text:
        base = ord('A')
        shift = ord(key[key_index % len(key)]) - base
        
        encrypted_ord = (ord(char) - base + shift) % 26 + base
        result += chr(encrypted_ord)
        key_index += 1
        
    return result

def vigenere_decrypt(text, key):
    key = key.upper().replace(" ", "")
    text = "".join(filter(str.isalpha, text)).upper()
    key_index = 0
    result = ""
    
    for char in text:
        base = ord('A')
        shift = ord(key[key_index % len(key)]) - base
        
        decrypted_ord = (ord(char) - base - shift + 26) % 26 + base
        result += chr(decrypted_ord)
        key_index += 1
        
    return result

def substitution_encrypt(text, key):
    key = key.upper()
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    result = ""
    text = "".join(filter(str.isalpha, text)).upper()
    
    if len(key) != 26 or len(set(key)) != 26:
        raise ValueError("Substitution Cipher anahtarı 26 eşsiz harf içermelidir.")
    
    for char in text:
        index = alphabet.find(char)
        result += key[index]
    return result

def substitution_decrypt(text, key):
    key = key.upper()
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    result = ""
    text = "".join(filter(str.isalpha, text)).upper()
    
    if len(key) != 26 or len(set(key)) != 26:
        raise ValueError("Substitution Cipher anahtarı 26 eşsiz harf içermelidir.")
        
    for char in text:
        index = key.find(char)
        result += alphabet[index]
    return result

def affine_encrypt(text, key):
    parts = key.split(',')
    a = int(parts[0].strip())
    b = int(parts[1].strip())
    result = ""
    text = "".join(filter(str.isalpha, text)).upper()
    
    for char in text:
        x = ord(char) - ord('A')
        enc = (a * x + b) % 26
        result += chr(enc + ord('A'))
    return result

def affine_decrypt(text, key):
    parts = key.split(',')
    a = int(parts[0].strip())
    b = int(parts[1].strip())
    
    a_inv = mod_inverse(a, 26)
    if a_inv == 0:
        raise ValueError("Affine Cipher: 'a' anahtarı 26 ile aralarında asal olmalı.")
        
    result = ""
    text = "".join(filter(str.isalpha, text)).upper()
    
    for char in text:
        y = ord(char) - ord('A')
        dec = (a_inv * (y - b + 26)) % 26
        result += chr(dec + ord('A'))
    return result

def railfence_encrypt(text, key):
    rails = int(key)
    text = "".join(filter(str.isalpha, text)).upper()
    if rails <= 1 or not text: return text

    rail = [['\n'] * len(text) for _ in range(rails)]
    row, col = 0, 0
    dir_down = False

    for char in text:
        if row == 0 or row == rails - 1:
            dir_down = not dir_down
        rail[row][col] = char
        col += 1
        row += 1 if dir_down else -1
        
    result = ""
    for r in range(rails):
        for c in range(len(text)):
            if rail[r][c] != '\n':
                result += rail[r][c]
    return result

def railfence_decrypt(text, key):
    rails = int(key)
    text = "".join(filter(str.isalpha, text)).upper()
    if rails <= 1 or not text: return text

    rail = [['\n'] * len(text) for _ in range(rails)]
    row, col = 0, 0
    dir_down = False

    for i in range(len(text)):
        if row == 0 or row == rails - 1:
            dir_down = not dir_down
        rail[row][col] = '*'
        col += 1
        row += 1 if dir_down else -1

    text_index = 0
    for r in range(rails):
        for c in range(len(text)):
            if rail[r][c] == '*' and text_index < len(text):
                rail[r][c] = text[text_index]
                text_index += 1

    result = ""
    row, col = 0, 0
    dir_down = False
    
    for i in range(len(text)):
        if row == 0 or row == rails - 1:
            dir_down = not dir_down
        result += rail[row][col]
        col += 1
        row += 1 if dir_down else -1
    return result

def hill_encrypt(text, key):
    text = "".join(filter(str.isalpha, text)).upper()
    if len(text) % 2 != 0:
        text += 'X'
    
    key_matrix = get_matrix_key(key)
    result = ""
    
    for i in range(0, len(text), 2):
        p1 = ord(text[i]) - ord('A')
        p2 = ord(text[i+1]) - ord('A')
        
        c1 = (key_matrix[0][0] * p1 + key_matrix[0][1] * p2) % 26
        c2 = (key_matrix[1][0] * p1 + key_matrix[1][1] * p2) % 26
        
        result += chr(c1 + ord('A'))
        result += chr(c2 + ord('A'))
    return result

def hill_decrypt(text, key):
    text = "".join(filter(str.isalpha, text)).upper()
    if len(text) % 2 != 0:
        raise ValueError("Hill Cipher: Deşifre edilecek metin çift uzunlukta olmalıdır.")

    key_matrix = get_matrix_key(key)
    
    determinant = (key_matrix[0][0] * key_matrix[1][1] - key_matrix[0][1] * key_matrix[1][0])
    determinant = (determinant % 26 + 26) % 26
    
    det_inv = mod_inverse(determinant, 26)
    if det_inv == 0:
        raise ValueError("Hill Cipher: Anahtar (matris) tersinir değil! Başka bir anahtar deneyin.")
        
    inv_key_matrix = [
        [(key_matrix[1][1] * det_inv) % 26, ((-key_matrix[0][1] * det_inv) % 26 + 26) % 26],
        [((-key_matrix[1][0] * det_inv) % 26 + 26) % 26, (key_matrix[0][0] * det_inv) % 26]
    ]

    result = ""
    
    for i in range(0, len(text), 2):
        c1 = ord(text[i]) - ord('A')
        c2 = ord(text[i+1]) - ord('A')
        
        p1 = (inv_key_matrix[0][0] * c1 + inv_key_matrix[0][1] * c2) % 26
        p2 = (inv_key_matrix[1][0] * c1 + inv_key_matrix[1][1] * c2) % 26
        
        result += chr(p1 + ord('A'))
        result += chr(p2 + ord('A'))
    return result



def create_playfair_matrix(key):
    key = key.upper().replace('J', 'I')
    key = "".join(dict.fromkeys(key))
    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
    
    matrix = []
    
    for char in key:
        if char not in matrix:
            matrix.append(char)
            
    for char in alphabet:
        if char not in matrix:
            matrix.append(char)
            
    matrix_5x5 = [matrix[i:i+5] for i in range(0, 25, 5)]
    return matrix_5x5

def get_playfair_coords(matrix, char):
    char = char.upper()
    for r in range(5):
        for c in range(5):
            if matrix[r][c] == char:
                return r, c
    return -1, -1

def playfair_encrypt(text, key):
    matrix = create_playfair_matrix(key)
    text = text.upper().replace('J', 'I').replace(' ', '')
    
    
    i = 0
    while i < len(text):
        if i + 1 == len(text) or text[i] == text[i+1]:
            text = text[:i+1] + 'X' + text[i+1:]
        i += 2
        
    result = ""
    for i in range(0, len(text), 2):
        c1, c2 = text[i], text[i+1]
        r1, col1 = get_playfair_coords(matrix, c1)
        r2, col2 = get_playfair_coords(matrix, c2)
        
        if r1 == r2: 
            result += matrix[r1][(col1 + 1) % 5] + matrix[r2][(col2 + 1) % 5]
        elif col1 == col2: 
            result += matrix[(r1 + 1) % 5][col1] + matrix[(r2 + 1) % 5][col2]
        else: 
            result += matrix[r1][col2] + matrix[r2][col1]
            
    return result

def playfair_decrypt(text, key):
    matrix = create_playfair_matrix(key)
    text = text.upper().replace('J', 'I').replace(' ', '')
    result = ""
    
    for i in range(0, len(text), 2):
        c1, c2 = text[i], text[i+1]
        r1, col1 = get_playfair_coords(matrix, c1)
        r2, col2 = get_playfair_coords(matrix, c2)
        
        if r1 == r2: 
            result += matrix[r1][(col1 - 1 + 5) % 5] + matrix[r2][(col2 - 1 + 5) % 5]
        elif col1 == col2: 
            result += matrix[(r1 - 1 + 5) % 5][col1] + matrix[(r2 - 1 + 5) % 5][col2]
        else: 
            result += matrix[r1][col2] + matrix[r2][col1]
            
    return result

def columnar_encrypt(text, key):
    key = key.upper().replace(' ', '')  
    text = "".join(filter(str.isalpha, text)).upper()  

    key_order = sorted(range(len(key)), key=lambda k: key[k])  
    
    num_cols = len(key)  
    num_rows = math.ceil(len(text) / num_cols)  

    cipher_matrix = [''] * num_cols  

    for i, char in enumerate(text):
        col = i % num_cols  
        cipher_matrix[col] += char 
        
    result = ""
    for index in key_order:  
        result += cipher_matrix[index]
        
    return result


def columnar_decrypt(text, key):
    key = key.upper().replace(' ', '')
    text = "".join(filter(str.isalpha, text)).upper()

    key_order = sorted(range(len(key)), key=lambda k: key[k])

    num_cols = len(key)
    len_text = len(text)
    num_rows = math.ceil(len_text / num_cols)

    col_lengths = [len_text // num_cols] * num_cols
    extra = len_text % num_cols

    for i in range(extra):
        col_lengths[i] += 1

    cipher_parts = [''] * num_cols
    current_index = 0

    for i in range(num_cols):
        col_index = key_order[i]
        length = col_lengths[col_index]
        cipher_parts[col_index] = text[current_index:current_index + length]
        current_index += length

    result = ""
    for r in range(num_rows):
        for c in range(num_cols):
            if r < len(cipher_parts[c]):
                result += cipher_parts[c][r]

    return result


def route_encrypt(text, key):
    key = int(key)
    if key <= 1:
        raise ValueError("Route Cipher anahtarı 1'den büyük olmalıdır.")
        
    text = "".join(filter(str.isalpha, text)).upper()
    num_cols = key
    num_rows = math.ceil(len(text) / num_cols)
    
    matrix = [['X'] * num_cols for _ in range(num_rows)]
    text_index = 0
    
    for r in range(num_rows):
        for c in range(num_cols):
            if text_index < len(text):
                matrix[r][c] = text[text_index]
                text_index += 1
                
    result = ""
    
    for c in range(num_cols):
        if c % 2 == 0:  
            for r in range(num_rows):
                result += matrix[r][c]
        else:  
            for r in range(num_rows - 1, -1, -1):
                result += matrix[r][c]
    return result

def route_decrypt(text, key):
    key = int(key)
    if key <= 1:
        raise ValueError("Route Cipher anahtarı 1'den büyük olmalıdır.")

    num_cols = key
    num_rows = math.ceil(len(text) / num_cols)
    
    matrix = [['\n'] * num_cols for _ in range(num_rows)]
    text_index = 0
    
    
    for c in range(num_cols):
        if c % 2 == 0: 
            for r in range(num_rows):
                if text_index < len(text):
                    matrix[r][c] = text[text_index]
                    text_index += 1
        else: 
            for r in range(num_rows - 1, -1, -1):
                if text_index < len(text):
                    matrix[r][c] = text[text_index]
                    text_index += 1
                    
    result = ""
    for r in range(num_rows):
        for c in range(num_cols):
            if matrix[r][c] != '\n' and matrix[r][c] != 'X': 
                result += matrix[r][c]
                
    return result

def polybius_encrypt(text, key='25'):
    key = key.upper() 
    if key not in ['55', '66', '88']:
        key = '55' 
        
    text = "".join(filter(str.isalpha, text)).upper().replace('J', 'I')

    if key == '55':
        table = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
        size = 5
    elif key == '66':
        table = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        size = 6
    else: 
        raise ValueError("Polybius key yalnızca 5x5 (25), 6x6 (36) destekler.")

    result = ""
    for char in text:
        if char in table:
            index = table.find(char)
            row = (index // size) + 1
            col = (index % size) + 1
            result += str(row) + str(col)
        
    return result

def polybius_decrypt(text, key='25'):
    key = key.upper() 
    if key not in ['55', '66', '88']:
        key = '55'
        
    if key == '55':
        table = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
        size = 5
    elif key == '66':
        table = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        size = 6
    else:
        raise ValueError("Polybius key yalnızca 5x5 (25), 6x6 (36) destekler.")

    result = ""
    if len(text) % 2 != 0:
        raise ValueError("Polybius şifreli metin çift uzunlukta olmalıdır.")

    for i in range(0, len(text), 2):
        row = int(text[i])
        col = int(text[i+1])
        
        
        index = (row - 1) * size + (col - 1)
        
        if 0 <= index < len(table):
            result += table[index]
        else:
            result += '?'
            
    return result



PIGPEN_MAP = {
    'A': '⍝', 'B': '⎯', 'C': '⊥', 'D': '≡', 'E': '⊖', 'F': '⊗', 'G': '⎬', 'H': '⎮', 'I': '☍',
    'J': '⧗', 'K': '⧘', 'L': '⧙', 'M': '⧚', 'N': '⧝', 'O': '⧞', 'P': '⧟', 'Q': '⧰',
    'R': '⧱', 'S': '⧲', 'T': '⧳', 'U': '⧴', 'V': '⧵', 'W': '⧶', 'X': '⧷', 'Y': '⧸', 'Z': '⧺'
}

PIGPEN_INV_MAP = {
    '⍝': 'A', '⎯': 'B', '⊥': 'C', '≡': 'D', '⊖': 'E', '⊗': 'F', '⎬': 'G', '⎮': 'H', '☍': 'I',
    '⧗': 'J', '⧘': 'K', '⧙': 'L', '⧚': 'M', '⧝': 'N', '⧞': 'O', '⧟': 'P', '⧰': 'Q',
    '⧱': 'R', '⧲': 'S', '⧳': 'T', '⧴': 'U', '⧵': 'V', '⧶': 'W', '⧷': 'X', '⧸': 'Y', '⧺': 'Z'
}

def pigpen_encrypt(text):
    text = "".join(filter(str.isalpha, text)).upper()
    result = ""
    for char in text:
        result += PIGPEN_MAP.get(char, char)  
    return result

def pigpen_decrypt(text):
    result = ""
    i = 0
    while i < len(text):
        pair = text[i:i+2]
        result += PIGPEN_INV_MAP.get(pair, '?')  
        i += 2
    return result



def _normalize_key_bytes(key, size: int) -> bytes:
    
    if isinstance(key, str):
        keyb = key.encode("utf-8")
    elif isinstance(key, (bytes, bytearray)):
        keyb = bytes(key)
    else:
        raise TypeError("Anahtar tipi desteklenmiyor (str/bytes olmalı)")

    if len(keyb) < size:
        keyb = keyb + bytes(size - len(keyb))
    elif len(keyb) > size:
        keyb = keyb[:size]
    return keyb


def _pkcs7_pad(data: bytes, block_size: int) -> bytes:
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def _pkcs7_unpad(data: bytes, block_size: int) -> bytes:
    if not data:
        raise ValueError("Padding hatası")
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        raise ValueError("Padding hatası")
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Padding hatası")
    return data[:-pad_len]


def aes_encrypt(plaintext: str, key) -> str:
   
    key = _normalize_key_bytes(key, 16)
    cipher = AES.new(key, AES.MODE_CBC)
    iv = cipher.iv
    pt = _pkcs7_pad(plaintext.encode("utf-8"), AES.block_size)
    ct = cipher.encrypt(pt)
    return base64.b64encode(iv + ct).decode("utf-8")


def aes_decrypt(ciphertext_b64: str, key) -> str:
   
    key = _normalize_key_bytes(key, 16)
    raw = base64.b64decode(ciphertext_b64)
    if len(raw) < 16:
        raise ValueError("Geçersiz AES ciphertext")
    iv = raw[:16]
    ct = raw[16:]
    if len(ct) % 16 != 0:
        raise ValueError("Geçersiz AES ciphertext")
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = cipher.decrypt(ct)
    pt = _pkcs7_unpad(pt, AES.block_size)
    return pt.decode("utf-8")


def des_encrypt(plaintext: str, key) -> str:
   
    key = _normalize_key_bytes(key, 8)
    cipher = DES.new(key, DES.MODE_CBC)
    iv = cipher.iv
    pt = _pkcs7_pad(plaintext.encode("utf-8"), DES.block_size)
    ct = cipher.encrypt(pt)
    return base64.b64encode(iv + ct).decode("utf-8")


def des_decrypt(ciphertext_b64: str, key) -> str:
   
    key = _normalize_key_bytes(key, 8)
    raw = base64.b64decode(ciphertext_b64)
    if len(raw) < 8:
        raise ValueError("Geçersiz DES ciphertext")
    iv = raw[:8]
    ct = raw[8:]
    if len(ct) % 8 != 0:
        raise ValueError("Geçersiz DES ciphertext")
    cipher = DES.new(key, DES.MODE_CBC, iv)
    pt = cipher.decrypt(ct)
    pt = _pkcs7_unpad(pt, DES.block_size)
    return pt.decode("utf-8")

def rsa_encrypt_bytes(data: bytes, public_pem: bytes) -> str:
    pub = RSA.import_key(public_pem)  
    cipher = PKCS1_OAEP.new(pub)  
    ct = cipher.encrypt(data)  
    return base64.b64encode(ct).decode("utf-8")

def rsa_decrypt_bytes(ciphertext_b64: str, private_pem: bytes) -> bytes:
    priv = RSA.import_key(private_pem)  
    cipher = PKCS1_OAEP.new(priv)  
    ct = base64.b64decode(ciphertext_b64)  
    return cipher.decrypt(ct)

def encrypt(text, key, algorithm, public_key=None):
    algorithm = algorithm.lower().replace(' ', '')
    if algorithm == 'caesar':
        return caesar_encrypt(text, key)
    elif algorithm == 'vigenere':
        return vigenere_encrypt(text, key)
    elif algorithm == 'substitution':
        return substitution_encrypt(text, key)
    elif algorithm == 'affine':
        return affine_encrypt(text, key)
    elif algorithm == 'railfence':
        return railfence_encrypt(text, key)
    elif algorithm == 'hill':
        return hill_encrypt(text, key)
    elif algorithm == 'playfair': 
        return playfair_encrypt(text, key)
    elif algorithm == 'columnar': 
        return columnar_encrypt(text, key)
    elif algorithm == 'route': 
        return route_encrypt(text, key)
    elif algorithm == 'pigpen': 
        return pigpen_encrypt(text, key)
    elif algorithm == 'polybius': 
        return polybius_encrypt(text, key)
    elif algorithm == 'aes_rsa':
        if public_key is None:
            raise ValueError("Public key gereklidir!")
        session_key = get_random_bytes(16)  
        rsa_enc_key = rsa_encrypt_bytes(session_key, public_key)  
        aes_cipher = aes_encrypt(text, session_key)  
        return aes_cipher, rsa_enc_key 
    elif algorithm == "aes":
        return aes_encrypt(text, key)
    elif algorithm == "des":
        return des_encrypt(text, key)
    elif algorithm == "aes_manual":
        return aes_manual_encrypt(text, key)
    elif algorithm == "des_manual":
        return des_manual_encrypt(text, key)
    else:
        return "Geçersiz algoritma seçimi!"


def decrypt(text, key, algorithm, private_key=None):
    algorithm = algorithm.lower().replace(' ', '')
    if algorithm == 'caesar':
        return caesar_decrypt(text, key)
    elif algorithm == 'vigenere':
        return vigenere_decrypt(text, key)
    elif algorithm == 'substitution':
        return substitution_decrypt(text, key)
    elif algorithm == 'affine':
        return affine_decrypt(text, key)
    elif algorithm == 'railfence':
        return railfence_decrypt(text, key)
    elif algorithm == 'hill':
        return hill_decrypt(text, key)
    elif algorithm == 'playfair': 
        return playfair_decrypt(text, key)
    elif algorithm == 'columnar': 
        return columnar_decrypt(text, key)
    elif algorithm == 'route': 
        return route_decrypt(text, key)
    elif algorithm == 'pigpen': 
        return pigpen_decrypt(text, key)
    elif algorithm == 'polybius': 
        return polybius_decrypt(text, key)
    elif algorithm == 'aes_rsa':
        if private_key is None:
            raise ValueError("Private key gereklidir!") 
        session_key = rsa_decrypt_bytes(key, private_key)  
        decrypted_text = aes_decrypt(text, session_key) 
        return decrypted_text
    elif algorithm == "aes":
        return aes_decrypt(text, key)
    elif algorithm == "des":
        return des_decrypt(text, key)
    elif algorithm == "aes_manual":
        return aes_manual_decrypt(text, key)
    elif algorithm == "des_manual":
        return des_manual_decrypt(text, key)
    else:
        return "Geçersiz algoritma seçimi!"
