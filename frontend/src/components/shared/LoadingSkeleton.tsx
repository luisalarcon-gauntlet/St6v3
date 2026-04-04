export function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="animate-pulse space-y-4 p-6">
      <div className="h-4 bg-surface rounded w-3/4" />
      <div className="h-4 bg-surface rounded w-1/2" />
      <div className="h-4 bg-surface rounded w-5/6" />
      <div className="h-4 bg-surface rounded w-2/3" />
    </div>
  );
}
