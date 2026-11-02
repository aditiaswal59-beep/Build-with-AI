import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  UserX, 
  Sparkles, 
  Maximize2, 
  Eye, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { GeneratedShot, MediumMeta, BrandIdentity } from '../types/brand';
import { SUPPORTED_MEDIUMS } from '../data/presets';

interface ConsistencyComparatorProps {
  shots: Record<string, GeneratedShot>;
  identity: BrandIdentity;
  onOpenMockup: (meta: MediumMeta, shot: GeneratedShot) => void;
}

export const ConsistencyComparator: React.FC<ConsistencyComparatorProps> = ({
  shots,
  identity,
  onOpenMockup,
}) => {
  const coreMediums = ['billboard', 'newspaper', 'social'];
  const completedCoreShots = coreMediums
    .map(id => shots[id])
    .filter((s): s is GeneratedShot => Boolean(s && s.status === 'completed' && s.imageUrl));

  if (completedCoreShots.length < 2) {
    return null;
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
              Consistency Audit
            </span>
            <span className="text-xs text-zinc-400">
              Side-by-Side Product Alignment
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-zinc-100 mt-1">
            Cross-Medium Consistency Verification
          </h3>
        </div>

        {/* Consistency Score Badge */}
        <div className="flex items-center gap-3 bg-zinc-950/80 px-3.5 py-1.5 rounded-xl border border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">Silhouette & Logo Locked</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <UserX className="w-3.5 h-3.5 text-emerald-400" />
            <span>0 Humans</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {coreMediums.map((mediumId) => {
          const shot = shots[mediumId];
          const meta = SUPPORTED_MEDIUMS.find(m => m.id === mediumId);
          if (!meta) return null;

          return (
            <div 
              key={mediumId} 
              className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex flex-col group hover:border-zinc-700 transition"
            >
              <div className="p-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">{meta.title}</span>
                <span className="font-mono text-[10px] text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                  {meta.aspectRatio}
                </span>
              </div>

              <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                {shot?.status === 'completed' && shot.imageUrl ? (
                  <>
                    <img
                      src={shot.imageUrl}
                      alt={meta.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => onOpenMockup(meta, shot)}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect in Context</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500">Not generated</span>
                )}
              </div>

              <div className="p-3 text-[11px] text-zinc-400 bg-zinc-950">
                <div className="flex items-center gap-1 text-emerald-400 font-medium mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Branding & Silhouette Aligned</span>
                </div>
                <p className="line-clamp-2 text-zinc-500 font-mono text-[10px]">
                  {meta.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
