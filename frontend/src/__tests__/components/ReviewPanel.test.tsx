import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewPanel } from '@/components/manager/ReviewPanel';
import { mockCycleReconciled, mockCycleDraft } from '../mocks/handlers';

describe('ReviewPanel', () => {
  const defaultProps = {
    cycle: mockCycleReconciled,
    onSubmitReview: vi.fn().mockResolvedValue(undefined),
    submitting: false,
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders review form for reconciled cycle', () => {
    render(<ReviewPanel {...defaultProps} />);

    expect(screen.getByLabelText(/review notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  test('shows message when cycle is not reviewable', () => {
    render(<ReviewPanel {...defaultProps} cycle={mockCycleDraft} />);

    expect(screen.getByText(/cannot review/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/review notes/i)).not.toBeInTheDocument();
  });

  test('disables submit button when notes are empty', () => {
    render(<ReviewPanel {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /submit review/i });
    expect(submitBtn).toBeDisabled();
  });

  test('enables submit button when notes are entered', async () => {
    const user = userEvent.setup();
    render(<ReviewPanel {...defaultProps} />);

    await user.type(screen.getByLabelText(/review notes/i), 'Great work this week');

    const submitBtn = screen.getByRole('button', { name: /submit review/i });
    expect(submitBtn).toBeEnabled();
  });

  test('shows confirmation dialog before submitting', async () => {
    const user = userEvent.setup();
    render(<ReviewPanel {...defaultProps} />);

    await user.type(screen.getByLabelText(/review notes/i), 'Good progress');
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    // Confirmation dialog should appear
    expect(screen.getByText(/confirm review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('canceling confirmation does not submit', async () => {
    const onSubmitReview = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReviewPanel {...defaultProps} onSubmitReview={onSubmitReview} />);

    await user.type(screen.getByLabelText(/review notes/i), 'Good progress');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onSubmitReview).not.toHaveBeenCalled();
  });

  test('confirming calls onSubmitReview with cycle id and notes', async () => {
    const onSubmitReview = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReviewPanel {...defaultProps} onSubmitReview={onSubmitReview} />);

    await user.type(screen.getByLabelText(/review notes/i), 'Excellent week!');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onSubmitReview).toHaveBeenCalledWith('cycle-bob', 'Excellent week!');
  });

  test('shows submitting state while review is being sent', () => {
    render(<ReviewPanel {...defaultProps} submitting={true} />);

    const submitBtn = screen.getByRole('button', { name: /submitting/i });
    expect(submitBtn).toBeDisabled();
  });

  test('displays existing review when cycle has been reviewed', () => {
    const reviewedCycle = {
      ...mockCycleReconciled,
      reviewedAt: '2026-04-04T18:00:00Z',
      reviewerId: 'user-alice',
      reviewerNotes: 'Great work this week!',
    };

    render(<ReviewPanel {...defaultProps} cycle={reviewedCycle} />);

    expect(screen.getByText('Great work this week!')).toBeInTheDocument();
    expect(screen.getByText(/already reviewed/i)).toBeInTheDocument();
  });

  test('shows commit summary in review context', () => {
    render(<ReviewPanel {...defaultProps} />);

    // Should show commits for context
    expect(screen.getByText('Build onboarding wizard')).toBeInTheDocument();
  });

  test('shows completion status for each commit', () => {
    render(<ReviewPanel {...defaultProps} />);

    // Bob's commits: COMPLETED, COMPLETED, IN_PROGRESS
    expect(screen.getAllByText(/completed/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });
});
