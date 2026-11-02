import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  UserX, 
  Wand2, 
  Maximize2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Filter,
  ExternalLink
} from 'lucide-react';
import { Header } from './components/Header';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { MediumCard } from './components/MediumCard';
import { MockupModal } from './components/MockupModal';
import { BrandBookModal } from './components/BrandBookModal';
import { ConsistencyComparator } from './components/ConsistencyComparator';
import { BrandIdentity, GeneratedShot, MediumMeta, ProductPreset } from './types/brand';
import { SUPPORTED_MEDIUMS, PRODUCT_PRESETS } from './data/presets';

export default function App() {
  const initialPreset = PRODUCT_PRESETS[0];

  const [identity, setIdentity] = useState<BrandIdentity>({
    brandName: initialPreset.name,
    tagline: initialPreset.tagline,
    category: initialPreset.category,
    productDescription: initialPreset.description,
    productAnchor: initialPreset.brandAnchor,
    primaryColors: [...initialPreset.primaryColors],
    colorNames: [...initialPreset.colorNames],
    brandVoice: initialPreset.brandVoice,
  });

  const [activePresetId, setActivePresetId] = useState<string>(initialPreset.id);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite-image');
  const [shots, setShots] = useState<Record<string, GeneratedShot>>({});
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({
    billboard: initialPreset.mediumPrompts.billboard || '',
    newspaper: initialPreset.mediumPrompts.newspaper || '',
    social: initialPreset.mediumPrompts.social || '',
  });

  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<{ current: number; total: number; currentMedium?: string }>();
  const [activeMockup, setActiveMockup] = useState<{ meta: MediumMeta; shot: GeneratedShot } | null>(null);
  const [isBrandBookOpen, setIsBrandBookOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'core' | 'Outdoor' | 'Print' | 'Digital' | 'Retail'>('all');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Switch inspiration preset
  const handleSelectPreset = (preset: ProductPreset) => {
    setActivePresetId(preset.id);
    const newIdentity: BrandIdentity = {
      brandName: preset.name,
      tagline: preset.tagline,
      category: preset.category,
      productDescription: preset.description,
      productAnchor: preset.brandAnchor,
      primaryColors: [...preset.primaryColors],
      colorNames: [...preset.colorNames],
      brandVoice: preset.brandVoice,
      referenceImageBase64: undefined,
      referenceMimeType: undefined,
    };
    setIdentity(newIdentity);

    setCustomPrompts(prev => ({
      ...prev,
      ...preset.mediumPrompts,
    }));

    showToast('info', `Switched to ${preset.name} (${preset.category}). Generating shots...`);

    // Auto-generate core campaign shots for the selected preset
    const coreMediums = ['billboard', 'newspaper', 'social'];
    coreMediums.forEach(async (mediumId) => {
      await generateShot(mediumId, undefined, newIdentity);
    });
  };

  // Refine product identity with Gemini 3.8 Flash
  const handleRefineWithAI = async () => {
    if (!identity.productDescription.trim()) return;

    setIsRefining(true);
    try {
      const response = await fetch('/api/brand/refine-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDescription: identity.productDescription,
          brandNameHint: identity.brandName,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to refine identity');
      }

      const data = resData.data;
      setIdentity(prev => ({
        ...prev,
        brandName: data.brandName || prev.brandName,
        tagline: data.tagline || prev.tagline,
        category: data.category || prev.category,
        productAnchor: data.productAnchor || prev.productAnchor,
        primaryColors: data.primaryColors || prev.primaryColors,
        colorNames: data.colorNames || prev.colorNames,
        brandVoice: data.brandVoice || prev.brandVoice,
      }));

      if (data.mediumPrompts) {
        setCustomPrompts(prev => ({
          ...prev,
          ...data.mediumPrompts,
        }));
      }

      showToast('success', 'Brand DNA refined and anchor specifications locked!');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to refine brand with AI');
    } finally {
      setIsRefining(false);
    }
  };

  // Generate an individual shot with Nano-Banana or Studio Engine
  const generateShot = async (
    mediumId: string, 
    customImageRef?: string,
    overrideIdentity?: BrandIdentity
  ): Promise<{ success: boolean; imageUrl?: string }> => {
    const meta = SUPPORTED_MEDIUMS.find(m => m.id === mediumId);
    if (!meta) return { success: false };

    const activeId = overrideIdentity || identity;
    const promptToUse = customPrompts[mediumId]?.trim() || meta.defaultPromptSuffix;

    // Set status to generating
    setShots(prev => ({
      ...prev,
      [mediumId]: {
        id: `${mediumId}-${Date.now()}`,
        medium: mediumId as any,
        imageUrl: prev[mediumId]?.imageUrl || '',
        prompt: promptToUse,
        modelUsed: selectedModel,
        aspectRatio: meta.aspectRatio,
        createdAt: Date.now(),
        status: 'generating',
      },
    }));

    try {
      const response = await fetch('/api/brand/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          medium: meta.title,
          aspectRatio: meta.aspectRatio,
          model: selectedModel,
          referenceImage: customImageRef || activeId.referenceImageBase64,
          referenceMimeType: activeId.referenceMimeType,
          productAnchor: activeId.productAnchor || activeId.productDescription,
          brandName: activeId.brandName,
          tagline: activeId.tagline,
          category: activeId.category,
          primaryColors: activeId.primaryColors,
          colorNames: activeId.colorNames,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to generate shot');
      }

      setShots(prev => ({
        ...prev,
        [mediumId]: {
          id: `${mediumId}-${Date.now()}`,
          medium: mediumId as any,
          imageUrl: resData.imageUrl,
          prompt: promptToUse,
          modelUsed: resData.modelUsed || selectedModel,
          aspectRatio: meta.aspectRatio,
          createdAt: Date.now(),
          status: 'completed',
        },
      }));

      return { success: true, imageUrl: resData.imageUrl };
    } catch (err: any) {
      console.error(err);
      setShots(prev => ({
        ...prev,
        [mediumId]: {
          ...prev[mediumId],
          status: 'error',
          errorMessage: err.message,
        },
      }));
      showToast('error', `Failed generating ${meta.title}: ${err.message}`);
      return { success: false };
    }
  };

  // Pre-generate initial shots on mount so photos appear right away
  React.useEffect(() => {
    let isMounted = true;
    const generateInitial = async () => {
      const coreMediums = ['billboard', 'newspaper', 'social'];
      for (const mediumId of coreMediums) {
        if (!isMounted) break;
        await generateShot(mediumId, undefined, identity);
      }
    };
    generateInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate the full core campaign (Billboard + Newspaper + Social Post)
  const handleGenerateFullCampaign = async () => {
    const coreMediums = ['billboard', 'newspaper', 'social'];
    setIsGeneratingCampaign(true);

    try {
      let masterAnchor = identity.referenceImageBase64;

      for (let i = 0; i < coreMediums.length; i++) {
        const mediumId = coreMediums[i];
        const meta = SUPPORTED_MEDIUMS.find(m => m.id === mediumId);
        setCampaignProgress({
          current: i + 1,
          total: coreMediums.length,
          currentMedium: meta?.title,
        });

        const result = await generateShot(mediumId, masterAnchor);

        // If Nano-Banana produced a raster photo and no master anchor was set, use it as reference
        if (result.success && !masterAnchor && result.imageUrl && i === 0) {
          const isSvg = result.imageUrl.startsWith('data:image/svg+xml');
          if (!isSvg) {
            masterAnchor = result.imageUrl;
            setIdentity(prev => ({
              ...prev,
              referenceImageBase64: result.imageUrl,
              referenceMimeType: 'image/png',
            }));
          }
        }
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#38BDF8'],
      });

      showToast('success', 'Full 3-Medium Campaign synthesized with consistent branding!');
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Campaign generation encountered an issue.');
    } finally {
      setIsGeneratingCampaign(false);
      setCampaignProgress(undefined);
    }
  };

  // Set an existing shot as the anchor reference
  const handleSetAsAnchor = (imageUrl: string) => {
    setIdentity(prev => ({
      ...prev,
      referenceImageBase64: imageUrl,
      referenceMimeType: 'image/png',
    }));
    showToast('success', 'Selected shot locked as Master Anchor Reference! All future mediums will match this exact silhouette.');
  };

  // Filter mediums
  const filteredMediums = SUPPORTED_MEDIUMS.filter(meta => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'core') return ['billboard', 'newspaper', 'social'].includes(meta.id);
    return meta.category === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-[#0B0F17] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Header */}
      <Header
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
        onOpenBrandBook={() => setIsBrandBookOpen(true)}
        hasAnchorImage={Boolean(identity.referenceImageBase64)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium flex items-center gap-2.5 max-w-md ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/40' 
              : toastMessage.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/40'
              : 'bg-zinc-900/95 text-zinc-200 border-zinc-700'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Step 1: Product Definition & Consistency Anchor Panel */}
        <BrandConfigPanel
          identity={identity}
          onUpdateIdentity={(updated) => setIdentity(prev => ({ ...prev, ...updated }))}
          onRefineWithAI={handleRefineWithAI}
          isRefining={isRefining}
          onGenerateFullCampaign={handleGenerateFullCampaign}
          isGeneratingCampaign={isGeneratingCampaign}
          campaignProgress={campaignProgress}
        />

        {/* Consistency Comparator (Active once 2 or more core mediums are generated) */}
        <ConsistencyComparator
          shots={shots}
          identity={identity}
          onOpenMockup={(meta, shot) => setActiveMockup({ meta, shot })}
        />

        {/* Step 2: Mediums Grid & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  Step 2: Multi-Medium Canvas
                </span>
                <span className="text-xs text-zinc-400">
                  (Powered by Nano-Banana with Strict No-People Policy)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 mt-0.5">
                Advertising Mediums
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-zinc-800 text-amber-300 shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Mediums
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('core')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'core'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Core Trio (Billboard, Newspaper, Social)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('Outdoor')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'Outdoor' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Outdoor
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('Print')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'Print' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('Digital')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'Digital' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Digital
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('Retail')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedFilter === 'Retail' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Retail
              </button>
            </div>
          </div>

          {/* Mediums Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMediums.map((meta) => {
              const shot = shots[meta.id];
              const isAnchor = identity.referenceImageBase64 === shot?.imageUrl;

              return (
                <MediumCard
                  key={meta.id}
                  meta={meta}
                  shot={shot}
                  customPrompt={customPrompts[meta.id] || ''}
                  onUpdatePrompt={(newPrompt) => setCustomPrompts(prev => ({ ...prev, [meta.id]: newPrompt }))}
                  onGenerate={(id) => generateShot(id)}
                  onSetAsAnchor={handleSetAsAnchor}
                  onOpenMockup={(m, s) => setActiveMockup({ meta: m, shot: s })}
                  isAnchor={Boolean(isAnchor)}
                  isGeneratingAny={isGeneratingCampaign}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* Realistic Mockup Modal */}
      {activeMockup && (
        <MockupModal
          isOpen={Boolean(activeMockup)}
          onClose={() => setActiveMockup(null)}
          meta={activeMockup.meta}
          shot={activeMockup.shot}
          identity={identity}
        />
      )}

      {/* Brand Book & Campaign Dossier Modal */}
      <BrandBookModal
        isOpen={isBrandBookOpen}
        onClose={() => setIsBrandBookOpen(false)}
        identity={identity}
        shots={shots}
      />
    </div>
  );
}
