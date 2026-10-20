import hashlib
from datetime import datetime, timezone
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature
from pydantic import BaseModel, Field
from nexus.error import CryptoError


class SignedReceipt(BaseModel):
    task_id: str
    payload_digest: str
    public_key: str
    signature: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def verify(self) -> bool:
        try:
            pub_bytes = bytes.fromhex(self.public_key)
            sig_bytes = bytes.fromhex(self.signature)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)

            message = f"{self.task_id}:{self.payload_digest}:{self.timestamp}".encode("utf-8")
            public_key.verify(sig_bytes, message)
            return True
        except (InvalidSignature, ValueError, Exception):
            return False


class ReceiptSigner:
    """Ed25519 cryptographic signer for verifiable execution receipts."""

    def __init__(self, private_key: ed25519.Ed25519PrivateKey):
        self._private_key = private_key

    @classmethod
    def generate(cls) -> "ReceiptSigner":
        return cls(ed25519.Ed25519PrivateKey.generate())

    @classmethod
    def from_private_bytes(cls, data: bytes) -> "ReceiptSigner":
        try:
            key = ed25519.Ed25519PrivateKey.from_private_bytes(data)
            return cls(key)
        except Exception as e:
            raise CryptoError(f"Failed to load Ed25519 private key: {e}") from e

    def sign(self, task_id: str, payload: str) -> SignedReceipt:
        hasher = hashlib.sha256()
        hasher.update(payload.encode("utf-8"))
        payload_digest = hasher.hexdigest()

        timestamp = datetime.now(timezone.utc).isoformat()
        message = f"{task_id}:{payload_digest}:{timestamp}".encode("utf-8")

        sig_bytes = self._private_key.sign(message)
        pub_bytes = self._private_key.public_key().public_bytes_raw()

        return SignedReceipt(
            task_id=task_id,
            payload_digest=payload_digest,
            public_key=pub_bytes.hex(),
            signature=sig_bytes.hex(),
            timestamp=timestamp,
        )
