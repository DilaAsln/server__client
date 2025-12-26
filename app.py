from flask import Flask, render_template, request, jsonify
from src.encryptor import encrypt, decrypt
from routes.file_routes import file_bp

app = Flask(__name__)
app.register_blueprint(file_bp) 

@app.route('/')
def home():
    return render_template("index.html")  


@app.route('/api/encrypt', methods=['POST'])
def encrypt_message():
    try:
        data = request.get_json()
        message = data['message']
        key = data.get('key', '')
        algorithm = data['algorithm']

        encrypted = encrypt(message, key, algorithm)

        return jsonify({'encryptedMessage': encrypted})

    except Exception as e:
        print("ENCRYPT ERROR:", e)   
        return jsonify({
            "message": str(e)
        }), 500

@app.route('/api/decrypt', methods=['POST'])
def decrypt_message():
    try:
        data = request.get_json()
        encrypted_message = data['encryptedMessage']
        key = data.get('key', '')
        algorithm = data['algorithm']

        decrypted = decrypt(encrypted_message, key, algorithm)

        return jsonify({'decryptedMessage': decrypted})

    except Exception as e:
        print("DECRYPT ERROR:", e)
        return jsonify({
            "message": str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True)
