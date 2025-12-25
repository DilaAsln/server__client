import tkinter as tk
from tkinter import ttk, scrolledtext
import socket, threading
from Crypto.Random import get_random_bytes
import encryptor as enc
from AES_lib import aes_encrypt

HOST = "127.0.0.1"
PORT = 50000

class ClientGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Client")
        self.geometry("700x500")

        self.server_pub = None

        self.msg = scrolledtext.ScrolledText(self, height=5)
        self.msg.pack(fill="x")

        ttk.Button(self, text="Gönder (AES + RSA)", command=self.send).pack()

        self.log = scrolledtext.ScrolledText(self)
        self.log.pack(fill="both", expand=True)

    def fetch_pubkey(self):
        with socket.socket() as s:
            s.connect((HOST, PORT))
            s.sendall(b"GET_PUBKEY")
            self.server_pub = s.recv(8192)

    def send(self):
        if not self.server_pub:
            self.fetch_pubkey()

        message = self.msg.get("1.0", tk.END).strip()
        session_key = get_random_bytes(16)

        enc_key = enc.rsa_encrypt_bytes(session_key, self.server_pub)
        cipher = aes_encrypt(message, session_key)

        payload = f"METHOD:AES_RSA:{enc_key.hex()}:{cipher.hex()}"

        threading.Thread(target=self._send, args=(payload,), daemon=True).start()

    def _send(self, payload):
        with socket.socket() as s:
            s.connect((HOST, PORT))
            s.sendall(payload.encode())
            resp = s.recv(8192).decode()
            self.log.insert(tk.END, resp + "\n")

if __name__ == "__main__":
    ClientGUI().mainloop()
