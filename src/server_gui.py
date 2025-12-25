import tkinter as tk
from tkinter import ttk, scrolledtext
import socket, threading, os
from concurrent.futures import ThreadPoolExecutor
import encryptor as enc
from AES_lib import aes_decrypt

HOST = "0.0.0.0"
PORT = 50000
MAX_WORKERS = 5

RSA_DIR = "src/rsa_keys"
PRIVATE_KEY = os.path.join(RSA_DIR, "private.pem")
PUBLIC_KEY = os.path.join(RSA_DIR, "public.pem")

class ServerGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Server")
        self.geometry("600x400")

        self.private_pem = open(PRIVATE_KEY, "rb").read()
        self.public_pem = open(PUBLIC_KEY, "rb").read()

        self.executor = ThreadPoolExecutor(MAX_WORKERS)
        self.running = False

        self.logbox = scrolledtext.ScrolledText(self)
        self.logbox.pack(fill="both", expand=True)

        ttk.Button(self, text="Server Başlat", command=self.start).pack()

    def log(self, msg):
        self.logbox.insert(tk.END, msg + "\n")
        self.logbox.see(tk.END)

    def start(self):
        threading.Thread(target=self.run, daemon=True).start()

    def run(self):
        self.running = True
        with socket.socket() as s:
            s.bind((HOST, PORT))
            s.listen()
            self.log("Server dinleniyor...")
            while self.running:
                conn, addr = s.accept()
                self.executor.submit(self.handle, conn)

    def handle(self, conn):
        try:
            data = conn.recv(8192).decode()
            if data == "GET_PUBKEY":
                conn.sendall(self.public_pem)
                return

            _, _, enc_key_hex, enc_msg_hex = data.split(":", 3)

            session_key = enc.rsa_decrypt_bytes(
                bytes.fromhex(enc_key_hex),
                self.private_pem
            )

            plaintext = aes_decrypt(bytes.fromhex(enc_msg_hex), session_key)
            response = f"Çözüldü: {plaintext}"
            self.log(response)
            conn.sendall(response.encode())

        except Exception as e:
            self.log(f"Hata: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    ServerGUI().mainloop()
