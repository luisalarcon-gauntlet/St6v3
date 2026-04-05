import { render, screen } from '@testing-library/react';
import { TeamMemberCard } from '@/components/manager/TeamMemberCard';
import {
  mockTeamMemberBob,
  mockTeamMemberCarol,
  mockTeamMemberNoCycle,
} from '../mocks/handlers';

describe('TeamMemberCard', () => {
  test('displays team member name and email', () => {
    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={vi.fn()} />);

    expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    expect(screen.getByText('bob@st6.com')).toBeInTheDocument();
  });

  test('displays current cycle state when cycle exists', () => {
    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={vi.fn()} />);

    expect(screen.getByText(/reconciled/i)).toBeInTheDocument();
  });

  test('displays locked state for locked cycle', () => {
    render(<TeamMemberCard member={mockTeamMemberCarol} onSelect={vi.fn()} />);

    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });

  test('displays no cycle message when member has no cycle', () => {
    render(<TeamMemberCard member={mockTeamMemberNoCycle} onSelect={vi.fn()} />);

    expect(screen.getByText(/no cycle/i)).toBeInTheDocument();
  });

  test('displays commit count when cycle exists', () => {
    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={vi.fn()} />);

    // Bob has 3 commits
    expect(screen.getByText(/3 commits/i)).toBeInTheDocument();
  });

  test('displays total planned hours when cycle exists', () => {
    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={vi.fn()} />);

    // 20 + 4 + 6 = 30 hours
    expect(screen.getByText(/30\s*h/i)).toBeInTheDocument();
  });

  test('calls onSelect when card is clicked', async () => {
    const onSelect = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /view bob martinez/i }));
    expect(onSelect).toHaveBeenCalledWith('user-bob');
  });

  test('shows review badge when cycle has been reviewed', () => {
    const reviewedMember = {
      ...mockTeamMemberBob,
      currentCycle: {
        ...mockTeamMemberBob.currentCycle!,
        reviewedAt: '2026-04-04T18:00:00Z',
        reviewerId: 'user-alice',
        reviewerNotes: 'Great work this week!',
      },
    };

    render(<TeamMemberCard member={reviewedMember} onSelect={vi.fn()} />);

    expect(screen.getByText(/reviewed/i)).toBeInTheDocument();
  });

  test('card has transition classes for CSS animations', () => {
    render(<TeamMemberCard member={mockTeamMemberBob} onSelect={vi.fn()} />);

    const card = screen.getByRole('button', { name: /view bob martinez/i });
    expect(card.className).toContain('transition');
  });
});
