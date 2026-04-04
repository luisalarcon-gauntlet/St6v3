import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  mockCycleDraft,
  mockRcdoTree,
  mockUser,
  mockCommit,
  mockCommit2,
  mockCommit3,
} from '../mocks/handlers';
import { AuthProvider } from '@/context/AuthContext';
import { WeeklyPlannerPage } from '@/pages/WeeklyPlannerPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <WeeklyPlannerPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('WeeklyPlannerPage', () => {
  beforeEach(() => {
    // Default handlers return authenticated user, draft cycle, and RCDO tree
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockUser)),
      http.get('/api/v1/cycles/current', () => HttpResponse.json(mockCycleDraft)),
      http.get('/api/v1/rcdo/tree', () => HttpResponse.json(mockRcdoTree)),
    );
  });

  test('displays current cycle state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });
  });

  test('displays week start date', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/mar 30/i)).toBeInTheDocument();
    });
  });

  test('renders existing commits', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(mockCommit.title)).toBeInTheDocument();
    });
    expect(screen.getByText(mockCommit2.title)).toBeInTheDocument();
    expect(screen.getByText(mockCommit3.title)).toBeInTheDocument();
  });

  test('shows commit form in DRAFT state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
  });

  test('hides commit form in non-DRAFT state', async () => {
    server.use(
      http.get('/api/v1/cycles/current', () =>
        HttpResponse.json({ ...mockCycleDraft, state: 'LOCKED' }),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/locked/i)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  test('lock button validates before transitioning', async () => {
    // Cycle with fewer than 3 commits — lock should fail
    server.use(
      http.get('/api/v1/cycles/current', () =>
        HttpResponse.json({
          ...mockCycleDraft,
          commits: [mockCommit], // only 1 commit
        }),
      ),
      http.post('/api/v1/cycles/:id/lock', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Validation Failed',
            status: 422,
            detail: 'At least 3 commits are required to lock',
            violations: [],
          },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(mockCommit.title)).toBeInTheDocument();
    });

    const lockBtn = screen.getByRole('button', { name: /lock/i });
    await user.click(lockBtn);

    await waitFor(() => {
      expect(screen.getByText(/at least 3 commits/i)).toBeInTheDocument();
    });
  });

  test('shows validation errors from lock attempt', async () => {
    server.use(
      http.post('/api/v1/cycles/:id/lock', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Validation Failed',
            status: 422,
            detail: 'Exactly one KING commit is required',
            violations: [],
          },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(mockCommit.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /lock/i }));

    await waitFor(() => {
      expect(screen.getByText(/exactly one king/i)).toBeInTheDocument();
    });
  });

  test('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
