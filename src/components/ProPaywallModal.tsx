"use client";

import React, { useEffect } from "react";
import { Crown, Check, X, Sparkles } from "lucide-react";

interface ProPaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired by the primary CTA. Wire to your checkout flow when available. */
  onUpgrade?: () => void;
}

const PRO_FEATURES = [
  "Jocuri nelimitate",
  "Fără reclame",
  "Analize detaliate ChronoAI",
];

export default function ProPaywallModal({ open, onClose, onUpgrade }: ProPaywallModalProps) {
  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#15171d]/95 p-7 sm:p-8 shadow-2xl shadow-black/60 score-pop"
        style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.6), 0 0 60px rgba(245,158,11,0.08)" }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Glowing crown */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-black bg-gradient-to-br from-amber-300 to-amber-500"
            style={{ boxShadow: "0 0 28px rgba(245,158,11,0.6)" }}
          >
            <Crown size={30} />
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="mt-5 text-center">
          <h2
            id="paywall-title"
            className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Energii Epuizate
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-400">
            Ai atins limita de 3 jocuri gratuite pe zi. Treci la PRO pentru a
            continua explorarea istoriei.
          </p>
        </div>

        {/* Feature list */}
        <ul className="mt-6 flex flex-col gap-3">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/15 border border-amber-500/40 text-amber-400">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="text-sm font-medium text-gray-200">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-black bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontFamily: "var(--font-sora)", boxShadow: "0 8px 28px rgba(245,158,11,0.4)" }}
          >
            <Sparkles size={18} />
            Treci la ChronoMap PRO
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Așteaptă până mâine
          </button>
        </div>
      </div>
    </div>
  );
}
