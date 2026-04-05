import type { CycleState, ChessCategory, CompletionStatus } from '@/types/domain';

export const CHESS_STYLES = {
  KING: {
    border: 'border-l-[6px] border-l-chess-king',
    card: 'bg-chess-king/5 shadow-[0_0_15px_-3px_rgba(224,159,62,0.2)]',
    pill: 'bg-chess-king/15 text-chess-king',
    color: '#e09f3e',
  },
  QUEEN: {
    border: 'border-l-4 border-l-chess-queen',
    card: '',
    pill: 'bg-chess-queen/15 text-chess-queen',
    color: '#a855f7',
  },
  ROOK: {
    border: 'border-l-4 border-l-chess-rook',
    card: '',
    pill: 'bg-chess-rook/15 text-chess-rook',
    color: '#3b82f6',
  },
  BISHOP: {
    border: 'border-l-4 border-l-chess-bishop',
    card: '',
    pill: 'bg-chess-bishop/15 text-chess-bishop',
    color: '#4ade80',
  },
  KNIGHT: {
    border: 'border-l-4 border-l-chess-knight',
    card: '',
    pill: 'bg-chess-knight/15 text-chess-knight',
    color: '#ef4444',
  },
  PAWN: {
    border: 'border-l-4 border-l-chess-pawn',
    card: '',
    pill: 'bg-chess-pawn/15 text-chess-pawn',
    color: '#a89f96',
  },
} as const satisfies Record<ChessCategory, { border: string; card: string; pill: string; color: string }>;

export const COMPLETION_STATUS_STYLES = {
  NOT_STARTED: { label: 'Not Started', badge: 'bg-muted/10 text-muted border-muted/20' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-locked/10 text-locked border-locked/20' },
  COMPLETED: { label: 'Completed', badge: 'bg-success/10 text-success border-success/20' },
  CARRIED_FORWARD: { label: 'Carried Forward', badge: 'bg-warning/10 text-warning border-warning/20' },
  DROPPED: { label: 'Dropped', badge: 'bg-danger/10 text-danger border-danger/20' },
} as const satisfies Record<CompletionStatus, { label: string; badge: string }>;

const COMPLETION_STATUS_FALLBACK = { label: 'Unknown', badge: 'bg-muted/10 text-muted border-muted/20' } as const;

export function getCompletionStatusStyle(status: string | null | undefined) {
  return COMPLETION_STATUS_STYLES[status as CompletionStatus] ?? COMPLETION_STATUS_FALLBACK;
}

export const CYCLE_STATE_STYLES = {
  DRAFT: {
    badge: 'bg-draft/20 text-draft border-draft/30',
    button: 'bg-draft hover:bg-draft/80',
    text: 'text-draft',
  },
  LOCKED: {
    badge: 'bg-locked/20 text-locked border-locked/30',
    button: 'bg-locked hover:bg-locked/80',
    text: 'text-locked',
  },
  RECONCILING: {
    badge: 'bg-reconciling/20 text-reconciling border-reconciling/30',
    button: 'bg-reconciling hover:bg-reconciling/80',
    text: 'text-reconciling',
  },
  RECONCILED: {
    badge: 'bg-reconciled/20 text-reconciled border-reconciled/30',
    button: 'bg-reconciled hover:bg-reconciled/80',
    text: 'text-reconciled',
  },
} as const satisfies Record<CycleState, { badge: string; button: string; text: string }>;

const CYCLE_STATE_FALLBACK = { badge: 'bg-muted/20 text-muted border-muted/30', button: 'bg-muted hover:bg-muted/80', text: 'text-muted' } as const;

export function getCycleStateStyle(state: string | null | undefined) {
  return CYCLE_STATE_STYLES[state as CycleState] ?? CYCLE_STATE_FALLBACK;
}

const CHESS_FALLBACK = { border: 'border-l-4 border-l-muted', card: '', pill: 'bg-muted/15 text-muted', color: '#a89f96' } as const;

export function getChessStyle(category: string | null | undefined) {
  return CHESS_STYLES[category as ChessCategory] ?? CHESS_FALLBACK;
}
