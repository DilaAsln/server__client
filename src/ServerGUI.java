import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.net.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ServerGUI extends JFrame {
    private static final int PORT = 12345;
    private JTextArea logArea;
    private JButton startStopButton;
    private ServerSocket serverSocket;
    private ExecutorService pool = Executors.newCachedThreadPool();
    private volatile boolean running = false;

    public ServerGUI() {
        setTitle("Şifreleme Server GUI");
        setSize(600, 400);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout(10, 10));

        logArea = new JTextArea();
        logArea.setEditable(false);
        logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        JScrollPane scrollPane = new JScrollPane(logArea);
        scrollPane.setBorder(BorderFactory.createTitledBorder("Sunucu Logları"));
        add(scrollPane, BorderLayout.CENTER);

        startStopButton = new JButton("Server'ı Başlat");
        startStopButton.addActionListener(e -> toggleServer());
        
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        bottomPanel.add(startStopButton);
        add(bottomPanel, BorderLayout.SOUTH);

        setLocationRelativeTo(null);
        setVisible(true);
        log("GUI Başlatıldı. Port: " + PORT);
    }

    private void log(String msg) {
        SwingUtilities.invokeLater(() -> {
            logArea.append(msg + "\n");
            logArea.setCaretPosition(logArea.getDocument().getLength());
        });
    }

    private void toggleServer() {
        if (!running) {
            startServer();
        } else {
            stopServer();
        }
    }

    private void startServer() {
        running = true;
        startStopButton.setText("Server Durduruluyor...");
        startStopButton.setEnabled(false);

        new Thread(() -> {
            try {
                serverSocket = new ServerSocket(PORT);
                log("[SERVER] Başlatıldı. Port " + PORT + " dinleniyor...");
                
                SwingUtilities.invokeLater(() -> {
                    startStopButton.setText("Server'ı Durdur");
                    startStopButton.setEnabled(true);
                });

                while (running) {
                    try {
                        final Socket socket = serverSocket.accept();
                        log("[SERVER] Bağlantı kabul edildi: " + socket.getInetAddress());
                        pool.submit(() -> handleClient(socket));
                    } catch (SocketException se) {
                        if (running) log("HATA: Sunucu Soketi Hatası: " + se.getMessage());
                    } catch (IOException e) {
                        log("HATA: Bağlantı Hatası: " + e.getMessage());
                    }
                }
            } catch (IOException e) {
                log("HATA: Sunucu başlatılamadı: " + e.getMessage());
                running = false;
                SwingUtilities.invokeLater(() -> {
                    startStopButton.setText("Server'ı Başlat");
                    startStopButton.setEnabled(true);
                });
            }
        }).start();
    }

    private void stopServer() {
        running = false;
        try {
            if (serverSocket != null) {
                serverSocket.close();
                log("[SERVER] Durduruluyor...");
            }
        } catch (IOException e) {
            log("HATA: Durdurma sırasında sorun: " + e.getMessage());
        } finally {
            pool.shutdownNow();
            startStopButton.setText("Server'ı Başlat");
            startStopButton.setEnabled(true);
        }
    }

    private void handleClient(Socket clientSocket) {
        try (
            BufferedReader reader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(clientSocket.getOutputStream()))
        ) {
            String message;

            while ((message = reader.readLine()) != null) {
                log("[SERVER] Gelen veri: " + message);
                String response = "Bilinmeyen komut formatı.";

                if (message.startsWith("CAESAR:")) {
                    String[] parts = message.split(":", 3);
                    int key = Integer.parseInt(parts[1]);
                    String encryptedText = parts[2];
                    
                    String decrypted = Encryptor.decrypt(encryptedText, String.valueOf(key), "caesar");
                    
                    response = "Sunucu deşifre etti (Caesar): " + decrypted;
                }
                
                else if (message.startsWith("DECRYPTED:")) {
                    String[] parts = message.split(":", 3);
                    String method = parts[1];
                    String decryptedText = parts[2];
                    response = "Client'tan deşifre sonucu alındı (" + method + "): " + decryptedText;
                }
                
                else if (message.startsWith("MESSAGE:")) {
                    String encryptedText = message.substring(8); 
                    response = "Sunucu mesajı aldı. Şifreli metin: " + encryptedText;
                }
                
                log("[SERVER] Yanıt Gönderiliyor: " + response);
                writer.write(response);
                writer.newLine();
                writer.flush();
            }
        } catch (IOException e) {
            log("⚠ Bağlantı kapandı veya hata oluştu: " + clientSocket.getInetAddress());
        }
    }

    
public static void main(String[] args) {
    try {
       
        UIManager.setLookAndFeel("javax.swing.plaf.nimbus.NimbusLookAndFeel");
    } catch (Exception ex) {
        System.err.println("Tema yüklenirken hata oluştu: " + ex.getMessage());
    }
    
    SwingUtilities.invokeLater(ServerGUI::new);
}
}