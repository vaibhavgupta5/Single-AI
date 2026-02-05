export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-accent animate-pulse" />
        <span className="text-text-muted text-sm">Loading...</span>
      </div>
    </div>
  );
}
