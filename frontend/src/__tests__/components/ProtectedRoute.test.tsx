import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import type { User } from '@/types/domain';
import type { ReactNode } from 'react';

// Mock AuthContext so we can control user/loading state directly
const mockAuthState = {
  user: null as User | null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

function renderWithRouter(element: ReactNode, initialRoute = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/protected" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

const memberUser: User = {
  id: 'u1',
  email: 'bob@st6.com',
  displayName: 'Bob Martinez',
  role: 'MEMBER',
  managerId: 'u2',
};

const managerUser: User = {
  id: 'u2',
  email: 'alice@st6.com',
  displayName: 'Alice Chen',
  role: 'MANAGER',
  managerId: null,
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.loading = false;
  });

  test('renders children when user has required role', () => {
    mockAuthState.user = memberUser;

    renderWithRouter(
      <ProtectedRoute allowedRoles={['MEMBER', 'MANAGER', 'ADMIN']}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    mockAuthState.user = null;

    renderWithRouter(
      <ProtectedRoute allowedRoles={['MEMBER']}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('redirects to unauthorized when role insufficient', () => {
    mockAuthState.user = memberUser;

    renderWithRouter(
      <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
        <div>Manager Content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText('Manager Content')).not.toBeInTheDocument();
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  test('shows loading skeleton while auth is resolving', () => {
    mockAuthState.loading = true;

    renderWithRouter(
      <ProtectedRoute allowedRoles={['MEMBER']}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  test('manager role can access manager-only routes', () => {
    mockAuthState.user = managerUser;

    renderWithRouter(
      <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
        <div>Manager Dashboard</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
  });
});
