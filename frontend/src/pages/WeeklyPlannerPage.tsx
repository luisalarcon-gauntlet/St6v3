import { useState } from 'react';
import { useCycle } from '@/hooks/useCycle';
import { useCommits } from '@/hooks/useCommits';
import { useRcdoTree } from '@/hooks/useRcdoTree';
import { CommitForm } from '@/components/commits/CommitForm';
import { CommitList } from '@/components/commits/CommitList';
import { WeekStateBar } from '@/components/lifecycle/WeekStateBar';
import { StateTransitionButton } from '@/components/lifecycle/StateTransitionButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import type { CreateCommitRequest } from '@/types/api';
import type { AppError } from '@/types/errors';

export function WeeklyPlannerPage() {
  const { cycle, loading, reload, lock, beginReconciliation, reconcile } = useCycle();
  const { add, remove } = useCommits();
  const { tree: rcdoTree } = useRcdoTree();
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (loading || !cycle) {
    return <LoadingSkeleton />;
  }

  const existingChessCategories = cycle.commits.map((c) => c.chessCategory);

  async function handleAddCommit(data: CreateCommitRequest) {
    await add(cycle!.id, data);
    reload();
  }

  async function handleDelete(id: string) {
    await remove(id);
    reload();
  }

  async function handleLock() {
    setTransitionError(null);
    try {
      await lock();
    } catch (err) {
      const appErr = err as AppError;
      setTransitionError(appErr.detail);
    }
  }

  async function handleStartReconciliation() {
    setTransitionError(null);
    try {
      await beginReconciliation();
    } catch (err) {
      const appErr = err as AppError;
      setTransitionError(appErr.detail);
    }
  }

  async function handleReconcile() {
    setTransitionError(null);
    try {
      await reconcile();
    } catch (err) {
      const appErr = err as AppError;
      setTransitionError(appErr.detail);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Weekly Planner</h1>
          <div className="mt-1">
            <WeekStateBar state={cycle.state} weekStartDate={cycle.weekStartDate} />
          </div>
        </div>
        <StateTransitionButton
          cycleState={cycle.state}
          onLock={handleLock}
          onStartReconciliation={handleStartReconciliation}
          onReconcile={handleReconcile}
        />
      </div>

      {transitionError && (
        <div role="alert" className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
          {transitionError}
        </div>
      )}

      {cycle.state === 'DRAFT' && (
        <CommitForm
          cycleId={cycle.id}
          rcdoTree={rcdoTree}
          onSubmit={handleAddCommit}
          existingChessCategories={existingChessCategories}
        />
      )}

      <CommitList
        commits={cycle.commits}
        rcdoTree={rcdoTree}
        loading={false}
        cycleState={cycle.state}
        onDelete={handleDelete}
      />
    </div>
  );
}
