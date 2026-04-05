import type { CycleState } from '@/types/domain';

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
