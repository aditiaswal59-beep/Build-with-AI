import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  Lock, 
  Unlock, 
  Palette, 
  Wand2, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Camera
} from 'lucide-react';
import { BrandIdentity } from '../types/brand';

interface BrandConfigPanelProps {
  identity: BrandIdentity;
  onUpdateIdentity: (updated: Partial<BrandIdentity>) => void;
  onRefineWithAI: () => Promise<void>;
  isRefining: boolean;
  onGenerateFullCampaign: () => void;
  isGeneratingCampaign: boolean;
  campaignProgress?: { current: number; total: number; currentMedium?: string };
}

export const BrandConfigPanel: React.FC<BrandConfigPanelProps> = ({
  identity,
  onUpdateIdentity,
  onRefineWithAI,
  isRefining,
  onGenerateFullCampaign,
  isGeneratingCampaign,
  campaignProgress,
}) => {
  const [isEditingAnchor, setIsEditingAnchor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onUpdateIdentity({
        referenceImageBase64: base64,
        referenceMimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    onUpdateIdentity({
      referenceImageBase64: undefined,
      referenceMimeType: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleColorChange = (index: number, newHex: string) => {
    const newColors = [...identity.primaryColors];
    newColors[index] = newHex;
    onUpdateIdentity({
      primaryColors: newColors,
      referenceImageBase64: undefined, // Clear stale anchor so new colors render immediately!
    });
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
              Step 1: Product Definition
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Consistency Anchor Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 mt-1">
            Product & Brand DNA
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Describe any product or pick an archetype. The engine locks its physical silhouette, typography, and chosen colors across every medium.
          </p>
        </div>

        {/* Generate Full Campaign CTA */}
        <div className="flex items-center gap-2 sm:self-center">
          <button
            onClick={onGenerateFullCampaign}
            disabled={isGeneratingCampaign || !identity.productDescription.trim()}
            className="w-full sm:w-auto relative group overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGeneratingCampaign ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>
                  Generating {campaignProgress?.currentMedium || 'Campaign'} ({campaignProgress?.current}/{campaignProgress?.total})...
                </span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-zinc-950 transition-transform group-hover:rotate-12" />
                <span>Generate Full Campaign (3 Mediums)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left Column: Product Description & AI Refiner (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                Product Name & Concept
                <span className="text-amber-400">*</span>
              </label>
              <button
                type="button"
                onClick={onRefineWithAI}
                disabled={isRefining || !identity.productDescription.trim()}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition disabled:opacity-40 disabled:hover:text-amber-400 cursor-pointer"
              >
                {isRefining ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analyzing DNA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Enhance & Refine Spec</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lumina, Velvet Rouge"
                  value={identity.brandName}
                  onChange={(e) => onUpdateIdentity({ brandName: e.target.value })}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Pure Pigment, Architectural Form"
                  value={identity.tagline}
                  onChange={(e) => onUpdateIdentity({ tagline: e.target.value })}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Product Category & Silhouette</label>
                <input
                  type="text"
                  placeholder="e.g. Lipstick, Spectacles, Sneakers, Watch"
                  value={identity.category}
                  onChange={(e) => onUpdateIdentity({ 
                    category: e.target.value,
                    referenceImageBase64: undefined, // Clear stale anchor so new typed product renders
                  })}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            {/* Quick Product Type Archetype Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Quick Archetypes:</span>
              {[
                { 
                  label: '💄 Velvet Lipstick', 
                  name: 'Velvet Rouge', 
                  cat: 'Haute Couture Lipstick', 
                  desc: 'Sculpted satin lipstick bullet in a beveled brushed brass and obsidian magnetic case with debossed serif monogram.',
                  colors: ['#9E1B32', '#1B1B1B', '#D4AF37', '#FAF0E6'],
                  names: ['Crimson Scarlet', 'Obsidian Black', 'Brushed Brass', 'Satin Alabaster']
                },
                { 
                  label: '👓 Optical Specs', 
                  name: 'Optica Pure', 
                  cat: 'Architectural Eyewear & Specs', 
                  desc: 'Ultra-lightweight Japanese beta-titanium spectacle frame with geometric bridge bar, screwless hinges, and amber-tinted polarized lenses.',
                  colors: ['#2C3539', '#5A6369', '#E5A65D', '#FFFFFF'],
                  names: ['Graphite Titanium', 'Slate Grey', 'Amber Polarized', 'Pure White']
                },
                { 
                  label: '👟 Sculpted Sneaker', 
                  name: 'Aero Apex', 
                  cat: 'Performance Footwear', 
                  desc: 'Aerodynamic running sneaker with sculpted carbon-fiber propulsion plate, geometric dual-density foam midsole, and technical knit upper.',
                  colors: ['#06B6D4', '#0F172A', '#F97316', '#F8FAFC'],
                  names: ['Electric Cyan', 'Midnight Obsidian', 'Signal Orange', 'Pure White']
                },
                { 
                  label: '🕯️ Scented Candle', 
                  name: 'Aura Nobilis', 
                  cat: 'Artisanal Scented Candle', 
                  desc: 'Minimalist ribbed ceramic candle tumbler filled with natural organic soy wax and a crackling wood wick with warm amber flame.',
                  colors: ['#D4A373', '#2A2624', '#C85A17', '#FAF6F0'],
                  names: ['Warm Honey', 'Charcoal Clay', 'Burnt Amber', 'Porcelain']
                },
                { 
                  label: '👜 Leather Tote', 
                  name: 'Atelier Minimal', 
                  cat: 'Luxury Leather Goods', 
                  desc: 'Full-grain structured architectural leather handbag with dual arched handles and polished brass turnlock clasp.',
                  colors: ['#6B4423', '#1A1816', '#D4AF37', '#F5EBE1'],
                  names: ['Cognac Leather', 'Sumi Noir', 'Polished Brass', 'Ivory Suede']
                },
                { 
                  label: '📷 Precision Camera', 
                  name: 'KRONOS Rangefinder', 
                  cat: 'Precision Optical Camera', 
                  desc: 'Minimalist rangefinder camera with milled aluminum dials, textured grip, and high-aperture multi-coated prime lens.',
                  colors: ['#1E293B', '#0F172A', '#E2E8F0', '#EF4444'],
                  names: ['Matte Slate', 'Deep Carbon', 'Milled Silver', 'Ruby Dot']
                },
                { 
                  label: '🍾 Botanical Bottle', 
                  name: 'Lumina Elixir', 
                  cat: 'Adaptogenic Botanicals', 
                  desc: 'Apothecary glass flacon bottle with pipette dropper cap, textured label, and warm backlighting.',
                  colors: ['#B8860B', '#1B263B', '#D4A373', '#F8F9FA'],
                  names: ['Antique Gold', 'Midnight Navy', 'Warm Terracotta', 'Pure Linen']
                },
                { 
                  label: '⏱️ Desk Clock', 
                  name: 'Kuro Chrono', 
                  cat: 'Minimalist Industrial Clock', 
                  desc: 'Basalt ceramic monolithic desk timekeeper with recessed dial, minimalist indices, and brushed titanium bezel.',
                  colors: ['#121212', '#2B2D42', '#8D99AE', '#E0A96D'],
                  names: ['Obsidian Black', 'Graphite Slate', 'Brushed Titanium', 'Copper Accent']
                },
                { 
                  label: '🧴 Serum Bottle', 
                  name: 'Vane Glacier', 
                  cat: 'Clean Derma Skincare', 
                  desc: 'Frosted sea-glass cylindrical serum bottle with white ceramic pump dispenser and vertical debossed typography.',
                  colors: ['#0077B6', '#00B4D8', '#90E0EF', '#FFFFFF'],
                  names: ['Deep Arctic', 'Glacial Cyan', 'Mist Blue', 'Pure Snow']
                },
              ].map((arch) => (
                <button
                  key={arch.label}
                  type="button"
                  onClick={() => {
                    onUpdateIdentity({
                      brandName: arch.name || identity.brandName,
                      category: arch.cat,
                      productDescription: arch.desc,
                      productAnchor: arch.desc,
                      primaryColors: [...arch.colors],
                      colorNames: [...arch.names],
                      referenceImageBase64: undefined, // Clear old anchor to render the new shape and colors!
                    });
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    identity.category.toLowerCase().includes(arch.cat.toLowerCase().split(' ')[1] || '')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: arch.colors[0] }} />
                  <span>{arch.label}</span>
                </button>
              ))}
            </div>

            {/* Description Textarea */}
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Describe the physical product, packaging shape, materials, finishes, and label details (e.g. 'A luxury botanical elixir in a fluted amber apothecary glass bottle with brushed bronze dropper cap, gold foil serif typography, and cream textured label')..."
                value={identity.productDescription}
                onChange={(e) => onUpdateIdentity({ productDescription: e.target.value })}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition resize-none font-sans leading-relaxed"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-zinc-400">
                {identity.productDescription.length} chars
              </span>
            </div>
          </div>

          {/* Strict Consistency Anchor Accordion */}
          <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Locked Visual Anchor Specification
                </span>
                <span className="text-[10px] text-zinc-400 hidden sm:inline">
                  (Injected into every medium prompt)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAnchor(!isEditingAnchor)}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 font-mono transition"
              >
                {isEditingAnchor ? 'Done' : 'Edit Spec'}
              </button>
            </div>

            {isEditingAnchor ? (
              <textarea
                rows={2}
                value={identity.productAnchor}
                onChange={(e) => onUpdateIdentity({ productAnchor: e.target.value })}
                className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-400"
              />
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed font-mono bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                {identity.productAnchor || 'No anchor defined yet. Click "AI Enhance & Refine Spec" to generate a strict anchor specification.'}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Visual Anchor Image & Brand Colors (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Master Visual Anchor Image */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Visual Reference Anchor (Optional)
              </label>
              {identity.referenceImageBase64 && (
                <button
                  type="button"
                  onClick={removeReferenceImage}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Anchor to Re-style
                </button>
              )}
            </div>

            <div className="relative">
              {identity.referenceImageBase64 ? (
                <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-zinc-950 group">
                  <img
                    src={identity.referenceImageBase64}
                    alt="Master Product Reference"
                    className="w-full h-24 object-contain bg-zinc-950 p-2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={removeReferenceImage}
                      className="bg-rose-500/80 hover:bg-rose-500 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Anchor
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-zinc-700/80 hover:border-amber-500/50 rounded-xl p-2.5 text-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/70 transition flex flex-col items-center justify-center gap-1 group"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-800/80 group-hover:bg-amber-500/20 text-zinc-400 group-hover:text-amber-400 flex items-center justify-center transition">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-amber-300">
                      Upload Custom Reference Photo
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      Or use any generated shot below as the anchor
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Color Palette Manager & Interactive Pickers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Brand Color Palette
                <span className="text-[10px] font-normal text-amber-400/80">(Click any chip to pick color)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                {identity.brandVoice || 'Custom Palette'}
              </span>
            </div>

            {/* Quick Color Presets */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {[
                { name: 'Ruby Velvet', colors: ['#9E1B32', '#1B1B1B', '#D4AF37', '#FAF0E6'], names: ['Crimson Scarlet', 'Obsidian Black', 'Brushed Brass', 'Satin Alabaster'] },
                { name: 'Titanium Amber', colors: ['#2C3539', '#5A6369', '#E5A65D', '#FFFFFF'], names: ['Graphite Titanium', 'Slate Grey', 'Amber Polarized', 'Pure White'] },
                { name: 'Amber Gold', colors: ['#B8860B', '#1B263B', '#D4A373', '#F8F9FA'], names: ['Gold', 'Navy', 'Terracotta', 'Linen'] },
                { name: 'Obsidian Slate', colors: ['#121212', '#2B2D42', '#8D99AE', '#E0A96D'], names: ['Obsidian', 'Graphite', 'Titanium', 'Copper'] },
                { name: 'Arctic Glacier', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#FFFFFF'], names: ['Deep Arctic', 'Glacial Cyan', 'Mist Blue', 'Pure White'] },
                { name: 'Emerald Forest', colors: ['#064E3B', '#047857', '#A7F3D0', '#F0FDF4'], names: ['Deep Emerald', 'Vibrant Jade', 'Mint Accent', 'Opal White'] },
                { name: 'Ceremonial Matcha', colors: ['#2D4A22', '#D4AF37', '#E9E5D9', '#1A1C16'], names: ['Moss Green', 'Gold Leaf', 'Washi Cream', 'Sumi Ink'] },
                { name: 'Cyber Neon', colors: ['#8B5CF6', '#EC4899', '#06B6D4', '#090D16'], names: ['Neon Violet', 'Cyber Pink', 'Bright Cyan', 'Deep Void'] },
                { name: 'Terracotta Earth', colors: ['#C85A17', '#E0A96D', '#2B2625', '#FAF6F0'], names: ['Terracotta', 'Warm Sand', 'Espresso', 'Porcelain'] },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    onUpdateIdentity({
                      primaryColors: [...p.colors],
                      colorNames: [...p.names],
                      referenceImageBase64: undefined, // Clear old anchor to reflect new color!
                    });
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colors[0] }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Interactive Swatches with Native Color Picker */}
            <div className="grid grid-cols-4 gap-2">
              {identity.primaryColors.map((hex, i) => (
                <div
                  key={i}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-1.5 flex flex-col items-center gap-1 group relative"
                >
                  {/* Clickable Swatch with Color Picker Input */}
                  <label
                    className="w-full h-7 rounded-md border border-white/10 shadow-inner cursor-pointer relative overflow-hidden block transition-transform group-hover:scale-[1.02]"
                    style={{ backgroundColor: hex }}
                    title="Click to open color picker"
                  >
                    <input
                      type="color"
                      value={hex.startsWith('#') && hex.length === 7 ? hex : '#D4A373'}
                      onChange={(e) => handleColorChange(i, e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Palette className="w-3 h-3 text-white drop-shadow" />
                    </div>
                  </label>

                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="w-full text-center text-[10px] font-mono text-zinc-300 bg-transparent focus:outline-none focus:text-amber-300"
                  />
                  <span className="text-[9px] text-zinc-400 truncate max-w-full">
                    {identity.colorNames[i] || `Color ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
