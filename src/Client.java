import java.io.*;
import java.net.Socket;
import java.net.ConnectException; 
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Scanner;

public class Client {

    private static final String HOST = "127.0.0.1";
    private static final int PORT = 9000;
    private static final String DOWNLOADS_DIR = "client_downloads";

    public static void main(String[] args) {
        Path dirPath = Paths.get(DOWNLOADS_DIR);
        if (!Files.exists(dirPath)) {
            try {
                Files.createDirectories(dirPath);
            } catch (IOException e) {
                System.err.println("HATA: İndirme dizini oluşturulamadı: " + e.getMessage());
                return;
            }
        }

        Scanner scanner = new Scanner(System.in);
        System.out.println("Java Client Başlatıldı.");

        while (true) {
            System.out.println("\n--- İşlem Seçin ---");
            System.out.println("1: Mesaj Gönder (MESSAGE)");
            System.out.println("2: Dosya Gönder (SEND)");
            System.out.println("3: Sunucudan Dosya Çek (PULL)");
            System.out.println("4: Çıkış");
            System.out.print("Seçiminiz (1-4): ");
            
            if (scanner.hasNextLine()) {
                String choice = scanner.nextLine().trim();
                try {
                    switch (choice) {
                        case "1":
                            sendMessage(scanner);
                            break;
                        case "2":
                            sendFile(scanner);
                            break;
                        case "3":
                            pullFile();
                            break;
                        case "4":
                            System.out.println("Client kapatılıyor.");
                            scanner.close();
                            return;
                        default:
                            System.out.println("Geçersiz seçim.");
                    }
                } catch (IOException e) {
                    System.err.println("İletişim hatası: " + e.getMessage());
                }
            }
        }
    }

    private static void sendMessage(Scanner scanner) throws IOException {
        System.out.print("Gönderilecek mesajı girin: ");
        String message = scanner.nextLine();
        String header = "MESSAGE:" + message;

        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {

            out.println(header);
            
            String response = in.readLine();
            System.out.println("Sunucu Yanıtı: " + response);

        } catch (ConnectException e) {
            System.err.println("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        }
    }

    private static void sendFile(Scanner scanner) throws IOException {
        System.out.print("Gönderilecek dosyanın tam yolunu girin: ");
        String filePathStr = scanner.nextLine();
        Path filePath = Paths.get(filePathStr);
        File file = filePath.toFile();

        if (!file.exists() || !file.isFile()) {
            System.err.println("HATA: Geçersiz dosya yolu veya dosya bulunamadı.");
            return;
        }

        long fileSize = file.length();
        String fileName = file.getName();
        String header = "SEND:" + fileName + ":" + fileSize;

        System.out.println("Dosya gönderme başlatılıyor: " + fileName + ", Boyut: " + fileSize + " bytes.");

        try (Socket socket = new Socket(HOST, PORT);
             OutputStream os = socket.getOutputStream();
             FileInputStream fis = new FileInputStream(file)) {

            os.write((header + "\n").getBytes());
            os.flush();

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();

            System.out.println("Dosya transferi başarıyla tamamlandı.");

        } catch (ConnectException e) {
            System.err.println("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        }
    }

    private static void pullFile() throws IOException {
        System.out.println("Sunucudan 'PULL' komutu gönderiliyor...");

        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             InputStream is = socket.getInputStream()) {

            out.println("PULL");

            String responseHeader = in.readLine();
            if (responseHeader == null || !responseHeader.startsWith("RECEIVE_OK:")) {
                System.err.println("HATA: Sunucudan geçersiz yanıt alındı: " + responseHeader);
                return;
            }

            String[] parts = responseHeader.split(":", 3);
            String fileName = parts[1];
            long fileSize = Long.parseLong(parts[2]);

            System.out.println("Sunucudan dosya alınıyor: " + fileName + ", Boyut: " + fileSize + " bytes.");

            Path filePath = Paths.get(DOWNLOADS_DIR, fileName);
            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                long totalBytesRead = 0;

                while (totalBytesRead < fileSize && (bytesRead = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                }

                if (totalBytesRead >= fileSize) {
                    System.out.println("Dosya başarıyla kaydedildi: " + filePath);
                } else {
                    System.err.println("UYARI: Dosya eksik çekildi (" + totalBytesRead + "/" + fileSize + ").");
                }
            }

        } catch (ConnectException e) {
            System.err.println("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        }
    }
}