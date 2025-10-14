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
}