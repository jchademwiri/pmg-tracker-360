/**
 * @bun-test-environment jsdom
 */

/**
 * Basic tests for CreateorganizationForm component
 * These tests focus on form rendering, validation, and user interactions
 * without complex mocking of external dependencies
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateOrganizationForm } from '../create-organization-form';

// Mock the external dependencies with simple implementations
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      create: jest.fn().mockResolvedValue({}),
      checkSlug: jest.fn().mockResolvedValue({ data: { status: true } }),
    },
  },
}));

describe('CreateorganizationForm - Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders all required form fields', () => {
      render(<CreateOrganizationForm />);

      // Check for form fields
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/logo url/i)).toBeInTheDocument();

      // Check for submit button
      expect(
        screen.getByRole('button', { name: /create organization/i })
      ).toBeInTheDocument();
    });

    it('shows proper placeholders', () => {
      render(<CreateOrganizationForm />);

      expect(
        screen.getByPlaceholderText(/enter your organization name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/organization-slug/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/https:\/\/example\.com\/logo\.png/i)
      ).toBeInTheDocument();
    });

    it('shows form descriptions', () => {
      render(<CreateOrganizationForm />);

      expect(
        screen.getByText(/this will be the display name for your organization/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /only lowercase letters, numbers, and hyphens allowed/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/provide a url to your organization's logo image/i)
      ).toBeInTheDocument();
    });

    it('disables submit button initially', () => {
      render(<CreateOrganizationForm />);

      const submitButton = screen.getByRole('button', {
        name: /create organization/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Slug Generation', () => {
    it('auto-generates slug from organization name', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      const slugInput = screen.getByLabelText(/organization slug/i);

      await user.type(nameInput, 'My Test Organization');

      // The slug should be auto-generated
      expect(slugInput).toHaveValue('my-test-organization');
    });

    it('handles special characters in name correctly', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      const slugInput = screen.getByLabelText(/organization slug/i);

      await user.type(nameInput, 'Test & Organisation @ 2024!');

      // Special characters should be converted to hyphens
      expect(slugInput).toHaveValue('test-organization-2024');
    });

    it('shows URL preview when slug is entered', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      await user.type(nameInput, 'Test Org');

      // Should show URL preview
      expect(screen.getByText('/organization/test-org')).toBeInTheDocument();
    });

    it('allows manual slug editing', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      const editButton = screen.getByRole('button', { name: /edit/i });

      await user.type(nameInput, 'Test Organization');
      await user.click(editButton);

      const slugInput = screen.getByLabelText(/organization slug/i);
      expect(slugInput).not.toBeDisabled();

      await user.clear(slugInput);
      await user.type(slugInput, 'custom-slug');

      expect(slugInput).toHaveValue('custom-slug');
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for short organization name', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);

      await user.type(nameInput, 'A');

      // Wait for validation to trigger on change
      await waitFor(() => {
        expect(
          screen.getByText(/organization name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid characters in name', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);

      await user.type(nameInput, 'Test@#$%');

      // Wait for validation to trigger on change
      await waitFor(() => {
        expect(
          screen.getByText(
            /can only contain letters, numbers, spaces, hyphens, and underscores/i
          )
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid logo URL', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const logoInput = screen.getByLabelText(/logo url/i);

      // Clear the default logo value first
      await user.clear(logoInput);
      await user.type(logoInput, 'invalid-url');

      // Wait for validation to trigger on change
      await waitFor(() => {
        expect(
          screen.getByText(/logo must be a valid url/i)
        ).toBeInTheDocument();
      });
    });

    it('accepts valid logo URL', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      const logoInput = screen.getByLabelText(/logo url/i);

      await user.type(logoInput, 'https://example.com/logo.png');
      await user.tab();

      // Should not show validation error
      expect(
        screen.queryByText(/logo must be a valid url/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CreateOrganizationForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/organization name/i)).toHaveFocus();

      await user.tab();
      // The slug input is disabled by default, so focus goes to the edit button
      expect(screen.getByRole('button', { name: /edit/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/logo url/i)).toHaveFocus();
    });

    it('shows loading state when form is being submitted', async () => {
      const user = userEvent.setup();

      // Mock a slow API call
      const { authClient } = require('@/lib/auth-client');
      authClient.organization.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      await user.type(nameInput, 'Test Organization');

      const submitButton = screen.getByRole('button', {
        name: /create organization/i,
      });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/creating organization/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<CreateOrganizationForm />);

      const nameInput = screen.getByLabelText(/organization name/i);
      const slugInput = screen.getByLabelText(/organization slug/i);
      const logoInput = screen.getByLabelText(/logo url/i);

      expect(nameInput).toBeInTheDocument();
      expect(slugInput).toBeInTheDocument();
      expect(logoInput).toBeInTheDocument();
    });

    it('provides helpful descriptions for form fields', () => {
      render(<CreateOrganizationForm />);

      // Check that form descriptions are present
      expect(
        screen.getByText(/this will be the display name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/this will be used in your organization's url/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/provide a url to your organization's logo/i)
      ).toBeInTheDocument();
    });
  });
});
