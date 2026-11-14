import type { ListingKit, PhotoInputPayload } from '../utils/listingKit';

export interface SavedPropertyKit {
  id: string;
  name: string;
  propertyContext: string;
  notes: string;
  photoUrls: string[];
  updatedAt: string;
  kit: ListingKit;
}

export interface SamplePreset {
  id: string;
  label: string;
  propertyContext: string;
  notes: string;
  photoUrls: string[];
}

export const SAMPLE_PHOTO_URLS = {
  balcony: '/src/assets/images/property_sea_balcony_1794673682909.jpg',
  living: '/src/assets/images/property_living_espresso_1794673683326.jpg',
  bedroomBath: '/src/assets/images/property_bath_workspace_1794673683266.jpg',
};

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'aegean-suite',
    label: 'Aegean Sea-View Suite',
    propertyContext: 'Coastal 1-Bedroom Suite in Oia, Santorini · Sleeps 2',
    notes: `Check-in: 15:00 via smart lockbox next to the blue wooden gate (code sent morning of arrival). Check-out: 11:00.
Wi-Fi: Network "AegeanBreeze_5G" / Pass "Sunset2026!"
Espresso bar: Fresh locally roasted beans in the jar beside the machine.
House rules: No smoking indoors, quiet hours after 23:00, please do not flush paper in the island plumbing (use bin provided).
Local tips: Morning coffee at Vitrin Café (4 min walk), sunset dinner reservation at Ammoudi Fish Tavern, bus stop to Fira is 250m up the pedestrian lane.`,
    photoUrls: [
      SAMPLE_PHOTO_URLS.balcony,
      SAMPLE_PHOTO_URLS.living,
      SAMPLE_PHOTO_URLS.bedroomBath,
    ],
  },
  {
    id: 'workcation-loft',
    label: 'Sunlit Coastal Workcation Loft',
    propertyContext: 'Bright Architect Suite near Crete Harbor · Sleeps 2',
    notes: `Self check-in after 14:00 with keypad code. Check-out 10:30.
Fiber Wi-Fi: "HarborLoft_Fiber" / Pass "CretanOlive88" (300 Mbps, ideal for video calls at the oak desk).
Amenities note: Inverter AC in living room, freestanding soaking tub, full espresso grinder setup.
House rules: Keep balcony door closed when AC is running. Pets not permitted.
Local favorites: Bakery "Koukouvagia" 3 mins east for bougatsa, rocky swimming cove 6 mins down the steps.`,
    photoUrls: [
      SAMPLE_PHOTO_URLS.living,
      SAMPLE_PHOTO_URLS.bedroomBath,
    ],
  },
];

