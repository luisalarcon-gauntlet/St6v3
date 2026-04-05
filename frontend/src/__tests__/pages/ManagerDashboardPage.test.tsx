import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider } from '@/context/AuthContext';
import { ManagerDashboardPage } from '@/pages/ManagerDashboardPage';
import {
  mockManagerUser,
  mockTeamPage,
  mockTeamMemberBob,
  mockCycleReconciled,
} from '../mocks/handlers';

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ManagerDashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ManagerDashboardPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockManagerUser)),
      http.get('/api/v1/manager/team', () => HttpResponse.json(mockTeamPage)),
      http.get('/api/v1/manager/team/:userId', () => HttpResponse.json(mockTeamMemberBob)),
    );
  });

  test('displays page heading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
    });
  });

  test('shows team members grid', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });
    expect(screen.getByText('Carol Nguyen')).toBeInTheDocument();
  });

  test('clicking a team member shows their detail view', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('article');
    await user.click(cards[0]);

    await waitFor(() => {
      // Detail view should show member info
      expect(screen.getByText('bob@st6.com')).toBeInTheDocument();
    });

    // Should show commits in review panel
    expect(screen.getByText('Build onboarding wizard')).toBeInTheDocument();
  });

  test('shows back button when viewing member detail', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('article');
    await user.click(cards[0]);

    await waitFor(() => {
      expect(screen.getByText(/back to team/i)).toBeInTheDocument();
    });
  });

  test('clicking back returns to team grid', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('article');
    await user.click(cards[0]);

    await waitFor(() => {
      expect(screen.getByText(/back to team/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/back to team/i));

    await waitFor(() => {
      expect(screen.getByText('Carol Nguyen')).toBeInTheDocument();
    });
  });

  test('review can be submitted from detail view', async () => {
    let reviewSubmitted = false;

    server.use(
      http.post('/api/v1/manager/reviews/:cycleId', async () => {
        reviewSubmitted = true;
        return HttpResponse.json({
          ...mockCycleReconciled,
          reviewedAt: new Date().toISOString(),
          reviewerId: 'user-alice',
          reviewerNotes: 'Nice work',
          version: 3,
        });
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('article');
    await user.click(cards[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/review notes/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/review notes/i), 'Nice work');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(reviewSubmitted).toBe(true);
    });
  });
});
