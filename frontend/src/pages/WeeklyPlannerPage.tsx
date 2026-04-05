import { useState } from 'react';
import { useCycle } from '@/hooks/useCycle';
import { useCommits } from '@/hooks/useCommits';
import { useRcdoTree } from '@/hooks/useRcdoTree';
import { CommitForm } from '@/components/commits/CommitForm';
import { CommitList } from '@/components/commits/CommitList';
import { WeekStateBar } from '@/components/lifecycle/WeekStateBar';
import { StateTransitionButton } from '@/components/lifecycle/StateTransitionButton';
import { LifecycleStepper } from '@/components/lifecycle/LifecycleStepper';
import { WeekSummary } from '@/components/planner/WeekSummary';
import { ChessDistribution } from '@/components/planner/ChessDistribution';
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-primary">Weekly Planner</h1>
            <div className="mt-1.5">
              <WeekStateBar state={cycle.state} weekStartDate={cycle.weekStartDate} />
            </div>
          </div>
          <LifecycleStepper currentState={cycle.state} />
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
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

        <aside className="space-y-4">
          <WeekSummary commits={cycle.commits} />
          <ChessDistribution commits={cycle.commits} />
        </aside>
      </div>
    </div>
  );
}
