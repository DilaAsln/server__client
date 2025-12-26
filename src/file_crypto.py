
from src.file_algorithms.aes_file import (
    aes_file_encrypt,
    aes_file_decrypt
)

from src.file_algorithms.des_file import (
    des_file_encrypt,
    des_file_decrypt
)


def encrypt_file_bytes(data: bytes, password: str, algorithm: str) -> bytes:
    if algorithm == "aes":
        return aes_file_encrypt(data, password)
    elif algorithm == "des":
        return des_file_encrypt(data, password)
    else:
        raise ValueError("Desteklenmeyen dosya şifreleme algoritması")


def decrypt_file_bytes(data: bytes, password: str, algorithm: str) -> bytes:
    if algorithm == "aes":
        return aes_file_decrypt(data, password)
    elif algorithm == "des":
        return des_file_decrypt(data, password)
    else:
        raise ValueError("Desteklenmeyen dosya deşifreleme algoritması")
