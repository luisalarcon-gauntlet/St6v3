import { http, HttpResponse } from 'msw';
import type { WeeklyCycle, WeeklyCommit, RallyCry } from '@/types/domain';

// --- Mock data ---

export const mockUser = {
  id: 'user-1',
  email: 'bob@st6.com',
  displayName: 'Bob Martinez',
  role: 'MEMBER' as const,
  managerId: 'user-alice',
};

export const mockOutcomes = {
  'outcome-1': { id: 'outcome-1', definingObjectiveId: 'do-1', title: 'Self-serve onboarding flow live', description: '', status: 'ACTIVE' as const },
  'outcome-2': { id: 'outcome-2', definingObjectiveId: 'do-1', title: 'Onboarding docs revamp complete', description: '', status: 'ACTIVE' as const },
  'outcome-3': { id: 'outcome-3', definingObjectiveId: 'do-2', title: 'Enterprise pricing page shipped', description: '', status: 'ACTIVE' as const },
};

export const mockRcdoTree: RallyCry[] = [
  {
    id: 'rc-1',
    title: 'Accelerate Enterprise Adoption',
    description: '',
    status: 'ACTIVE',
    displayOrder: 1,
    definingObjectives: [
      {
        id: 'do-1',
        rallyCryId: 'rc-1',
        title: 'Reduce onboarding time by 50%',
        description: '',
        status: 'ACTIVE',
        outcomes: [mockOutcomes['outcome-1'], mockOutcomes['outcome-2']],
      },
      {
        id: 'do-2',
        rallyCryId: 'rc-1',
        title: 'Land 10 enterprise logos in Q1',
        description: '',
        status: 'ACTIVE',
        outcomes: [mockOutcomes['outcome-3']],
      },
    ],
  },
];

export const mockCommit: WeeklyCommit = {
  id: 'commit-1',
  weeklyCycleId: 'cycle-1',
  title: 'Build onboarding wizard',
  description: 'Multi-step wizard for new users',
  outcomeId: 'outcome-1',
  chessCategory: 'KING',
  priorityRank: 1,
  plannedHours: 20,
  actualHours: null,
  completionStatus: 'NOT_STARTED',
  reconciliationNotes: null,
  version: 0,
};

export const mockCommit2: WeeklyCommit = {
  id: 'commit-2',
  weeklyCycleId: 'cycle-1',
  title: 'Update API docs',
  description: 'Refresh endpoint documentation',
  outcomeId: 'outcome-2',
  chessCategory: 'PAWN',
  priorityRank: 2,
  plannedHours: 4,
  actualHours: null,
  completionStatus: 'NOT_STARTED',
  reconciliationNotes: null,
  version: 0,
};

export const mockCommit3: WeeklyCommit = {
  id: 'commit-3',
  weeklyCycleId: 'cycle-1',
  title: 'Review pricing page designs',
  description: 'Collaborate with design team',
  outcomeId: 'outcome-3',
  chessCategory: 'BISHOP',
  priorityRank: 3,
  plannedHours: 6,
  actualHours: null,
  completionStatus: 'NOT_STARTED',
  reconciliationNotes: null,
  version: 0,
};

export const mockCycleDraft: WeeklyCycle = {
  id: 'cycle-1',
  userId: 'user-1',
  weekStartDate: '2026-03-30',
  state: 'DRAFT',
  version: 0,
  lockedAt: null,
  reconciledAt: null,
  reviewedAt: null,
  reviewerId: null,
  reviewerNotes: null,
  commits: [mockCommit, mockCommit2, mockCommit3],
};

export const mockCycleReconciling: WeeklyCycle = {
  ...mockCycleDraft,
  state: 'RECONCILING',
  version: 1,
  lockedAt: '2026-03-30T09:00:00Z',
  commits: [
    { ...mockCommit, version: 1 },
    { ...mockCommit2, version: 1 },
    { ...mockCommit3, version: 1 },
  ],
};

// --- Handlers ---

export const handlers = [
  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.get('/api/v1/rcdo/tree', () => {
    return HttpResponse.json(mockRcdoTree);
  }),

  http.get('/api/v1/cycles/current', () => {
    return HttpResponse.json(mockCycleDraft);
  }),

  http.post('/api/v1/cycles/:cycleId/commits', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newCommit: WeeklyCommit = {
      id: 'commit-new',
      weeklyCycleId: 'cycle-1',
      title: body.title as string,
      description: (body.description as string) ?? '',
      outcomeId: body.outcomeId as string,
      chessCategory: body.chessCategory as WeeklyCommit['chessCategory'],
      priorityRank: 4,
      plannedHours: body.plannedHours as number,
      actualHours: null,
      completionStatus: 'NOT_STARTED',
      reconciliationNotes: null,
      version: 0,
    };
    return HttpResponse.json(newCommit, { status: 201 });
  }),

  http.delete('/api/v1/commits/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/cycles/:cycleId/lock', () => {
    return HttpResponse.json({
      ...mockCycleDraft,
      state: 'LOCKED',
      version: 1,
      lockedAt: new Date().toISOString(),
    });
  }),

  http.post('/api/v1/cycles/:cycleId/start-reconciliation', () => {
    return HttpResponse.json(mockCycleReconciling);
  }),

  http.put('/api/v1/commits/:id/reconcile', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockCommit,
      actualHours: body.actualHours,
      completionStatus: body.completionStatus,
      reconciliationNotes: body.reconciliationNotes,
      version: 2,
    });
  }),

  http.post('/api/v1/cycles/:cycleId/reconcile', () => {
    return HttpResponse.json({
      ...mockCycleReconciling,
      state: 'RECONCILED',
      version: 2,
      reconciledAt: new Date().toISOString(),
    });
  }),
];
