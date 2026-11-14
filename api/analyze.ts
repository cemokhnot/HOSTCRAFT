import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel Environment Variables.' });
    }

    const { photos = [], notes = '', propertyContext = '' } = req.body || {};

    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    for (const photo of photos) {
      if (photo?.data && photo?.mimeType) {
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: photo.data,
          },
        });
      }
    }

    parts.push({
      text: `You are an elite short-term rental copywriter and hospitality specialist for Airbnb and Booking.com.
Analyze the uploaded property photos and the host's rough notes to generate a complete, high-converting listing and 6-language guest welcome kit.

Property Location & Type: ${propertyContext || 'Not specified'}
Host Rough Notes: ${notes || 'Not specified'}

Rules:
1. Detect real amenities strictly visible in the photos or explicitly mentioned in notes. Do NOT hallucinate unconfirmed features.
2. Write an SEO-optimized Title in English (strictly maximum 50 characters) and a structured, scannable English Description.
3. Translate the Digital Welcome Guide (Wi-Fi, check-in, rules, tips) into EN, DE, FR, IT, ES, and GR.
4. Provide 2 guest message templates (welcome and checkout).`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
      },
    });

    const rawText = response.text || '{}';
    const kit = JSON.parse(rawText);

    if (kit.listing_title && kit.listing_title.length > 50) {
      kit.listing_title = kit.listing_title.slice(0, 50).trim();
    }

    return res.status(200).json({ kit });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to analyze property.' });
  }
}
