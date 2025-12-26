from flask import Blueprint, request, send_file
from src.file_crypto import encrypt_file_bytes, decrypt_file_bytes
import io

file_bp = Blueprint("file", __name__)

@file_bp.route("/api/file/encrypt", methods=["POST"])
def encrypt_file():
    file = request.files["file"]
    password = request.form["password"]
    algorithm = request.form["algorithm"]

    encrypted = encrypt_file_bytes(file.read(), password, algorithm)

    return send_file(
        io.BytesIO(encrypted),
        as_attachment=True,
        download_name=file.filename + ".enc"
    )


@file_bp.route("/api/file/decrypt", methods=["POST"])
def decrypt_file():
    file = request.files["file"]
    password = request.form["password"]
    algorithm = request.form["algorithm"]

    decrypted = decrypt_file_bytes(file.read(), password, algorithm)

    return send_file(
        io.BytesIO(decrypted),
        as_attachment=True,
        download_name=file.filename.replace(".enc", "")
    )
