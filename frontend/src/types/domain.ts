export type Role = 'MEMBER' | 'MANAGER' | 'ADMIN';

export type CycleState = 'DRAFT' | 'LOCKED' | 'RECONCILING' | 'RECONCILED';

export type ChessCategory = 'KING' | 'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT' | 'PAWN';

export type CompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CARRIED_FORWARD'
  | 'DROPPED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  managerId: string | null;
}

export interface RallyCry {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  displayOrder: number;
  definingObjectives: DefiningObjective[];
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface WeeklyCycle {
  id: string;
  userId: string;
  weekStartDate: string;
  state: CycleState;
  version: number;
  lockedAt: string | null;
  reconciledAt: string | null;
  reviewedAt: string | null;
  reviewerId: string | null;
  reviewerNotes: string | null;
  regressedFromState: CycleState | null;
  regressedByName: string | null;
  regressionReason: string | null;
  commits: WeeklyCommit[];
}

export interface WeeklyCommit {
  id: string;
  weeklyCycleId: string;
  title: string;
  description: string;
  outcomeId: string;
  chessCategory: ChessCategory;
  priorityRank: number;
  plannedHours: number;
  actualHours: number | null;
  completionStatus: CompletionStatus;
  reconciliationNotes: string | null;
  version: number;
}

export interface TeamMemberOverview {
  id: string;
  email: string;
  displayName: string;
  currentCycle: WeeklyCycle | null;
}
