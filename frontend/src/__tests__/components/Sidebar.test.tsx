import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { mockUser, mockManagerUser } from '../mocks/handlers';

const mockLogout = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/context/AuthContext';
const mockedUseAuth = vi.mocked(useAuth);

function renderSidebar(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders app branding', () => {
    renderSidebar();

    expect(screen.getByText('ST6')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('Weekly Commits')).toBeInTheDocument();
  });

  test('renders nav items for MEMBER role', () => {
    renderSidebar();

    expect(screen.getByText('Weekly Planner')).toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    // MEMBER should not see Team Dashboard
    expect(screen.queryByText('Team Dashboard')).not.toBeInTheDocument();
  });

  test('renders Team Dashboard for MANAGER role', () => {
    mockedUseAuth.mockReturnValue({
      user: mockManagerUser,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
    });
    renderSidebar();

    expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
  });

  test('highlights active route', () => {
    renderSidebar('/reconcile');

    const reconcileLink = screen.getByText('Reconciliation').closest('a');
    expect(reconcileLink?.className).toContain('text-accent');
  });

  test('shows user display name and email', () => {
    renderSidebar();

    expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    expect(screen.getByText('bob@st6.com')).toBeInTheDocument();
  });

  test('shows user initials as avatar', () => {
    renderSidebar();

    // Bob Martinez → BM
    expect(screen.getByText('BM')).toBeInTheDocument();
  });

  test('calls logout on sign out click', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByText('Sign out'));

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  test('has sidebar aria-label', () => {
    renderSidebar();

    expect(screen.getByRole('complementary', { name: /sidebar/i })).toBeInTheDocument();
  });

  test('has main navigation aria-label', () => {
    renderSidebar();

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
