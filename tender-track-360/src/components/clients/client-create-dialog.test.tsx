import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientCreateDialog } from './client-create-dialog';
import { createClient } from '@/server/clients';

// Mock the server action
jest.mock('@/server/clients', () => ({
  createClient: jest.fn(),
}));

/**
 * Polyfill for ResizeObserver which is needed by Radix UI
 */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ClientCreateDialog', () => {
  const mockOnClientCreated = jest.fn();
  const organizationId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue({
      success: true,
      client: { id: 'client-123', name: 'Test Client' },
    });
  });

  it('renders the trigger button initially', () => {
    render(
      <ClientCreateDialog
        organizationId={organizationId}
        onClientCreated={mockOnClientCreated}
      />
    );

    // Look for the default button (Plus icon)
    // It's a button with an icon.
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens validation form when triggered', async () => {
    render(
      <ClientCreateDialog
        organizationId={organizationId}
        onClientCreated={mockOnClientCreated}
      />
    );

    const user = userEvent.setup();
    // Assuming the first button is the trigger (or the only one)
    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);

    // Radix UI Dialog renders content in a portal.
    // We expect "Add New Client" title
    expect(await screen.findByText('Add New Client')).toBeInTheDocument();
  });

  it('should have a phone number field', async () => {
    render(
      <ClientCreateDialog
        organizationId={organizationId}
        onClientCreated={mockOnClientCreated}
      />
    );

    const user = userEvent.setup();
    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);

    expect(await screen.findByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('submits form with valid data including phone', async () => {
    render(
      <ClientCreateDialog
        organizationId={organizationId}
        onClientCreated={mockOnClientCreated}
      />
    );

    const user = userEvent.setup();
    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);

    const nameInput = await screen.findByLabelText(/client name/i);
    await user.type(nameInput, 'New Client LLC');

    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '123-456-7890');

    const submitBtn = screen.getByRole('button', { name: /create client/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createClient).toHaveBeenCalledWith(
        organizationId,
        expect.objectContaining({
          name: 'New Client LLC',
          contactPhone: '123-456-7890',
        })
      );
    });
  });
});
