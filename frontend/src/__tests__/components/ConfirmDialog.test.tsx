import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const defaultProps = {
  open: true,
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

function renderDialog(overrides = {}) {
  return render(<ConfirmDialog {...defaultProps} {...overrides} />);
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = renderDialog({ open: false });
    expect(container.innerHTML).toBe('');
  });

  test('renders title and message when open', () => {
    renderDialog();
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  test('has cancel and confirm buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm });

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onCancel });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('supports custom button labels', () => {
    renderDialog({ confirmLabel: 'Yes, delete', cancelLabel: 'No, keep it' });
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument();
  });

  test('has role=dialog and aria-modal', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('dialog is labelled by title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(screen.getByText('Delete Item').id).toBe('confirm-dialog-title');
  });

  test('closes on Escape key', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onCancel });

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
