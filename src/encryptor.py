import math

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


def encrypt(text, key, algorithm):
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
    else:
        return "Geçersiz algoritma seçimi!"

def decrypt(text, key, algorithm):
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
    else:
        return "Geçersiz algoritma seçimi!"