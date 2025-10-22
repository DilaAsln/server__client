public class Encryptor {

    public static String encrypt(String text, String key, String algorithm) {
        switch (algorithm.toLowerCase()) {
            case "caesar":
                return caesarEncrypt(text, key);
            case "vigenere":
                return vigenereEncrypt(text, key);
            case "substitution":
                return substitutionEncrypt(text, key);
            case "affine":
                return affineEncrypt(text, key);
            case "railfence":
                return railfenceEncrypt(text, key);
            case "hill": // Hill Cipher Eklendi
                return hillEncrypt(text, key);
            default:
                return "Geçersiz algoritma seçimi!";
        }
    }

    public static String decrypt(String text, String key, String algorithm) {
        switch (algorithm.toLowerCase()) {
            case "caesar":
                return caesarDecrypt(text, key);
            case "vigenere":
                return vigenereDecrypt(text, key);
            case "substitution":
                return substitutionDecrypt(text, key);
            case "affine":
                return affineDecrypt(text, key);
            case "railfence":
                return railfenceDecrypt(text, key);
            case "hill": // Hill Cipher Eklendi
                return hillDecrypt(text, key);
            default:
                return "Geçersiz algoritma seçimi!";
        }
    }

    private static String caesarEncrypt(String text, String key) {
        int shift = Integer.parseInt(key);
        StringBuilder result = new StringBuilder();

        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base + shift) % 26 + base));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static String caesarDecrypt(String text, String key) {
        int shift = Integer.parseInt(key);
        StringBuilder result = new StringBuilder();

        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base - shift + 26) % 26 + base));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static String vigenereEncrypt(String text, String key) {
        StringBuilder result = new StringBuilder();
        key = key.toLowerCase();
        int keyIndex = 0;

        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                int shift = key.charAt(keyIndex % key.length()) - 'a';
                result.append((char) ((c - base + shift) % 26 + base));
                keyIndex++;
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static String vigenereDecrypt(String text, String key) {
        StringBuilder result = new StringBuilder();
        key = key.toLowerCase();
        int keyIndex = 0;

        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                int shift = key.charAt(keyIndex % key.length()) - 'a';
                result.append((char) ((c - base - shift + 26) % 26 + base));
                keyIndex++;
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static String substitutionEncrypt(String text, String key) {
        key = key.toUpperCase();
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder result = new StringBuilder();

        for (char c : text.toUpperCase().toCharArray()) {
            int index = alphabet.indexOf(c);
            if (index != -1)
                result.append(key.charAt(index));
            else
                result.append(c);
        }
        return result.toString();
    }

    private static String substitutionDecrypt(String text, String key) {
        key = key.toUpperCase();
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder result = new StringBuilder();

        for (char c : text.toUpperCase().toCharArray()) {
            int index = key.indexOf(c);
            if (index != -1)
                result.append(alphabet.charAt(index));
            else
                result.append(c);
        }
        return result.toString();
    }

    private static String affineEncrypt(String text, String key) {
        String[] parts = key.split(",");
        int a = Integer.parseInt(parts[0]);
        int b = Integer.parseInt(parts[1]);

        StringBuilder result = new StringBuilder();
        for (char c : text.toUpperCase().toCharArray()) {
            if (Character.isLetter(c)) {
                int x = c - 'A';
                char enc = (char) (((a * x + b) % 26) + 'A');
                result.append(enc);
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static String affineDecrypt(String text, String key) {
        String[] parts = key.split(",");
        int a = Integer.parseInt(parts[0]);
        int b = Integer.parseInt(parts[1]);

        int a_inv = modInverse(a, 26);
        StringBuilder result = new StringBuilder();

        for (char c : text.toUpperCase().toCharArray()) {
            if (Character.isLetter(c)) {
                int y = c - 'A';
                char dec = (char) (((a_inv * (y - b + 26)) % 26) + 'A');
                result.append(dec);
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    private static int modInverse(int a, int m) {
        a = a % m;
        for (int x = 1; x < m; x++) {
            if ((a * x) % m == 1)
                return x;
        }
        return 1;
    }
    
    private static String railfenceEncrypt(String text, String key) {
        int rails = Integer.parseInt(key.trim());
        text = text.replaceAll("[^a-zA-Z]", "").toUpperCase(); 
        if (rails <= 1 || text.isEmpty()) return text;

        char[][] rail = new char[rails][text.length()];
        for (int i = 0; i < rails; i++) {
            java.util.Arrays.fill(rail[i], '\n');
        }

        boolean dirDown = false;
        int row = 0, col = 0;

        for (char c : text.toCharArray()) {
            if (row == 0 || row == rails - 1) dirDown = !dirDown;
            rail[row][col++] = c;
            if (dirDown) row++; else row--;
        }

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < rails; i++) {
            for (int j = 0; j < text.length(); j++) {
                if (rail[i][j] != '\n') result.append(rail[i][j]);
            }
        }
        return result.toString();
    }

    private static String railfenceDecrypt(String text, String key) {
        int rails = Integer.parseInt(key.trim());
        text = text.replaceAll("[^a-zA-Z]", "").toUpperCase(); 
        if (rails <= 1 || text.isEmpty()) return text;

        char[][] rail = new char[rails][text.length()];
        for (int i = 0; i < rails; i++) {
            java.util.Arrays.fill(rail[i], '\n');
        }

        boolean dirDown = false;
        int row = 0, col = 0;

        for (int i = 0; i < text.length(); i++) {
            if (row == 0 || row == rails - 1) dirDown = !dirDown;
            rail[row][col++] = '*';
            if (dirDown) row++; else row--;
        }

        int textIndex = 0;
        for (int i = 0; i < rails; i++) {
            for (int j = 0; j < text.length(); j++) {
                if (rail[i][j] == '*' && textIndex < text.length()) {
                    rail[i][j] = text.charAt(textIndex++);
                }
            }
        }

        StringBuilder result = new StringBuilder();
        dirDown = false;
        row = 0; col = 0;
        for (int i = 0; i < text.length(); i++) {
            if (row == 0 || row == rails - 1) dirDown = !dirDown;
            result.append(rail[row][col++]);
            if (dirDown) row++; else row--;
        }
        return result.toString();
    }

   

    private static int[][] getMatrixKey(String key) {
        String[] parts = key.split(",");
        if (parts.length != 4) {
            throw new IllegalArgumentException("Hill Cipher anahtarı 4 tam sayıdan oluşmalıdır.");
        }
        int[][] keyMatrix = new int[2][2];
        for (int i = 0; i < 4; i++) {
            keyMatrix[i / 2][i % 2] = Integer.parseInt(parts[i].trim()) % 26;
        }
        return keyMatrix;
    }
    

    private static String hillEncrypt(String text, String key) {
        text = text.replaceAll("[^a-zA-Z]", "").toUpperCase();
        if (text.length() % 2 != 0) {
            text += 'X';
        }

        int[][] keyMatrix = getMatrixKey(key);
        StringBuilder result = new StringBuilder();

        for (int i = 0; i < text.length(); i += 2) {
            int p1 = text.charAt(i) - 'A';
            int p2 = text.charAt(i + 1) - 'A';

            int c1 = (keyMatrix[0][0] * p1 + keyMatrix[0][1] * p2) % 26;
            int c2 = (keyMatrix[1][0] * p1 + keyMatrix[1][1] * p2) % 26;

            result.append((char) (c1 + 'A'));
            result.append((char) (c2 + 'A'));
        }
        return result.toString();
    }

    private static String hillDecrypt(String text, String key) {
        text = text.replaceAll("[^a-zA-Z]", "").toUpperCase();
        int[][] keyMatrix = getMatrixKey(key);

        int determinant = (keyMatrix[0][0] * keyMatrix[1][1] - keyMatrix[0][1] * keyMatrix[1][0]);
        determinant = (determinant % 26 + 26) % 26;
        
        int detInv = modInverse(determinant, 26); 
        if (detInv == 0) {
            throw new IllegalArgumentException("Hill Cipher: Anahtar (matris) tersinir değil! Başka bir anahtar deneyin.");
        }
        
        int[][] invKeyMatrix = new int[2][2];
        invKeyMatrix[0][0] = (keyMatrix[1][1] * detInv) % 26;
        invKeyMatrix[0][1] = ((-keyMatrix[0][1] * detInv) % 26 + 26) % 26;
        invKeyMatrix[1][0] = ((-keyMatrix[1][0] * detInv) % 26 + 26) % 26;
        invKeyMatrix[1][1] = (keyMatrix[0][0] * detInv) % 26;

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < text.length(); i += 2) {
            int c1 = text.charAt(i) - 'A';
            int c2 = text.charAt(i + 1) - 'A';

            int p1 = (invKeyMatrix[0][0] * c1 + invKeyMatrix[0][1] * c2) % 26;
            int p2 = (invKeyMatrix[1][0] * c1 + invKeyMatrix[1][1] * c2) % 26;

            result.append((char) (p1 + 'A'));
            result.append((char) (p2 + 'A'));
        }
        return result.toString();
    }
}