import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Home } from 'lucide-react';
import type { PhotoInputPayload } from '../utils/listingKit';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_PHOTOS } from '../utils/listingKit';

interface PhotoUploaderProps {
  photos: PhotoInputPayload[];
  onAddPhotos: (newPhotos: PhotoInputPayload[]) => void;
  onRemovePhoto: (id: string) => void;
  onError: (msg: string) => void;
}

function readFileAsBase64(file: File): Promise<{ data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`Unable to read ${file.name}`));
        return;
      }
      const dataUrl = reader.result;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve({ data: base64, previewUrl: dataUrl });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function PhotoThumbnail({
  photo,
  index,
  onRemove,
}: {
  photo: PhotoInputPayload;
  index: number;
  onRemove: (id: string) => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {broken ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 p-2 text-center text-xs text-slate-500">
          <Home className="h-5 w-5 text-slate-400" />
          <span className="line-clamp-2">{photo.name}</span>
        </div>
      ) : (
        <img
          src={photo.previewUrl}
          alt={`Property photo ${index + 1}: ${photo.name}`}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        aria-label={`Remove photo ${index + 1}`}
        className="absolute right-1.5 top-1.5 rounded-md bg-slate-900/75 p-1.5 text-white hover:bg-red-600 transition-colors focus-visible:outline-2 focus-visible:outline-white"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function PhotoUploader({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onError,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      onError(`Maximum of ${MAX_PHOTOS} property photos reached.`);
      return;
    }

    const incoming = Array.from(fileList).slice(0, remainingSlots);
    const processed: PhotoInputPayload[] = [];

    for (const file of incoming) {
      const mime = file.type.toLowerCase();
      if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
        onError(`Unsupported format for ${file.name}. Use JPG, PNG, or WebP.`);
        continue;
      }
      try {
        const { data, previewUrl } = await readFileAsBase64(file);
        processed.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: mime,
          data,
          previewUrl,
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to process image.');
      }
    }

    if (processed.length > 0) {
      onAddPhotos(processed);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="property-photo-input" className="text-sm font-medium text-slate-900">
          Property Photos
        </label>
        <span className="text-xs text-slate-500 tabular-nums">
          {photos.length} / {MAX_PHOTOS} uploaded
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border border-dashed p-4 transition-colors ${
          isDragging
            ? 'border-teal-600 bg-teal-50/60'
            : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          id="property-photo-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void handleFiles(e.target.files)}
          className="sr-only"
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center py-2">
          <ImagePlus className="h-5 w-5 text-slate-500" />
          <p className="text-xs text-slate-600">
            Drop JPG, PNG, or WebP interior and balcony photos here
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700 whitespace-nowrap"
          >
            Choose Photos
          </button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5" data-testid="photo-preview-grid">
          {photos.map((photo, index) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              index={index}
              onRemove={onRemovePhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
}
