import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  UserX, 
  Cpu, 
  FileText, 
  FolderDown, 
  Palette,
  ExternalLink
} from 'lucide-react';
import { ProductPreset } from '../types/brand';
import { PRODUCT_PRESETS } from '../data/presets';

interface HeaderProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onSelectPreset: (preset: ProductPreset) => void;
  activePresetId?: string;
  onOpenBrandBook: () => void;
  hasAnchorImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel,
  onSelectModel,
  onSelectPreset,
  activePresetId,
  onOpenBrandBook,
  hasAnchorImage,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Brand Identity Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-[1px] shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <span className="font-serif font-black text-lg bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                B
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-zinc-100 tracking-tight text-base sm:text-lg flex items-center gap-2">
                Brand Builder
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Studio
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Multi-Medium Product Visualization & Consistency Engine
            </p>
          </div>
        </div>

        {/* Center: System Status & Model Control */}
        <div className="hidden lg:flex items-center gap-3 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 text-xs">
          {/* Model selector badge */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-zinc-800/80 hover:bg-zinc-800 text-amber-300 font-mono text-xs rounded-md px-2 py-0.5 border border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="gemini-3.1-flash-lite-image">Nano-Banana (3.1 Flash Lite)</option>
              <option value="gemini-nano-banana-2.1">Nano-Banana 2.1 (Ultra Fidelity)</option>
              <option value="studio-pro">Studio Pro (Instant Free-Tier)</option>
            </select>
          </div>

          <span className="w-1 h-1 rounded-full bg-zinc-700" />

          {/* Strict Human-Free constraint guarantee badge */}
          <div className="flex items-center gap-1.5 text-emerald-400" title="Guaranteed: Absolutely no people in any generated imagery">
            <UserX className="w-3.5 h-3.5" />
            <span className="font-medium">No People Filter</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-zinc-700" />

          {/* Consistency Lock badge */}
          <div className="flex items-center gap-1.5 text-cyan-400" title="Brand consistency lock active across all mediums">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">
              {hasAnchorImage ? 'Anchor Reference Locked' : 'Brand Spec Anchor Active'}
            </span>
          </div>
        </div>

        {/* Right: Presets & Brand Dossier CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Selector */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-lg border border-zinc-800 transition cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Product Preset:</span>
              <span className="font-medium text-amber-200">
                {PRODUCT_PRESETS.find(p => p.id === activePresetId)?.name || 'Custom'}
              </span>
            </div>
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-mono uppercase text-zinc-400 px-2 py-1 tracking-wider">
                Select Inspiration Preset
              </div>
              {PRODUCT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex flex-col gap-0.5 ${
                    activePresetId === preset.id
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="font-medium flex items-center justify-between">
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">{preset.category}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 truncate">{preset.tagline}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Dossier Modal Button */}
          <button
            onClick={onOpenBrandBook}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brand Dossier</span>
          </button>
        </div>
      </div>

      {/* Mobile Bar for Model & Status */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-t border-zinc-800/60 text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="bg-zinc-800 text-amber-300 font-mono text-[11px] rounded px-1.5 py-0.5 border border-amber-500/30"
          >
            <option value="gemini-3.1-flash-lite-image">Nano-Banana Lite</option>
            <option value="gemini-nano-banana-2.1">Nano-Banana 2.1</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
          <UserX className="w-3 h-3" />
          <span>No People Guaranteed</span>
        </div>
      </div>
    </header>
  );
};
