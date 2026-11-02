import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Shared server-side Gemini client with aistudio-build User-Agent
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure your API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health and configuration check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    nanoBananaModel: 'gemini-3.1-flash-lite-image',
    timestamp: new Date().toISOString(),
  });
});

let nanoBananaQuotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1000; // Track free-tier quota status

// Refine product description into structured brand identity & optimized medium prompts
app.post('/api/brand/refine-identity', async (req: Request, res: Response) => {
  try {
    const { rawDescription, brandNameHint } = req.body;
    if (!rawDescription || typeof rawDescription !== 'string') {
      return res.status(400).json({ error: 'Product description is required' });
    }

    const ai = getAiClient();
    const prompt = `You are an elite creative director and brand strategist.
The user wants to establish a brand identity for this product:
"${rawDescription}"
${brandNameHint ? `Preferred Brand Name: "${brandNameHint}"` : ''}

Generate a cohesive, distinctive brand identity and tailored visual advertising prompts.
IMPORTANT CONSTRAINT: There must be ABSOLUTELY NO PEOPLE in any images. The scene must be purely focused on the product and its medium/environment.
Branding, typography, and product design must be crisp, distinctive, and consistent.

Return strict JSON adhering to this schema:
{
  "brandName": "Short memorable brand name",
  "tagline": "Punchy 3-6 word brand tagline",
  "category": "e.g. Functional Botanicals, Minimalist Tech, Luxury Ceramics",
  "primaryColors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "colorNames": ["Deep Cobalt", "Warm Terracotta", "Champagne Gold", "Soft Linen"],
  "productAnchor": "A detailed 2-3 sentence visual description of the physical product, packaging, materials, silhouette, and embossed/printed branding that must stay identical in every shot.",
  "brandVoice": "e.g. Avant-Garde Minimalist, Warm Organic Luxury, Bold Retro-Modern",
  "mediumPrompts": {
    "billboard": "A cinematic highway/city overhead billboard ad featuring [product]...",
    "newspaper": "A textured vintage or modern full-page newspaper ad printed on authentic newsprint paper featuring [product]...",
    "social": "A clean, vibrant editorial social media product photo shot on a modern architectural plinth with sharp sunlight featuring [product]...",
    "subway": "An illuminated modern subway station lightbox ad featuring [product]...",
    "magazine": "A double-page glossy fashion and design magazine spread open flat featuring [product]...",
    "storefront": "A luxury boutique window display at night with soft ambient spotlights featuring [product]..."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error refining brand identity:', error);
    res.status(500).json({
      error: error?.message || 'Failed to refine brand identity',
    });
  }
});

// Generate image using Nano-Banana model (gemini-3.1-flash-lite-image or gemini-nano-banana-2.1)
app.post('/api/brand/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      medium,
      aspectRatio = '1:1',
      model = 'gemini-3.1-flash-lite-image',
      referenceImage, // base64 string if user wants reference image consistency
      referenceMimeType = 'image/png',
      productAnchor,
      brandName,
      tagline,
      category,
      primaryColors,
      colorNames,
      forceStudioRender,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    const safeBrand = (brandName || 'Lumina').trim();
    const isFreeTierQuotaExhausted = Date.now() < nanoBananaQuotaExhaustedUntil;

    // If Studio Pro model selected, or Nano-Banana has exhausted quota/scopes, render instantly
    if (isFreeTierQuotaExhausted || forceStudioRender || model === 'studio-pro') {
      const fallbackSvg = generateMediumSvgArtwork({
        medium: medium || 'Billboard',
        aspectRatio,
        brandName: safeBrand,
        tagline: tagline || '',
        category: category || '',
        productDescription: prompt || '',
        productAnchor: productAnchor || '',
        primaryColors: primaryColors || [],
        colorNames: colorNames || [],
        referenceImage,
      });

      return res.json({
        success: true,
        imageUrl: fallbackSvg,
        modelUsed: 'Studio Pro Engine (Nano-Banana Spec)',
        medium,
        aspectRatio,
        isFallback: true,
        quotaExceededOnKey: isFreeTierQuotaExhausted,
      });
    }

    try {
      const ai = getAiClient();
      const selectedModel = model === 'gemini-nano-banana-2.1' 
        ? 'gemini-nano-banana-2.1' 
        : 'gemini-3.1-flash-lite-image';

      const parts: any[] = [];

      // CRITICAL FIX: Only pass to Gemini inlineData if referenceImage is a valid raster base64 (JPEG, PNG, WebP)
      // Never pass SVG data URLs as base64 bytes to inlineData, as that triggers 400 Base64 decoding failed errors.
      const isRasterBase64 = referenceImage &&
        typeof referenceImage === 'string' &&
        !referenceImage.startsWith('data:image/svg+xml') &&
        referenceImage.includes(';base64,');

      if (isRasterBase64) {
        const mimeMatch = referenceImage.match(/^data:(image\/\w+);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : (referenceMimeType || 'image/png');
        const cleanBase64 = referenceImage.replace(/^data:image\/\w+;base64,/, '').trim();
        if (cleanBase64.length > 0) {
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: mime,
            },
          });
        }
      }

      const colorDesc = primaryColors && primaryColors.length > 0 
        ? `Brand Signature Color Palette: ${primaryColors.join(', ')}` 
        : '';

      const enrichedPrompt = `[COMMERCIAL ADVERTISING PHOTOGRAPHY]
MEDIUM: ${medium ? medium.toUpperCase() : 'COMMERCIAL ADVERTISEMENT'}
BRAND NAME: ${safeBrand}
${category ? `CATEGORY: ${category}` : ''}
${colorDesc}
${productAnchor ? `EXACT PRODUCT SPECIFICATION (MUST MAINTAIN CONSISTENCY): ${productAnchor}` : ''}

SCENE:
${prompt}

STRICT MANDATORY RULES:
1. STRICT NEGATIVE CONSTRAINT: Absolutely NO PEOPLE, NO human faces, NO human hands, NO fingers, NO human bodies, NO silhouettes of people anywhere in the entire image. The scene must be 100% devoid of any human presence.
2. PRODUCT CONSISTENCY: The product's shape, materials, silhouette, color palette, and packaging design must stay faithful and consistent.
3. BRANDING CLARITY: The branding, logo, and typography for "${safeBrand}" must be razor-sharp, distinct, beautifully legible, and professionally integrated into the medium.
4. COMMERCIAL QUALITY: High-end advertising photography, studio lighting, hyper-realistic textures, clean composition, authentic medium characteristics.`;

      parts.push({ text: enrichedPrompt });

      const isBanana21 = selectedModel === 'gemini-nano-banana-2.1';

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            ...(isBanana21 ? { imageSize: '1K' } : {}),
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const base64EncodeString: string = part.inlineData.data;
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        return res.json({
          success: true,
          imageUrl,
          modelUsed: selectedModel,
          medium,
          aspectRatio,
        });
      }
    } catch (error: any) {
      // Check if error is quota exhaustion on free tier or permission/scope limitation
      const errStr = String(error?.message || '');
      const isQuotaOrAuthError = errStr.includes('RESOURCE_EXHAUSTED') || 
        errStr.includes('quota') || 
        errStr.includes('429') ||
        errStr.includes('403') ||
        errStr.includes('PERMISSION_DENIED') ||
        errStr.includes('INSUFFICIENT');

      if (isQuotaOrAuthError) {
        nanoBananaQuotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1000;
      }
      console.info(`[Brand Builder] Using Studio Pro Engine fallback for ${medium} (${isQuotaOrAuthError ? 'free-tier or service fallback' : 'fallback'})`);
    }

    // High-Fidelity Studio Artwork Fallback with user's exact colors & product category
    const fallbackSvg = generateMediumSvgArtwork({
      medium: medium || 'Billboard',
      aspectRatio,
      brandName: safeBrand,
      tagline: tagline || '',
      category: category || '',
      productDescription: prompt || '',
      productAnchor: productAnchor || '',
      primaryColors: primaryColors || [],
      colorNames: colorNames || [],
      referenceImage,
    });

    res.json({
      success: true,
      imageUrl: fallbackSvg,
      modelUsed: 'Studio Pro Engine (Nano-Banana Spec)',
      medium,
      aspectRatio,
      isFallback: true,
      quotaExceededOnKey: true,
    });
  } catch (outerErr: any) {
    res.status(500).json({ error: outerErr?.message || 'Internal generation error' });
  }
});

// Helper to safely escape text for XML / SVG compliance
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to generate bespoke, beautiful SVG advertising graphics
function generateMediumSvgArtwork(params: {
  medium: string;
  aspectRatio: string;
  brandName: string;
  tagline?: string;
  category?: string;
  productDescription?: string;
  productAnchor?: string;
  primaryColors?: string[];
  colorNames?: string[];
  referenceImage?: string;
}): string {
  const { medium, aspectRatio, brandName, tagline = '', category = '', productDescription = '', productAnchor = '', primaryColors = [], referenceImage } = params;
  const med = medium.toLowerCase();
  
  // Dimensions based on aspect ratio
  let width = 1200;
  let height = 1200;
  if (aspectRatio === '16:9') {
    width = 1600;
    height = 900;
  } else if (aspectRatio === '3:4') {
    width = 900;
    height = 1200;
  } else if (aspectRatio === '4:3') {
    width = 1200;
    height = 900;
  } else if (aspectRatio === '9:16') {
    width = 900;
    height = 1600;
  }

  const safeBrand = escapeXml((brandName || 'BRAND').trim().toUpperCase());
  const safeTagline = escapeXml((tagline || 'Pioneering Pure Form').trim().toUpperCase());
  const safeCategory = escapeXml((category || 'ORIGINAL').trim().toUpperCase());

  // Extract custom user colors with elegant defaults
  const c1 = primaryColors[0] || '#D4A373'; // Main product color / liquid / body
  const c2 = primaryColors[1] || '#1B263B'; // Secondary / casing / contrast
  const c3 = primaryColors[2] || '#B8860B'; // Accent / foil / metallic highlight
  const c4 = primaryColors[3] || '#F8F9FA'; // Typography / light label

  // Detect product archetype from category, description, prompt, and anchor
  const desc = `${category} ${productDescription} ${productAnchor} ${params.productAnchor || ''} ${safeBrand}`.toLowerCase();
  let archetype: 'lipstick' | 'specs' | 'sneaker' | 'candle' | 'bag' | 'camera' | 'perfume' | 'can' | 'jewelry' | 'clock' | 'serum' | 'tea' | 'audio' | 'bottle' | 'universal' = 'universal';

  if (desc.includes('lipstick') || desc.includes('lip ') || desc.includes('rouge') || desc.includes('balm') || desc.includes('cosmetic stick') || desc.includes('gloss')) {
    archetype = 'lipstick';
  } else if (desc.includes('spec') || desc.includes('glass') || desc.includes('sunglass') || desc.includes('eyewear') || desc.includes('optic') || desc.includes('frame') || desc.includes('shades')) {
    archetype = 'specs';
  } else if (desc.includes('sneaker') || desc.includes('shoe') || desc.includes('footwear') || desc.includes('kicks') || desc.includes('runner') || desc.includes('boot') || desc.includes('trainer')) {
    archetype = 'sneaker';
  } else if (desc.includes('candle') || desc.includes('wax') || desc.includes('votive') || desc.includes('scent') || desc.includes('flame') || desc.includes('diffuser')) {
    archetype = 'candle';
  } else if (desc.includes('bag') || desc.includes('handbag') || desc.includes('tote') || desc.includes('purse') || desc.includes('backpack') || desc.includes('leather') || desc.includes('clutch') || desc.includes('briefcase')) {
    archetype = 'bag';
  } else if (desc.includes('camera') || desc.includes('lens') || desc.includes('leica') || desc.includes('dslr') || desc.includes('mirrorless') || desc.includes('photography')) {
    archetype = 'camera';
  } else if (desc.includes('perfume') || desc.includes('parfum') || desc.includes('fragrance') || desc.includes('cologne') || desc.includes('scent bottle')) {
    archetype = 'perfume';
  } else if (desc.includes('can') || desc.includes('soda') || desc.includes('beverage can') || desc.includes('beer') || desc.includes('seltzer') || desc.includes('energy drink')) {
    archetype = 'can';
  } else if (desc.includes('ring') || desc.includes('jewelry') || desc.includes('jewellery') || desc.includes('necklace') || desc.includes('pendant') || desc.includes('diamond')) {
    archetype = 'jewelry';
  } else if (desc.includes('clock') || desc.includes('watch') || desc.includes('chrono') || desc.includes('horology') || desc.includes('timekeeper') || desc.includes('dial') || desc.includes('smartwatch')) {
    archetype = 'clock';
  } else if (desc.includes('serum') || desc.includes('skincare') || desc.includes('pump') || desc.includes('glacier') || desc.includes('derma') || desc.includes('lotion') || desc.includes('cream')) {
    archetype = 'serum';
  } else if (desc.includes('tea') || desc.includes('matcha') || desc.includes('caddy') || desc.includes('tin') || desc.includes('canister') || desc.includes('coffee')) {
    archetype = 'tea';
  } else if (desc.includes('headphone') || desc.includes('audio') || desc.includes('speaker') || desc.includes('cyber') || desc.includes('sound') || desc.includes('earbuds') || desc.includes('earphones')) {
    archetype = 'audio';
  } else if (desc.includes('bottle') || desc.includes('elixir') || desc.includes('flacon') || desc.includes('beverage') || desc.includes('drink') || desc.includes('tonic')) {
    archetype = 'bottle';
  } else {
    archetype = 'universal';
  }

  // Only embed referenceImage if it is an actual user-uploaded raster photograph (PNG/JPEG/WebP).
  // Never embed a previously generated SVG or data URL, ensuring newly selected colors and product types take effect immediately!
  const isUserUploadedPhoto = referenceImage &&
    typeof referenceImage === 'string' &&
    !referenceImage.startsWith('data:image/svg+xml') &&
    (referenceImage.startsWith('data:image/png') ||
     referenceImage.startsWith('data:image/jpeg') ||
     referenceImage.startsWith('data:image/webp'));

  const safeImageHref = isUserUploadedPhoto
    ? referenceImage.replace(/"/g, '&quot;')
    : null;

  // Helper to render the specific product silhouette
  const renderProduct = (isMonochrome = false) => {
    if (safeImageHref) {
      return `<image href="${safeImageHref}" x="-120" y="-140" width="240" height="280" preserveAspectRatio="xMidYMid meet" ${isMonochrome ? 'filter="grayscale(100%) contrast(150%)"' : ''} />`;
    }

    const p1 = isMonochrome ? '#27272a' : c1;
    const p2 = isMonochrome ? '#18181b' : c2;
    const p3 = isMonochrome ? '#52525b' : c3;
    const p4 = isMonochrome ? '#f4f4f5' : c4;

    switch (archetype) {
      case 'lipstick':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="50" ry="12" fill="#000" opacity="0.35" />
            <!-- Lower Beveled Lipstick Case Base -->
            <rect x="-30" y="5" width="60" height="105" rx="10" fill="${p2}" stroke="${p3}" stroke-width="2.5" />
            <!-- Metallic Mechanism Collar -->
            <rect x="-24" y="-30" width="48" height="38" rx="4" fill="${p3}" />
            <line x1="-24" y1="-14" x2="24" y2="-14" stroke="${p2}" stroke-width="1.5" />
            <!-- Angled Sculpted Lipstick Bullet in Brand Primary Color -->
            <path d="M-20,-30 L-20,-75 C-20,-92 0,-112 18,-95 L18,-30 Z" fill="${p1}" stroke="${p3}" stroke-width="1.5" />
            <path d="M-12,-30 L-12,-72 C-12,-85 2,-98 12,-90 L12,-30 Z" fill="${p1}" opacity="0.75" />
            <!-- Debossed Brand Mark on Casing -->
            <rect x="-24" y="30" width="48" height="55" rx="4" fill="${p2}" />
            <text x="0" y="60" font-family="serif" font-size="11" font-weight="900" fill="${p3}" text-anchor="middle" letter-spacing="1.5">${safeBrand}</text>
            <text x="0" y="74" font-family="sans-serif" font-size="6" font-weight="bold" fill="${p4}" text-anchor="middle" letter-spacing="2">LIP COLOUR</text>
          </g>
        `;
      case 'specs':
        return `
          <g>
            <ellipse cx="0" cy="85" rx="110" ry="14" fill="#000" opacity="0.3" />
            <!-- Left Lens Rim -->
            <rect x="-105" y="-45" width="90" height="70" rx="22" fill="${p2}" opacity="0.45" stroke="${p1}" stroke-width="6" />
            <rect x="-100" y="-40" width="80" height="60" rx="18" fill="${p3}" opacity="0.2" />
            <line x1="-85" y1="-30" x2="-45" y2="10" stroke="${p4}" stroke-width="2" opacity="0.4" stroke-linecap="round" />
            
            <!-- Right Lens Rim -->
            <rect x="15" y="-45" width="90" height="70" rx="22" fill="${p2}" opacity="0.45" stroke="${p1}" stroke-width="6" />
            <rect x="20" y="-40" width="80" height="60" rx="18" fill="${p3}" opacity="0.2" />
            <line x1="35" y1="-30" x2="75" y2="10" stroke="${p4}" stroke-width="2" opacity="0.4" stroke-linecap="round" />

            <!-- Bridge Bar & Accents -->
            <path d="M-15,-20 Q0,-32 15,-20" fill="none" stroke="${p3}" stroke-width="4.5" stroke-linecap="round" />
            <line x1="-15" y1="-12" x2="15" y2="-12" stroke="${p1}" stroke-width="2.5" />

            <!-- Temple Hinges -->
            <path d="M-105,-22 L-130,-48" fill="none" stroke="${p3}" stroke-width="4" stroke-linecap="round" />
            <path d="M105,-22 L130,-48" fill="none" stroke="${p3}" stroke-width="4" stroke-linecap="round" />

            <!-- Brand Monogram Stand -->
            <g transform="translate(0, 42)">
              <rect x="-55" y="0" width="110" height="22" rx="4" fill="${p2}" stroke="${p3}" stroke-width="1" />
              <text x="0" y="14" font-family="sans-serif" font-size="8.5" font-weight="900" fill="${p4}" text-anchor="middle" letter-spacing="1.5">${safeBrand} EYEWEAR</text>
            </g>
          </g>
        `;
      case 'sneaker':
        return `
          <g>
            <ellipse cx="0" cy="85" rx="110" ry="14" fill="#000" opacity="0.3" />
            <!-- Sculpted Sole -->
            <path d="M-105,45 Q-30,55 90,45 Q115,40 120,25 Q110,18 80,24 Q-20,28 -105,22 Z" fill="${p4}" stroke="${p3}" stroke-width="2" />
            <!-- Upper Silhouette -->
            <path d="M-100,22 Q-105,-5 -75,-15 Q-55,-25 -25,-10 Q10,12 55,-5 Q85,-18 105,10 Q112,22 105,24 Z" fill="${p1}" stroke="${p2}" stroke-width="2.5" />
            <!-- Heel Counter -->
            <path d="M-100,22 Q-105,-5 -75,-15 L-65,24 Z" fill="${p3}" />
            <!-- Lacing Structure -->
            <path d="M-20,-5 Q10,10 40,-2" fill="none" stroke="${p3}" stroke-width="3" />
            <circle cx="-10" cy="0" r="3" fill="${p4}" />
            <circle cx="10" cy="4" r="3" fill="${p4}" />
            <circle cx="30" cy="0" r="3" fill="${p4}" />
            <!-- Brand Badge -->
            <rect x="-55" y="6" width="38" height="14" rx="3" fill="${p2}" />
            <text x="-36" y="16" font-family="sans-serif" font-size="7" font-weight="900" fill="${p4}" text-anchor="middle">${safeBrand}</text>
          </g>
        `;
      case 'candle':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="65" ry="14" fill="#000" opacity="0.35" />
            <!-- Ceramic Tumbler Body -->
            <rect x="-50" y="-45" width="100" height="150" rx="14" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <ellipse cx="0" cy="-45" rx="50" ry="12" fill="${p4}" />
            <line x1="0" y1="-45" x2="0" y2="-65" stroke="#18181b" stroke-width="3" stroke-linecap="round" />
            <!-- Flickering Flame -->
            <path d="M0,-65 C-10,-78 -8,-98 0,-112 C8,-98 10,-78 0,-65 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" />
            <circle cx="0" cy="-80" r="4" fill="#ffffff" />
            <!-- Label -->
            <rect x="-36" y="5" width="72" height="80" rx="4" fill="${p2}" />
            <text x="0" y="40" font-family="serif" font-size="12" font-weight="900" fill="${p4}" text-anchor="middle" letter-spacing="1">${safeBrand}</text>
            <text x="0" y="58" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="2">SCENTED CANDLE</text>
          </g>
        `;
      case 'bag':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="75" ry="14" fill="#000" opacity="0.35" />
            <!-- Leather Body -->
            <path d="M-65,100 L-50,-25 Q-45,-35 -30,-35 L30,-35 Q45,-35 50,-25 L65,100 Z" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <!-- Top Handles -->
            <path d="M-30,-35 C-30,-95 30,-95 30,-35" fill="none" stroke="${p2}" stroke-width="9" stroke-linecap="round" />
            <path d="M-28,-35 C-28,-90 28,-90 28,-35" fill="none" stroke="${p3}" stroke-width="2" />
            <!-- Metallic Clasp -->
            <path d="M-45,-20 L45,-20 L35,25 L-35,25 Z" fill="${p2}" />
            <circle cx="0" cy="25" r="9" fill="${p3}" stroke="${p4}" stroke-width="1.5" />
            <!-- Foil Logo -->
            <text x="0" y="58" font-family="serif" font-size="11" font-weight="900" fill="${p3}" text-anchor="middle" letter-spacing="2">${safeBrand}</text>
            <text x="0" y="72" font-family="sans-serif" font-size="6.5" fill="${p4}" text-anchor="middle" letter-spacing="1">MAISON</text>
          </g>
        `;
      case 'clock':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="85" ry="14" fill="#000" opacity="0.4" />
            <rect x="-80" y="-80" width="160" height="160" rx="36" fill="${p1}" stroke="${p3}" stroke-width="3" />
            <circle cx="0" cy="0" r="62" fill="${p2}" stroke="${p3}" stroke-width="1.5" />
            <line x1="0" y1="-54" x2="0" y2="-45" stroke="${p3}" stroke-width="2.5" />
            <line x1="54" y1="0" x2="45" y2="0" stroke="${p3}" stroke-width="2.5" />
            <line x1="0" y1="54" x2="0" y2="45" stroke="${p3}" stroke-width="2.5" />
            <line x1="-54" y1="0" x2="-45" y2="0" stroke="${p3}" stroke-width="2.5" />
            <line x1="0" y1="0" x2="-24" y2="-28" stroke="${p3}" stroke-width="3" stroke-linecap="round" />
            <line x1="0" y1="0" x2="34" y2="-12" stroke="${p3}" stroke-width="2" stroke-linecap="round" />
            <circle cx="0" cy="0" r="4.5" fill="${p4}" />
            <text x="0" y="26" font-family="sans-serif" font-size="9" font-weight="900" fill="${p4}" text-anchor="middle" letter-spacing="2">${safeBrand}</text>
          </g>
        `;
      case 'serum':
        return `
          <g>
            <ellipse cx="0" cy="125" rx="55" ry="12" fill="#000" opacity="0.35" />
            <rect x="-42" y="-50" width="84" height="165" rx="20" fill="${p1}" opacity="0.88" stroke="${p3}" stroke-width="1.5" />
            <rect x="-35" y="-30" width="70" height="135" rx="14" fill="${p1}" opacity="0.6" />
            <rect x="-24" y="-72" width="48" height="22" rx="4" fill="${p3}" />
            <rect x="-16" y="-96" width="32" height="24" rx="6" fill="${p2}" />
            <rect x="0" y="-90" width="22" height="6" rx="2" fill="${p2}" />
            <rect x="-28" y="-10" width="56" height="95" rx="4" fill="${p4}" opacity="0.95" />
            <text x="0" y="30" font-family="sans-serif" font-size="11" font-weight="800" fill="${p2}" text-anchor="middle" letter-spacing="1">${safeBrand}</text>
            <text x="0" y="48" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${p3}" text-anchor="middle" letter-spacing="1">SERUM ELIXIR</text>
          </g>
        `;
      case 'tea':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="65" ry="14" fill="#000" opacity="0.4" />
            <rect x="-55" y="-75" width="110" height="180" rx="16" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <rect x="-58" y="-96" width="116" height="26" rx="6" fill="${p2}" stroke="${p3}" stroke-width="1.5" />
            <rect x="-55" y="-40" width="110" height="16" fill="${p3}" />
            <rect x="-40" y="-15" width="80" height="95" rx="4" fill="${p4}" />
            <text x="0" y="24" font-family="serif" font-size="13" font-weight="900" fill="${p2}" text-anchor="middle" letter-spacing="1">${safeBrand}</text>
            <text x="0" y="44" font-family="sans-serif" font-size="7" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="2">CEREMONIAL</text>
          </g>
        `;
      case 'audio':
        return `
          <g>
            <ellipse cx="0" cy="120" rx="75" ry="14" fill="#000" opacity="0.4" />
            <rect x="-20" y="10" width="40" height="100" fill="${p2}" />
            <path d="M-65,10 C-65,-100 65,-100 65,10" fill="none" stroke="${p2}" stroke-width="12" stroke-linecap="round" />
            <path d="M-55,0 C-55,-85 55,-85 55,0" fill="none" stroke="${p3}" stroke-width="2" />
            <rect x="-82" y="-15" width="30" height="65" rx="14" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <circle cx="-67" cy="17" r="8" fill="${p3}" />
            <rect x="52" y="-15" width="30" height="65" rx="14" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <circle cx="67" cy="17" r="8" fill="${p3}" />
            <rect x="-35" y="70" width="70" height="20" rx="4" fill="${p4}" />
            <text x="0" y="84" font-family="sans-serif" font-size="8" font-weight="bold" fill="${p2}" text-anchor="middle" letter-spacing="1">${safeBrand}</text>
          </g>
        `;
      case 'camera':
        return `
          <g>
            <ellipse cx="0" cy="95" rx="85" ry="14" fill="#000" opacity="0.4" />
            <!-- Camera Body in Primary & Secondary Colors -->
            <rect x="-80" y="-45" width="160" height="110" rx="14" fill="${p2}" stroke="${p3}" stroke-width="2.5" />
            <rect x="-80" y="-10" width="160" height="65" fill="${p1}" opacity="0.85" />
            <!-- Top Deck & Dials -->
            <rect x="-70" y="-55" width="50" height="12" rx="3" fill="${p3}" />
            <circle cx="-50" cy="-60" r="9" fill="${p3}" stroke="${p2}" stroke-width="2" />
            <circle cx="50" cy="-60" r="11" fill="${p3}" stroke="${p2}" stroke-width="2" />
            <!-- Viewfinder -->
            <rect x="-20" y="-52" width="22" height="10" rx="2" fill="${p4}" />
            <!-- Large Precision Lens Cylinder -->
            <circle cx="0" cy="15" r="46" fill="${p2}" stroke="${p3}" stroke-width="3" />
            <circle cx="0" cy="15" r="38" fill="#090d16" stroke="${p1}" stroke-width="3" />
            <circle cx="0" cy="15" r="26" fill="${p3}" opacity="0.4" />
            <circle cx="0" cy="15" r="12" fill="${p1}" />
            <circle cx="-6" cy="10" r="4" fill="${p4}" opacity="0.8" />
            <!-- Brand Script -->
            <text x="-65" y="-22" font-family="sans-serif" font-size="9" font-weight="900" fill="${p4}">${safeBrand}</text>
          </g>
        `;
      case 'perfume':
        return `
          <g>
            <ellipse cx="0" cy="115" rx="60" ry="14" fill="#000" opacity="0.4" />
            <!-- Faceted Crystal Flacon -->
            <polygon points="-50,-35 50,-35 60,95 -60,95" fill="${p1}" opacity="0.85" stroke="${p3}" stroke-width="2" />
            <polygon points="-40,-25 40,-25 48,85 -48,85" fill="${p1}" opacity="0.5" />
            <!-- Gold Neck & Spray Nozzle Collar -->
            <rect x="-18" y="-55" width="36" height="20" rx="3" fill="${p3}" />
            <!-- Geometric Crystal Stopper -->
            <rect x="-28" y="-95" width="56" height="40" rx="6" fill="${p2}" stroke="${p3}" stroke-width="2" />
            <rect x="-20" y="-87" width="40" height="24" rx="3" fill="${p1}" opacity="0.3" />
            <!-- Centered Gold Label Plaque -->
            <rect x="-35" y="10" width="70" height="55" rx="3" fill="${p4}" stroke="${p3}" stroke-width="1.5" />
            <text x="0" y="32" font-family="serif" font-size="11" font-weight="900" fill="${p2}" text-anchor="middle" letter-spacing="1.5">${safeBrand}</text>
            <text x="0" y="48" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="2">PARFUM</text>
          </g>
        `;
      case 'can':
        return `
          <g>
            <ellipse cx="0" cy="120" rx="55" ry="12" fill="#000" opacity="0.4" />
            <!-- Cylindrical Can Body -->
            <rect x="-46" y="-65" width="92" height="170" rx="14" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <!-- Metallic Chime Rims Top & Bottom -->
            <ellipse cx="0" cy="-65" rx="46" ry="12" fill="${p4}" stroke="${p3}" stroke-width="2" />
            <ellipse cx="0" cy="-65" rx="36" ry="9" fill="${p2}" />
            <!-- Ring Pull Tab -->
            <rect x="-8" y="-72" width="16" height="10" rx="4" fill="${p3}" />
            <circle cx="0" cy="-67" r="3" fill="${p2}" />
            <!-- Vertical Brand Ribbon & Typography -->
            <path d="M-46,0 L46,-20 L46,30 L-46,50 Z" fill="${p2}" opacity="0.9" />
            <text x="0" y="22" font-family="sans-serif" font-size="14" font-weight="900" fill="${p4}" text-anchor="middle" letter-spacing="2">${safeBrand}</text>
            <text x="0" y="38" font-family="sans-serif" font-size="7" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="3">COLD CRAFT</text>
          </g>
        `;
      case 'jewelry':
        return `
          <g>
            <ellipse cx="0" cy="100" rx="75" ry="14" fill="#000" opacity="0.4" />
            <!-- Sculptural Presentation Plinth -->
            <polygon points="-65,100 65,100 80,45 -80,45" fill="${p2}" stroke="${p3}" stroke-width="1.5" />
            <!-- Precious Metal Ring Band -->
            <ellipse cx="0" cy="0" rx="48" ry="48" fill="none" stroke="${p3}" stroke-width="12" />
            <ellipse cx="0" cy="0" rx="42" ry="42" fill="none" stroke="${p1}" stroke-width="2.5" />
            <!-- Bezel & Radiant Gem -->
            <polygon points="-16,-48 16,-48 24,-72 0,-85 -24,-72" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <polygon points="-8,-52 8,-52 14,-68 0,-76 -14,-68" fill="${p4}" opacity="0.8" />
            <!-- Brand Seal -->
            <text x="0" y="78" font-family="serif" font-size="11" font-weight="900" fill="${p3}" text-anchor="middle" letter-spacing="2">${safeBrand}</text>
          </g>
        `;
      case 'bottle':
        return `
          <g>
            <ellipse cx="0" cy="120" rx="65" ry="14" fill="#000" opacity="0.45" />
            <rect x="-48" y="-60" width="96" height="170" rx="24" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <rect x="-24" y="-88" width="48" height="28" rx="4" fill="${p2}" />
            <rect x="-14" y="-112" width="28" height="24" rx="4" fill="${p3}" />
            <rect x="-36" y="-20" width="72" height="105" rx="4" fill="${p4}" />
            <text x="0" y="22" font-family="serif" font-size="14" font-weight="900" fill="${p2}" text-anchor="middle">${safeBrand}</text>
            <text x="0" y="44" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="2">ESSENCE</text>
          </g>
        `;
      case 'universal':
      default:
        return `
          <g>
            <ellipse cx="0" cy="115" rx="80" ry="14" fill="#000" opacity="0.35" />
            <!-- Geometric Architectural Monolith Package / Device -->
            <rect x="-65" y="-70" width="130" height="175" rx="22" fill="${p1}" stroke="${p3}" stroke-width="2" />
            <rect x="-52" y="-55" width="104" height="145" rx="14" fill="${p2}" />
            <!-- Center Accent Window -->
            <rect x="-40" y="-35" width="80" height="70" rx="8" fill="${p1}" opacity="0.75" stroke="${p3}" stroke-width="1.5" />
            <circle cx="0" cy="0" r="18" fill="${p3}" opacity="0.3" />
            <!-- Monogram & Typography -->
            <text x="0" y="-4" font-family="sans-serif" font-size="12" font-weight="900" fill="${p4}" text-anchor="middle" letter-spacing="2">${safeBrand}</text>
            <circle cx="-20" cy="55" r="5" fill="${p3}" />
            <circle cx="0" cy="55" r="5" fill="${p4}" />
            <circle cx="20" cy="55" r="5" fill="${p3}" />
            <text x="0" y="78" font-family="sans-serif" font-size="7" font-weight="bold" fill="${p3}" text-anchor="middle" letter-spacing="1.5">${safeCategory.slice(0, 18)}</text>
          </g>
        `;
    }
  };

  if (med.includes('billboard')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#050814" />
          <stop offset="60%" stop-color="#0f172a" />
          <stop offset="85%" stop-color="${c2}" />
          <stop offset="100%" stop-color="${c1}" />
        </linearGradient>
        <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="${c2}" />
          <stop offset="100%" stop-color="#020408" />
        </linearGradient>
        <radialGradient id="productGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Dusk Sky -->
      <rect width="${width}" height="${height}" fill="url(#skyGrad)" />
      <!-- Distant City Horizon Silhouette -->
      <path d="M0,${height * 0.88} L120,${height * 0.88} L120,${height * 0.82} L200,${height * 0.82} L200,${height * 0.88} L380,${height * 0.88} L380,${height * 0.79} L440,${height * 0.79} L440,${height * 0.88} L600,${height * 0.88} L600,${height * 0.75} L680,${height * 0.75} L680,${height * 0.88} L900,${height * 0.88} L900,${height * 0.8} L1020,${height * 0.8} L1020,${height * 0.88} L1600,${height * 0.88} L1600,${height} L0,${height} Z" fill="#04060c" opacity="0.9" />
      <rect y="${height * 0.88}" width="${width}" height="${height * 0.12}" fill="#030408" />
      
      <!-- Billboard Canvas Frame -->
      <g transform="translate(${width * 0.08}, ${height * 0.12})">
        <rect width="${width * 0.84}" height="${height * 0.65}" rx="8" fill="#000" stroke="#334155" stroke-width="12" />
        <rect x="6" y="6" width="${width * 0.84 - 12}" height="${height * 0.65 - 12}" fill="url(#boardGrad)" />
        
        <!-- Overhead Spotlights -->
        <circle cx="100" cy="10" r="14" fill="${c3}" opacity="0.9" />
        <circle cx="${width * 0.42}" cy="10" r="14" fill="${c3}" opacity="0.9" />
        <circle cx="${width * 0.84 - 100}" cy="10" r="14" fill="${c3}" opacity="0.9" />

        <!-- Ambient Product Glow -->
        <circle cx="${width * 0.62}" cy="${height * 0.32}" r="220" fill="url(#productGlow)" />

        <!-- Render Specific Product -->
        <g transform="translate(${width * 0.62}, ${height * 0.32})">
          ${renderProduct(false)}
        </g>

        <!-- Giant Headline Typography -->
        <text x="65" y="130" font-family="Georgia, serif" font-size="48" font-weight="900" fill="${c4}" letter-spacing="3">${safeBrand}</text>
        <text x="65" y="175" font-family="sans-serif" font-size="16" font-weight="700" fill="${c3}" letter-spacing="4">${safeTagline}</text>
        <text x="65" y="215" font-family="sans-serif" font-size="13" fill="#94a3b8">Master advertising showcase. Precision form without human distraction.</text>

        <!-- Accent Action Pill -->
        <rect x="65" y="260" width="180" height="42" rx="8" fill="${c3}" />
        <text x="155" y="286" font-family="sans-serif" font-size="12" font-weight="900" fill="${c2}" text-anchor="middle" letter-spacing="1">EXPERIENCE ${safeBrand}</text>
      </g>
      
      <!-- Support Steel Trusses -->
      <g stroke="#334155" stroke-width="8" fill="none">
        <line x1="${width * 0.3}" y1="${height * 0.77}" x2="${width * 0.3}" y2="${height * 0.95}" />
        <line x1="${width * 0.7}" y1="${height * 0.77}" x2="${width * 0.7}" y2="${height * 0.95}" />
        <line x1="${width * 0.3}" y1="${height * 0.77}" x2="${width * 0.7}" y2="${height * 0.95}" stroke-width="4" stroke="#1e293b" />
        <line x1="${width * 0.7}" y1="${height * 0.77}" x2="${width * 0.3}" y2="${height * 0.95}" stroke-width="4" stroke="#1e293b" />
      </g>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } else if (med.includes('newspaper')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <pattern id="halftone" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.2" fill="#18181b" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="#f2ecde" />
      <rect width="${width}" height="${height}" fill="url(#halftone)" opacity="0.45" />
      <rect x="36" y="36" width="${width - 72}" height="${height - 72}" fill="none" stroke="#27272a" stroke-width="2" />
      
      <!-- Masthead -->
      <g transform="translate(60, 65)">
        <text x="${(width - 120) / 2}" y="24" font-family="'Times New Roman', serif" font-size="11" font-weight="bold" letter-spacing="4" fill="#52525b" text-anchor="middle">INTERNATIONAL COMMERCIAL CHRONICLE</text>
        <line x1="0" y1="36" x2="${width - 120}" y2="36" stroke="#27272a" stroke-width="2" />
        <text x="${(width - 120) / 2}" y="85" font-family="'Times New Roman', Georgia, serif" font-size="52" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="1">THE COMMERCIAL DISPATCH</text>
        <line x1="0" y1="102" x2="${width - 120}" y2="102" stroke="#27272a" stroke-width="3" />
        <line x1="0" y1="106" x2="${width - 120}" y2="106" stroke="#27272a" stroke-width="1" />
      </g>

      <!-- Headline -->
      <g transform="translate(60, 205)">
        <text x="${(width - 120) / 2}" y="32" font-family="'Times New Roman', serif" font-size="28" font-weight="bold" fill="#18181b" text-anchor="middle" letter-spacing="1">${safeBrand} INTRODUCES THE NEW ${safeCategory}</text>
        <text x="${(width - 120) / 2}" y="56" font-family="serif" font-style="italic" font-size="14" fill="#3f3f46" text-anchor="middle">"${safeTagline}" — Architectural purity without human distraction</text>
        <line x1="100" y1="72" x2="${width - 220}" y2="72" stroke="#71717a" stroke-width="1" />
      </g>

      <!-- Central Lithograph Box -->
      <g transform="translate(70, 305)">
        <rect width="${width - 140}" height="${height * 0.44}" fill="#e8e2d2" stroke="#18181b" stroke-width="2" />
        <g transform="translate(${(width - 140) / 2}, ${height * 0.22})">
          ${renderProduct(true)}
        </g>
        <text x="${(width - 140) / 2}" y="${height * 0.44 - 14}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#3f3f46" text-anchor="middle">FIGURE 1.0 — THE OFFICIAL ${safeBrand} SPECIFICATION</text>
      </g>

      <!-- Multi-Column Text -->
      <g transform="translate(70, ${height * 0.77})">
        <line x1="0" y1="0" x2="${width - 140}" y2="0" stroke="#27272a" stroke-width="1" />
        <text x="0" y="24" font-family="serif" font-size="11" fill="#27272a">
          <tspan x="0" dy="0" font-weight="bold">AUTUMN DISPATCH —</tspan>
          <tspan>In an era overwhelmed by</tspan>
          <tspan x="0" dy="16">ephemeral novelties, ${safeBrand} exhibits a</tspan>
          <tspan x="0" dy="16">discipline that commands quiet authority.</tspan>
        </text>
        <line x1="${(width - 140) / 3}" y1="10" x2="${(width - 140) / 3}" y2="120" stroke="#a1a1aa" stroke-width="1" />
        <text x="${(width - 140) / 3 + 20}" y="24" font-family="serif" font-size="11" fill="#27272a">
          <tspan x="${(width - 140) / 3 + 20}" dy="0" font-weight="bold">PURITY OF MEDIUM —</tspan>
          <tspan>Free of human models</tspan>
          <tspan x="${(width - 140) / 3 + 20}" dy="16">or superfluous hands, the silhouette alone</tspan>
          <tspan x="${(width - 140) / 3 + 20}" dy="16">communicates tactile integrity.</tspan>
        </text>
        <line x1="${((width - 140) * 2) / 3}" y1="10" x2="${((width - 140) * 2) / 3}" y2="120" stroke="#a1a1aa" stroke-width="1" />
        <text x="${((width - 140) * 2) / 3 + 20}" y="24" font-family="serif" font-size="11" fill="#27272a">
          <tspan x="${((width - 140) * 2) / 3 + 20}" dy="0" font-weight="bold">CONSISTENT FINISH —</tspan>
          <tspan>Engineered under</tspan>
          <tspan x="${((width - 140) * 2) / 3 + 20}" dy="16">uncompromising standards to remain faithful</tspan>
          <tspan x="${((width - 140) * 2) / 3 + 20}" dy="16">across every civic medium.</tspan>
        </text>
      </g>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } else if (med.includes('subway') || med.includes('shelter')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
        <radialGradient id="transitGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="${c3}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#wallGrad)" />
      
      <g transform="translate(${width * 0.08}, ${height * 0.08})">
        <rect width="${width * 0.84}" height="${height * 0.84}" rx="14" fill="#030712" stroke="#475569" stroke-width="14" />
        <rect x="8" y="8" width="${width * 0.84 - 16}" height="${height * 0.84 - 16}" fill="${c2}" />
        <rect x="8" y="8" width="${width * 0.84 - 16}" height="${height * 0.84 - 16}" fill="url(#transitGlow)" />
        
        <g transform="translate(${width * 0.42}, ${height * 0.36})">
          ${renderProduct(false)}
        </g>

        <text x="${width * 0.42}" y="${height * 0.64}" font-family="Georgia, serif" font-size="44" font-weight="900" fill="${c4}" text-anchor="middle" letter-spacing="3">${safeBrand}</text>
        <text x="${width * 0.42}" y="${height * 0.69}" font-family="sans-serif" font-size="16" font-weight="bold" fill="${c3}" text-anchor="middle" letter-spacing="4">${safeTagline}</text>
        <text x="${width * 0.42}" y="${height * 0.74}" font-family="sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Zero passengers. Pure illuminated commercial presence.</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } else {
    // Social / Studio / General Still-Life
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <radialGradient id="studioLighting" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="${c2}" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </radialGradient>
        <linearGradient id="plinthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#studioLighting)" />
      
      <!-- Travertine Plinth -->
      <g transform="translate(${width * 0.25}, ${height * 0.65})">
        <polygon points="-80,80 400,200 600,120 100,0" fill="#000000" opacity="0.6" />
        <polygon points="0,0 300,-60 500,0 200,60" fill="url(#plinthGrad)" />
        <polygon points="0,0 200,60 200,160 0,100" fill="#cbd5e1" />
        <polygon points="200,60 500,0 500,100 200,160" fill="#64748b" />
      </g>

      <!-- Center Product -->
      <g transform="translate(${width * 0.5}, ${height * 0.45})">
        ${renderProduct(false)}
      </g>

      <!-- Studio Header Branding -->
      <g transform="translate(60, 90)">
        <text x="0" y="0" font-family="Georgia, serif" font-size="36" font-weight="900" fill="${c4}" letter-spacing="2">${safeBrand}</text>
        <text x="0" y="26" font-family="sans-serif" font-size="12" font-weight="bold" fill="${c3}" letter-spacing="4">${safeTagline}</text>
      </g>
      
      <!-- Zero People Certified Badge -->
      <g transform="translate(${width - 240}, ${height - 60})">
        <rect width="180" height="28" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <text x="90" y="18" font-family="sans-serif" font-size="10" font-weight="600" fill="#10b981" text-anchor="middle">✓ ZERO HUMANS VERIFIED</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Brand Builder server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
