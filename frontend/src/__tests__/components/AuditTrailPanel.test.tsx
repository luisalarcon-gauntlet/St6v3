import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuditTrailPanel } from '@/components/manager/AuditTrailPanel';

describe('AuditTrailPanel', () => {
  test('renders audit entries with actor names and actions', async () => {
    render(<AuditTrailPanel cycleId="cycle-bob" />);

    await waitFor(() => {
      expect(screen.getByText(/Regressed to Draft/)).toBeInTheDocument();
    });

    expect(screen.getByText(/by Alice Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Locked week/)).toBeInTheDocument();
    expect(screen.getByText(/by Bob Martinez/)).toBeInTheDocument();
  });

  test('shows reason detail when present', async () => {
    render(<AuditTrailPanel cycleId="cycle-bob" />);

    await waitFor(() => {
      expect(screen.getByText(/Needs to re-plan commitments/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no audit entries exist', async () => {
    server.use(
      http.get('/api/v1/manager/cycles/:cycleId/audit', () => {
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        });
      }),
    );

    render(<AuditTrailPanel cycleId="cycle-bob" />);

    await waitFor(() => {
      expect(screen.getByText(/No audit events recorded yet/)).toBeInTheDocument();
    });
  });

  test('shows loading skeleton initially', () => {
    render(<AuditTrailPanel cycleId="cycle-bob" />);

    expect(screen.getByTestId('audit-loading')).toBeInTheDocument();
  });
});
