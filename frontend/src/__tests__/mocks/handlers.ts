import { http, HttpResponse } from 'msw';
import type { AuditLogEntry, WeeklyCycle, WeeklyCommit, RallyCry, TeamMemberOverview } from '@/types/domain';

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
  regressedFromState: null,
  regressedByName: null,
  regressionReason: null,
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

export const mockCycleReconciled: WeeklyCycle = {
  ...mockCycleDraft,
  id: 'cycle-bob',
  userId: 'user-bob',
  state: 'RECONCILED',
  version: 2,
  lockedAt: '2026-03-30T09:00:00Z',
  reconciledAt: '2026-04-04T17:00:00Z',
  reviewedAt: null,
  reviewerId: null,
  reviewerNotes: null,
  commits: [
    { ...mockCommit, completionStatus: 'COMPLETED', actualHours: 18, version: 2 },
    { ...mockCommit2, completionStatus: 'COMPLETED', actualHours: 3, version: 2 },
    { ...mockCommit3, completionStatus: 'IN_PROGRESS', actualHours: 4, version: 2 },
  ],
};

export const mockCycleLocked: WeeklyCycle = {
  ...mockCycleDraft,
  id: 'cycle-carol',
  userId: 'user-carol',
  state: 'LOCKED',
  version: 1,
  lockedAt: '2026-03-30T09:00:00Z',
  commits: [
    { ...mockCommit, id: 'commit-c1', weeklyCycleId: 'cycle-carol', version: 1 },
    { ...mockCommit2, id: 'commit-c2', weeklyCycleId: 'cycle-carol', version: 1 },
    { ...mockCommit3, id: 'commit-c3', weeklyCycleId: 'cycle-carol', version: 1 },
  ],
};

export const mockManagerUser = {
  id: 'user-alice',
  email: 'alice@st6.com',
  displayName: 'Alice Chen',
  role: 'MANAGER' as const,
  managerId: null,
};

export const mockTeamMemberBob: TeamMemberOverview = {
  id: 'user-bob',
  email: 'bob@st6.com',
  displayName: 'Bob Martinez',
  currentCycle: mockCycleReconciled,
};

export const mockTeamMemberCarol: TeamMemberOverview = {
  id: 'user-carol',
  email: 'carol@st6.com',
  displayName: 'Carol Nguyen',
  currentCycle: mockCycleLocked,
};

export const mockTeamMemberNoCycle: TeamMemberOverview = {
  id: 'user-dave',
  email: 'dave@st6.com',
  displayName: 'Dave Kim',
  currentCycle: null,
};

export const mockAuditEntries: AuditLogEntry[] = [
  {
    id: 'audit-1',
    entityType: 'WEEKLY_CYCLE',
    entityId: 'cycle-bob',
    action: 'REGRESSED',
    actorId: 'user-alice',
    actorDisplayName: 'Alice Chen',
    details: { previous_state: 'LOCKED', new_state: 'DRAFT', reason: 'Needs to re-plan commitments' },
    createdAt: '2026-04-03T14:30:00Z',
  },
  {
    id: 'audit-2',
    entityType: 'WEEKLY_CYCLE',
    entityId: 'cycle-bob',
    action: 'LOCKED',
    actorId: 'user-bob',
    actorDisplayName: 'Bob Martinez',
    details: { previous_state: 'DRAFT', new_state: 'LOCKED' },
    createdAt: '2026-04-02T09:00:00Z',
  },
];

export const mockAuditPage = {
  content: mockAuditEntries,
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 20,
};

export const mockTeamPage = {
  content: [mockTeamMemberBob, mockTeamMemberCarol],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 20,
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

  http.get('/api/v1/manager/team', () => {
    return HttpResponse.json(mockTeamPage);
  }),

  http.get('/api/v1/manager/team/:userId', ({ params }) => {
    const { userId } = params;
    if (userId === 'user-bob') return HttpResponse.json(mockTeamMemberBob);
    if (userId === 'user-carol') return HttpResponse.json(mockTeamMemberCarol);
    return HttpResponse.json(
      { type: 'about:blank', title: 'Not Found', status: 404, detail: 'User not found' },
      { status: 404 },
    );
  }),

  http.post('/api/v1/cycles/:cycleId/regress', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockCycleDraft,
      version: 3,
      regressedFromState: 'LOCKED',
      regressedByName: 'Alice Chen',
      regressionReason: body.reason,
    });
  }),

  // --- RCDO Admin endpoints ---

  http.post('/api/v1/rally-cries', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'rc-new',
        title: body.title as string,
        description: (body.description as string) ?? '',
        status: 'ACTIVE',
        displayOrder: 99,
        definingObjectives: [],
      },
      { status: 201 },
    );
  }),

  http.put('/api/v1/rally-cries/:id', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rc = mockRcdoTree.find((r) => r.id === params.id);
    return HttpResponse.json({
      ...rc,
      id: params.id,
      title: body.title as string,
      description: (body.description as string) ?? '',
      status: (body.status as string) ?? rc?.status ?? 'ACTIVE',
    });
  }),

  http.delete('/api/v1/rally-cries/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/defining-objectives', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'do-new',
        rallyCryId: body.rallyCryId as string,
        title: body.title as string,
        description: (body.description as string) ?? '',
        status: 'ACTIVE',
        outcomes: [],
      },
      { status: 201 },
    );
  }),

  http.put('/api/v1/defining-objectives/:id', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id,
      title: body.title as string,
      description: (body.description as string) ?? '',
      status: (body.status as string) ?? 'ACTIVE',
      outcomes: [],
    });
  }),

  http.delete('/api/v1/defining-objectives/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/outcomes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'outcome-new',
        definingObjectiveId: body.definingObjectiveId as string,
        title: body.title as string,
        description: (body.description as string) ?? '',
        status: 'ACTIVE',
      },
      { status: 201 },
    );
  }),

  http.put('/api/v1/outcomes/:id', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id,
      title: body.title as string,
      description: (body.description as string) ?? '',
      status: (body.status as string) ?? 'ACTIVE',
    });
  }),

  http.delete('/api/v1/outcomes/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/v1/manager/cycles/:cycleId/audit', () => {
    return HttpResponse.json(mockAuditPage);
  }),

  http.post('/api/v1/manager/reviews/:cycleId', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockCycleReconciled,
      id: params.cycleId,
      reviewedAt: new Date().toISOString(),
      reviewerId: 'user-alice',
      reviewerNotes: body.reviewerNotes,
      version: 3,
    });
  }),
];
