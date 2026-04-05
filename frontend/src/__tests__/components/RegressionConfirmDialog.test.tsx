import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegressionConfirmDialog } from '@/components/shared/RegressionConfirmDialog';

const defaultProps = {
  open: true,
  memberName: 'Bob Martinez',
  currentState: 'LOCKED' as const,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  submitting: false,
};

function renderDialog(overrides = {}) {
  return render(<RegressionConfirmDialog {...defaultProps} {...overrides} />);
}

describe('RegressionConfirmDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = renderDialog({ open: false });
    expect(container.innerHTML).toBe('');
  });

  test('renders member name and current state', () => {
    renderDialog();
    expect(screen.getByText(/Bob Martinez/)).toBeInTheDocument();
    expect(screen.getByText(/Locked/)).toBeInTheDocument();
  });

  test('confirm button is disabled when reason is empty', () => {
    renderDialog();
    const confirmBtn = screen.getByRole('button', { name: /regress/i });
    expect(confirmBtn).toBeDisabled();
  });

  test('confirm button is enabled when reason is entered', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/reason/i), 'Needs to add more commits');

    expect(screen.getByRole('button', { name: /regress/i })).toBeEnabled();
  });

  test('calls onConfirm with reason when submitted', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm });

    await user.type(screen.getByLabelText(/reason/i), 'Missing key deliverables');
    await user.click(screen.getByRole('button', { name: /regress/i }));

    expect(onConfirm).toHaveBeenCalledWith('Missing key deliverables');
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onCancel });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('closes on Escape key', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onCancel });

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('has accessible dialog role and labelling', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'regression-dialog-title');
  });

  test('shows submitting state', () => {
    renderDialog({ submitting: true });
    const btn = screen.getByRole('button', { name: /regressing/i });
    expect(btn).toBeDisabled();
  });
});
