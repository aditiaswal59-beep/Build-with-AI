import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Sliders, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { MediumMeta, GeneratedShot, BrandIdentity } from '../types/brand';

interface MockupModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: MediumMeta;
  shot: GeneratedShot;
  identity: BrandIdentity;
}

export const MockupModal: React.FC<MockupModalProps> = ({
  isOpen,
  onClose,
  meta,
  shot,
  identity,
}) => {
  const [activeTab, setActiveTab] = useState<'mockup' | 'raw'>('mockup');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(2842);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasHalftone, setHasHalftone] = useState(true);

  if (!isOpen) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = shot.imageUrl;
    link.download = `${identity.brandName || 'Brand'}_${meta.id}_NanoBanana.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {meta.title}
            </span>
            <h3 className="text-base font-semibold text-zinc-100 hidden sm:block">
              {identity.brandName || 'Product'} Realistic Environment Mockup
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Switcher */}
            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('mockup')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'mockup'
                    ? 'bg-zinc-800 text-amber-300 shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Medium Context
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'raw'
                    ? 'bg-zinc-800 text-amber-300 shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Raw Artwork
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs transition"
              title="Download Artwork"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-zinc-950/90 relative">
          {activeTab === 'raw' ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <div 
                className="relative max-w-full max-h-[70vh] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={shot.imageUrl}
                  alt={meta.title}
                  className="max-h-[70vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-300">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                  className="p-1 hover:text-amber-400 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] min-w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                  className="p-1 hover:text-amber-400 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:text-amber-400 transition ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : meta.id === 'billboard' ? (
            /* =================== BILLBOARD REALISTIC MOCKUP =================== */
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-gradient-to-b from-slate-950 via-zinc-900 to-zinc-950 p-6 sm:p-10 flex flex-col items-center">
                {/* Dusk Atmosphere & Horizon */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-indigo-950/20 to-sky-950/40 pointer-events-none" />

                {/* Top Spotlight Rig */}
                <div className="w-[88%] flex justify-between px-6 mb-2 z-10">
                  {[1, 2, 3, 4, 5].map((light) => (
                    <div key={light} className="flex flex-col items-center">
                      <div className="w-3 h-2 bg-zinc-700 rounded-sm" />
                      <div className="w-1.5 h-3 bg-zinc-800" />
                      {/* Downward light cone */}
                      <div className="w-8 h-12 bg-gradient-to-b from-amber-200/25 to-transparent blur-sm -mt-1 pointer-events-none" />
                    </div>
                  ))}
                </div>

                {/* Massive Billboard Canvas */}
                <div className="relative w-full max-w-3xl aspect-[16/9] rounded-sm shadow-2xl border-4 border-zinc-700/80 bg-black overflow-hidden z-10">
                  <img
                    src={shot.imageUrl}
                    alt="Billboard Shot"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle canvas vinyl texture & lighting highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                  <div className="absolute bottom-2 right-3 font-mono text-[9px] text-white/50 uppercase tracking-widest">
                    GLOBAL BILLBOARD CAMPAIGN #01
                  </div>
                </div>

                {/* Bottom Heavy Steel Truss Support Structure */}
                <div className="w-[88%] mt-2 flex flex-col items-center z-10">
                  <div className="w-full h-3 bg-zinc-800 border-t border-zinc-700 rounded-sm" />
                  <div className="flex gap-16 mt-1">
                    <div className="w-6 h-16 bg-gradient-to-b from-zinc-700 to-zinc-900 border-x border-zinc-600 flex flex-col justify-around py-1">
                      <div className="w-full h-[1px] bg-zinc-500" />
                      <div className="w-full h-[1px] bg-zinc-500" />
                      <div className="w-full h-[1px] bg-zinc-500" />
                    </div>
                    <div className="w-6 h-16 bg-gradient-to-b from-zinc-700 to-zinc-900 border-x border-zinc-600 flex flex-col justify-around py-1">
                      <div className="w-full h-[1px] bg-zinc-500" />
                      <div className="w-full h-[1px] bg-zinc-500" />
                      <div className="w-full h-[1px] bg-zinc-500" />
                    </div>
                  </div>
                </div>

                {/* Roadway Silhouette */}
                <div className="w-full h-4 mt-1 bg-zinc-950 border-t border-zinc-800 relative">
                  <div className="absolute left-1/4 top-1 w-12 h-1 bg-amber-400/40 rounded-full blur-[1px]" />
                  <div className="absolute right-1/3 top-1 w-16 h-1 bg-rose-500/40 rounded-full blur-[1px]" />
                </div>
              </div>
            </div>
          ) : meta.id === 'newspaper' ? (
            /* =================== NEWSPAPER REALISTIC MOCKUP =================== */
            <div className="w-full max-w-3xl flex flex-col items-center">
              {/* Paper Controls */}
              <div className="mb-3 flex items-center gap-3 text-xs text-zinc-300">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasHalftone}
                    onChange={(e) => setHasHalftone(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Halftone Screen Printing Simulation</span>
                </label>
              </div>

              {/* The Physical Newspaper Page */}
              <div 
                className={`relative w-full max-w-2xl bg-[#EBE5D8] text-zinc-900 rounded-sm shadow-2xl p-6 sm:p-8 font-serif border border-[#D5CDBD] select-none ${
                  hasHalftone ? 'contrast-[1.05]' : ''
                }`}
                style={{
                  backgroundImage: `radial-gradient(#111 0.75px, transparent 0.75px)`,
                  backgroundSize: hasHalftone ? '4px 4px' : 'auto',
                }}
              >
                {/* Vintage Newspaper Masthead */}
                <div className="border-b-4 border-double border-zinc-900 pb-3 mb-4 text-center">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-700 mb-1 border-b border-zinc-400 pb-1">
                    <span>Vol. CXXVIII No. 41</span>
                    <span>THE GLOBAL COMMERCE CHRONICLE</span>
                    <span>PRINTED IN RECYCLED COTTON INK</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-serif uppercase text-zinc-900">
                    THE COMMERCIAL GAZETTE
                  </h1>
                  <div className="flex items-center justify-between text-[10px] italic text-zinc-600 mt-1">
                    <span>NEW YORK — LONDON — TOKYO</span>
                    <span>SPECIAL DESIGN & BRANDING EDITION</span>
                    <span>PRICE $1.50</span>
                  </div>
                </div>

                {/* Lead Headline */}
                <div className="text-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-zinc-950 font-serif leading-tight">
                    {identity.brandName.toUpperCase()} REINVENTS THE MARKET WITH GROUNDBREAKING {identity.category.toUpperCase()}
                  </h2>
                  <p className="text-xs italic text-zinc-700 mt-1">
                    "{identity.tagline || 'Pioneering form and uncompromising substance'}"
                  </p>
                </div>

                {/* Embedded Newspaper Advertisement Artwork */}
                <div className="my-4 border-2 border-zinc-900 p-2 bg-[#F2EDE2]">
                  <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full overflow-hidden grayscale contrast-125 sepia-[0.25]">
                    <img
                      src={shot.imageUrl}
                      alt="Newspaper Ad"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center mt-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-800">
                    FIGURE 1.0 — THE OFFICIAL {identity.brandName.toUpperCase()} PRESENTATION
                  </div>
                </div>

                {/* Editorial Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10px] text-zinc-800 leading-relaxed text-justify mt-4 border-t border-zinc-400 pt-3">
                  <div>
                    <span className="font-bold uppercase block mb-0.5">The Evolution of Form</span>
                    In an era saturated with transient novelties, {identity.brandName} demonstrates an acute fidelity to architectural discipline. The packaging speaks in whispers rather than shouts.
                  </div>
                  <div>
                    <span className="font-bold uppercase block mb-0.5">Material Integrity</span>
                    Every contour of the silhouette has been evaluated for tactile weight, sustainable longevity, and uncompromising aesthetic clarity.
                  </div>
                  <div className="hidden sm:block">
                    <span className="font-bold uppercase block mb-0.5">Market Horizon</span>
                    Industry observers predict widespread adoption across luxury and boutique sectors seeking grounded, intentional design.
                  </div>
                </div>

                {/* Page Footer */}
                <div className="border-t border-zinc-900 mt-5 pt-2 flex justify-between text-[9px] font-mono text-zinc-600">
                  <span>SECTION B — ARCHITECTURE & COMMERCE</span>
                  <span>PAGE B-12</span>
                </div>
              </div>
            </div>
          ) : meta.id === 'social' ? (
            /* =================== SOCIAL FEED REALISTIC MOCKUP =================== */
            <div className="w-full max-w-sm flex flex-col items-center">
              {/* Phone Frame */}
              <div className="w-full bg-zinc-900 rounded-[36px] p-3 shadow-2xl border-4 border-zinc-700">
                {/* Dynamic Island / Notch */}
                <div className="w-24 h-4 bg-zinc-950 rounded-full mx-auto mb-2" />

                {/* Social App Header */}
                <div className="bg-zinc-950 rounded-[28px] overflow-hidden border border-zinc-800/80">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-[1.5px]">
                        <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center font-bold text-xs text-amber-300">
                          {identity.brandName.slice(0, 1) || 'B'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-zinc-100">
                            {identity.brandName.toLowerCase().replace(/\s+/g, '') || 'brand'}
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                        </div>
                        <span className="text-[10px] text-zinc-400 block -mt-0.5">
                          Sponsored • Studio Collection
                        </span>
                      </div>
                    </div>

                    <button className="text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full transition">
                      Follow
                    </button>
                  </div>

                  {/* Main Square Post Image */}
                  <div className="relative aspect-square w-full bg-black overflow-hidden">
                    <img
                      src={shot.imageUrl}
                      alt="Social Post"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Interaction Bar */}
                  <div className="p-3.5 bg-zinc-950">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3.5">
                        <button 
                          onClick={handleLike} 
                          className={`transition transform active:scale-125 ${
                            isLiked ? 'text-rose-500' : 'text-zinc-200 hover:text-rose-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button className="text-zinc-200 hover:text-zinc-100 transition">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button className="text-zinc-200 hover:text-zinc-100 transition">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="text-zinc-200 hover:text-zinc-100 transition">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Like Counter */}
                    <div className="text-xs font-semibold text-zinc-200 mb-1">
                      {likesCount.toLocaleString()} likes
                    </div>

                    {/* Caption */}
                    <div className="text-xs text-zinc-300 leading-snug">
                      <span className="font-semibold text-zinc-100 mr-1.5">
                        {identity.brandName.toLowerCase().replace(/\s+/g, '')}
                      </span>
                      <span>
                        Crafted with uncompromising discipline. Experience the {identity.category} standard.
                      </span>
                      <div className="mt-1 text-zinc-400 font-mono text-[11px]">
                        #{identity.brandName.replace(/\s+/g, '')} #Design2026 #StudioCampaign #NanoBanana
                      </div>
                    </div>

                    {/* Comments Snippet */}
                    <div className="mt-2 text-[11px] text-zinc-400 cursor-pointer">
                      View all 148 comments
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =================== GENERIC / POSTER / MAGAZINE MOCKUP =================== */
            <div className="w-full max-w-2xl flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden border-8 border-zinc-800 shadow-2xl bg-zinc-950 p-2">
                <img
                  src={shot.imageUrl}
                  alt={meta.title}
                  className="max-h-[65vh] object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Rendered via Nano-Banana ({shot.modelUsed})</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400">Zero Humans Policy Guaranteed</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Media Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
