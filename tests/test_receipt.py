import pytest
from nexus.trust.receipt import ReceiptSigner, SignedReceipt

def test_ed25519_receipt_signing_and_verification():
    signer = ReceiptSigner.generate()
    receipt = signer.sign("task-42", "final result: accurate analysis")

    assert isinstance(receipt, SignedReceipt)
    assert receipt.task_id == "task-42"
    assert len(receipt.payload_digest) == 64  # sha256 hex
    assert len(receipt.public_key) == 64      # ed25519 public key 32 bytes hex
    assert len(receipt.signature) == 128     # ed25519 signature 64 bytes hex

    # Untampered passes
    assert receipt.verify() is True

    # Tampered payload fails
    tampered_payload = receipt.model_copy(update={"payload_digest": "0" * 64})
    assert tampered_payload.verify() is False

    # Tampered signature fails
    tampered_sig = receipt.model_copy(update={"signature": "f" * 128})
    assert tampered_sig.verify() is False
