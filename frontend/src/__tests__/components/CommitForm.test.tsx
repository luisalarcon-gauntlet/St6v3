import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommitForm } from '@/components/commits/CommitForm';
import { mockRcdoTree } from '../mocks/handlers';

const defaultProps = {
  cycleId: 'cycle-1',
  rcdoTree: mockRcdoTree,
  onSubmit: vi.fn().mockResolvedValue(undefined),
  existingChessCategories: [] as string[],
};

function renderForm(overrides = {}) {
  return render(<CommitForm {...defaultProps} {...overrides} />);
}

describe('CommitForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows inline error when title is empty on submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /add commit/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  test('shows inline error when title exceeds 200 chars', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'x'.repeat(201));
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    expect(screen.getByText(/title must be 200 characters or fewer/i)).toBeInTheDocument();
  });

  test('shows inline error when planned hours > 80', async () => {
    const user = userEvent.setup();
    renderForm();

    // Type into title first so we can isolate the hours error
    await user.type(screen.getByLabelText(/title/i), 'Valid title');

    const hoursInput = screen.getByLabelText(/planned hours/i);
    await user.type(hoursInput, '81');

    // Click somewhere neutral first, then submit
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    await waitFor(() => {
      expect(screen.getByText(/hours must be between 0 and 80/i)).toBeInTheDocument();
    });
  });

  test('requires outcome selection', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Valid title');
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    expect(screen.getByText(/outcome is required/i)).toBeInTheDocument();
  });

  test('requires chess category selection', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Valid title');
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    expect(screen.getByText(/chess category is required/i)).toBeInTheDocument();
  });

  test('submits valid form and calls onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm({ onSubmit });

    // Fill title
    await user.type(screen.getByLabelText(/title/i), 'Build onboarding flow');

    // Fill description
    await user.type(screen.getByLabelText(/description/i), 'Multi-step wizard');

    // Fill hours
    const hoursInput = screen.getByLabelText(/planned hours/i);
    await user.clear(hoursInput);
    await user.type(hoursInput, '15');

    // Select chess piece
    await user.click(screen.getByRole('radio', { name: /queen/i }));

    // Open RCDO tree and select an outcome
    await user.click(screen.getByRole('button', { name: /select outcome/i }));
    await user.click(screen.getByText('Self-serve onboarding flow live'));

    // Submit
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Build onboarding flow',
        description: 'Multi-step wizard',
        plannedHours: 15,
        chessCategory: 'QUEEN',
        outcomeId: 'outcome-1',
      });
    });
  });

  test('chess piece picker has aria-label on each option', () => {
    renderForm();

    const pieces = ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'];
    for (const piece of pieces) {
      expect(screen.getByRole('radio', { name: new RegExp(piece, 'i') })).toBeInTheDocument();
    }
  });

  test('RCDO tree picker has role=tree and aria-expanded', async () => {
    const user = userEvent.setup();
    renderForm();

    const trigger = screen.getByRole('button', { name: /select outcome/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  test('warns when KING is already used this week', () => {
    renderForm({ existingChessCategories: ['KING'] });

    const kingRadio = screen.getByRole('radio', { name: /king/i });
    expect(kingRadio).toBeDisabled();
  });

  test('clears form after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/title/i), 'Build onboarding flow');
    await user.type(screen.getByLabelText(/description/i), 'Wizard');
    const hoursInput = screen.getByLabelText(/planned hours/i);
    await user.clear(hoursInput);
    await user.type(hoursInput, '15');
    await user.click(screen.getByRole('radio', { name: /queen/i }));
    await user.click(screen.getByRole('button', { name: /select outcome/i }));
    await user.click(screen.getByText('Self-serve onboarding flow live'));
    await user.click(screen.getByRole('button', { name: /add commit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });
});
