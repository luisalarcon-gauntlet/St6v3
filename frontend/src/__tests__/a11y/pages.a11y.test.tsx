import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  mockUser,
  mockManagerUser,
  mockCycleDraft,
  mockCycleReconciling,
  mockRcdoTree,
  mockTeamPage,
} from '../mocks/handlers';
import { AuthProvider } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { WeeklyPlannerPage } from '@/pages/WeeklyPlannerPage';
import { ReconciliationPage } from '@/pages/ReconciliationPage';
import { ManagerDashboardPage } from '@/pages/ManagerDashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('Accessibility: LoginPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Not authenticated' },
          { status: 401 },
        ),
      ),
    );
  });

  test('has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: WeeklyPlannerPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockUser)),
      http.get('/api/v1/cycles/current', () => HttpResponse.json(mockCycleDraft)),
      http.get('/api/v1/rcdo/tree', () => HttpResponse.json(mockRcdoTree)),
    );
  });

  test('has no a11y violations', async () => {
    const { container } = renderWithProviders(<WeeklyPlannerPage />);
    await waitFor(() => {
      expect(screen.getByText('Weekly Planner')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: ReconciliationPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockUser)),
      http.get('/api/v1/cycles/current', () => HttpResponse.json(mockCycleReconciling)),
      http.get('/api/v1/rcdo/tree', () => HttpResponse.json(mockRcdoTree)),
    );
  });

  test('has no a11y violations', async () => {
    const { container } = renderWithProviders(<ReconciliationPage />);
    await waitFor(() => {
      expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: ManagerDashboardPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockManagerUser)),
      http.get('/api/v1/manager/team', () => HttpResponse.json(mockTeamPage)),
    );
  });

  test('has no a11y violations', async () => {
    const { container } = renderWithProviders(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: HistoryPage', () => {
  test('has no a11y violations', async () => {
    const { container } = renderWithProviders(<HistoryPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: UnauthorizedPage', () => {
  test('has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
