import React, { useState } from 'react';
import { 
  Maximize2, 
  Newspaper, 
  Smartphone, 
  Train, 
  BookOpen, 
  ShoppingBag, 
  Compass, 
  Layers,
  Wand2,
  RefreshCw,
  Eye,
  Download,
  Lock,
  Anchor,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { MediumMeta, GeneratedShot, AspectRatio } from '../types/brand';

interface MediumCardProps {
  meta: MediumMeta;
  shot?: GeneratedShot;
  customPrompt: string;
  onUpdatePrompt: (newPrompt: string) => void;
  onGenerate: (mediumId: string) => void;
  onSetAsAnchor: (imageUrl: string) => void;
  onOpenMockup: (meta: MediumMeta, shot: GeneratedShot) => void;
  isAnchor: boolean;
  isGeneratingAny: boolean;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Maximize2,
  Newspaper,
  Smartphone,
  Train,
  BookOpen,
  ShoppingBag,
  Compass,
  Layers,
};

export const MediumCard: React.FC<MediumCardProps> = ({
  meta,
  shot,
  customPrompt,
  onUpdatePrompt,
  onGenerate,
  onSetAsAnchor,
  onOpenMockup,
  isAnchor,
  isGeneratingAny,
}) => {
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const IconComponent = ICON_MAP[meta.iconName] || Layers;
  const isGenerating = shot?.status === 'generating';
  const hasImage = shot?.status === 'completed' && Boolean(shot?.imageUrl);

  const handleDownload = () => {
    if (!shot?.imageUrl) return;
    const link = document.createElement('a');
    link.href = shot.imageUrl;
    link.download = `${meta.id}_nano_banana_campaign.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async () => {
    if (!shot?.imageUrl) return;
    try {
      await navigator.clipboard.writeText(shot.imageUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`bg-zinc-900/80 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
      isAnchor 
        ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30' 
        : hasImage 
          ? 'border-zinc-700/80 hover:border-zinc-600 shadow-md' 
          : 'border-zinc-800/80 hover:border-zinc-750'
    }`}>
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/60 flex items-center justify-between gap-2 bg-zinc-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            meta.id === 'billboard' ? 'bg-amber-500/15 text-amber-400' :
            meta.id === 'newspaper' ? 'bg-emerald-500/15 text-emerald-400' :
            meta.id === 'social' ? 'bg-pink-500/15 text-pink-400' :
            'bg-zinc-800 text-zinc-300'
          }`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate flex items-center gap-1.5">
              {meta.title}
              {isAnchor && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/50">
                  Anchor Reference
                </span>
              )}
            </h3>
            <span className="text-[11px] text-zinc-400 block truncate">
              {meta.category} Medium
            </span>
          </div>
        </div>

        {/* Aspect Ratio Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
            {meta.aspectRatio}
          </span>
        </div>
      </div>

      {/* Main Image or Placeholder Viewport */}
      <div className="relative w-full aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden group">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Nano-Banana Synthesizing...
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Applying brand spec & strict human-free negative rules
              </p>
            </div>
          </div>
        ) : hasImage ? (
          <>
            <img
              src={shot!.imageUrl}
              alt={`${meta.title} generation`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="eager"
            />

            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetAsAnchor(shot!.imageUrl)}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 backdrop-blur-md transition ${
                    isAnchor
                      ? 'bg-cyan-500 text-zinc-950'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200'
                  }`}
                  title={isAnchor ? 'Active consistency anchor' : 'Set as anchor reference for all other mediums'}
                >
                  <Anchor className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{isAnchor ? 'Anchor Locked' : 'Set Anchor'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMockup(meta, shot!)}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Realistic Mockup</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs transition"
                    title="Download High-Res"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : shot?.status === 'error' ? (
          <div className="p-4 text-center flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            <p className="text-xs font-semibold text-rose-300">Generation Failed</p>
            <p className="text-[11px] text-zinc-400 max-w-xs line-clamp-3">
              {shot.errorMessage || 'Nano-Banana service error. Check API key quota or adjust prompt.'}
            </p>
          </div>
        ) : (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 transition">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Not yet generated</p>
              <p className="text-[11px] text-zinc-400 max-w-[200px] mt-0.5">
                {meta.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Prompt Accordion */}
      <div className="p-3.5 sm:p-4 bg-zinc-950/60 border-t border-zinc-800/60 flex flex-col gap-2.5">
        {/* Toggle Prompt Editing */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPromptEdit(!showPromptEdit)}
            className="text-[11px] font-mono text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition"
          >
            <span>Custom Prompt Tuning</span>
            {showPromptEdit ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {shot?.modelUsed && (
            <span className="text-[10px] font-mono text-amber-400/80">
              {shot.modelUsed.includes('2.1') ? 'Nano 2.1' : 'Nano Flash'}
            </span>
          )}
        </div>

        {showPromptEdit && (
          <div className="animate-in fade-in duration-150">
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => onUpdatePrompt(e.target.value)}
              placeholder="Refine specific lighting, background, or composition for this medium..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none font-mono"
            />
          </div>
        )}

        {/* Generate / Regenerate Action Button */}
        <button
          type="button"
          onClick={() => onGenerate(meta.id)}
          disabled={isGenerating || isGeneratingAny}
          className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] ${
            hasImage
              ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/60'
              : 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-semibold shadow-md shadow-amber-500/15'
          } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Rendering Shot...</span>
            </>
          ) : hasImage ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Re-render {meta.title}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate with Nano-Banana</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
