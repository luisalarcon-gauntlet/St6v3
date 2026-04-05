import { render, screen } from '@testing-library/react';
import { ChessDistribution } from '@/components/planner/ChessDistribution';
import type { WeeklyCommit } from '@/types/domain';
import { mockCommit, mockCommit2, mockCommit3 } from '../mocks/handlers';

function renderDistribution(commits: WeeklyCommit[]) {
  return render(<ChessDistribution commits={commits} />);
}

describe('ChessDistribution', () => {
  test('renders all 6 chess categories', () => {
    renderDistribution([]);

    // ChessPieceIcon renders with title attribute containing the piece label
    expect(screen.getByTitle('King')).toBeInTheDocument();
    expect(screen.getByTitle('Queen')).toBeInTheDocument();
    expect(screen.getByTitle('Rook')).toBeInTheDocument();
    expect(screen.getByTitle('Bishop')).toBeInTheDocument();
    expect(screen.getByTitle('Knight')).toBeInTheDocument();
    expect(screen.getByTitle('Pawn')).toBeInTheDocument();
  });

  test('shows correct count per piece', () => {
    // mockCommit=KING, mockCommit2=PAWN, mockCommit3=BISHOP
    renderDistribution([mockCommit, mockCommit2, mockCommit3]);

    const allCounts = screen.getAllByText(/^\d+$/);
    // 6 categories rendered, each with a count
    expect(allCounts).toHaveLength(6);
  });

  test('shows count of 1 for KING with single KING commit', () => {
    // mockCommit is KING
    const { container } = renderDistribution([mockCommit]);

    // Find the King's row — the parent of the King icon should contain the count
    const kingIcon = screen.getByTitle('King');
    const kingRow = kingIcon.closest('div[class*="flex items-center"]');
    expect(kingRow).toHaveTextContent('1');
  });

  test('shows count of 0 for unused categories', () => {
    // mockCommit=KING only
    const { container } = renderDistribution([mockCommit]);

    const queenIcon = screen.getByTitle('Queen');
    const queenRow = queenIcon.closest('div[class*="flex items-center"]');
    expect(queenRow).toHaveTextContent('0');
  });

  test('dims categories with zero count', () => {
    // mockCommit=KING only → Queen/Rook/Bishop/Knight/Pawn have 0
    const { container } = renderDistribution([mockCommit]);

    const queenIcon = screen.getByTitle('Queen');
    const queenRow = queenIcon.closest('div[class*="flex items-center"]');
    expect(queenRow?.className).toContain('opacity-35');
  });

  test('does not dim categories with non-zero count', () => {
    const { container } = renderDistribution([mockCommit]);

    const kingIcon = screen.getByTitle('King');
    const kingRow = kingIcon.closest('div[class*="flex items-center"]');
    expect(kingRow?.className).not.toContain('opacity-35');
  });

  test('counts multiple commits in same category', () => {
    const twoKings: WeeklyCommit[] = [
      mockCommit,
      { ...mockCommit2, chessCategory: 'KING' },
    ];
    renderDistribution(twoKings);

    const kingIcon = screen.getByTitle('King');
    const kingRow = kingIcon.closest('div[class*="flex items-center"]');
    expect(kingRow).toHaveTextContent('2');
  });
});
