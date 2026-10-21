import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Key,
  Copy,
  Check,
  Clock,
  Hash,
  Fingerprint,
  Lock,
  ArrowRight,
  Code2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import type { SignedReceipt } from '../../types/nexus';

export interface ReceiptCardProps {
  receipt?: SignedReceipt | null;
  className?: string;
  onVerify?: (receipt: SignedReceipt) => void;
}

type CopyableField = 'digest' | 'pubkey' | 'signature' | 'all';

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receipt,
  className = '',
  onVerify,
}) => {
  const [copiedField, setCopiedField] = useState<CopyableField | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleCopy = async (text: string, field: CopyableField) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField((curr) => (curr === field ? null : curr));
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const isVerified = receipt ? receipt.verified !== false : false;

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
      data-testid="receipt-card"
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-paper border border-line text-green">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
                Cryptographic Execution Receipt
              </h2>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-line bg-paper text-gold font-semibold">
                Ed25519
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Zero-trust mathematical proof guaranteeing payload provenance and non-repudiation
            </p>
          </div>
        </div>

        {/* Verification Badge */}
        {receipt && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border shadow-xs ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/50'
                  : 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-400/50'
              }`}
            >
              {isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✅ Ed25519 Signature Verified</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  <span>❌ Signature Verification Failed</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-5 sm:p-6 flex-1">
        {!receipt ? (
          /* Empty State: Zero-Trust Explainer */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-paper/30 rounded-lg border border-line/60">
            <div className="w-14 h-14 rounded-full border border-line bg-paper flex items-center justify-center mb-4 text-gold shadow-2xs">
              <Lock className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink mb-2">
              Zero-Trust Cryptographic Audit
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-lg mb-6 leading-relaxed">
              No signed execution receipt generated yet. Every subtask orchestrated by Nexus is sealed with an
              asymmetric Ed25519 digital signature over the task ID, timestamp, and SHA-256 payload digest.
            </p>

            {/* Zero-Trust Architecture Flow Card */}
            <div className="w-full max-w-xl p-4 sm:p-5 rounded-lg border border-line bg-surface text-left">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold mb-3 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-olive" />
                <span>Verification Pipeline Architecture:</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                {/* Step 1: Payload Digest */}
                <div className="w-full sm:w-1/3 p-3 rounded bg-paper border border-line flex flex-col gap-1">
                  <div className="text-[10px] uppercase text-muted font-semibold">Step 01</div>
                  <div className="font-bold text-ink flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-olive" />
                    <span>SHA-256</span>
                  </div>
                  <div className="text-[10px] text-muted truncate">Payload Digest</div>
                </div>

                <ArrowRight className="w-4 h-4 text-line shrink-0 hidden sm:block" />

                {/* Step 2: Message Serialization */}
                <div className="w-full sm:w-1/3 p-3 rounded bg-paper border border-line flex flex-col gap-1">
                  <div className="text-[10px] uppercase text-muted font-semibold">Step 02</div>
                  <div className="font-bold text-ink flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-gold" />
                    <span>Binding</span>
                  </div>
                  <div className="text-[10px] text-muted truncate">Task ID + Time</div>
                </div>

                <ArrowRight className="w-4 h-4 text-line shrink-0 hidden sm:block" />

                {/* Step 3: Ed25519 Signature */}
                <div className="w-full sm:w-1/3 p-3 rounded bg-paper border border-line flex flex-col gap-1">
                  <div className="text-[10px] uppercase text-muted font-semibold">Step 03</div>
                  <div className="font-bold text-ink flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green" />
                    <span>Ed25519</span>
                  </div>
                  <div className="text-[10px] text-muted truncate">Signed Proof</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line/70 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>Standard: RFC 8032 Edwards-Curve</span>
                <span className="text-olive font-semibold">Non-Repudiable</span>
              </div>
            </div>
          </div>
        ) : (
          /* Rendered Receipt Card Content */
          <div className="space-y-5">
            {/* Metadata Summary Strip */}
            <div className="p-3.5 rounded-lg bg-paper/60 border border-line flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-muted" />
                <span className="text-muted">Task ID:</span>
                <span className="font-bold text-ink select-all">{receipt.task_id}</span>
              </div>

              {receipt.timestamp && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  <span className="text-muted">Signed At:</span>
                  <span className="font-medium text-ink tabular-nums">{receipt.timestamp}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded border border-line bg-surface text-gold font-bold text-[10px] uppercase tracking-wide">
                  RFC 8032 Ed25519
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-2 py-0.5 rounded border border-line bg-surface text-muted hover:text-ink text-[10px] font-mono cursor-pointer transition-colors"
                >
                  {showRawJson ? 'Hide Raw' : 'View Raw'}
                </button>
              </div>
            </div>

            {/* Raw JSON Inspection Drawer if opened */}
            {showRawJson && (
              <div className="p-3.5 rounded-lg bg-paper/40 border border-line">
                <div className="flex items-center justify-between pb-2 text-[11px] font-mono text-muted">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-olive" />
                    <span>Raw Receipt JSON</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(receipt, null, 2), 'all')}
                    className="inline-flex items-center gap-1 text-[10px] text-ink hover:text-olive cursor-pointer"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check className="w-3 h-3 text-green" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-ink text-paper rounded font-mono text-xs overflow-x-auto selection:bg-olive selection:text-paper">
                  <code>{JSON.stringify(receipt, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Three Cryptographic Fields */}
            <div className="space-y-4">
              {/* Field 1: SHA-256 Payload Digest */}
              <div className="rounded-lg border border-line bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-ink font-bold">
                    <Fingerprint className="w-3.5 h-3.5 text-olive" />
                    <span>SHA-256 Payload Digest</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(receipt.payload_digest, 'digest')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      copiedField === 'digest'
                        ? 'bg-green/10 text-green border-green/40 font-semibold'
                        : 'bg-paper text-muted hover:text-ink border-line'
                    }`}
                    title="Copy SHA-256 digest"
                  >
                    {copiedField === 'digest' ? (
                      <>
                        <Check className="w-3 h-3 text-green" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded bg-ink text-paper font-mono text-xs break-all leading-relaxed select-all border border-line/60">
                  {receipt.payload_digest}
                </div>
              </div>

              {/* Field 2: Ed25519 Public Key */}
              <div className="rounded-lg border border-line bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-ink font-bold">
                    <Key className="w-3.5 h-3.5 text-gold" />
                    <span>Signer Public Key (Ed25519 Raw Hex)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(receipt.public_key, 'pubkey')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      copiedField === 'pubkey'
                        ? 'bg-green/10 text-green border-green/40 font-semibold'
                        : 'bg-paper text-muted hover:text-ink border-line'
                    }`}
                    title="Copy public key"
                  >
                    {copiedField === 'pubkey' ? (
                      <>
                        <Check className="w-3 h-3 text-green" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded bg-ink text-paper font-mono text-xs break-all leading-relaxed select-all border border-line/60">
                  {receipt.public_key}
                </div>
              </div>

              {/* Field 3: Ed25519 Digital Signature */}
              <div className="rounded-lg border border-line bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-ink font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-green" />
                    <span>Ed25519 Digital Signature</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(receipt.signature, 'signature')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      copiedField === 'signature'
                        ? 'bg-green/10 text-green border-green/40 font-semibold'
                        : 'bg-paper text-muted hover:text-ink border-line'
                    }`}
                    title="Copy signature"
                  >
                    {copiedField === 'signature' ? (
                      <>
                        <Check className="w-3 h-3 text-green" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded bg-ink text-paper font-mono text-xs break-all leading-relaxed select-all border border-line/60">
                  {receipt.signature}
                </div>
              </div>
            </div>

            {/* Zero-Trust Footnote & Re-verify Action */}
            <div className="p-4 rounded-lg bg-paper/50 border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="text-muted leading-relaxed max-w-2xl">
                <span className="font-bold text-ink">Zero-Trust Guarantee: </span>
                This signature binds <code className="text-ink font-semibold">task_id:payload_digest:timestamp</code>.
                Any tampering with task inputs or sandbox outputs invalidates this mathematical proof.
              </div>

              {onVerify && (
                <button
                  type="button"
                  onClick={() => onVerify(receipt)}
                  className="px-3 py-1.5 rounded-md border border-line bg-surface text-xs font-mono text-ink hover:text-olive hover:border-olive font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs"
                >
                  Re-Verify Proof
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptCard;
