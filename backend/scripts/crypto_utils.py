# File: backend/scripts/crypto_utils.py
import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend

# Use a fixed salt for key derivation. In a real high-security system,
# you might store/derive this differently, but for this use case, it's fine.
SALT = b'\x8d\t\xf1\x15\xca\x9f-\xe0\xf5\xc8\xbf\x9a"\xe8\xb6\xf2'

def get_key(password: str) -> bytes:
    """Derives a 32-byte key from a password string using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())

def encrypt(data: bytes, password: str) -> bytes:
    """Encrypts data using AES-GCM and returns nonce + ciphertext + tag."""
    key = get_key(password)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce is recommended for GCM
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext

def decrypt(encrypted_data: bytes, password: str) -> bytes:
    """Decrypts data using AES-GCM, expecting nonce + ciphertext + tag."""
    key = get_key(password)
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)