import { useCallback, useEffect, useRef, useState } from 'react';
import type { RallyCry, DefiningObjective, Outcome } from '@/types/domain';
import type { AppError } from '@/types/errors';
import { normalizeError } from '@/api/client';
import {
  getRcdoTreeAll,
  createRallyCry,
  updateRallyCry,
  archiveRallyCry,
  createDefiningObjective,
  updateDefiningObjective,
  archiveDefiningObjective,
  createOutcome,
  updateOutcome,
  archiveOutcome,
} from '@/api/rcdo';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface EditState {
  id: string;
  field: 'title';
  value: string;
}

export function RCDOAdminPage() {
  const [tree, setTree] = useState<RallyCry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTree = useCallback(async () => {
    try {
      const data = await getRcdoTreeAll();
      setTree(data);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleStartEdit = (id: string, title: string) => {
    setEditing({ id, field: 'title', value: title });
  };

  const handleSave = useCallback(
    async (type: 'rally-cry' | 'defining-objective' | 'outcome') => {
      if (!editing || saving) return;
      const trimmed = editing.value.trim();
      if (!trimmed) {
        setEditing(null);
        return;
      }

      setSaving(true);
      try {
        if (type === 'rally-cry') {
          await updateRallyCry(editing.id, { title: trimmed, description: '' });
        } else if (type === 'defining-objective') {
          await updateDefiningObjective(editing.id, { title: trimmed, description: '' });
        } else {
          await updateOutcome(editing.id, { title: trimmed, description: '' });
        }
        setEditing(null);
        await loadTree();
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setSaving(false);
      }
    },
    [editing, saving, loadTree],
  );

  const handleArchive = useCallback(
    async (type: 'rally-cry' | 'defining-objective' | 'outcome', id: string) => {
      setSaving(true);
      try {
        if (type === 'rally-cry') {
          await archiveRallyCry(id);
        } else if (type === 'defining-objective') {
          await archiveDefiningObjective(id);
        } else {
          await archiveOutcome(id);
        }
        await loadTree();
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setSaving(false);
      }
    },
    [loadTree],
  );

  const handleRestore = useCallback(
    async (type: 'rally-cry' | 'defining-objective' | 'outcome', id: string, title: string) => {
      setSaving(true);
      try {
        if (type === 'rally-cry') {
          await updateRallyCry(id, { title, description: '', status: 'ACTIVE' });
        } else if (type === 'defining-objective') {
          await updateDefiningObjective(id, { title, description: '', status: 'ACTIVE' });
        } else {
          await updateOutcome(id, { title, description: '', status: 'ACTIVE' });
        }
        await loadTree();
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setSaving(false);
      }
    },
    [loadTree],
  );

  const handleCreateRallyCry = useCallback(async () => {
    setSaving(true);
    try {
      await createRallyCry({ title: 'New Rally Cry', description: '' });
      await loadTree();
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setSaving(false);
    }
  }, [loadTree]);

  const handleCreateDefiningObjective = useCallback(
    async (rallyCryId: string) => {
      setSaving(true);
      try {
        await createDefiningObjective({
          rallyCryId,
          title: 'New Defining Objective',
          description: '',
        });
        await loadTree();
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setSaving(false);
      }
    },
    [loadTree],
  );

  const handleCreateOutcome = useCallback(
    async (definingObjectiveId: string) => {
      setSaving(true);
      try {
        await createOutcome({
          definingObjectiveId,
          title: 'New Outcome',
          description: '',
        });
        await loadTree();
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setSaving(false);
      }
    },
    [loadTree],
  );

  const renderInlineEdit = (
    type: 'rally-cry' | 'defining-objective' | 'outcome',
  ) => (
    <input
      ref={inputRef}
      type="text"
      value={editing?.value ?? ''}
      onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
      onBlur={() => handleSave(type)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave(type);
        if (e.key === 'Escape') setEditing(null);
      }}
      className="bg-transparent border-b border-accent text-primary text-sm outline-none w-full"
      aria-label="Edit title"
    />
  );

  const renderStatusBadge = (status: string) => (
    <span
      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
        status === 'ACTIVE'
          ? 'bg-success/15 text-success'
          : 'bg-muted/15 text-muted'
      }`}
    >
      {status}
    </span>
  );

  const renderArchiveButton = (
    type: 'rally-cry' | 'defining-objective' | 'outcome',
    id: string,
    status: string,
    title: string,
  ) =>
    status === 'ACTIVE' ? (
      <button
        type="button"
        onClick={() => handleArchive(type, id)}
        disabled={saving}
        className="text-[11px] text-muted hover:text-danger transition-colors min-h-[44px] px-2"
        aria-label={`Archive ${title}`}
      >
        Archive
      </button>
    ) : (
      <button
        type="button"
        onClick={() => handleRestore(type, id, title)}
        disabled={saving}
        className="text-[11px] text-muted hover:text-success transition-colors min-h-[44px] px-2"
        aria-label={`Restore ${title}`}
      >
        Restore
      </button>
    );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary">RCDO Management</h1>
          <p className="text-muted text-sm mt-1.5">
            Manage Rally Cries, Defining Objectives, and Outcomes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateRallyCry}
          disabled={saving}
          className="px-4 py-2 min-h-[44px] text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          + Rally Cry
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
          {error.detail}
        </div>
      )}

      {tree.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-sm">No RCDO items yet. Create a Rally Cry to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {tree.map((rc) => (
          <div
            key={rc.id}
            className={`bg-surface border border-border rounded-lg ${
              rc.status === 'ARCHIVED' ? 'opacity-60' : ''
            }`}
          >
            {/* Rally Cry header */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-border">
              <span className="text-accent font-mono text-xs" aria-hidden="true">RC</span>
              <div className="flex-1 min-w-0">
                {editing?.id === rc.id ? (
                  renderInlineEdit('rally-cry')
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(rc.id, rc.title)}
                    className="text-sm text-primary hover:text-accent transition-colors text-left truncate w-full"
                  >
                    {rc.title}
                  </button>
                )}
              </div>
              {renderStatusBadge(rc.status)}
              {renderArchiveButton('rally-cry', rc.id, rc.status, rc.title)}
            </div>

            {/* Defining Objectives */}
            <div className="px-3 sm:px-4 py-2 space-y-2">
              {rc.definingObjectives.map((doObj: DefiningObjective) => (
                <div
                  key={doObj.id}
                  className={`pl-4 border-l-2 border-border ${
                    doObj.status === 'ARCHIVED' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 py-1.5">
                    <span className="text-warning font-mono text-[10px]" aria-hidden="true">DO</span>
                    <div className="flex-1 min-w-0">
                      {editing?.id === doObj.id ? (
                        renderInlineEdit('defining-objective')
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(doObj.id, doObj.title)}
                          className="text-sm text-primary hover:text-accent transition-colors text-left truncate w-full"
                        >
                          {doObj.title}
                        </button>
                      )}
                    </div>
                    {renderStatusBadge(doObj.status)}
                    {renderArchiveButton('defining-objective', doObj.id, doObj.status, doObj.title)}
                  </div>

                  {/* Outcomes */}
                  <div className="pl-4 space-y-1">
                    {doObj.outcomes.map((outcome: Outcome) => (
                      <div
                        key={outcome.id}
                        className={`flex items-center gap-2 sm:gap-3 py-1 ${
                          outcome.status === 'ARCHIVED' ? 'opacity-60' : ''
                        }`}
                      >
                        <span className="text-muted font-mono text-[10px]" aria-hidden="true">OC</span>
                        <div className="flex-1 min-w-0">
                          {editing?.id === outcome.id ? (
                            renderInlineEdit('outcome')
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(outcome.id, outcome.title)}
                              className="text-xs text-muted hover:text-accent transition-colors text-left truncate w-full"
                            >
                              {outcome.title}
                            </button>
                          )}
                        </div>
                        {renderStatusBadge(outcome.status)}
                        {renderArchiveButton('outcome', outcome.id, outcome.status, outcome.title)}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCreateOutcome(doObj.id)}
                      disabled={saving || doObj.status === 'ARCHIVED'}
                      className="text-[11px] text-muted hover:text-accent transition-colors min-h-[44px] disabled:opacity-50"
                    >
                      + Outcome
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleCreateDefiningObjective(rc.id)}
                disabled={saving || rc.status === 'ARCHIVED'}
                className="text-[11px] text-muted hover:text-accent transition-colors pl-2 sm:pl-4 min-h-[44px] disabled:opacity-50"
              >
                + Defining Objective
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
