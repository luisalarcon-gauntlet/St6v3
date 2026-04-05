import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TeamGrid } from '@/components/manager/TeamGrid';
import {
  mockManagerUser,
  mockTeamPage,
} from '../mocks/handlers';

function renderGrid(overrides: { onSelectMember?: (id: string) => void } = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TeamGrid onSelectMember={overrides.onSelectMember ?? vi.fn()} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('TeamGrid', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockManagerUser)),
      http.get('/api/v1/manager/team', () => HttpResponse.json(mockTeamPage)),
    );
  });

  test('renders loading skeleton while fetching', () => {
    renderGrid();
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  test('renders team members after loading', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });
    expect(screen.getByText('Carol Nguyen')).toBeInTheDocument();
  });

  test('renders empty state when no team members', async () => {
    server.use(
      http.get('/api/v1/manager/team', () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        }),
      ),
    );

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText(/no team members/i)).toBeInTheDocument();
    });
  });

  test('displays error state on API failure', async () => {
    server.use(
      http.get('/api/v1/manager/team', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Forbidden', status: 403, detail: 'Access denied' },
          { status: 403 },
        ),
      ),
    );

    renderGrid();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('shows pagination when multiple pages exist', async () => {
    server.use(
      http.get('/api/v1/manager/team', () =>
        HttpResponse.json({
          ...mockTeamPage,
          totalPages: 3,
          totalElements: 50,
        }),
      ),
    );

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  test('hides pagination when only one page', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  test('calls onSelectMember when a card is clicked', async () => {
    const onSelectMember = vi.fn();
    const user = userEvent.setup();

    renderGrid({ onSelectMember });

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    const cards = screen.getAllByRole('button', { name: /view .+? weekly commitments/i });
    await user.click(cards[0]);

    expect(onSelectMember).toHaveBeenCalledWith('user-bob');
  });

  test('navigates to next page on next button click', async () => {
    const user = userEvent.setup();
    let requestedPage = 0;

    server.use(
      http.get('/api/v1/manager/team', ({ request }) => {
        const url = new URL(request.url);
        requestedPage = Number(url.searchParams.get('page') ?? 0);
        return HttpResponse.json({
          ...mockTeamPage,
          number: requestedPage,
          totalPages: 3,
          totalElements: 50,
        });
      }),
    );

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(requestedPage).toBe(1);
    });
  });

  test('displays page info text', async () => {
    server.use(
      http.get('/api/v1/manager/team', () =>
        HttpResponse.json({
          ...mockTeamPage,
          totalPages: 3,
          totalElements: 50,
        }),
      ),
    );

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });
  });
});
