import { toast } from './dom';
import { state } from './models';
import { renderReceipts } from './views';
import { errorMessage, type Receipt } from './types';

function decodeHex(value: string | undefined, length: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || !new RegExp(`^[0-9a-fA-F]{${length}}$`).test(value)) {
    throw new Error('Malformed hexadecimal key or signature.');
  }
  return Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

/** Verify the signed Nexus message against its supplied Ed25519 public key. */
export async function verifyReceiptSignature(receipt: Receipt): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    decodeHex(receipt.public_key, 64),
    { name: 'Ed25519' },
    false,
    ['verify'],
  );
  const message = new TextEncoder().encode(
    `${receipt.task_id}:${receipt.payload_digest}:${receipt.timestamp}`,
  );
  return crypto.subtle.verify('Ed25519', key, decodeHex(receipt.signature, 128), message);
}

export async function verifyReceipt(index: number): Promise<void> {
  const receipt = state.receipts[index];
  if (!receipt || receipt.preview) return;
  if (!receipt.public_key) {
    toast('Public key missing. Import the full receipt exported by the CLI.');
    return;
  }
  try {
    receipt.verified = await verifyReceiptSignature(receipt);
    renderReceipts();
    toast(
      receipt.verified
        ? 'Signature verifies against the supplied key.'
        : 'Signature verification failed.',
    );
  } catch (error) {
    toast('Verification unavailable: ' + errorMessage(error));
  }
}
