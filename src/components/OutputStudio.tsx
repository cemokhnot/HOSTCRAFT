import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Plus,
  Printer,
  X,
  FileText,
  Globe,
  MessageSquare,
  Code2,
} from 'lucide-react';
import {
  LANGUAGE_LABELS,
  WELCOME_LANGUAGES,
  formatAllWelcomeGuides,
  formatKitAsJson,
  getTitleLengthStatus,
  type ListingKit,
  type WelcomeLanguage,
} from '../utils/listingKit';

export type OutputTab = 'listing' | 'welcome' | 'messages' | 'json';

interface OutputStudioProps {
  kit: ListingKit | null;
  isLoading: boolean;
  onUpdateKit: (updated: ListingKit) => void;
  onLoadSampleClick: () => void;
}

function CopyButton({
  text,
  label,
  className = '',
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard denied
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-teal-700" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-slate-500" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export function OutputStudio({
  kit,
  isLoading,
  onUpdateKit,
  onLoadSampleClick,
}: OutputStudioProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>('listing');
  const [activeLanguage, setActiveLanguage] = useState<WelcomeLanguage>('EN');
  const [newAmenity, setNewAmenity] = useState('');

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
        aria-busy="true"
        aria-label="Generating listing and welcome kit"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-56 rounded bg-slate-200 animate-pulse" />
            <div className="h-3.5 w-80 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-11 w-full rounded-lg bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-9 rounded bg-slate-100 animate-pulse" />
            <div className="h-9 rounded bg-slate-100 animate-pulse" />
            <div className="h-9 rounded bg-slate-100 animate-pulse" />
            <div className="h-9 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto max-w-md space-y-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Ready to build your listing &amp; welcome kit
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Upload property photos and paste your rough host notes on the left to detect real
            amenities, craft an SEO title under 50 characters, and translate your welcome guide into
            6 languages.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onLoadSampleClick}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Load Sample Property Inputs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const titleStatus = getTitleLengthStatus(kit.listing_title);
  const rawJsonString = formatKitAsJson(kit);

  function handleDownloadJson() {
    if (!kit) return;
    const blob = new Blob([rawJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = kit.listing_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'listing-kit';
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAddAmenity(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = newAmenity.trim();
    if (!cleaned || !kit) return;
    if (kit.detected_amenities.some((a) => a.toLowerCase() === cleaned.toLowerCase())) {
      setNewAmenity('');
      return;
    }
    onUpdateKit({
      ...kit,
      detected_amenities: [...kit.detected_amenities, cleaned],
    });
    setNewAmenity('');
  }

  function handleRemoveAmenity(item: string) {
    if (!kit) return;
    onUpdateKit({
      ...kit,
      detected_amenities: kit.detected_amenities.filter((a) => a !== item),
    });
  }

  const tabs: Array<{ id: OutputTab; label: string; icon: typeof FileText }> = [
    { id: 'listing', label: 'Listing Copy', icon: FileText },
    { id: 'welcome', label: '6-Language Guide', icon: Globe },
    { id: 'messages', label: 'Guest Messages', icon: MessageSquare },
    { id: 'json', label: 'Raw JSON', icon: Code2 },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden print-only-surface">
      {/* Segmented Workspace Tabs */}
      <div
        role="tablist"
        aria-label="Generated kit sections"
        className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 no-print"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                selected
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${selected ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Listing Copy & Detected Amenities */}
      {activeTab === 'listing' && (
        <div role="tabpanel" className="divide-y divide-slate-200">
          {/* Title Section */}
          <section className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label htmlFor="output-listing-title" className="text-sm font-semibold text-slate-900">
                  SEO Listing Title
                </label>
                <p className="text-xs text-slate-500">
                  Airbnb &amp; Booking.com search headline · Maximum 50 characters
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  data-testid="title-char-counter"
                  className={`font-mono text-xs font-medium tabular-nums ${
                    titleStatus.status === 'over'
                      ? 'text-red-600'
                      : titleStatus.status === 'warning'
                        ? 'text-amber-700'
                        : 'text-teal-700'
                  }`}
                >
                  {titleStatus.count} / {titleStatus.max} chars
                </span>
                <CopyButton text={kit.listing_title} label="Copy Title" />
              </div>
            </div>

            <input
              id="output-listing-title"
              type="text"
              value={kit.listing_title}
              onChange={(e) =>
                onUpdateKit({
                  ...kit,
                  listing_title: e.target.value,
                })
              }
              className={`w-full rounded-lg border px-3.5 py-2.5 font-display text-base font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                titleStatus.status === 'over'
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:border-teal-700 focus:ring-teal-700/15'
              }`}
            />
            {titleStatus.status === 'over' && (
              <p role="alert" className="text-xs text-red-600">
                Title exceeds the 50-character platform limit by {Math.abs(titleStatus.remaining)}{' '}
                characters.
              </p>
            )}
          </section>

          {/* Detected Amenities Section (Clean Unboxed Grid, Zero Pills) */}
          <section className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Verified Amenities from Photos &amp; Notes
                </h3>
                <p className="text-xs text-slate-500">
                  Only features visibly confirmed or explicitly noted ·{' '}
                  <span className="tabular-nums">{kit.detected_amenities.length}</span> detected
                </p>
              </div>
              <CopyButton
                text={kit.detected_amenities.join(', ')}
                label="Copy Amenities"
              />
            </div>

            {kit.detected_amenities.length === 0 ? (
              <p className="text-sm text-slate-500">No amenities listed yet.</p>
            ) : (
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-3"
                data-testid="detected-amenities-list"
              >
                {kit.detected_amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 text-sm text-slate-800"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Check className="h-4 w-4 shrink-0 text-teal-700" />
                      <span className="truncate">{amenity}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      aria-label={`Remove amenity ${amenity}`}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddAmenity} className="flex items-center gap-2 pt-1">
              <label htmlFor="add-amenity-input" className="sr-only">
                Add verified amenity
              </label>
              <input
                id="add-amenity-input"
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add another verified amenity..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          </section>

          {/* Structured Description Section */}
          <section className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="output-listing-description"
                  className="text-sm font-semibold text-slate-900"
                >
                  Scannable English Listing Description
                </label>
                <p className="text-xs text-slate-500">
                  Structured for international travelers on Airbnb and Booking.com
                </p>
              </div>
              <CopyButton text={kit.listing_description} label="Copy Description" />
            </div>

            <textarea
              id="output-listing-description"
              rows={12}
              value={kit.listing_description}
              onChange={(e) =>
                onUpdateKit({
                  ...kit,
                  listing_description: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </section>
        </div>
      )}

      {/* Tab 2: 6-Language Digital Welcome Guide */}
      {activeTab === 'welcome' && (
        <div role="tabpanel" className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                6-Language Digital Welcome Guide
              </h3>
              <p className="text-xs text-slate-500">
                Wi-Fi, check-in, house rules, and local recommendations translated for guests
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton
                text={kit.welcome_guide[activeLanguage]}
                label={`Copy ${activeLanguage}`}
              />
              <CopyButton
                text={formatAllWelcomeGuides(kit)}
                label="Copy All 6 Languages"
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print Sheet</span>
              </button>
            </div>
          </div>

          {/* Language Switcher */}
          <div
            role="tablist"
            aria-label="Welcome guide language"
            className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-4 no-print"
          >
            {WELCOME_LANGUAGES.map((lang) => {
              const selected = activeLanguage === lang;
              const info = LANGUAGE_LABELS[lang];
              return (
                <button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveLanguage(lang)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                    selected
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {lang} · {info.native}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Active translation: {LANGUAGE_LABELS[activeLanguage].english} (
                {LANGUAGE_LABELS[activeLanguage].native})
              </span>
              <span className="font-mono tabular-nums">
                {kit.welcome_guide[activeLanguage].length} chars
              </span>
            </div>
            <textarea
              aria-label={`Welcome guide in ${LANGUAGE_LABELS[activeLanguage].english}`}
              rows={16}
              value={kit.welcome_guide[activeLanguage]}
              onChange={(e) =>
                onUpdateKit({
                  ...kit,
                  welcome_guide: {
                    ...kit.welcome_guide,
                    [activeLanguage]: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-slate-50/40 p-4 text-sm leading-relaxed text-slate-800 focus:bg-white focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Guest Message Templates */}
      {activeTab === 'messages' && (
        <div role="tabpanel" className="divide-y divide-slate-200">
          <section className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="template-welcome-msg"
                  className="text-sm font-semibold text-slate-900"
                >
                  Warm Welcome Message
                </label>
                <p className="text-xs text-slate-500">
                  Send on arrival morning with check-in instructions and Wi-Fi details
                </p>
              </div>
              <CopyButton text={kit.message_templates.welcome} label="Copy Welcome Message" />
            </div>
            <textarea
              id="template-welcome-msg"
              rows={6}
              value={kit.message_templates.welcome}
              onChange={(e) =>
                onUpdateKit({
                  ...kit,
                  message_templates: {
                    ...kit.message_templates,
                    welcome: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </section>

          <section className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="template-checkout-msg"
                  className="text-sm font-semibold text-slate-900"
                >
                  Check-out Reminder Message
                </label>
                <p className="text-xs text-slate-500">
                  Send the evening before or morning of departure with key return steps
                </p>
              </div>
              <CopyButton text={kit.message_templates.checkout} label="Copy Check-out Message" />
            </div>
            <textarea
              id="template-checkout-msg"
              rows={6}
              value={kit.message_templates.checkout}
              onChange={(e) =>
                onUpdateKit({
                  ...kit,
                  message_templates: {
                    ...kit.message_templates,
                    checkout: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </section>
        </div>
      )}

      {/* Tab 4: Strict Raw JSON Output */}
      {activeTab === 'json' && (
        <div role="tabpanel" className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Strict JSON Output Schema
              </h3>
              <p className="text-xs text-slate-500">
                Ready for PMS, channel manager, or webhook integration
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={rawJsonString} label="Copy JSON" />
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre
            data-testid="raw-json-output"
            className="max-h-[600px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100"
          >
            {rawJsonString}
          </pre>
        </div>
      )}
    </div>
  );
}
