import javax.swing.SwingUtilities;

public class Server {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(ServerGUI::new); 
    }
}