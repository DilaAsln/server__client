import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.io.*;
import java.net.ConnectException;
import java.net.Socket;

public class ClientGUI extends JFrame {
    private static final String HOST = "127.0.0.1";
    private static final int PORT = 12345;
    
    private JTextArea logArea;
    private JTextField messageField;
    private JTextField keyField;
    private JComboBox<String> cipherBox;
    
    public ClientGUI() {
        setTitle("Şifreleme Client GUI");
        setSize(700, 500);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout(10, 10));
        
        
        JPanel topPanel = new JPanel(new GridLayout(3, 2, 10, 10));
        topPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        topPanel.add(new JLabel("Mesaj:"));
        messageField = new JTextField();
        topPanel.add(messageField);
        
        topPanel.add(new JLabel("Anahtar:"));
        keyField = new JTextField();
        topPanel.add(keyField);
        
        topPanel.add(new JLabel("Algoritma Seç:"));
        cipherBox = new JComboBox<>(new String[]{"Caesar", "Vigenere", "Substitution", "Affine"});
        topPanel.add(cipherBox);
        
        add(topPanel, BorderLayout.NORTH);
        
        
        logArea = new JTextArea(15, 40);
        logArea.setEditable(false);
        logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        JScrollPane scrollPane = new JScrollPane(logArea);
        scrollPane.setBorder(BorderFactory.createTitledBorder("İşlem Geçmişi"));
        add(scrollPane, BorderLayout.CENTER);
        
        
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 10));
        
        JButton encryptButton = new JButton("Şifrele ve Gönder");
        encryptButton.setPreferredSize(new Dimension(150, 30));
        encryptButton.addActionListener(this::handleEncrypt);
        bottomPanel.add(encryptButton);
        
        JButton decryptButton = new JButton("Deşifrele");
        decryptButton.setPreferredSize(new Dimension(150, 30));
        decryptButton.addActionListener(this::handleDecrypt);
        bottomPanel.add(decryptButton);
        
        JButton clearButton = new JButton("Temizle");
        clearButton.setPreferredSize(new Dimension(100, 30));
        clearButton.addActionListener(e -> {
            messageField.setText("");
            keyField.setText("");
            logArea.setText("");
            log("Ekran temizlendi.");
        });
        bottomPanel.add(clearButton);
        
        add(bottomPanel, BorderLayout.SOUTH);
        
        setLocationRelativeTo(null);
        setVisible(true);
        log("=== GUI Başlatıldı ===");
        log("Server adres: " + HOST + ":" + PORT);
        log("Lütfen Server'ın çalıştığından emin olun.\n");
    }
    
    private void log(String msg) {
        SwingUtilities.invokeLater(() -> {
            logArea.append(msg + "\n");
            logArea.setCaretPosition(logArea.getDocument().getLength());
        });
    }
    
    
    private void handleEncrypt(ActionEvent e) {
        new Thread(() -> {
            String message = messageField.getText().trim();
            String key = keyField.getText().trim();
            String method = (String) cipherBox.getSelectedItem();
            
            if (message.isEmpty() || key.isEmpty()) {
                log("❌ HATA: Mesaj ve anahtar boş olamaz!");
                return;
            }
            
            try {
                log("\n--- Şifreleme İşlemi ---");
                log("Algoritma: " + method);
                log("Orijinal Mesaj: " + message);
                log("Anahtar: " + key);
                
                String encrypted = Encryptor.encrypt(message, key, method);
                log("✓ Şifrelenmiş Mesaj: " + encrypted);
                
                sendToServer(encrypted, key, method);
            } catch (Exception ex) {
                log("❌ HATA: " + ex.getMessage());
                ex.printStackTrace();
            }
        }).start();
    }
    
    
    private void handleDecrypt(ActionEvent e) {
        new Thread(() -> {
            String encryptedMessage = messageField.getText().trim();
            String key = keyField.getText().trim();
            String method = (String) cipherBox.getSelectedItem();
            
            if (encryptedMessage.isEmpty() || key.isEmpty()) {
                log("❌ HATA: Şifreli mesaj ve anahtar boş olamaz!");
                return;
            }
            
            try {
                log("\n--- Deşifreleme İşlemi ---");
                log("Algoritma: " + method);
                log("Şifreli Mesaj: " + encryptedMessage);
                log("Anahtar: " + key);
                
                String decrypted = Encryptor.decrypt(encryptedMessage, key, method);
                log("✓ Deşifrelenmiş Mesaj: " + decrypted);
                
                
                sendDecryptedToServer(decrypted, key, method);
            } catch (Exception ex) {
                log("❌ HATA: " + ex.getMessage());
                ex.printStackTrace();
            }
        }).start();
    }
    
    
    private void sendToServer(String encryptedMessage, String key, String method) {
        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
            
            log("→ Sunucuya bağlanıldı...");
            
            
            if (method.equalsIgnoreCase("Caesar")) {
                out.println("CAESAR:" + key + ":" + encryptedMessage);
            } else {
                out.println("MESSAGE:" + encryptedMessage);
            }
            
            String response = in.readLine();
            log("← Sunucu Yanıtı: " + response);
            
        } catch (ConnectException e) {
            log("❌ HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        } catch (IOException e) {
            log("❌ HATA: Mesaj gönderilemedi: " + e.getMessage());
        }
    }
    
    
    private void sendDecryptedToServer(String decryptedMessage, String key, String method) {
        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
            
            log("→ Deşifre sonucu sunucuya gönderiliyor...");
            out.println("DECRYPTED:" + method + ":" + decryptedMessage);
            
            String response = in.readLine();
            log("← Sunucu Yanıtı: " + response);
            
        } catch (ConnectException e) {
            log("⚠ Sunucuya bağlanılamadı (deşifre lokal olarak tamamlandı)");
        } catch (IOException e) {
            log("⚠ Deşifre sonucu gönderilemedi: " + e.getMessage());
        }
    }
    
    public static void main(String[] args) {
        SwingUtilities.invokeLater(ClientGUI::new);
    }
}