import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider } from '@/context/AuthContext';
import { RCDOAdminPage } from '@/pages/RCDOAdminPage';
import { mockRcdoTree } from '../mocks/handlers';

const mockAdminUser = {
  id: 'user-admin',
  email: 'dave@st6.com',
  displayName: 'Dave Kim',
  role: 'ADMIN' as const,
  managerId: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RCDOAdminPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RCDOAdminPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(mockAdminUser)),
      http.get('/api/v1/rcdo/tree', () => HttpResponse.json(mockRcdoTree)),
    );
  });

  test('displays page heading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('RCDO Management')).toBeInTheDocument();
    });
  });

  test('renders the full RCDO tree', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });
    expect(screen.getByText('Reduce onboarding time by 50%')).toBeInTheDocument();
    expect(screen.getByText('Self-serve onboarding flow live')).toBeInTheDocument();
  });

  test('shows create rally cry button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rally cry/i })).toBeInTheDocument();
    });
  });

  test('clicking a title enters inline edit mode', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Accelerate Enterprise Adoption'));

    await waitFor(() => {
      expect(screen.getByLabelText('Edit title')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Edit title')).toHaveValue('Accelerate Enterprise Adoption');
  });

  test('pressing Escape cancels inline editing', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Accelerate Enterprise Adoption'));
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByLabelText('Edit title')).not.toBeInTheDocument();
    });
  });

  test('create rally cry button triggers API call', async () => {
    let createCalled = false;
    server.use(
      http.post('/api/v1/rally-cries', () => {
        createCalled = true;
        return HttpResponse.json(
          {
            id: 'rc-new',
            title: 'New Rally Cry',
            description: '',
            status: 'ACTIVE',
            displayOrder: 99,
            definingObjectives: [],
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('RCDO Management')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /rally cry/i }));

    await waitFor(() => {
      expect(createCalled).toBe(true);
    });
  });

  test('archive button is shown for each item', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByRole('button', { name: /^archive /i });
    expect(archiveButtons.length).toBeGreaterThan(0);
  });

  test('archive rally cry triggers API call', async () => {
    let archiveCalled = false;
    server.use(
      http.delete('/api/v1/rally-cries/:id', () => {
        archiveCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });

    const archiveBtn = screen.getByRole('button', {
      name: /archive Accelerate Enterprise Adoption/i,
    });
    await user.click(archiveBtn);

    await waitFor(() => {
      expect(archiveCalled).toBe(true);
    });
  });

  test('shows add objective and add outcome buttons', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Accelerate Enterprise Adoption')).toBeInTheDocument();
    });

    expect(screen.getAllByText('+ Defining Objective').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+ Outcome').length).toBeGreaterThan(0);
  });

  test('shows empty state when no items', async () => {
    server.use(http.get('/api/v1/rcdo/tree', () => HttpResponse.json([])));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no rcdo items yet/i)).toBeInTheDocument();
    });
  });
});
