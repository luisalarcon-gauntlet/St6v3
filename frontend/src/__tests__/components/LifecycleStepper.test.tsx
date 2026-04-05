import { render, screen } from '@testing-library/react';
import { LifecycleStepper } from '@/components/lifecycle/LifecycleStepper';
import type { CycleState } from '@/types/domain';

function renderStepper(currentState: CycleState) {
  return render(<LifecycleStepper currentState={currentState} />);
}

describe('LifecycleStepper', () => {
  test('renders all 4 steps', () => {
    renderStepper('DRAFT');

    expect(screen.getByLabelText(/step 1: draft/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step 2: locked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step 3: reconciling/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step 4: reconciled/i)).toBeInTheDocument();
  });

  test('marks DRAFT as current when state is DRAFT', () => {
    renderStepper('DRAFT');

    expect(screen.getByLabelText(/step 1: draft \(current\)/i)).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByLabelText(/step 2: locked$/i)).not.toHaveAttribute('aria-current');
  });

  test('fills steps up to current state for RECONCILING', () => {
    renderStepper('RECONCILING');

    // Steps 1-3 should be active (filled with their state color backgrounds)
    const step1 = screen.getByLabelText(/step 1: draft/i);
    const step2 = screen.getByLabelText(/step 2: locked/i);
    const step3 = screen.getByLabelText(/step 3: reconciling \(current\)/i);
    const step4 = screen.getByLabelText(/step 4: reconciled/i);

    // Active steps get their state color as backgroundColor
    expect(step1.style.backgroundColor).not.toBe('transparent');
    expect(step2.style.backgroundColor).not.toBe('transparent');
    expect(step3.style.backgroundColor).not.toBe('transparent');

    // Step 4 should be inactive (transparent)
    expect(step4.style.backgroundColor).toBe('transparent');
  });

  test('fills all steps when state is RECONCILED', () => {
    renderStepper('RECONCILED');

    const step4 = screen.getByLabelText(/step 4: reconciled \(current\)/i);
    expect(step4).toHaveAttribute('aria-current', 'step');

    // All steps should be filled
    for (const label of [/step 1/i, /step 2/i, /step 3/i, /step 4/i]) {
      expect(screen.getByLabelText(label).style.backgroundColor).not.toBe('transparent');
    }
  });

  test('uses correct color for each state', () => {
    renderStepper('RECONCILED');

    // Colors from the component: DRAFT=#fbbf24, LOCKED=#3b82f6, RECONCILING=#f59e0b, RECONCILED=#4ade80
    expect(screen.getByLabelText(/step 1/i).style.backgroundColor).toBe('rgb(251, 191, 36)');
    expect(screen.getByLabelText(/step 2/i).style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(screen.getByLabelText(/step 3/i).style.backgroundColor).toBe('rgb(245, 158, 11)');
    expect(screen.getByLabelText(/step 4/i).style.backgroundColor).toBe('rgb(74, 222, 128)');
  });

  test('only first step is filled when state is DRAFT', () => {
    renderStepper('DRAFT');

    expect(screen.getByLabelText(/step 1/i).style.backgroundColor).not.toBe('transparent');
    expect(screen.getByLabelText(/step 2/i).style.backgroundColor).toBe('transparent');
    expect(screen.getByLabelText(/step 3/i).style.backgroundColor).toBe('transparent');
    expect(screen.getByLabelText(/step 4/i).style.backgroundColor).toBe('transparent');
  });

  test('current step has glow box-shadow', () => {
    renderStepper('LOCKED');

    const current = screen.getByLabelText(/step 2: locked \(current\)/i);
    expect(current.style.boxShadow).not.toBe('none');

    // Non-current filled step should not glow
    const step1 = screen.getByLabelText(/step 1: draft/i);
    expect(step1.style.boxShadow).toBe('none');
  });

  test('has navigation aria-label', () => {
    renderStepper('DRAFT');

    expect(screen.getByRole('navigation', { name: /cycle progress/i })).toBeInTheDocument();
  });
});
