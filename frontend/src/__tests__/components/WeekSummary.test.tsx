import { render, screen } from '@testing-library/react';
import { WeekSummary } from '@/components/planner/WeekSummary';
import type { WeeklyCommit } from '@/types/domain';
import { mockCommit, mockCommit2, mockCommit3 } from '../mocks/handlers';

function renderSummary(commits: WeeklyCommit[]) {
  return render(<WeekSummary commits={commits} />);
}

describe('WeekSummary', () => {
  test('displays commitment count', () => {
    renderSummary([mockCommit, mockCommit2, mockCommit3]);

    expect(screen.getByText('Commitments')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('displays total planned hours', () => {
    // mockCommit=20h, mockCommit2=4h, mockCommit3=6h → 30h
    renderSummary([mockCommit, mockCommit2, mockCommit3]);

    expect(screen.getByText('Planned Hours')).toBeInTheDocument();
    expect(screen.getByText('30h')).toBeInTheDocument();
  });

  test('shows dash when no actuals are recorded', () => {
    // All mock commits have actualHours: null
    renderSummary([mockCommit, mockCommit2, mockCommit3]);

    expect(screen.getByText('Actual Hours')).toBeInTheDocument();
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  test('displays actual hours when present', () => {
    const withActuals: WeeklyCommit[] = [
      { ...mockCommit, actualHours: 18 },
      { ...mockCommit2, actualHours: 3 },
      { ...mockCommit3, actualHours: 5 },
    ];
    renderSummary(withActuals);

    expect(screen.getByText('26h')).toBeInTheDocument();
  });

  test('shows actuals when at least one commit has actual hours', () => {
    const mixed: WeeklyCommit[] = [
      { ...mockCommit, actualHours: 10 },
      { ...mockCommit2, actualHours: null },
    ];
    renderSummary(mixed);

    // 10 + 0 = 10h (null treated as 0 in sum)
    expect(screen.getByText('10h')).toBeInTheDocument();
  });

  test('displays zero commitments for empty array', () => {
    renderSummary([]);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0h')).toBeInTheDocument();
  });

  test('uses semantic dl/dt/dd structure', () => {
    const { container } = renderSummary([mockCommit]);

    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(3);
    expect(container.querySelectorAll('dd')).toHaveLength(3);
  });
});
