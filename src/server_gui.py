import tkinter as tk
from tkinter import ttk, scrolledtext
import socket
import threading
from concurrent.futures import ThreadPoolExecutor
import encryptor as enc

HOST = '0.0.0.0'
PORT = 50000
MAX_WORKERS = 10

class ServerGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Şifreleme Server GUI")
        self.geometry("600x400")
        
        self.running = False
        self.server_socket = None
        self.thread_pool = ThreadPoolExecutor(max_workers=MAX_WORKERS)
        
        self.algorithms = ["Caesar", "Vigenere", "Substitution", "Affine", "Railfence", "Hill","Playfair", "Columnar", "Route", "Pigpen", "Polybius"]

        self._create_widgets()
        self.log("GUI Başlatıldı. Port: " + str(PORT))

    def _create_widgets(self):
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill='both', expand=True)
        
        ttk.Label(main_frame, text="Sunucu Logları:", font=("Arial", 12)).pack(anchor='w', pady=(5, 5))
        self.log_text = scrolledtext.ScrolledText(main_frame, height=15, font=("Monospaced", 10))
        self.log_text.pack(fill='both', expand=True)

        self.start_stop_button = ttk.Button(main_frame, text="Server'ı Başlat", 
                                            command=self.toggle_server)
        self.start_stop_button.pack(fill='x', pady=10)

    def log(self, msg):
        self.log_text.insert(tk.END, msg + "\n")
        self.log_text.see(tk.END)
        self.update_idletasks()

    def toggle_server(self):
        if not self.running:
            threading.Thread(target=self._start_server_thread).start()
        else:
            self._stop_server()

    def _start_server_thread(self):
        self.running = True
        self.start_stop_button.config(text="Server Durduruluyor...", state=tk.DISABLED)

        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.bind((HOST, PORT))
            self.server_socket.listen()
            self.log(f"[SERVER] Başlatıldı. Port {PORT} dinleniyor...")
            
            self.start_stop_button.config(text="Server'ı Durdur", state=tk.NORMAL)

            while self.running:
                conn, addr = self.server_socket.accept()
                self.log(f"[SERVER] Bağlantı kabul edildi: {addr}")
                self.thread_pool.submit(self.handle_client, conn, addr)

        except Exception as e:
            if self.running:
                self.log(f"HATA: Sunucu başlatılamadı veya soket hatası: {e}")
            self.running = False
            self.start_stop_button.config(text="Server'ı Başlat", state=tk.NORMAL)

    def _stop_server(self):
        self.running = False
        self.log("[SERVER] Durduruluyor...")
        
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
        
        self.thread_pool.shutdown(wait=False)
        self.start_stop_button.config(text="Server'ı Başlat", state=tk.NORMAL)

    def handle_client(self, conn, addr):
        try:
            data = conn.recv(1024).decode('utf-8').strip()
            self.log(f"[SERVER] Gelen veri: {data}")

            response = "Bilinmeyen komut formatı."
            
            if data.startswith("METHOD:"):
                
                try:
                    parts = data.split(":", 3)
                    if len(parts) == 4:
                        method_full = parts[1].lower() 
                        key = parts[2]
                        encrypted_text = parts[3]

                        decrypted = enc.decrypt(encrypted_text, key, method_full)
                        response = f"Sunucu deşifre etti ({method_full.capitalize()}): {decrypted}"

                except Exception as e:
                    
                    method_name = parts[1].capitalize() if len(parts) > 1 else "Bilinmeyen"
                    response = f"Deşifre hatası ({method_name}): {e}"
                    
            
            self.log(f"[SERVER] Yanıt Gönderiliyor: {response}")
            conn.sendall(response.encode('utf-8'))
            
        except Exception as e:
            self.log(f"⚠ Bağlantı kapandı veya hata oluştu: {addr}. Hata: {e}")
        finally:
            conn.close()


if __name__ == '__main__':
    app = ServerGUI()
    app.mainloop()