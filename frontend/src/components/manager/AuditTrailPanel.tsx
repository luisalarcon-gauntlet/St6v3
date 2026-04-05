import { useCallback, useEffect, useState } from 'react';
import { getCycleAudit } from '@/api/manager';
import { normalizeError } from '@/api/client';
import type { AuditLogEntry } from '@/types/domain';
import type { AppError } from '@/types/errors';

const ACTION_LABELS: Record<string, string> = {
  LOCKED: 'Locked week',
  RECONCILING: 'Started reconciliation',
  RECONCILED: 'Reconciled week',
  REGRESSED: 'Regressed to Draft',
  REVIEWED: 'Submitted review',
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface AuditTrailPanelProps {
  cycleId: string;
}

export function AuditTrailPanel({ cycleId }: AuditTrailPanelProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getCycleAudit(cycleId);
      setEntries(page.content);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-primary text-sm font-medium mb-4">Audit Trail</h3>

      {loading && (
        <div className="space-y-3" data-testid="audit-loading">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-border/30 rounded animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error.detail}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-muted text-sm">No audit events recorded yet.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol className="relative border-l border-border ml-2 space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="ml-4">
              <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-accent border border-surface" />
              <time className="text-xs text-muted">{formatTimestamp(entry.createdAt)}</time>
              <p className="text-sm text-primary mt-0.5">
                {formatAction(entry.action)}
                {entry.actorDisplayName && (
                  <span className="text-muted"> by {entry.actorDisplayName}</span>
                )}
              </p>
              {entry.details?.reason && (
                <p className="text-xs text-muted mt-1 italic">
                  &ldquo;{entry.details.reason}&rdquo;
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
