import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const INITIAL_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.0-flash',
].filter(Boolean) as string[];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    listing_title: { type: Type.STRING },
    listing_description: { type: Type.STRING },
    detected_amenities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    welcome_guide: {
      type: Type.OBJECT,
      properties: {
        EN: { type: Type.STRING },
        DE: { type: Type.STRING },
        FR: { type: Type.STRING },
        IT: { type: Type.STRING },
        NL: { type: Type.STRING },
        GR: { type: Type.STRING },
      },
      required: ['EN', 'DE', 'FR', 'IT', 'NL', 'GR'],
    },
    message_templates: {
      type: Type.OBJECT,
      properties: {
        welcome: { type: Type.STRING },
        checkout: { type: Type.STRING },
      },
      required: ['welcome', 'checkout'],
    },
  },
  required: [
    'listing_title',
    'listing_description',
    'detected_amenities',
    'welcome_guide',
    'message_templates',
  ],
};

function sanitizeJsonResponse(raw: string): Record<string, any> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function normalizeKit(rawKit: Record<string, any>) {
  const title = String(rawKit.listing_title || '').trim();
  return {
    listing_title: title.length > 50 ? title.slice(0, 50).trim() : title,
    listing_description: String(rawKit.listing_description || '').trim(),
    detected_amenities: Array.isArray(rawKit.detected_amenities)
      ? Array.from(new Set(rawKit.detected_amenities.map((a: unknown) => String(a).trim()).filter(Boolean)))
      : [],
    welcome_guide: {
      EN: String(rawKit.welcome_guide?.EN || ''),
      DE: String(rawKit.welcome_guide?.DE || ''),
      FR: String(rawKit.welcome_guide?.FR || ''),
      IT: String(rawKit.welcome_guide?.IT || ''),
      NL: String(rawKit.welcome_guide?.NL || ''),
      GR: String(rawKit.welcome_guide?.GR || ''),
    },
    message_templates: {
      welcome: String(rawKit.message_templates?.welcome || ''),
      checkout: String(rawKit.message_templates?.checkout || ''),
    },
  };
}

async function discoverAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const resp = await fetch(
      `[https://generativelanguage.googleapis.com/v1beta/models?key=$](https://generativelanguage.googleapis.com/v1beta/models?key=$){encodeURIComponent(apiKey)}`
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const models: any[] = Array.isArray(data?.models) ? data.models : [];

    const valid = models
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          typeof m.name === 'string' &&
          m.name.includes('gemini') &&
          !m.name.includes('embedding') &&
          !m.name.includes('imagen') &&
          !m.name.includes('veo')
      )
      .map((m) => m.name.replace(/^models\//, ''));

    const flashFirst = [
      ...valid.filter((name) => name.includes('flash')),
      ...valid.filter((name) => !name.includes('flash')),
    ];
    return Array.from(new Set(flashFirst));
  } catch {
    return [];
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: missing API key.' });
  }

  const { photos = [], notes = '', propertyContext = '' } = req.body || {};

  if ((!Array.isArray(photos) || photos.length === 0) && !String(notes).trim()) {
    return res.status(400).json({ error: 'Please provide at least one photo or host notes.' });
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

  const parts: any[] = [];
  for (const photo of Array.isArray(photos) ? photos.slice(0, 8) : []) {
    if (photo?.data && photo?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: String(photo.mimeType),
          data: String(photo.data),
        },
      });
    }
  }

  parts.push({
    text: `You are an elite short-term rental copywriter and hospitality specialist for Airbnb and Booking.com.
Analyze the uploaded property photos and the host's rough notes to generate a complete, high-converting listing and 6-language guest welcome kit.

Property Location & Type: ${String(propertyContext || 'Not specified').slice(0, 300)}
Host Rough Notes: ${String(notes || 'Not specified').slice(0, 3000)}

Rules:
1. Detect real amenities strictly visible in the photos or explicitly mentioned in notes. Do NOT hallucinate unconfirmed features.
2. Write an SEO-optimized Title in English (strictly maximum 50 characters) and a structured, scannable English Description.
3. Translate the Digital Welcome Guide (Wi-Fi, check-in, rules, tips) into EN, DE, FR, IT, NL (Dutch), and GR.
4. Provide 2 guest message templates (welcome and checkout).`,
  });

  const tried = new Set<string>();
  let lastError: any = null;

  const tryModels = async (candidates: string[]) => {
    for (const model of candidates) {
      if (tried.has(model)) continue;
      tried.add(model);

      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });

        const parsed = sanitizeJsonResponse(response.text || '{}');
        const kit = normalizeKit(parsed);
        return { kit, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const msg = JSON.stringify(err || '').toLowerCase();
        // Only stop immediately on invalid API key; otherwise keep trying fallbacks
        if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
          throw err;
        }
        continue;
      }
    }
    return null;
  };

  try {
    let result = await tryModels(INITIAL_MODELS);

    if (!result) {
      const discovered = await discoverAvailableModels(apiKey);
      result = await tryModels(discovered);
    }

    if (result) {
      return res.status(200).json(result);
    }
  } catch (err: any) {
    lastError = err;
  }

  console.error('Analyze API failed:', lastError);
  return res.status(500).json({
    error: lastError?.message || 'Unable to generate listing kit right now. Please try again.',
  });
}
