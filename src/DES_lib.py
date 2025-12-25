from Crypto.Cipher import DES
from Crypto.Random import get_random_bytes
from src.rsa import generate_keys, encrypt_key, decrypt_key
import base64

BLOCK_SIZE = 8

def pad(data: bytes) -> bytes:
    padding_len = BLOCK_SIZE - len(data) % BLOCK_SIZE
    return data + bytes([padding_len]) * padding_len

def unpad(data: bytes) -> bytes:
    return data[:-data[-1]]

def generate_key() -> bytes:
    return get_random_bytes(8)

def des_lib_encrypt(message: str):
    generate_keys()

    key = generate_key()
    iv = get_random_bytes(8)

    cipher = DES.new(key, DES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(message.encode()))

    encrypted_key = encrypt_key(key)

    return {
        "ciphertext": base64.b64encode(iv + ciphertext).decode(),
        "encrypted_key": base64.b64encode(encrypted_key).decode(),
        "algorithm": "des_lib"
    }

def des_lib_decrypt(ciphertext_b64: str, encrypted_key_b64: str):
    data = base64.b64decode(ciphertext_b64)
    iv = data[:8]
    ciphertext = data[8:]

    key = decrypt_key(base64.b64decode(encrypted_key_b64))

    cipher = DES.new(key, DES.MODE_CBC, iv)
    plaintext = unpad(cipher.decrypt(ciphertext))

    return plaintext.decode()
