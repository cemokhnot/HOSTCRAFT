import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, type Part } from '@google/genai';
import { normalizeListingKit, validateGenerateInput } from './src/utils/listingKit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const SYSTEM_INSTRUCTION = `You are an elite short-term rental copywriter and hospitality specialist for Airbnb and Booking.com.
Your job is to analyze uploaded property photos and the host's rough notes, and generate a complete, high-converting listing and guest welcome kit.

Follow these strict rules:
1. Analyze the photos carefully to detect real amenities (e.g., balcony, sea/city view, espresso machine, AC, workspace, natural light, bathtub) and never hallucinate features that are not visible in the photos or explicitly mentioned in the host's notes.
2. Write an SEO-optimized, emotionally engaging Title (strictly maximum 50 characters including spaces) and a structured, scannable Description in English tailored for international travelers. Use clear section headings and concise bullet points in the description.
3. Generate a clean, friendly Digital Welcome Guide based on the host's notes (Wi-Fi, check-in, house rules, local tips) translated accurately and naturally into 6 languages: English (EN), German (DE), French (FR), Italian (IT), Dutch (NL), and Greek (GR). If certain practical details are missing from the notes, keep guidance helpful without inventing fake passwords or codes.
4. Provide 2 ready-to-use guest message templates (Warm Welcome & Check-out Reminder) ready for Airbnb or Booking.com messaging.

Output ONLY valid JSON matching the requested schema.`;

const LISTING_KIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    listing_title: {
      type: Type.STRING,
      description: 'SEO-optimized, emotionally engaging property title, strictly 50 characters or fewer.',
    },
    listing_description: {
      type: Type.STRING,
      description: 'Structured, scannable Airbnb/Booking.com description in English for international travelers.',
    },
    detected_amenities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of real amenities clearly visible in the uploaded photos or explicitly stated in host notes.',
    },
    welcome_guide: {
      type: Type.OBJECT,
      properties: {
        EN: { type: Type.STRING, description: 'Digital Welcome Guide in English.' },
        DE: { type: Type.STRING, description: 'Digital Welcome Guide in German.' },
        FR: { type: Type.STRING, description: 'Digital Welcome Guide in French.' },
        IT: { type: Type.STRING, description: 'Digital Welcome Guide in Italian.' },
        NL: { type: Type.STRING, description: 'Digital Welcome Guide in Dutch.' },
        GR: { type: Type.STRING, description: 'Digital Welcome Guide in Greek.' },
      },
      required: ['EN', 'DE', 'FR', 'IT', 'NL', 'GR'],
    },
    message_templates: {
      type: Type.OBJECT,
      properties: {
        welcome: { type: Type.STRING, description: 'Warm Welcome guest message template.' },
        checkout: { type: Type.STRING, description: 'Friendly Check-out Reminder guest message template.' },
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

interface AnalyzePhotoBody {
  mimeType: string;
  data: string;
  name?: string;
}

interface AnalyzeRequestBody {
  photos?: AnalyzePhotoBody[];
  notes?: string;
  propertyContext?: string;
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const err = error as { status?: number; message?: string; code?: number };
  const rawMessage = err?.message || 'Unexpected error communicating with Gemini API.';

  if (rawMessage.includes('API_KEY_INVALID') || err?.status === 400 && rawMessage.includes('API key')) {
    return {
      status: 400,
      message: 'The configured GEMINI_API_KEY is invalid. Check Settings > Secrets.',
    };
  }
  if (rawMessage.includes('PERMISSION_DENIED') || err?.status === 403) {
    return {
      status: 403,
      message: 'Permission denied by Gemini API. Verify your API key in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
    return {
      status: 429,
      message: 'Gemini API rate limit or quota reached. Please wait a moment and try again.',
    };
  }
  if (rawMessage.includes('NOT_FOUND') || err?.status === 404) {
    return {
      status: 404,
      message: 'Requested Gemini model was not found. Please verify model availability.',
    };
  }
  return {
    status: err?.status && err.status >= 400 && err.status < 600 ? err.status : 500,
    message: rawMessage,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as AnalyzeRequestBody;
    const photos = Array.isArray(body.photos) ? body.photos : [];
    const notes = typeof body.notes === 'string' ? body.notes : '';
    const propertyContext = typeof body.propertyContext === 'string' ? body.propertyContext.trim() : '';

    const validation = validateGenerateInput(photos, notes);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Add your key in Settings > Secrets.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: Part[] = [];
      for (const photo of photos) {
        if (!photo.data || typeof photo.data !== 'string') continue;
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: photo.data,
          },
        });
      }

      const promptSegments = [
        propertyContext ? `Property context / location: ${propertyContext}` : '',
        notes.trim()
          ? `Host rough notes:\n${notes.trim()}`
          : 'Host rough notes: (None provided — rely strictly on what is visible in the photos and write a polite general welcome framework without fabricating Wi-Fi passwords or lockbox codes.)',
        'Inspect all attached photos carefully. List ONLY amenities visibly confirmed in the photos or stated in the notes. Keep listing_title <= 50 characters. Translate the Digital Welcome Guide accurately into EN, DE, FR, IT, NL, and GR.',
      ].filter(Boolean);

      parts.push({ text: promptSegments.join('\n\n') });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: LISTING_KIT_SCHEMA,
        },
      });

      const jsonText = (response.text ?? '').trim();
      if (!jsonText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(jsonText) as unknown;
      const kit = normalizeListingKit(parsed);
      res.json({ kit });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HostCraft server running on http://localhost:${PORT}`);
  });
}

startServer();
