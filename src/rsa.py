from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64

def rsa_generate_keypair(bits: int = 2048):
    key = RSA.generate(bits)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    with open("private.pem", "wb") as private_file:
        private_file.write(private_key)
    with open("public.pem", "wb") as public_file:
        public_file.write(public_key)
    
    return private_key, public_key


def rsa_encrypt(plaintext: str, public_pem: bytes) -> str:
    pub_key = RSA.import_key(public_pem)
    cipher = PKCS1_OAEP.new(pub_key)
    ct = cipher.encrypt(plaintext.encode("utf-8"))
    return base64.b64encode(ct).decode("utf-8")

def rsa_decrypt(ciphertext_b64: str, private_pem: bytes) -> str:
    priv_key = RSA.import_key(private_pem)
    cipher = PKCS1_OAEP.new(priv_key)
    ct = base64.b64decode(ciphertext_b64)
    return cipher.decrypt(ct).decode("utf-8")

def rsa_encrypt_bytes(data: bytes, public_pem: bytes) -> str:
    pub_key = RSA.import_key(public_pem)
    cipher = PKCS1_OAEP.new(pub_key)
    ct = cipher.encrypt(data)
    return base64.b64encode(ct).decode("utf-8")


def rsa_decrypt_bytes(ciphertext_b64: str, private_pem: bytes) -> bytes:
    priv_key = RSA.import_key(private_pem)
    cipher = PKCS1_OAEP.new(priv_key)
    ct = base64.b64decode(ciphertext_b64)
    return cipher.decrypt(ct)

def load_keys():
    try:
        with open("private.pem", "rb") as private_file:
            private_key = private_file.read()
        with open("public.pem", "rb") as public_file:
            public_key = public_file.read()
        return private_key, public_key
    except FileNotFoundError:
        return None, None
