import { Fragment } from 'react';
import type { CycleState } from '@/types/domain';

const STEPS: { state: CycleState; label: string; num: number }[] = [
  { state: 'DRAFT', label: 'Draft', num: 1 },
  { state: 'LOCKED', label: 'Locked', num: 2 },
  { state: 'RECONCILING', label: 'Reconciling', num: 3 },
  { state: 'RECONCILED', label: 'Reconciled', num: 4 },
];

const STATE_COLORS: Record<CycleState, string> = {
  DRAFT: '#fbbf24',
  LOCKED: '#3b82f6',
  RECONCILING: '#f59e0b',
  RECONCILED: '#4ade80',
};

interface LifecycleStepperProps {
  currentState: CycleState;
}

export function LifecycleStepper({ currentState }: LifecycleStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.state === currentState);

  return (
    <nav aria-label="Cycle progress" className="hidden sm:flex items-center">
      {STEPS.map((step, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <Fragment key={step.state}>
            {i > 0 && (
              <div
                className="w-5 h-0.5 transition-colors duration-300"
                style={{
                  backgroundColor: isActive ? STATE_COLORS[step.state] : '#3a3532',
                }}
              />
            )}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300"
              style={{
                backgroundColor: isActive ? STATE_COLORS[step.state] : 'transparent',
                color: isActive ? '#1a1614' : '#a89f96',
                border: isActive ? 'none' : '1px solid #3a3532',
                boxShadow: isCurrent ? `0 0 8px ${STATE_COLORS[step.state]}60` : 'none',
              }}
              aria-label={`Step ${step.num}: ${step.label}${isCurrent ? ' (current)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {step.num}
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}
