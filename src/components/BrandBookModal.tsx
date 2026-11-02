import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  UserX,
  FileText,
  Layers
} from 'lucide-react';
import { BrandIdentity, GeneratedShot } from '../types/brand';
import { SUPPORTED_MEDIUMS } from '../data/presets';

interface BrandBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: BrandIdentity;
  shots: Record<string, GeneratedShot>;
}

export const BrandBookModal: React.FC<BrandBookModalProps> = ({
  isOpen,
  onClose,
  identity,
  shots,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyJSON = async () => {
    const exportData = {
      brandIdentity: identity,
      campaignMediums: Object.values(shots).map(s => ({
        medium: s.medium,
        prompt: s.prompt,
        model: s.modelUsed,
        aspectRatio: s.aspectRatio,
        hasImage: Boolean(s.imageUrl),
      })),
      exportedAt: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedShots = Object.values(shots).filter(s => s.status === 'completed' && s.imageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                {identity.brandName || 'Product'} — Brand Campaign Dossier
              </h3>
              <p className="text-xs text-zinc-400">
                Master Brand Guidelines & Multi-Medium Advertising Portfolio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied JSON' : 'Export JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brand Book</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-950/70 text-zinc-200">
          {/* Section 1: Brand Essence */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block mb-1">
              Section 01 // Identity
            </span>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-800 pb-4 mb-4">
              <h2 className="text-3xl font-serif font-black text-zinc-100">
                {identity.brandName || 'Untitled Brand'}
              </h2>
              <span className="text-sm font-medium text-amber-300 italic">
                "{identity.tagline || 'Essential Form'}"
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 font-mono uppercase text-[10px] block mb-1">
                  Product Category
                </span>
                <p className="text-zinc-200 font-medium">{identity.category || 'Luxury Goods'}</p>
              </div>
              <div>
                <span className="text-zinc-400 font-mono uppercase text-[10px] block mb-1">
                  Brand Archetype & Tone
                </span>
                <p className="text-zinc-200 font-medium">{identity.brandVoice || 'Avant-Garde Minimalist'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/60">
              <span className="text-zinc-400 font-mono uppercase text-[10px] block mb-1">
                Locked Product Specification Anchor
              </span>
              <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                {identity.productAnchor || identity.productDescription}
              </p>
            </div>
          </div>

          {/* Section 2: Color Palette */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block mb-3">
              Section 02 // Official Color System
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {identity.primaryColors.map((hex, i) => (
                <div key={i} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-2">
                  <div
                    className="w-full h-16 rounded-lg border border-white/10 shadow-inner"
                    style={{ backgroundColor: hex }}
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block truncate">
                      {identity.colorNames[i] || `Color ${i + 1}`}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">{hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Guardrail Compliance */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block mb-3">
              Section 03 // Production Rules & Compliance
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Zero Humans Policy</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    All advertising media are strictly devoid of human models, hands, or silhouettes. The composition is dedicated entirely to product craftsmanship and spatial environment.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Consistency Anchor Lock</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Physical silhouette, materials, and typography are enforced across every format using Nano-Banana image generation with consistent seed specs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Visual Campaign Gallery */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Section 04 // Multi-Medium Campaign Portfolio ({completedShots.length} Generated)
              </span>
            </div>

            {completedShots.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 text-zinc-400 text-xs">
                No medium shots generated yet. Use the Campaign Generator to synthesize shots across billboards, newspapers, and social feeds.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedShots.map((shot) => {
                  const meta = SUPPORTED_MEDIUMS.find(m => m.id === shot.medium);
                  return (
                    <div key={shot.id} className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
                      <div className="relative aspect-[4/3] bg-black">
                        <img
                          src={shot.imageUrl}
                          alt={meta?.title || shot.medium}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-zinc-200">{meta?.title || shot.medium}</span>
                          <span className="font-mono text-[10px] text-amber-400">{shot.aspectRatio}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 font-mono">
                          {shot.prompt}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
