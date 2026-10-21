'use client';
import React, { useRef, useState } from 'react';
import { CheckCircle2, Download, FileJson, Loader2, ShieldAlert, UploadCloud, KeyRound, Hash } from 'lucide-react';
import Panel from '@/components/ui/Panel';

import Toast from '@/components/ui/Toast';

const receipt = {
  run_id: 'run-8f21c4',
  alg: 'Ed25519',
  public_key: 'MCowBQYDK2VwAyEA7h3vQ9Zc2x1fLwR8yTn0bKd4sUaE5pJmXoV6gHqIiCk=',
  payload_sha256: '3b9f1c2a7e44d0b86f5a91c3e2d7048a6b15f9c0e8d3a47b21c6f05e9a8d7c14',
  signature: 'k8Qm2xV1rN0pTzE9aYdL4uHjB6wScF3gXoIq7MvZt5KnRe2bPyA8Dh1Uc0JlWfG9sTxO4iEaVrN3mQyB6kZpCw==',
  signed_at: '2026-10-21T01:04:30Z',
};

type Result =
  | { state: 'idle' }
  | { state: 'verifying' }
  | { state: 'valid'; name: string }
  | { state: 'invalid'; name: string; reason: string };

export default function ReceiptVerifier() {
  const [result, setResult] = useState<Result>({ state: 'idle' });
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const verify = async (file: File) => {
    setResult({ state: 'verifying' });
    // Backend integration: POST /api/receipts/verify with the parsed JSON; server runs Ed25519 verify
    await new Promise((r) => setTimeout(r, 900));
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.payload_sha256 === receipt.payload_sha256 && parsed.alg === 'Ed25519') {
        setResult({ state: 'valid', name: file.name });
      } else if (!parsed.payload_sha256 || !parsed.signature) {
        setResult({ state: 'invalid', name: file.name, reason: 'Missing payload_sha256 or signature field' });
      } else {
        setResult({ state: 'invalid', name: file.name, reason: 'SHA-256 digest does not match the signed payload' });
      }
    } catch {
      setResult({ state: 'invalid', name: file.name, reason: 'File is not valid JSON' });
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) verify(f);
  };

  const downloadBundle = () => {
    const bundle = { bundle: 'nexus-audit-bundle', version: 1, receipt, spans: 5, sandbox: { pid: 48213, exec_ms: 180 } };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-audit-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
    setToast('nexus-audit-bundle.json downloaded');
  };

  return (
    <Panel
      title="Cryptographic receipt"
      subtitle="Ed25519 signature over the SHA-256 payload digest"
      action={
        <button
          type="button"
          onClick={downloadBundle}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" /> Audit bundle
        </button>
      }
    >
      <div className="space-y-4 p-5">
        <div className="space-y-3">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> PUBLIC KEY · ED25519
            </p>
            <p className="font-data break-all rounded-md border border-border bg-background p-2.5 text-xs">{receipt.public_key}</p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">
              <Hash className="h-3.5 w-3.5" /> PAYLOAD SHA-256
            </p>
            <p className="font-data break-all rounded-md border border-border bg-background p-2.5 text-xs">{receipt.payload_sha256}</p>
          </div>
          <div>
            <p className="mb-1 text-[13px] font-medium tracking-wide text-muted-foreground">Signature · signed {receipt.signed_at}</p>
            <p className="font-data break-all rounded-md border border-border bg-background p-2.5 text-xs">{receipt.signature}</p>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors duration-150 ${
            dragging ? 'border-accent bg-accent/10' : 'border-input bg-background'
          }`}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drop a receipt JSON to verify</p>
          <p className="text-xs text-muted-foreground">Checked against the signed digest and Ed25519 public key</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:border-input active:scale-95"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) verify(f);
              e.target.value = '';
            }}
          />
        </div>

        {result.state === 'verifying' && (
          <div className="fade-in flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-accent" /> Verifying signature…
          </div>
        )}
        {result.state === 'valid' && (
          <div className="fade-in flex items-start gap-2.5 rounded-md border border-success/30 bg-success/10 px-3 py-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              <span className="font-semibold text-success">Signature valid.</span>{' '}
              <span className="font-data text-xs">{result.name}</span> matches digest 3b9f1c2a…8d7c14.
            </span>
          </div>
        )}
        {result.state === 'invalid' && (
          <div className="fade-in flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>
              <span className="font-semibold text-destructive">Verification failed.</span>{' '}
              <span className="font-data text-xs">{result.name}</span> — {result.reason}.
            </span>
          </div>
        )}
        {result.state === 'idle' && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileJson className="h-3.5 w-3.5" /> No receipt loaded. Drop nexus-receipt.json above to run a check.
          </p>
        )}
      </div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </Panel>
  );
}