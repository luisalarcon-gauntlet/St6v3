import { useState } from 'react';
import type { WeeklyCommit, CycleState, RallyCry } from '@/types/domain';
import type { ReconcileCommitRequest } from '@/types/api';
import { CommitCard } from './CommitCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface CommitListProps {
  commits: WeeklyCommit[];
  rcdoTree: RallyCry[];
  loading: boolean;
  cycleState: CycleState;
  onDelete: (id: string) => void;
  onReconcile?: (id: string, data: ReconcileCommitRequest) => void;
}

export function CommitList({
  commits,
  rcdoTree,
  loading,
  cycleState,
  onDelete,
}: CommitListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No commits yet</p>
        <p className="text-sm mt-1">Add your first weekly commitment above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {commits.map((commit) => (
          <CommitCard
            key={commit.id}
            commit={commit}
            rcdoTree={rcdoTree}
            cycleState={cycleState}
            onDelete={(id) => setDeleteTarget(id)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Commit"
        message="Are you sure you want to delete this commit?"
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
