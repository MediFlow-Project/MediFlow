import { IconEdit, IconTrash } from "./Icons";

const BASE =
  "inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold transition duration-200 ease-soft";

export default function RowActions({ onEdit, onDelete, name }) {
  const suffix = name ? ` ${name}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Ubah${suffix}`}
        className={`${BASE} border-line text-primary hover:border-accent hover:text-accent-ink`}
      >
        <IconEdit className="h-3.5 w-3.5" />
        Ubah
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Hapus${suffix}`}
        className={`${BASE} border-danger/25 text-danger hover:border-danger/50 hover:bg-clay/5`}
      >
        <IconTrash className="h-3.5 w-3.5" />
        Hapus
      </button>
    </div>
  );
}
