import { useEffect, useState } from 'react';
import { Download, Loader2, Menu, RotateCcw, Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PhotoUploader } from './components/PhotoUploader';
import { OutputStudio } from './components/OutputStudio';
import {
  INITIAL_SAVED_KITS,
  SAMPLE_PRESETS,
  loadImageUrlAsPhotoPayload,
  type SamplePreset,
  type SavedPropertyKit,
} from './data/sampleProperties';
import {
  formatKitAsJson,
  validateGenerateInput,
  type ListingKit,
  type PhotoInputPayload,
} from './utils/listingKit';

const STORAGE_KEY = 'hostcraft_saved_kits_v1';

function loadInitialKits(): SavedPropertyKit[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SAVED_KITS;
    const parsed = JSON.parse(raw) as SavedPropertyKit[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return INITIAL_SAVED_KITS;
}

export default function App() {
  const [savedKits, setSavedKits] = useState<SavedPropertyKit[]>(loadInitialKits);
  const [activeKitId, setActiveKitId] = useState<string | null>(
    () => loadInitialKits()[0]?.id ?? null,
  );
  const [activeKit, setActiveKit] = useState<ListingKit | null>(
    () => loadInitialKits()[0]?.kit ?? null,
  );

  const [photos, setPhotos] = useState<PhotoInputPayload[]>([]);
  const [sessionPhotoMap, setSessionPhotoMap] = useState<Record<string, PhotoInputPayload[]>>({});
  const [propertyContext, setPropertyContext] = useState<string>(
    () => loadInitialKits()[0]?.propertyContext ?? '',
  );
  const [notes, setNotes] = useState<string>(() => loadInitialKits()[0]?.notes ?? '');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync saved kits to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKits));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedKits]);

  // Pre-load sample photos for initial demo kit on first mount so thumbnails appear cleanly
  useEffect(() => {
    const firstKit = savedKits[0];
    if (!firstKit || firstKit.photoUrls.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await Promise.all(
          firstKit.photoUrls.map((url, idx) =>
            loadImageUrlAsPhotoPayload(url, `sample-photo-${idx + 1}.jpg`, idx),
          ),
        );
        if (!cancelled) {
          setPhotos(loaded);
        }
      } catch {
        // Non-blocking if initial demo thumbnails fail
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectKit(saved: SavedPropertyKit) {
    setErrorMessage(null);
    setActiveKitId(saved.id);
    setActiveKit(saved.kit);
    setPropertyContext(saved.propertyContext);
    setNotes(saved.notes);

    if (sessionPhotoMap[saved.id]?.length) {
      setPhotos(sessionPhotoMap[saved.id]);
    } else if (saved.photoUrls.length > 0) {
      try {
        const loaded = await Promise.all(
          saved.photoUrls.map((url, idx) =>
            loadImageUrlAsPhotoPayload(url, `property-photo-${idx + 1}.jpg`, idx),
          ),
        );
        setPhotos(loaded);
      } catch {
        setPhotos([]);
      }
    } else {
      setPhotos([]);
    }
  }

  function handleNewKit() {
    setErrorMessage(null);
    setActiveKitId(null);
    setActiveKit(null);
    setPhotos([]);
    setPropertyContext('');
    setNotes('');
  }

  function handleDeleteKit(id: string) {
    setSavedKits((prev) => {
      const next = prev.filter((k) => k.id !== id);
      if (activeKitId === id) {
        const fallback = next[0] ?? null;
        setActiveKitId(fallback?.id ?? null);
        setActiveKit(fallback?.kit ?? null);
        setPropertyContext(fallback?.propertyContext ?? '');
        setNotes(fallback?.notes ?? '');
        setPhotos([]);
      }
      return next;
    });
  }

  async function handleLoadPreset(preset: SamplePreset) {
    setErrorMessage(null);
    setIsLoadingSample(true);
    try {
      const loadedPhotos = await Promise.all(
        preset.photoUrls.map((url, idx) =>
          loadImageUrlAsPhotoPayload(url, `${preset.id}-${idx + 1}.jpg`, idx),
        ),
      );
      setPhotos(loadedPhotos);
      setPropertyContext(preset.propertyContext);
      setNotes(preset.notes);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to load sample property photos.',
      );
    } finally {
      setIsLoadingSample(false);
    }
  }

  function handleUpdateKit(updated: ListingKit) {
    setActiveKit(updated);
    if (activeKitId) {
      setSavedKits((prev) =>
        prev.map((item) =>
          item.id === activeKitId
            ? {
                ...item,
                name: updated.listing_title || item.name,
                kit: updated,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : item,
        ),
      );
    }
  }

  async function handleAnalyzeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateGenerateInput(
      photos.map((p) => ({ mimeType: p.mimeType, data: p.data })),
      notes,
    );
    if (!validation.valid) {
      setErrorMessage(validation.error ?? 'Please provide photos or host notes.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map((p) => ({
            mimeType: p.mimeType,
            data: p.data,
            name: p.name,
          })),
          notes,
          propertyContext,
        }),
      });

      const payload = (await response.json()) as { kit?: ListingKit; error?: string };
      if (!response.ok || !payload.kit) {
        throw new Error(payload.error || `Analysis failed with status ${response.status}.`);
      }

      const generatedKit = payload.kit;
      const newId = `kit-${Date.now()}`;
      const newSaved: SavedPropertyKit = {
        id: newId,
        name: generatedKit.listing_title || propertyContext || 'Untitled Property Kit',
        propertyContext,
        notes,
        photoUrls: [],
        updatedAt: new Date().toISOString().slice(0, 10),
        kit: generatedKit,
      };

      setSessionPhotoMap((prev) => ({ ...prev, [newId]: photos }));
      setSavedKits((prev) => [newSaved, ...prev]);
      setActiveKitId(newId);
      setActiveKit(generatedKit);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to complete listing analysis.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleExportActiveJson() {
    if (!activeKit) return;
    const raw = formatKitAsJson(activeKit);
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug =
      activeKit.listing_title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'listing-kit';
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      <Sidebar
        savedKits={savedKits}
        activeKitId={activeKitId}
        onSelectKit={(k) => void handleSelectKit(k)}
        onNewKit={handleNewKit}
        onDeleteKit={handleDeleteKit}
        onLoadPreset={(p) => void handleLoadPreset(p)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Zone + 1 Primary Action */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 py-3.5 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open saved kits menu"
              className="lg:hidden rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav aria-label="Workspace breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-display font-semibold text-slate-900 truncate">
                Listing &amp; Welcome Studio
              </span>
              {activeKit && (
                <>
                  <span className="hidden sm:inline text-slate-300 shrink-0" aria-hidden="true">
                    /
                  </span>
                  <span className="hidden sm:inline truncate text-slate-500">
                    {activeKit.listing_title}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="shrink-0">
            {activeKit ? (
              <button
                type="button"
                onClick={handleExportActiveJson}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON Kit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleLoadPreset(SAMPLE_PRESETS[0])}
                disabled={isLoadingSample}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                <span>Load Sample Inputs</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Studio Workspace */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          <div className="flex flex-col xl:flex-row items-start gap-6">
            {/* Left Composer Column */}
            <section
              aria-label="Property photos and host notes input"
              className="w-full xl:w-[440px] shrink-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 no-print"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h1 className="font-display text-base font-semibold text-slate-900">
                    Property Inputs
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Photos are inspected for real amenities; notes build your 6-language welcome
                    guide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewKit}
                  aria-label="Clear property inputs"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>

              <form onSubmit={(e) => void handleAnalyzeSubmit(e)} className="space-y-5" noValidate>
                <PhotoUploader
                  photos={photos}
                  onAddPhotos={(incoming) => {
                    setErrorMessage(null);
                    setPhotos((prev) => [...prev, ...incoming]);
                  }}
                  onRemovePhoto={(id) =>
                    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
                  }
                  onError={(msg) => setErrorMessage(msg)}
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="property-context-input"
                    className="block text-sm font-medium text-slate-900"
                  >
                    Property Location &amp; Type
                  </label>
                  <input
                    id="property-context-input"
                    type="text"
                    value={propertyContext}
                    onChange={(e) => setPropertyContext(e.target.value)}
                    placeholder="e.g. 1-Bedroom Sea-View Suite in Oia, Santorini · Sleeps 2"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="host-notes-input"
                      className="block text-sm font-medium text-slate-900"
                    >
                      Host Rough Notes
                    </label>
                    <span className="text-xs text-slate-500">
                      Wi-Fi, check-in, rules, local tips
                    </span>
                  </div>
                  <textarea
                    id="host-notes-input"
                    rows={8}
                    value={notes}
                    onChange={(e) => {
                      setErrorMessage(null);
                      setNotes(e.target.value);
                    }}
                    placeholder={`Check-in: 15:00 via smart lockbox\nCheck-out: 11:00\nWi-Fi: Network / Password\nHouse rules: Quiet hours, no indoor smoking\nLocal tips: Best coffee, bakery, beach or transit stop`}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="pt-1 flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={isAnalyzing || isLoadingSample}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing Photos &amp; Translating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Analyze &amp; Generate Kit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Right Output Studio */}
            <section aria-label="Generated listing and welcome kit" className="flex-1 min-w-0 w-full">
              <OutputStudio
                kit={activeKit}
                isLoading={isAnalyzing}
                onUpdateKit={handleUpdateKit}
                onLoadSampleClick={() => void handleLoadPreset(SAMPLE_PRESETS[0])}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
