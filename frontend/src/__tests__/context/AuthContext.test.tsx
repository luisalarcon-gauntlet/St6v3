import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const mockUser = {
  id: 'u1',
  email: 'bob@st6.com',
  displayName: 'Bob Martinez',
  role: 'MEMBER' as const,
  managerId: 'u2',
};

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.displayName : 'null'}</span>
      <button onClick={() => login('bob@st6.com', 'Password1!')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithAuth(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthContext', () => {
  test('provides null user when no cookie session', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json(null, { status: 401 });
      }),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('provides user after successful login', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json(null, { status: 401 });
      }),
      http.post('/api/v1/auth/login', () => {
        return HttpResponse.json(mockUser, { status: 200 });
      }),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Bob Martinez');
    });
  });

  test('clears user on logout', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json(mockUser, { status: 200 });
      }),
      http.post('/api/v1/auth/logout', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Bob Martinez');
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  test('resolves user from existing cookie on mount', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json(mockUser, { status: 200 });
      }),
    );

    renderWithAuth();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Bob Martinez');
  });
});
