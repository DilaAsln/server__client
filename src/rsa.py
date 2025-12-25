from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import os

KEY_DIR = "src/rsa_keys"

def generate_keys():
    if not os.path.exists(KEY_DIR):
        os.makedirs(KEY_DIR)

    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    with open(f"{KEY_DIR}/private.pem", "wb") as f:
        f.write(private_key)

    with open(f"{KEY_DIR}/public.pem", "wb") as f:
        f.write(public_key)

def load_public_key():
    with open(f"{KEY_DIR}/public.pem", "rb") as f:
        return RSA.import_key(f.read())

def load_private_key():
    with open(f"{KEY_DIR}/private.pem", "rb") as f:
        return RSA.import_key(f.read())

def encrypt_key(sym_key: bytes) -> bytes:
    public_key = load_public_key()
    cipher = PKCS1_OAEP.new(public_key)
    return cipher.encrypt(sym_key)

def decrypt_key(enc_key: bytes) -> bytes:
    private_key = load_private_key()
    cipher = PKCS1_OAEP.new(private_key)
    return cipher.decrypt(enc_key)