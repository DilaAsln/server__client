from Crypto.Cipher import DES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import hashlib

BLOCK_SIZE = 8


def derive_des_key(password: str) -> bytes:
    return hashlib.md5(password.encode()).digest()[:8]


def des_file_encrypt(data: bytes, password: str) -> bytes:
    key = derive_des_key(password)
    iv = get_random_bytes(8)

    cipher = DES.new(key, DES.MODE_CBC, iv)
    encrypted = cipher.encrypt(pad(data, BLOCK_SIZE))

    return iv + encrypted


def des_file_decrypt(data: bytes, password: str) -> bytes:
    key = derive_des_key(password)

    iv = data[:8]
    ciphertext = data[8:]

    cipher = DES.new(key, DES.MODE_CBC, iv)
    decrypted = unpad(cipher.decrypt(ciphertext), BLOCK_SIZE)

    return decrypted
