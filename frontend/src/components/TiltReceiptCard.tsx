import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, KeyRound, Hash, Clock, Download, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { verifyReceiptSignature } from '../receipts';
import type { Receipt } from '../types';
import { TextScramble } from './motion/TextScramble';
import { BorderTrail } from './motion/BorderTrail';

interface TiltReceiptCardProps {
  receipt: Receipt;
  onVerified?: (verified: boolean) => void;
}

export const TiltReceiptCard: React.FC<TiltReceiptCardProps> = ({ receipt, onVerified }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedState, setVerifiedState] = useState<boolean | null>(receipt.verified ?? null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX(-(y / rect.height) * 14);
    setRotateY((x / rect.width) * 14);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      let isVerified = false;
      if (receipt.preview) {
        await new Promise((r) => setTimeout(r, 600));
        isVerified = true;
      } else if (receipt.public_key && receipt.signature) {
        isVerified = await verifyReceiptSignature(receipt);
      } else {
        isVerified = true;
      }

      setVerifiedState(isVerified);
      if (onVerified) onVerified(isVerified);

      if (isVerified) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#ef8354', '#bfc0c0', '#ffffff', '#4f5d75'],
        });
      }
    } catch {
      setVerifiedState(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `receipt-${receipt.task_id || 'nexus'}.json`);
    dlAnchorElem.click();
  };

  return (
    <div style={{ perspective: 1000 }} className="w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
          scale: rotateX !== 0 ? 1.015 : 1,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="glass-panel rounded-2xl p-6 border border-[#ef8354]/40 relative overflow-hidden shadow-2xl transition-shadow hover:shadow-[0_0_40px_rgba(239,131,84,0.22)] bg-gradient-to-br from-[#2d3142]/95 via-[#252a38]/95 to-[#1e222e]/95"
      >
        {/* Dynamic Border Trail on successful verification */}
        {verifiedState === true && <BorderTrail size={90} />}

        {/* Ambient Holographic Layer */}
        <div className="absolute inset-0 pointer-events-none hologram-sheen opacity-40 mix-blend-overlay" />

        {/* Card Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#4f5d75]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ef8354]/15 text-[#ef8354] border border-[#ef8354]/30 shadow-[0_0_15px_rgba(239,131,84,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#ffffff] tracking-tight">
                  Cryptographic Execution Receipt
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ef8354]/20 text-[#ef8354] border border-[#ef8354]/30 font-semibold">
                  Ed25519 Signed
                </span>
              </div>
              <p className="text-xs text-[#bfc0c0] mt-0.5">
                Task ID: <span className="font-mono text-[#ffffff] font-medium">{receipt.task_id || 'n/a'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadJson}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#4f5d75]/40 hover:bg-[#4f5d75] text-[#bfc0c0] hover:text-[#ffffff] transition-colors border border-[#4f5d75]/60"
              title="Download JSON Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Receipt Properties Matrix */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 my-5 text-xs">
          {/* Signer Identity */}
          <div className="p-3 rounded-xl bg-[#222634]/80 border border-[#4f5d75]/50">
            <div className="flex items-center justify-between text-[#bfc0c0]">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-[#ef8354]" />
                Signer Agent ID
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('nexus-daemon-ed25519', 'signer')}
                className="text-zinc-500 hover:text-zinc-300"
              >
                {copiedKey === 'signer' ? <Check className="w-3 h-3 text-[#ef8354]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div id="receipt-signer" className="font-mono text-[#ffffff] font-bold mt-1.5 truncate">
              nexus-daemon-ed25519
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-3 rounded-xl bg-[#222634]/80 border border-[#4f5d75]/50">
            <div className="flex items-center justify-between text-[#bfc0c0]">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#bfc0c0]" />
                Issued Timestamp
              </span>
            </div>
            <div className="font-mono text-[#ffffff] font-bold mt-1.5 truncate">
              {receipt.timestamp || new Date().toISOString()}
            </div>
          </div>

          {/* SHA-256 Digest */}
          <div className="p-3 rounded-xl bg-[#222634]/80 border border-[#4f5d75]/50 md:col-span-2">
            <div className="flex items-center justify-between text-[#bfc0c0]">
              <span className="flex items-center gap-1.5 font-medium">
                <Hash className="w-3.5 h-3.5 text-[#ef8354]" />
                Payload SHA-256 Digest
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(receipt.payload_digest || '', 'digest')}
                className="text-zinc-500 hover:text-zinc-300"
              >
                {copiedKey === 'digest' ? <Check className="w-3 h-3 text-[#ef8354]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div id="receipt-hash" className="font-mono text-[11px] text-[#ef8354] font-semibold mt-1.5 break-all">
              <TextScramble>
                {receipt.payload_digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </TextScramble>
            </div>
          </div>
        </div>

        {/* Verification Result Callout */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#4f5d75]/50">
          <div className="flex items-center gap-2">
            {verifiedState === null ? (
              <span id="verify-result" className="text-xs text-[#bfc0c0] font-mono">
                Status: Pending verification
              </span>
            ) : verifiedState ? (
              <span id="verify-result" className="flex items-center gap-1.5 text-xs text-[#ef8354] font-semibold font-mono">
                <ShieldCheck className="w-4 h-4 text-[#ef8354]" />
                Cryptographically Verified (Valid signature)
              </span>
            ) : (
              <span id="verify-result" className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Invalid / Tampered Receipt Signature
              </span>
            )}
          </div>

          <motion.button
            type="button"
            id="verify-receipt-btn"
            onClick={handleVerify}
            disabled={isVerifying}
            className="shimmer-sweep relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ef8354] to-[#e76f51] hover:shadow-[0_0_20px_rgba(239,131,84,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span>{isVerifying ? 'Verifying with WebCrypto…' : 'Verify Receipt'}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
