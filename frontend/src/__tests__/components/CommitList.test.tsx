import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommitList } from '@/components/commits/CommitList';
import { mockCommit, mockCommit2, mockCommit3, mockRcdoTree } from '../mocks/handlers';
import type { WeeklyCommit } from '@/types/domain';

const defaultProps = {
  commits: [mockCommit, mockCommit2, mockCommit3] as WeeklyCommit[],
  rcdoTree: mockRcdoTree,
  loading: false,
  cycleState: 'DRAFT' as const,
  onDelete: vi.fn(),
  onReconcile: vi.fn(),
};

function renderList(overrides = {}) {
  return render(<CommitList {...defaultProps} {...overrides} />);
}

describe('CommitList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders loading skeleton while fetching', () => {
    renderList({ loading: true, commits: [] });
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  test('renders empty state when no commits', () => {
    renderList({ commits: [] });
    expect(screen.getByText(/no commits yet/i)).toBeInTheDocument();
  });

  test('renders commit cards with correct data', () => {
    renderList();

    expect(screen.getByText('Build onboarding wizard')).toBeInTheDocument();
    expect(screen.getByText('Update API docs')).toBeInTheDocument();
    expect(screen.getByText('Review pricing page designs')).toBeInTheDocument();
  });

  test('shows chess piece icon on each card', () => {
    renderList();

    // Each card should show its chess category
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);

    // First card is KING
    expect(within(cards[0]).getByText(/king/i)).toBeInTheDocument();
    // Second card is PAWN
    expect(within(cards[1]).getByText(/pawn/i)).toBeInTheDocument();
    // Third card is BISHOP
    expect(within(cards[2]).getByText(/bishop/i)).toBeInTheDocument();
  });

  test('shows planned hours on each card', () => {
    renderList();
    expect(screen.getByText(/20\s*h/i)).toBeInTheDocument();
    expect(screen.getByText(/4\s*h/i)).toBeInTheDocument();
    expect(screen.getByText(/6\s*h/i)).toBeInTheDocument();
  });

  test('shows outcome name on cards', () => {
    renderList();
    expect(screen.getByText('Self-serve onboarding flow live')).toBeInTheDocument();
  });

  test('delete button shows confirmation dialog', async () => {
    const user = userEvent.setup();
    renderList();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('confirming delete calls onDelete with commit id', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderList({ onDelete });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledWith('commit-1');
  });

  test('canceling delete does not call onDelete', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderList({ onDelete });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  test('hides delete button when cycle is not DRAFT', () => {
    renderList({ cycleState: 'LOCKED' });
    expect(screen.queryAllByRole('button', { name: /delete/i })).toHaveLength(0);
  });

  test('cards have transition classes for CSS animations', () => {
    renderList();
    const cards = screen.getAllByRole('article');
    cards.forEach((card) => {
      expect(card.className).toContain('transition');
    });
  });
});
