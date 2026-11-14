# HostCraft AI — Short-Term Rental Listing & Multilingual Welcome Kit Studio - Airbnb/Booking

An AI-powered workspace built for **Airbnb** and **Booking.com** hosts to turn raw property photos and quick notes into high-converting listings and 6-language guest welcome guides in seconds.

## Key Features
- **Vision-Powered Amenity Detection:** Inspects uploaded room and balcony photos using Gemini Vision with strict schema enforcement — detecting real amenities without hallucinating features.
- **SEO Listing Copy Studio:** Generates search-optimized titles (with live 50-character limit tracking) and structured English descriptions tailored for international travelers.
- **6-Language Digital Welcome Guide:** Automatically translates Wi-Fi credentials, check-in instructions, house rules, and local tips into **EN, DE, FR, IT, ES, and GR** with print-ready sheet formatting.
- **Guest Message Templates & JSON Export:** Ready-to-send Warm Welcome and Check-out Reminder templates plus raw JSON export.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & AI:** Node.js / Express API, Google GenAI SDK (Gemini Vision)
- **Testing & Tooling:** Vite, Node Test Runner (`tsx`)

## Run Locally
1. Install dependencies:
   ```bash
   npm install
