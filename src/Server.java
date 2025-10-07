import java.io.*;
import java.net.*;

public class Server {

    public static void main(String[] args) {
        int port = 12345;
        System.out.println("[SERVER] Başlatılıyor...");

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("[SERVER] Port " + port + " dinleniyor...");

            while (true) {
                Socket socket = serverSocket.accept();
                System.out.println("[SERVER] Bağlantı kabul edildi: " + socket.getInetAddress());

                new Thread(() -> handleClient(socket)).start();
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void handleClient(Socket clientSocket) {
    try (
        BufferedReader reader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(clientSocket.getOutputStream()))
    ) {
        String message;

        while ((message = reader.readLine()) != null) {
            System.out.println("[SERVER] Gelen veri: " + message);

            
            if (message.startsWith("MESSAGE:")) {
                String encryptedText = message.substring(8); 
                System.out.println("[SERVER] Şifreli mesaj alındı: " + encryptedText);

                
                writer.write("Sunucu mesajı aldı. Şifreli metin: " + encryptedText);
                writer.newLine();
                writer.flush();
            }
            
            else if (message.startsWith("CAESAR:")) {
                String[] parts = message.split(":", 3);
                int key = Integer.parseInt(parts[1]);
                String encryptedText = parts[2];
                String decrypted = decryptCaesar(encryptedText, key);

                writer.write("Sunucu mesajı aldı. Deşifre sonucu: " + decrypted);
                writer.newLine();
                writer.flush();
            }
            
            else {
                System.out.println("[SERVER] Bilinmeyen format: " + message);
            }
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
}

    
    private static String decryptCaesar(String text, int key) {
        return encryptCaesar(text, 26 - (key % 26)); 
    }

    private static String encryptCaesar(String text, int key) {
        StringBuilder result = new StringBuilder();
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                c = (char) ((c - base + key) % 26 + base);
            }
            result.append(c);
        }
        return result.toString();
    }
}
