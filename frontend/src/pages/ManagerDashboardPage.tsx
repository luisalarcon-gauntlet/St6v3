import { useCallback, useEffect, useState } from 'react';
import { TeamGrid } from '@/components/manager/TeamGrid';
import { ReviewPanel } from '@/components/manager/ReviewPanel';
import { RegressionConfirmDialog } from '@/components/shared/RegressionConfirmDialog';
import { getTeamMemberDetail, submitReview } from '@/api/manager';
import { regressCycle } from '@/api/cycles';
import { normalizeError } from '@/api/client';
import type { TeamMemberOverview } from '@/types/domain';
import type { AppError } from '@/types/errors';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export function ManagerDashboardPage() {
  const [selectedMember, setSelectedMember] = useState<TeamMemberOverview | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [regressOpen, setRegressOpen] = useState(false);
  const [regressing, setRegressing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectMember = useCallback(async (memberId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const member = await getTeamMemberDetail(memberId);
      setSelectedMember(member);
    } catch (err) {
      setDetailError(normalizeError(err));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSubmitReview = useCallback(async (cycleId: string, notes: string) => {
    setSubmitting(true);
    try {
      await submitReview(cycleId, { reviewerNotes: notes });
      // Refresh the member detail to show updated review
      if (selectedMember) {
        const updated = await getTeamMemberDetail(selectedMember.id);
        setSelectedMember(updated);
      }
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setSubmitting(false);
    }
  }, [selectedMember]);

  const handleRegress = useCallback(async (reason: string) => {
    if (!selectedMember?.currentCycle) return;
    setRegressing(true);
    try {
      await regressCycle(selectedMember.currentCycle.id, reason);
      setRegressOpen(false);
      const updated = await getTeamMemberDetail(selectedMember.id);
      setSelectedMember(updated);
      setSuccessMessage(`${selectedMember.displayName}'s week has been regressed to Draft.`);
    } catch (err) {
      setDetailError(normalizeError(err));
      setRegressOpen(false);
    } finally {
      setRegressing(false);
    }
  }, [selectedMember]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const canRegress = selectedMember?.currentCycle &&
    ['LOCKED', 'RECONCILING', 'RECONCILED'].includes(selectedMember.currentCycle.state);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary">Team Dashboard</h1>
          <p className="text-muted text-sm mt-1.5">Review your team's weekly commitments.</p>
        </div>

        {selectedMember && (
          <button
            type="button"
            onClick={() => setSelectedMember(null)}
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            &larr; Back to team
          </button>
        )}
      </div>

      {!selectedMember && !detailLoading && (
        <TeamGrid onSelectMember={handleSelectMember} />
      )}

      {detailLoading && <LoadingSkeleton />}

      {successMessage && (
        <div role="status" className="bg-success/10 border border-success/30 rounded-lg p-4 text-success text-sm">
          {successMessage}
        </div>
      )}

      {detailError && (
        <div role="alert" className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
          {detailError.detail}
        </div>
      )}

      {selectedMember && !detailLoading && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-primary font-medium">{selectedMember.displayName}</h2>
                <p className="text-muted text-xs mt-0.5">{selectedMember.email}</p>
                {selectedMember.currentCycle && (
                  <p className="text-xs text-muted mt-2">
                    Week of {selectedMember.currentCycle.weekStartDate} &middot;{' '}
                    <span className="text-accent">
                      {selectedMember.currentCycle.state.charAt(0) +
                        selectedMember.currentCycle.state.slice(1).toLowerCase()}
                    </span>
                  </p>
                )}
              </div>
              {canRegress && (
                <button
                  type="button"
                  onClick={() => setRegressOpen(true)}
                  className="px-3 py-1.5 text-xs text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors"
                >
                  Regress Week
                </button>
              )}
            </div>
          </div>

          {selectedMember.currentCycle ? (
            <ReviewPanel
              cycle={selectedMember.currentCycle}
              onSubmitReview={handleSubmitReview}
              submitting={submitting}
            />
          ) : (
            <div className="text-center py-12 text-muted">
              <p className="text-sm">This member has no cycle for the current week.</p>
            </div>
          )}
        </div>
      )}
      {selectedMember?.currentCycle && (
        <RegressionConfirmDialog
          open={regressOpen}
          memberName={selectedMember.displayName}
          currentState={selectedMember.currentCycle.state}
          onConfirm={handleRegress}
          onCancel={() => setRegressOpen(false)}
          submitting={regressing}
        />
      )}
    </div>
  );
}
