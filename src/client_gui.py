import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import socket
import threading
from Crypto.Random import get_random_bytes
import rsa
import encryptor as enc

HOST = '192.168.1.100'
PORT = 50000

class ClientGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Şifreleme Client GUI")
        self.geometry("700x500")

        self.algorithms = ["Caesar", "Vigenere", "Substitution", "Affine", "Railfence", "Hill", "Playfair",
                           "Columnar", "Route", "Pigpen", "Polybius", "DES", "AES", "AES_RSA"]

        self.server_public_pem = None

        self.rsa_private_pem, self.rsa_public_pem = self.load_keys()  
        if not self.rsa_public_pem:
            self.fetch_server_public_key()

        self._create_widgets()
        self.log("=== GUI Başlatıldı ===")
        self.log(f"Server adres: {HOST}:{PORT}")
        self.log("AES_RSA seçersen public key otomatik alınır.")

    def _create_widgets(self):
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill='both', expand=True)

        input_frame = ttk.Frame(main_frame)
        input_frame.pack(fill='x', pady=5)

        ttk.Label(input_frame, text="Mesaj:", font=("Arial", 12)).grid(row=0, column=0, padx=5, pady=5, sticky='w')
        self.message_text = scrolledtext.ScrolledText(input_frame, height=3, font=("Monospaced", 12))
        self.message_text.grid(row=0, column=1, padx=5, pady=5, sticky='ew')

        ttk.Label(input_frame, text="Anahtar:", font=("Arial", 12)).grid(row=1, column=0, padx=5, pady=5, sticky='w')
        self.key_entry = ttk.Entry(input_frame, font=("Monospaced", 12))
        self.key_entry.grid(row=1, column=1, padx=5, pady=5, sticky='ew')

        ttk.Label(input_frame, text="RSA Public Key (PEM):", font=("Arial", 12)).grid(row=2, column=0, padx=5, pady=5, sticky='w')
        self.client_pubkey_input = ttk.Entry(input_frame, font=("Monospaced", 12))
        self.client_pubkey_input.grid(row=2, column=1, padx=5, pady=5, sticky='ew')

        ttk.Label(input_frame, text="Algoritma Seç:", font=("Arial", 12)).grid(row=3, column=0, padx=5, pady=5, sticky='w')
        self.cipher_var = tk.StringVar(value="AES_RSA")
        cipher_combo = ttk.Combobox(input_frame, textvariable=self.cipher_var, values=self.algorithms, font=("Arial", 12))
        cipher_combo.grid(row=3, column=1, padx=5, pady=5, sticky='ew')

        input_frame.grid_columnconfigure(1, weight=1)

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill='x', pady=10)

        ttk.Button(button_frame, text="Şifrele ve Gönder", command=self.handle_encrypt).pack(side='left', padx=5, fill='x', expand=True)

    def log(self, msg):
        print(msg)

    def load_keys(self):
        try:
            with open("private.pem", "rb") as private_file:
                private_key = private_file.read()
            with open("public.pem", "rb") as public_file:
                public_key = public_file.read()
            return private_key, public_key
        except FileNotFoundError:
            return None, None

    def fetch_server_public_key(self):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((HOST, PORT))
                s.sendall(b"GET_PUBKEY")
                pem = s.recv(8192)
                if not pem or b"BEGIN PUBLIC KEY" not in pem:
                    raise ValueError("Sunucudan geçerli public key alınamadı.")
                self.server_public_pem = pem
                self.client_pubkey_input.delete(0, tk.END)
                self.client_pubkey_input.insert(tk.END, pem.decode('utf-8'))
                self.log("✓ Public key alındı ve input'a yazıldı.")
                return pem
        except Exception as e:
            self.log(f"Error: {str(e)}")

    def handle_encrypt(self):
        message = self.message_text.get("1.0", tk.END).strip()
        key = self.key_entry.get().strip()
        method = self.cipher_var.get()

        if not message:
            self.log("HATA: Mesaj boş olamaz!")
            return

        self.log("\n--- Şifreleme İşlemi ---")

        try:
            if method.upper() == "AES_RSA":
                if self.server_public_pem is None:
                    self.log("→ Sunucudan RSA public key alınıyor...")
                    self.fetch_server_public_key()
                    self.log("✓ Public key alındı.")

                session_key = get_random_bytes(16)
                rsa_enc_key = enc.rsa_encrypt_bytes(session_key, self.server_public_pem)
                aes_cipher = enc.aes_encrypt(message, session_key)

                self.log("✓ AES_RSA paket hazırlandı.")
                threading.Thread(target=self.send_to_server, args=(aes_cipher, rsa_enc_key, "AES_RSA")).start()
                return
        except Exception as e:
            self.log(f"Şifreleme Hatası: {e}")
            messagebox.showerror("Şifreleme Hatası", str(e))
            
    def send_to_server(self, encrypted_message, rsa_enc_key, method):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((HOST, PORT))
                self.log("→ Sunucuya bağlanıldı...")

                message_to_send = f"METHOD:{method.upper()}:{rsa_enc_key.hex()}:{encrypted_message}"
                s.sendall(message_to_send.encode('utf-8'))

                response = s.recv(8192).decode('utf-8', errors='ignore')
                self.log(f"← Sunucu Yanıtı: {response}")

        except ConnectionRefusedError:
            self.log("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?")
        except Exception as e:
            self.log(f"HATA: Mesaj gönderilemedi: {e}")
