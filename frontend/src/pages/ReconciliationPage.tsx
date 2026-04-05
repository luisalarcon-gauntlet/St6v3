import { useState } from 'react';
import { useCycle } from '@/hooks/useCycle';
import { useRcdoTree } from '@/hooks/useRcdoTree';
import { useCommits } from '@/hooks/useCommits';
import { WeekStateBar } from '@/components/lifecycle/WeekStateBar';
import { StateTransitionButton } from '@/components/lifecycle/StateTransitionButton';
import { ReconcileForm } from '@/components/commits/ReconcileForm';
import { CommitList } from '@/components/commits/CommitList';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import type { ReconcileCommitRequest } from '@/types/api';
import type { AppError } from '@/types/errors';

export function ReconciliationPage() {
  const { cycle, loading, reload, lock, beginReconciliation, reconcile } = useCycle();
  const { tree: rcdoTree } = useRcdoTree();
  const commits = useCommits();
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (loading || !cycle) {
    return <LoadingSkeleton />;
  }

  async function handleReconcileCommit(id: string, data: ReconcileCommitRequest) {
    await commits.reconcile(id, data);
    reload();
  }

  async function handleTransition() {
    setTransitionError(null);
    try {
      if (cycle!.state === 'DRAFT') await lock();
      else if (cycle!.state === 'LOCKED') await beginReconciliation();
      else if (cycle!.state === 'RECONCILING') await reconcile();
    } catch (err) {
      const appErr = err as AppError;
      setTransitionError(appErr.detail);
    }
  }

  const isReconciling = cycle.state === 'RECONCILING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Reconciliation</h1>
          <div className="mt-1">
            <WeekStateBar state={cycle.state} weekStartDate={cycle.weekStartDate} />
          </div>
        </div>
        <StateTransitionButton
          cycleState={cycle.state}
          onLock={handleTransition}
          onStartReconciliation={handleTransition}
          onReconcile={handleTransition}
        />
      </div>

      {transitionError && (
        <div role="alert" className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
          {transitionError}
        </div>
      )}

      {isReconciling ? (
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Report your actual hours and completion status for each commitment.
          </p>
          {cycle.commits.map((commit) => (
            <ReconcileForm
              key={commit.id}
              commit={commit}
              onReconcile={handleReconcileCommit}
            />
          ))}
        </div>
      ) : (
        <>
          {cycle.state === 'RECONCILED' ? (
            <p className="text-muted text-sm">This week has been reconciled.</p>
          ) : (
            <p className="text-muted text-sm">
              Transition to the RECONCILING state to start reconciling your commitments.
            </p>
          )}
          <CommitList
            commits={cycle.commits}
            rcdoTree={rcdoTree}
            loading={false}
            cycleState={cycle.state}
            onDelete={() => {}}
          />
        </>
      )}
    </div>
  );
}
