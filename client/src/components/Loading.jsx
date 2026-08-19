export default function Loading({ label = "Memuat..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-primary">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
