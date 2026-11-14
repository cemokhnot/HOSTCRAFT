import { Plus, Trash2, BookOpen, Sparkles, X } from 'lucide-react';
import type { SavedPropertyKit, SamplePreset } from '../data/sampleProperties';
import { SAMPLE_PRESETS } from '../data/sampleProperties';

interface SidebarProps {
  savedKits: SavedPropertyKit[];
  activeKitId: string | null;
  onSelectKit: (kit: SavedPropertyKit) => void;
  onNewKit: () => void;
  onDeleteKit: (id: string) => void;
  onLoadPreset: (preset: SamplePreset) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  savedKits,
  activeKitId,
  onSelectKit,
  onNewKit,
  onDeleteKit,
  onLoadPreset,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const sidebarBody = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          HostCraft
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            onNewKit();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New Property Kit</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <h2 className="px-2 mb-2 text-xs font-semibold text-slate-500 tracking-wide">
            Saved Property Kits
          </h2>
          {savedKits.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">
              No saved kits yet. Generate a listing to store it here.
            </p>
          ) : (
            <ul className="space-y-1">
              {savedKits.map((item) => {
                const isActive = item.id === activeKitId;
                return (
                  <li key={item.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectKit(item);
                        onCloseMobile();
                      }}
                      className={`flex-1 min-w-0 text-left rounded-lg px-2.5 py-2 transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-teal-700" />
                        <span className="truncate text-sm">{item.name}</span>
                      </div>
                      <p className="mt-0.5 pl-5.5 text-xs text-slate-500 truncate tabular-nums">
                        {item.kit.detected_amenities.length} amenities · 6 langs
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteKit(item.id)}
                      aria-label={`Delete '${item.name}'`}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h2 className="px-2 mb-2 text-xs font-semibold text-slate-500 tracking-wide">
            Sample Inputs
          </h2>
          <p className="px-2 mb-2.5 text-xs text-slate-500 leading-relaxed">
            Load photos and rough host notes to test Gemini Vision analysis immediately.
          </p>
          <div className="space-y-1.5">
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onLoadPreset(preset);
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-700" />
                <span className="truncate">Load {preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
        Airbnb &amp; Booking.com Kit Studio
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 no-print">
        {sidebarBody}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
