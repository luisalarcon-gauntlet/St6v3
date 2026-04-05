import type { ChessCategory, CompletionStatus } from './domain';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCommitRequest {
  title: string;
  description: string;
  outcomeId: string;
  chessCategory: ChessCategory;
  plannedHours: number;
}

export interface UpdateCommitRequest {
  title: string;
  description: string;
  outcomeId: string;
  chessCategory: ChessCategory;
  plannedHours: number;
  version: number;
}

export interface ReconcileCommitRequest {
  actualHours: number;
  completionStatus: CompletionStatus;
  reconciliationNotes: string;
  version: number;
}

export interface ReviewRequest {
  reviewerNotes: string;
}

export interface RegressCycleRequest {
  reason: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
