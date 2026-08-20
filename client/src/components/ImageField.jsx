import { useEffect, useRef, useState } from "react";
import { IconTrash, IconUpload } from "./Icons";

export default function ImageField({
  id = "photo",
  label = "Foto",
  existingUrl = "",
  file = null,
  className = "md:col-span-2",
  onFileChange,
}) {
  const inputRef = useRef(null);
  const [picked, setPicked] = useState({ file: null, url: "" });

  // The parent can reset `file` on its own, so only trust the preview while it still matches.
  const localPreview = picked.file === file ? picked.url : "";
  const preview = localPreview || existingUrl;

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  function handlePick(event) {
    const next = event.target.files?.[0] || null;
    if (picked.url) URL.revokeObjectURL(picked.url);
    setPicked({ file: next, url: next ? URL.createObjectURL(next) : "" });
    onFileChange?.(next);
  }

  function handleClear() {
    if (picked.url) URL.revokeObjectURL(picked.url);
    setPicked({ file: null, url: "" });
    onFileChange?.(null, { cleared: true });
  }

  return (
    <div className={className}>
      <p className="mf-label">{label}</p>
      <div className="mf-card-quiet mt-2 flex flex-wrap items-start gap-4 p-4">
        {preview ? (
          <img
            src={preview}
            alt="Pratinjau foto"
            className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-primary/10"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/60 text-center text-[11px] text-muted">
            <IconUpload className="h-5 w-5" />
            Belum ada foto
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <label className="sr-only" htmlFor={id}>
            {label}
          </label>
          <input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePick}
            className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-primary-hover"
          />
          <p className="text-xs text-muted">
            JPG, PNG, WEBP, atau GIF. Maksimal 5 MB.
          </p>
          {preview ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-xs text-xs font-semibold text-danger transition hover:underline"
            >
              <IconTrash className="h-3.5 w-3.5" />
              Hapus foto
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