export const INITIAL_SAVED_KITS: SavedPropertyKit[] = [
  {
    id: 'kit-aegean-demo',
    name: 'Aegean Sea-View Suite · Oia',
    propertyContext: SAMPLE_PRESETS[0].propertyContext,
    notes: SAMPLE_PRESETS[0].notes,
    photoUrls: SAMPLE_PRESETS[0].photoUrls,
    updatedAt: '2026-11-14',
    kit: {
      listing_title: 'Sunlit Aegean Suite · Sea Balcony & Espresso Bar',
      listing_description: `Wake up to uninterrupted turquoise Aegean views from your private furnished balcony in Oia. Thoughtfully designed for couples and remote travelers, this sunlit coastal suite pairs Cycladic stone character with calm, modern comforts.

The Space
• Private Sea-View Balcony: Teak armchairs and a stone bistro table overlooking the bay for morning coffee or golden-hour aperitifs.
• Sunlit Living & Espresso Corner: Bright open lounge with linen seating, wall-mounted climate control, and a full espresso machine with grinder.
• Restful Suite & Soaking Bath: King bed dressed in crisp cotton, a dedicated oak writing desk with task lighting, and an adjoining daylight bathroom with a freestanding soaking tub.

Guest Access & Work Comfort
Guests enjoy exclusive use of the entire suite and private terrace, backed by fast Wi-Fi and a quiet desk corner for focused mornings before heading down to the water.`,
      detected_amenities: [
        'Private Sea-View Balcony',
        'Espresso Machine & Grinder',
        'Freestanding Soaking Bathtub',
        'Dedicated Workspace Desk',
        'Air Conditioning',
        'Abundant Natural Light',
        'Outdoor Bistro Seating',
        'King Bed with Linen Bedding',
      ],
      welcome_guide: {
        EN: `Welcome to your Aegean Sea-View Suite!

Wi-Fi Access
• Network: AegeanBreeze_5G
• Password: Sunset2026!

Check-in & Check-out
• Check-in: From 15:00 via the smart lockbox beside the blue wooden gate (your personal code is sent on arrival morning).
• Check-out: By 11:00. Please leave the keys inside the lockbox on departure.

Home Essentials & Rules
• Espresso Bar: Fresh locally roasted beans are stocked in the jar beside the machine.
• Quiet Hours: Please keep noise low after 23:00 out of respect for neighboring suites.
• Island Plumbing: Kindly use the bathroom bin rather than flushing paper. No smoking indoors.

Local Recommendations
• Morning Coffee: Vitrin Café (4-minute walk).
• Sunset Dinner: Ammoudi Fish Tavern — we recommend booking a waterside table ahead.
• Transit: The Fira bus stop is 250m up the pedestrian lane.`,
        DE: `Willkommen in Ihrer Aegean Sea-View Suite!

WLAN-Zugang
• Netzwerk: AegeanBreeze_5G
• Passwort: Sunset2026!

Check-in & Check-out
• Check-in: Ab 15:00 Uhr über den Smart-Schlüsseltresor neben dem blauen Holztor (Ihren persönlichen Code erhalten Sie am Anreisetag).
• Check-out: Bis 11:00 Uhr. Bitte legen Sie den Schlüssel bei der Abreise wieder in den Tresor.

Wichtige Hinweise & Hausregeln
• Espressobar: Frisch geröstete Kaffeebohnen finden Sie im Glas neben der Maschine.
• Ruhezeiten: Bitte nehmen Sie ab 23:00 Uhr Rücksicht auf die Nachbarn.
• Insel-Leitungen: Bitte werfen Sie kein Toilettenpapier in die Toilette, sondern nutzen Sie den Eimer. Rauchen in der Suite ist nicht gestattet.

Lokale Tipps
• Morgenkaffee: Vitrin Café (4 Minuten zu Fuß).
• Abendessen bei Sonnenuntergang: Ammoudi Fish Tavern – am besten vorab reservieren.
• Busverbindung: Die Haltestelle nach Fira liegt 250 m die Fußgängerzone hinauf.`,
        FR: `Bienvenue dans votre Suite Vue Mer Égée !

Connexion Wi-Fi
• Réseau : AegeanBreeze_5G
• Mot de passe : Sunset2026!

Arrivée et Départ
• Arrivée : À partir de 15h00 via la boîte à clés connectée à côté du portail en bois bleu (code envoyé le matin de votre arrivée).
• Départ : Avant 11h00. Merci de replacer les clés dans la boîte à clés en partant.

Conseils pratiques & Règlement
• Coin Espresso : Du café torréfié localement vous attend dans le bocal près de la machine.
• Tranquillité : Merci de respecter le calme après 23h00 pour le voisinage.
• Plomberie insulaire : Veuillez utiliser la poubelle de la salle de bain et ne pas jeter de papier dans les toilettes. Logement non-fumeur.

Adresses locales
• Café du matin : Vitrin Café (à 4 minutes à pied).
• Dîner au coucher du soleil : Ammoudi Fish Tavern (réservation conseillée).
• Transports : L’arrêt de bus pour Fira se trouve à 250 m en haut de la ruelle piétonne.`,
        IT: `Benvenuti nella vostra Aegean Sea-View Suite!

Accesso Wi-Fi
• Rete: AegeanBreeze_5G
• Password: Sunset2026!

Check-in e Check-out
• Check-in: Dalle 15:00 tramite cassetta di sicurezza smart accanto al cancello in legno blu (codice inviato la mattina dell'arrivo).
• Check-out: Entro le 11:00. Vi preghiamo di riporre le chiavi nella cassetta alla partenza.

Regole della casa e Comfort
• Angolo Espresso: Troverete chicchi tostati localmente nel barattolo accanto alla macchina.
• Orari di silenzio: Vi chiediamo di limitare i rumori dopo le 23:00 per rispetto dei vicini.
• Impianto idrico dell'isola: Utilizzate l'apposito cestino in bagno senza gettare carta nel WC. Vietato fumare all'interno.

Consigli locali
• Caffè del mattino: Vitrin Café (4 minuti a piedi).
• Cena al tramonto: Ammoudi Fish Tavern — consigliamo di prenotare in anticipo.
• Trasporti: La fermata dell'autobus per Fira dista 250 m lungo il vicolo pedonale.`,
        NL: `Welkom in uw Aegean Sea-View Suite!

Wifi-toegang
• Netwerk: AegeanBreeze_5G
• Wachtwoord: Sunset2026!

Inchecken & Uitchecken
• Inchecken: Vanaf 15:00 uur via het slimme sleutelkastje naast de blauwe houten poort (uw code ontvangt u op de ochtend van aankomst).
• Uitchecken: Voor 11:00 uur. Plaats de sleutels bij vertrek terug in het sleutelkastje.

Huisregels & Voorzieningen
• Espressobar: Vers gebrande lokale koffiebonen staan in de pot naast het apparaat.
• Rustige uren: Houd na 23:00 uur rekening met de buren.
• Eilandriolering: Gebruik de prullenbak in de badkamer en spoel geen papier door het toilet. Roken binnenshuis is niet toegestaan.

Lokale tips
• Ochtendkoffie: Vitrin Café (4 minuten lopen).
• Diner bij zonsondergang: Ammoudi Fish Tavern — vooraf reserveren is aanbevolen.
• Openbaar vervoer: De bushalte naar Fira ligt 250 m verderop in de autovrije straat.`,
        GR: `Καλώς ήρθατε στη σουίτα Aegean Sea-View!

Πρόσβαση Wi-Fi
• Δίκτυο: AegeanBreeze_5G
• Κωδικός: Sunset2026!

Άφιξη & Αναχώρηση
• Check-in: Από τις 15:00 μέσω του έξυπνου κουτιού κλειδιών δίπλα στην μπλε ξύλινη πόρτα (ο κωδικός αποστέλλεται το πρωί της άφιξης).
• Check-out: Έως τις 11:00. Παρακαλούμε αφήστε τα κλειδιά μέσα στο κουτί κατά την αναχώρηση.

Κανόνες Σπιτιού & Παροχές
• Γωνιά Espresso: Φρεσκοκαβουρδισμένος τοπικός καφές βρίσκεται στο βάζο δίπλα στη μηχανή.
• Ώρες κοινής ησυχίας: Παρακαλούμε διατηρήστε χαμηλή ένταση μετά τις 23:00.
• Αποχέτευση νησιού: Παρακαλούμε χρησιμοποιείτε τον κάδο του μπάνιου και μην πετάτε χαρτί στη λεκάνη. Απαγορεύεται το κάπνισμα εντός της σουίτας.

Τοπικές Προτάσεις
• Πρωινός καφές: Vitrin Café (4 λεπτά με τα πόδια).
• Δείπνο στο ηλιοβασίλεμα: Ammoudi Fish Tavern (προτείνεται κράτηση εκ των προτέρων).
• Συγκοινωνία: Η στάση λεωφορείου για Φηρά απέχει 250 μ. στο τέλος του πεζόδρομου.`,
      },
      message_templates: {
        welcome: `Hi [Guest Name], warm welcome to Oia! Your Aegean Sea-View Suite is ready for your arrival from 15:00 today. You can access the suite via the smart lockbox beside the blue wooden gate using code [XXXX]. Once settled in, connect to Wi-Fi "AegeanBreeze_5G" (password: Sunset2026!) and help yourself to the fresh espresso beans on the counter. Let us know if you'd like help reserving a sunset table at Ammoudi Fish Tavern—enjoy every moment of your stay!`,
        checkout: `Good morning [Guest Name], we hope you had a wonderful stay overlooking the Aegean! As a friendly reminder, check-out today is by 11:00. Before heading out, please switch off the AC, close the balcony doors, and return the keys to the lockbox beside the blue wooden gate. Safe travels onward—we'd love to host you again anytime!`,
      },
    },
  },
];

export async function loadImageUrlAsPhotoPayload(
  url: string,
  name: string,
  index: number,
): Promise<PhotoInputPayload> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load sample image (${res.status})`);
  }
  const blob = await res.blob();
  const mimeType = blob.type || 'image/jpeg';

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image data'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(blob);
  });

  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return {
    id: `sample-${index}-${Date.now()}`,
    name,
    mimeType,
    data: base64,
    previewUrl: url,
  };
}
