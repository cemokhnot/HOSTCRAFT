import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.8-flash',
  'gemini-flash-latest',
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
        ES: { type: Type.STRING },
        GR: { type: Type.STRING },
      },
      required: ['EN', 'DE', 'FR', 'IT', 'ES', 'GR'],
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
      ES: String(rawKit.welcome_guide?.ES || ''),
      GR: String(rawKit.welcome_guide?.GR || ''),
    },
    message_templates: {
      welcome: String(rawKit.message_templates?.welcome || ''),
      checkout: String(rawKit.message_templates?.checkout || ''),
    },
  };
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

  const ai = new GoogleGenAI({ apiKey });

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
3. Translate the Digital Welcome Guide (Wi-Fi, check-in, rules, tips) into EN, DE, FR, IT, ES, and GR.
4. Provide 2 guest message templates (welcome and checkout).`,
  });

  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
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

      return res.status(200).json({ kit, modelUsed: model });
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      // Retry with fallback model only on 404 (deprecated model) or 503 (temporary overload)
      if (status === 404 || status === 503 || String(err?.message || '').includes('no longer available')) {
        continue;
      }
      break;
    }
  }

  console.error('Analyze API failed across all models:', lastError);
  return res.status(500).json({
    error: lastError?.message || 'Unable to generate listing kit right now. Please try again.',
  });
}
