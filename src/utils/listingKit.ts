export const WELCOME_LANGUAGES = ['EN', 'DE', 'FR', 'IT', 'NL', 'GR'] as const;

export type WelcomeLanguage = (typeof WELCOME_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<WelcomeLanguage, { native: string; english: string }> = {
  EN: { native: 'English', english: 'English' },
  DE: { native: 'Deutsch', english: 'German' },
  FR: { native: 'Français', english: 'French' },
  IT: { native: 'Italiano', english: 'Italian' },
  NL: { native: 'Nederlands', english: 'Dutch' },
  GR: { native: 'Ελληνικά', english: 'Greek' },
};

export interface ListingKit {
  listing_title: string;
  listing_description: string;
  detected_amenities: string[];
  welcome_guide: Record<WelcomeLanguage, string>;
  message_templates: {
    welcome: string;
    checkout: string;
  };
}

export interface PhotoInputPayload {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 without data: prefix
  previewUrl: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface TitleLengthStatus {
  count: number;
  max: number;
  remaining: number;
  status: 'optimal' | 'warning' | 'over';
}

export const MAX_TITLE_LENGTH = 50;
export const MAX_PHOTOS = 8;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function validateGenerateInput(
  photos: Array<{ mimeType: string; data?: string }>,
  notes: string,
): ValidationResult {
  const trimmedNotes = notes.trim();
  if (photos.length === 0 && trimmedNotes.length === 0) {
    return {
      valid: false,
      error: 'Upload at least one property photo or enter rough host notes before generating.',
    };
  }

  if (photos.length > MAX_PHOTOS) {
    return {
      valid: false,
      error: `Please upload at most ${MAX_PHOTOS} property photos per analysis.`,
    };
  }

  for (const photo of photos) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(photo.mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format (${photo.mimeType}). Use JPG, PNG, or WebP.`,
      };
    }
  }

  if (photos.length === 0 && trimmedNotes.length < 10) {
    return {
      valid: false,
      error: 'Without photos, please provide at least 10 characters of host notes.',
    };
  }

  return { valid: true };
}

export function clampListingTitle(title: string, max = MAX_TITLE_LENGTH): string {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) {
    return cleaned;
  }

  const sliced = cleaned.slice(0, max);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace >= Math.floor(max * 0.6)) {
    return sliced.slice(0, lastSpace).trim();
  }
  return sliced.trim();
}

export function getTitleLengthStatus(title: string, max = MAX_TITLE_LENGTH): TitleLengthStatus {
  const count = title.length;
  const remaining = max - count;
  if (count > max) {
    return { count, max, remaining, status: 'over' };
  }
  if (count >= max - 5) {
    return { count, max, remaining, status: 'warning' };
  }
  return { count, max, remaining, status: 'optimal' };
}

export function normalizeAmenities(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (typeof item !== 'string') continue;
    const cleaned = item.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

export function normalizeListingKit(raw: unknown): ListingKit {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawGuide = (
    obj.welcome_guide && typeof obj.welcome_guide === 'object' ? obj.welcome_guide : {}
  ) as Record<string, unknown>;
  const rawMessages = (
    obj.message_templates && typeof obj.message_templates === 'object' ? obj.message_templates : {}
  ) as Record<string, unknown>;

  const rawTitle = typeof obj.listing_title === 'string' ? obj.listing_title : '';
  const listing_title = clampListingTitle(rawTitle, MAX_TITLE_LENGTH);
  const listing_description =
    typeof obj.listing_description === 'string' ? obj.listing_description.trim() : '';

  const welcome_guide = {} as Record<WelcomeLanguage, string>;
  for (const lang of WELCOME_LANGUAGES) {
    const val = rawGuide[lang];
    welcome_guide[lang] = typeof val === 'string' ? val.trim() : '';
  }

  const message_templates = {
    welcome: typeof rawMessages.welcome === 'string' ? rawMessages.welcome.trim() : '',
    checkout: typeof rawMessages.checkout === 'string' ? rawMessages.checkout.trim() : '',
  };

  return {
    listing_title,
    listing_description,
    detected_amenities: normalizeAmenities(obj.detected_amenities),
    welcome_guide,
    message_templates,
  };
}

export function formatKitAsJson(kit: ListingKit): string {
  const strictOutput: ListingKit = {
    listing_title: kit.listing_title,
    listing_description: kit.listing_description,
    detected_amenities: kit.detected_amenities,
    welcome_guide: {
      EN: kit.welcome_guide.EN,
      DE: kit.welcome_guide.DE,
      FR: kit.welcome_guide.FR,
      IT: kit.welcome_guide.IT,
      NL: kit.welcome_guide.NL,
      GR: kit.welcome_guide.GR,
    },
    message_templates: {
      welcome: kit.message_templates.welcome,
      checkout: kit.message_templates.checkout,
    },
  };

  return JSON.stringify(strictOutput, null, 2);
}

export function formatAllWelcomeGuides(kit: ListingKit): string {
  return WELCOME_LANGUAGES.map((lang) => {
    const label = LANGUAGE_LABELS[lang];
    return `=== ${lang} (${label.english} / ${label.native}) ===\n${kit.welcome_guide[lang]}`;
  }).join('\n\n');
}
