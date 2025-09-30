import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.io.*;
import java.net.ConnectException;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Scanner;

public class FileTransferGUI extends JFrame {

    private static final String HOST = "127.0.0.1";
    private static final int PORT = 9000;
    private static final String DOWNLOADS_DIR = "client_downloads";
    private static final int BUFFER_SIZE = 4096;

    
    private JTextArea logArea;
    private JTextField messageEntry;
    private JTextField filePathField;
    private String selectedFilePath = "";

    public FileTransferGUI() {
        
        Path dirPath = Paths.get(DOWNLOADS_DIR);
        if (!Files.exists(dirPath)) {
            try {
                Files.createDirectories(dirPath);
            } catch (IOException e) {
                log("HATA: İndirme dizini oluşturulamadı: " + e.getMessage());
            }
        }
        
        
        setTitle("Java Socket Transfer GUI");
        setSize(700, 550);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout(10, 10)); 

        
        JPanel messagePanel = new JPanel(new BorderLayout(5, 5));
        messagePanel.setBorder(BorderFactory.createTitledBorder("Mesaj Gönder"));
        
        messageEntry = new JTextField("Merhaba Sunucu!", 30);
        JButton sendMessageButton = new JButton("Mesaj Gönder");
        sendMessageButton.addActionListener(this::handleSendMessage);
        
        messagePanel.add(messageEntry, BorderLayout.CENTER);
        messagePanel.add(sendMessageButton, BorderLayout.EAST);
        
        
        JPanel filePanel = new JPanel(new GridLayout(3, 1, 10, 5));
        filePanel.setBorder(BorderFactory.createTitledBorder("Dosya Transferi"));
        
        
        JPanel selectPanel = new JPanel(new BorderLayout(5, 5));
        filePathField = new JTextField("Dosya Seçiniz...", 30);
        filePathField.setEditable(false);
        JButton selectFileButton = new JButton("Dosya Seç");
        selectFileButton.addActionListener(this::handleSelectFile);
        selectPanel.add(filePathField, BorderLayout.CENTER);
        selectPanel.add(selectFileButton, BorderLayout.EAST);
        filePanel.add(selectPanel);
        
        
        JPanel transferButtonPanel = new JPanel(new GridLayout(1, 2, 10, 5));
        JButton sendFileButton = new JButton("Sunucuya Dosya Gönder");
        JButton pullFileButton = new JButton("Sunucudan Dosya Çek");
        
        sendFileButton.addActionListener(this::handleSendFile);
        pullFileButton.addActionListener(this::handlePullFile);
        
        transferButtonPanel.add(sendFileButton);
        transferButtonPanel.add(pullFileButton);
        filePanel.add(transferButtonPanel);

        
        JPanel controlPanel = new JPanel(new GridLayout(2, 1, 10, 10));
        controlPanel.add(messagePanel);
        controlPanel.add(filePanel);
        add(controlPanel, BorderLayout.NORTH);

        
        logArea = new JTextArea(15, 50);
        logArea.setEditable(false);
        logArea.setLineWrap(true);
        JScrollPane logScrollPane = new JScrollPane(logArea);
        
        add(logScrollPane, BorderLayout.CENTER);

        
        setVisible(true);
        log("GUI Başlatıldı. Lütfen Server'ın çalıştığından emin olun.");
    }
    
   

    private void log(String message) {
        
        SwingUtilities.invokeLater(() -> {
            logArea.append(message + "\n");
            logArea.setCaretPosition(logArea.getDocument().getLength()); 
        });
    }

    private void executeAction(Runnable action) {
        
        new Thread(action).start();
    }
    
    
    
    private void handleSelectFile(ActionEvent e) {
        JFileChooser fileChooser = new JFileChooser();
        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File selectedFile = fileChooser.getSelectedFile();
            selectedFilePath = selectedFile.getAbsolutePath();
            filePathField.setText(selectedFile.getName());
            log("Dosya seçildi: " + selectedFile.getName());
        }
    }

    private void handleSendMessage(ActionEvent e) {
        executeAction(() -> sendMessage(messageEntry.getText()));
    }
    
    private void handleSendFile(ActionEvent e) {
        executeAction(this::sendFile);
    }
    
    private void handlePullFile(ActionEvent e) {
        executeAction(this::pullFile);
    }
    
    

    private void sendMessage(String message) {
        if (message.isEmpty()) {
            log("HATA: Lütfen bir mesaj girin.");
            return;
        }
        
        log("Mesaj gönderiliyor: '" + message + "'");
        String header = "MESSAGE:" + message;

        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {

            out.println(header);
            
            String response = in.readLine();
            log("Sunucu Yanıtı: " + response);
            
        } catch (ConnectException e) {
            log("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        } catch (IOException e) {
            log("HATA: Mesaj gönderilemedi: " + e.getMessage());
        }
    }

    private void sendFile() {
        if (selectedFilePath.isEmpty()) {
            log("HATA: Lütfen önce bir dosya seçin.");
            return;
        }

        File file = new File(selectedFilePath);
        if (!file.exists() || !file.isFile()) {
            log("HATA: Geçersiz dosya yolu veya dosya bulunamadı.");
            return;
        }

        long fileSize = file.length();
        String fileName = file.getName();
        String header = "SEND:" + fileName + ":" + fileSize;

        log("Dosya gönderme başlatılıyor: " + fileName + ", Boyut: " + fileSize + " bytes.");

        try (Socket socket = new Socket(HOST, PORT);
             OutputStream os = socket.getOutputStream();
             FileInputStream fis = new FileInputStream(file)) {

            
            os.write((header + "\n").getBytes());
            os.flush();

            
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();

            log("Dosya transferi başarıyla tamamlandı.");

        } catch (ConnectException e) {
            log("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        } catch (IOException e) {
            log("HATA: Dosya gönderilemedi: " + e.getMessage());
        }
    }

    private void pullFile() {
        log("Sunucudan 'PULL' komutu gönderiliyor...");

        try (Socket socket = new Socket(HOST, PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             InputStream is = socket.getInputStream()) {

            
            out.println("PULL");

            
            String responseHeader = in.readLine();
            if (responseHeader == null || !responseHeader.startsWith("RECEIVE_OK:")) {
                log("HATA: Sunucudan geçersiz yanıt alındı: " + responseHeader);
                return;
            }

            String[] parts = responseHeader.split(":", 3);
            String fileName = parts[1];
            long fileSize = Long.parseLong(parts[2]);

            log("Sunucudan dosya alınıyor: " + fileName + ", Boyut: " + fileSize + " bytes.");

            
            Path filePath = Paths.get(DOWNLOADS_DIR, fileName);
            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int bytesRead;
                long totalBytesRead = 0;

                while (totalBytesRead < fileSize && (bytesRead = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                }

                if (totalBytesRead >= fileSize) {
                    log("Dosya başarıyla kaydedildi: " + filePath.toAbsolutePath());
                } else {
                    log("UYARI: Dosya eksik çekildi (" + totalBytesRead + "/" + fileSize + ").");
                }
            }

        } catch (ConnectException e) {
            log("HATA: Sunucuya bağlanılamadı. Server çalışıyor mu?");
        } catch (IOException e) {
            log("HATA: Dosya çekilemedi: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(FileTransferGUI::new);
    }
}
