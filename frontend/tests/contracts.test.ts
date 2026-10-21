import { describe, expect, it } from 'vitest';
import { generateKeyPairSync, sign } from 'node:crypto';
import { parseAgents, parseBoard, parseReceipt, parseServerMessage } from '../src/validation';
import { verifyReceiptSignature } from '../src/receipts';
import { plan } from '../src/planner';
import type { Receipt } from '../src/types';

const manifest = {
  id: 'custom-agent',
  name: 'Custom Specialist',
  capabilities: ['custom', 'python'],
  version: '2.0.0',
  timeout_secs: 30,
};

function signedReceipt(): Receipt {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const receipt: Receipt = {
    task_id: 'unit-task',
    payload_digest: 'a'.repeat(64),
    timestamp: '2026-10-21T12:00:00+00:00',
    public_key: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex'),
  };
  receipt.signature = sign(
    null,
    Buffer.from(`${receipt.task_id}:${receipt.payload_digest}:${receipt.timestamp}`),
    privateKey,
  ).toString('hex');
  return receipt;
}

describe('API boundary validation', () => {
  it('accepts dynamic plugin manifests without assuming built-in agent IDs', () =>
    expect(parseAgents([manifest])).toEqual([manifest]));
  it('rejects malformed manifests instead of breaking registry rendering', () => {
    expect(() => parseAgents([{ ...manifest, capabilities: [42] }])).toThrow();
    expect(() => parseAgents({ error: 'unavailable' })).toThrow();
  });
  it('retains arbitrary structured blackboard payloads and versions', () => {
    const entry = {
      key: 'custom:output',
      author: 'custom-agent',
      version: 2,
      value: { nested: [false, null, '<script>'] },
      timestamp: '2026-10-21',
    };
    expect(parseBoard([entry])).toEqual([entry]);
    expect(() => parseBoard([{ ...entry, version: '2' }])).toThrow();
  });
  it('narrows each supported WebSocket event into its discriminated type', () => {
    expect(parseServerMessage({ type: 'log', message: 'Routed task' }).type).toBe('log');
    expect(
      parseServerMessage({
        type: 'blackboard_update',
        key: 'a',
        author: 'b',
        version: 1,
        value: 'text',
      }).type,
    ).toBe('blackboard_update');
    expect(
      parseServerMessage({
        type: 'sandbox_event',
        message: 'Repair',
        code: 'print(1)',
        healed_code: 'print(2)',
        status: 'repaired',
      }),
    ).toMatchObject({ type: 'sandbox_event', healed_code: 'print(2)' });
    expect(parseServerMessage({ type: 'receipt', ...signedReceipt() }).type).toBe('receipt');
  });
  it('rejects malformed or unknown server events', () => {
    for (const value of [
      null,
      [],
      { type: 'log' },
      { type: 'receipt' },
      { type: 'sandbox_event', message: {} },
      { type: 'unexpected' },
    ])
      expect(() => parseServerMessage(value)).toThrow();
  });
  it('never trusts verification flags or preview labels imported from JSON', () => {
    const receipt = signedReceipt();
    expect(parseReceipt({ ...receipt, verified: true, preview: true })).toEqual(receipt);
  });
});

describe('receipt verification', () => {
  it('verifies the message format signed by Nexus', async () =>
    expect(await verifyReceiptSignature(signedReceipt())).toBe(true));
  it('detects modification of every signed field', async () => {
    const receipt = signedReceipt();
    for (const key of ['task_id', 'payload_digest', 'timestamp'] as const)
      expect(await verifyReceiptSignature({ ...receipt, [key]: receipt[key] + 'tampered' })).toBe(
        false,
      );
  });
  it('rejects missing or malformed key/signature bytes', async () => {
    await expect(
      verifyReceiptSignature({ ...signedReceipt(), public_key: undefined }),
    ).rejects.toThrow();
    await expect(
      verifyReceiptSignature({ ...signedReceipt(), signature: 'bad' }),
    ).rejects.toThrow();
  });
});

describe('dry-run planner parity', () => {
  it('matches the backend ordering for data, coding, ops, and research', () =>
    expect(
      plan('Analyze CSV data, write Python code, deploy Docker, and summarize research').map(
        ([id]) => id,
      ),
    ).toEqual(['data-agent', 'coding-agent', 'ops-agent', 'research-agent']));
  it('falls back to research when no explicit specialty matches', () =>
    expect(plan('Help me understand this').map(([id]) => id)).toEqual(['research-agent']));
});
