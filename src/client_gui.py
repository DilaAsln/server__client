import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import socket
import threading
import encryptor as enc

HOST = '127.0.0.1'
PORT = 12345

class ClientGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Şifreleme Client GUI")
        self.geometry("700x500")
        
        self.algorithms = ["Caesar", "Vigenere", "Substitution", "Affine", "Railfence", "Hill"]

        self._create_widgets()
        self.log("=== GUI Başlatıldı ===")
        self.log(f"Server adres: {HOST}:{PORT}")

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

        ttk.Label(input_frame, text="Algoritma Seç:", font=("Arial", 12)).grid(row=2, column=0, padx=5, pady=5, sticky='w')
        self.cipher_var = tk.StringVar(value=self.algorithms[0])
        cipher_combo = ttk.Combobox(input_frame, textvariable=self.cipher_var, values=self.algorithms, font=("Arial", 12))
        cipher_combo.grid(row=2, column=1, padx=5, pady=5, sticky='ew')
        
        input_frame.grid_columnconfigure(1, weight=1)

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill='x', pady=10)

        ttk.Button(button_frame, text="Şifrele ve Gönder", command=self.handle_encrypt).pack(side='left', padx=5, fill='x', expand=True)
        ttk.Button(button_frame, text="Deşifrele (Lokal)", command=self.handle_decrypt).pack(side='left', padx=5, fill='x', expand=True)
        ttk.Button(button_frame, text="Temizle", command=self.clear_fields).pack(side='left', padx=5, fill='x', expand=True)

        ttk.Label(main_frame, text="İşlem Geçmişi:", font=("Arial", 12)).pack(anchor='w', pady=(5, 0))
        self.log_text = scrolledtext.ScrolledText(main_frame, height=15, font=("Monospaced", 10))
        self.log_text.pack(fill='both', expand=True)

    def log(self, msg):
        self.log_text.insert(tk.END, msg + "\n")
        self.log_text.see(tk.END)
        self.update_idletasks()

    def clear_fields(self):
        self.message_text.delete("1.0", tk.END)
        self.key_entry.delete(0, tk.END)
        self.log_text.delete("1.0", tk.END)
        self.log("Ekran temizlendi.")

    def handle_encrypt(self):
        message = self.message_text.get("1.0", tk.END).strip()
        key = self.key_entry.get().strip()
        method = self.cipher_var.get()

        if not message or not key:
            self.log("HATA: Mesaj ve anahtar boş olamaz!")
            return

        self.log("\n--- Şifreleme İşlemi ---")
        try:
            encrypted = enc.encrypt(message, key, method)
            self.log(f"✓ Şifrelenmiş Mesaj: {encrypted}")
            threading.Thread(target=self.send_to_server, args=(encrypted, key, method)).start()
        except Exception as e:
            self.log(f"Şifreleme Hatası: {e}")
            messagebox.showerror("Şifreleme Hatası", str(e))

    def handle_decrypt(self):
        encrypted_message = self.message_text.get("1.0", tk.END).strip()
        key = self.key_entry.get().strip()
        method = self.cipher_var.get()

        if not encrypted_message or not key:
            self.log("HATA: Şifreli mesaj ve anahtar boş olamaz!")
            return

        self.log("\n--- Lokal Deşifreleme İşlemi ---")
        try:
            decrypted = enc.decrypt(encrypted_message, key, method)
            self.log(f"✓ Deşifrelenmiş Mesaj: {decrypted}")
        except Exception as e:
            self.log(f"Deşifreleme Hatası: {e}")
            messagebox.showerror("Deşifreleme Hatası", str(e))

    def send_to_server(self, encrypted_message, key, method):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((HOST, PORT))
                self.log("→ Sunucuya bağlanıldı...")
                
                message_to_send = f"METHOD:{method.upper()}:{key}:{encrypted_message}"
                    
                s.sendall(message_to_send.encode('utf-8'))
                
                response = s.recv(1024).decode('utf-8')
                self.log(f"← Sunucu Yanıtı: {response}")

        except ConnectionRefusedError:
            self.log("❌ HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?")
        except Exception as e:
            self.log(f"❌ HATA: Mesaj gönderilemedi: {e}")


if __name__ == '__main__':
    app = ClientGUI()
    app.mainloop()