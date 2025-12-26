
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import hashlib

BLOCK_SIZE = 16


def derive_key(password: str) -> bytes:
    return hashlib.sha256(password.encode()).digest()


def aes_file_encrypt(data: bytes, password: str) -> bytes:
    key = derive_key(password)
    cipher = AES.new(key, AES.MODE_ECB)
    encrypted = cipher.encrypt(pad(data, BLOCK_SIZE))
    return encrypted


def aes_file_decrypt(data: bytes, password: str) -> bytes:
    key = derive_key(password)
    cipher = AES.new(key, AES.MODE_ECB)
    decrypted = unpad(cipher.decrypt(data), BLOCK_SIZE)
    return decrypted
