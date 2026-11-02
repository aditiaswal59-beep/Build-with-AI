export type MediumType = 
  | 'billboard' 
  | 'newspaper' 
  | 'social' 
  | 'subway' 
  | 'magazine' 
  | 'storefront'
  | 'bus_shelter'
  | 'retail_shelf';

export type AspectRatio = '1:1' | '16:9' | '3:4' | '4:3' | '9:16';

export interface MediumMeta {
  id: MediumType;
  title: string;
  category: 'Outdoor' | 'Print' | 'Digital' | 'Retail';
  aspectRatio: AspectRatio;
  iconName: string;
  description: string;
  defaultPromptSuffix: string;
  mockupType: 'billboard' | 'newspaper' | 'social' | 'poster' | 'magazine' | 'storefront';
}

export interface BrandIdentity {
  brandName: string;
  tagline: string;
  category: string;
  productDescription: string;
  productAnchor: string; // strict description for consistency
  primaryColors: string[];
  colorNames: string[];
  brandVoice: string;
  referenceImageBase64?: string; // locked master visual reference
  referenceMimeType?: string;
}

export interface GeneratedShot {
  id: string;
  medium: MediumType;
  imageUrl: string;
  prompt: string;
  modelUsed: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  status: 'idle' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ProductPreset {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  brandAnchor: string;
  primaryColors: string[];
  colorNames: string[];
  brandVoice: string;
  mediumPrompts: Partial<Record<MediumType, string>>;
}
