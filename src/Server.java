import java.io.*;
import java.net.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Server {

    private static final int PORT = 9000;
    private static final String SERVER_FILES_DIR = "server_files";
    private static final String RESPONSE_FILE_NAME = "server_response.txt";
    private static final int THREAD_POOL_SIZE = 10;

    public static void main(String[] args) {
        Path dirPath = Paths.get(SERVER_FILES_DIR);
        if (!Files.exists(dirPath)) {
            try {
                Files.createDirectories(dirPath);
            } catch (IOException e) {
                System.err.println("HATA: Dosya dizini oluşturulamadı: " + e.getMessage());
                return;
            }
        }
        createResponseFile();

        ExecutorService pool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);

        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("Sunucu başlatıldı, bağlantı bekleniyor... Port: " + PORT);
            
            while (true) {
                Socket clientSocket = serverSocket.accept();
                pool.execute(new ClientHandler(clientSocket));
            }
        } catch (IOException e) {
            System.err.println("Sunucu hatası: " + e.getMessage());
        } finally {
            pool.shutdown();
        }
    }

    private static void createResponseFile() {
        Path responsePath = Paths.get(SERVER_FILES_DIR, RESPONSE_FILE_NAME);
        if (!Files.exists(responsePath)) {
            try (PrintWriter writer = new PrintWriter(Files.newBufferedWriter(responsePath))) {
                writer.println("Bu, Java Sunucusundan gelen cevaptır.");
                writer.println("Zaman damgası: " + new java.util.Date());
            } catch (IOException e) {
                System.err.println("Cevap dosyası oluşturulamadı: " + e.getMessage());
            }
        }
    }

    private static class ClientHandler implements Runnable {
        private final Socket clientSocket;

        public ClientHandler(Socket socket) {
            this.clientSocket = socket;
            System.out.println("\n--- Yeni Client bağlandı: " + socket.getInetAddress() + ":" + socket.getPort() + " ---");
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                 OutputStream os = clientSocket.getOutputStream();
                 InputStream is = clientSocket.getInputStream()) {
                
                String header = in.readLine();
                if (header == null) return;

                System.out.println("Client komutu: " + header);

                if (header.startsWith("SEND:")) {
                    String[] parts = header.split(":", 3);
                    String fileName = parts[1];
                    long fileSize = Long.parseLong(parts[2]);
                    receiveFile(is, fileName, fileSize);

                } else if (header.equals("PULL")) {
                    sendFile(os);

                } else if (header.startsWith("MESSAGE:")) {
                    String messageContent = header.substring("MESSAGE:".length());
                    System.out.println("Mesaj Alındı: " + messageContent);
                    os.write("OK: Mesajiniz alindi.\n".getBytes());
                    os.flush();
                } else {
                    System.out.println("Bilinmeyen komut alındı.");
                }

            } catch (Exception e) {
                System.err.println("Client ile iletişim hatası: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                    System.out.println("Client (" + clientSocket.getInetAddress() + ") bağlantısı kapatıldı.");
                } catch (IOException e) {
                    System.err.println("Soket kapatma hatası: " + e.getMessage());
                }
            }
        }

        private void receiveFile(InputStream is, String fileName, long fileSize) throws IOException {
            Path filePath = Paths.get(SERVER_FILES_DIR, fileName);
            System.out.println("Dosya alınıyor: " + fileName + ", Boyut: " + fileSize + " bytes");

            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                long totalBytesRead = 0;

                while (totalBytesRead < fileSize && (bytesRead = is.read(buffer)) > 0) {
                    fos.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                }

                if (totalBytesRead == fileSize) {
                    System.out.println("Dosya başarıyla kaydedildi: " + filePath);
                } else {
                    System.out.println("UYARI: Dosya eksik alındı (" + totalBytesRead + "/" + fileSize + ").");
                }
            }
        }

        private void sendFile(OutputStream os) throws IOException {
            Path responsePath = Paths.get(SERVER_FILES_DIR, RESPONSE_FILE_NAME);
            File file = responsePath.toFile();
            
            String responseHeader = "RECEIVE_OK:" + file.getName() + ":" + file.length() + "\n";
            os.write(responseHeader.getBytes());
            os.flush(); 

            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
                os.flush();
                System.out.println("Cevap dosyası başarıyla gönderildi: " + file.getName());
            }
        }
    }
}
