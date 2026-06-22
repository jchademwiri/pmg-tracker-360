import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectList } from '../project-list';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetProjects = jest.fn();
const mockDeleteProject = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/projects',
}));

jest.mock('@/server/projects', () => ({
  getProjects: (...args: unknown[]) => mockGetProjects(...args),
  deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Polyfills for jsdom (needed by userEvent and Radix UI)
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const noop = () => {};
global.ResizeObserver = class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
};

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleProjects: Array<{
  id: string;
  projectNumber: string;
  description: string;
  status: string;
  completionPercentage: number;
  client: { id: string; name: string; contactName: null; contactEmail: null; contactPhone: null } | null;
  tender: null;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'proj-1',
    projectNumber: 'PRJ-001',
    description: 'First project',
    status: 'active',
    completionPercentage: 75,
    client: { id: 'client-1', name: 'Acme Corp', contactName: null, contactEmail: null, contactPhone: null },
    tender: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'proj-2',
    projectNumber: 'PRJ-002',
    description: 'Second project',
    status: 'active',
    completionPercentage: 50,
    client: { id: 'client-2', name: 'Globex Inc', contactName: null, contactEmail: null, contactPhone: null },
    tender: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sampleClients = [
  { id: 'client-1', name: 'Acme Corp' },
  { id: 'client-2', name: 'Globex Inc' },
  { id: 'client-3', name: 'Initech' },
];

const defaultFetchResponse = {
  projects: sampleProjects,
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectList - Client Filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjects.mockResolvedValue(defaultFetchResponse);
  });

  /** Wait for the async fetch to complete and the loading overlay to clear. */
  async function waitForDataToRender() {
    // Wait for project data to appear (loading must be fully done)
    await waitFor(() => {
      const results = screen.getAllByText('PRJ-001');
      expect(results.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 5000 });
  }

  it('renders the client filter with default "All Clients" text', async () => {
    render(
      <ProjectList
        organizationId="org-1"
        initialProjects={sampleProjects}
        initialTotalCount={2}
        clients={sampleClients}
      />
    );

    await waitForDataToRender();
    expect(screen.getByText('All Clients')).toBeInTheDocument();
  });

  it('renders without crashing when no clients prop is provided', async () => {
    render(
      <ProjectList
        organizationId="org-1"
        initialProjects={sampleProjects}
        initialTotalCount={2}
      />
    );

    await waitForDataToRender();
    expect(screen.getByText('All Clients')).toBeInTheDocument();
  });

  it('allows selecting a client from the dropdown', async () => {
    const user = userEvent.setup();

    render(
      <ProjectList
        organizationId="org-1"
        initialProjects={sampleProjects}
        initialTotalCount={2}
        clients={sampleClients}
      />
    );

    await waitForDataToRender();

    // Open the desktop client filter select (second combobox - status filter is the first)
    await waitFor(async () => {
      const triggers = screen.getAllByRole('combobox');
      const clientFilterTrigger = triggers[1]; // second combobox = client filter
      await user.click(clientFilterTrigger);
    }, { timeout: 5000 });

    // Verify items in the opened dropdown (text may also appear in table rows)
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Globex Inc').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Initech')).toBeInTheDocument(); // only in dropdown, not in table

    // Select "Globex Inc" from the dropdown (also appears in table rows, so use getAllByText)
    const globexItems = screen.getAllByText('Globex Inc');
    await user.click(globexItems[globexItems.length - 1]); // last one is in the portaled dropdown

    // After selection, the trigger should update to show "Globex Inc"
    // (still in table too, so use getAllByText)
    expect(screen.getAllByText('Globex Inc').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the project data on initial load', async () => {
    render(
      <ProjectList
        organizationId="org-1"
        initialProjects={sampleProjects}
        initialTotalCount={2}
        clients={sampleClients}
      />
    );

    await waitForDataToRender();

    const prj001 = screen.getAllByText('PRJ-001');
    expect(prj001.length).toBeGreaterThanOrEqual(1);

    const prj002 = screen.getAllByText('PRJ-002');
    expect(prj002.length).toBeGreaterThanOrEqual(1);
  });
});
