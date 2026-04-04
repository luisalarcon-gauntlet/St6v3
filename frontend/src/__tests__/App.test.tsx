import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    // Reset URL to root so BrowserRouter starts fresh
    window.history.pushState({}, '', '/');
  });

  it('redirects to login when not authenticated', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json(null, { status: 401 });
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  it('shows app shell when authenticated', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json({
          id: 'u1',
          email: 'bob@st6.com',
          displayName: 'Bob Martinez',
          role: 'MEMBER',
          managerId: 'u2',
        });
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    });
  });
});
