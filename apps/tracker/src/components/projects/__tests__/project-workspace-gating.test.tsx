import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectWorkspace } from '../project-workspace';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/server/projects', () => ({
  addProjectRisk: jest.fn(),
  updateProjectRiskStatus: jest.fn(),
  submitProjectCloseOut: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/documents/document-manager', () => ({
  DocumentManager: () => <div data-testid="document-manager" />,
}));

const noop = () => {};
global.ResizeObserver = class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRisk(overrides: Record<string, string> = {}) {
  return {
    id: 'risk-1',
    title: overrides.title ?? 'Supplier delay',
    description: 'Risk of supplier delay impacting delivery timeline',
    severity: overrides.severity ?? 'critical',
    status: overrides.status ?? 'open',
    mitigationPlan: null,
    createdAt: new Date('2026-06-01'),
  };
}

function makePO(overrides: Record<string, unknown> = {}) {
  const defaults = {
    id: 'po-1',
    poNumber: 'PO-001',
    supplierName: 'Acme Supplies' as string | null,
    description: 'Office furniture' as string,
    totalAmount: '50000' as string,
    status: 'open' as string,
    poDate: new Date('2026-03-01') as Date | null,
    expectedDeliveryDate: new Date('2026-04-01') as Date | null,
    deliveredAt: null as Date | null,
    deliveryNotes: [],
  };
  for (const key of Object.keys(overrides)) {
    (defaults as Record<string, unknown>)[key] = overrides[key];
  }
  return defaults;
}

function makeProject(overrides: Record<string, unknown> = {}) {
  const defaults = {
    id: 'proj-1',
    projectNumber: 'PRJ-001',
    description: 'Test project' as string | null,
    status: 'active' as string,
    contractStartDate: new Date('2026-01-01') as Date | null,
    contractEndDate: new Date('2026-12-31') as Date | null,
    awardValue: '100000' as string | null,
    signedContractUrl: null as string | null,
    closeOutDate: null as Date | null,
    closeOutNotes: null as string | null,
    closeOutSubmittedBy: null as string | null,
    createdAt: new Date('2026-01-01') as Date,
    updatedAt: new Date('2026-06-01') as Date,
    client: null,
    tender: null,
  };
  for (const key of Object.keys(overrides)) {
    (defaults as Record<string, unknown>)[key] = overrides[key];
  }
  return defaults;
}

function makeDocument(name: string) {
  return {
    id: 'doc-1',
    name,
    size: 100000,
    type: 'application/pdf',
    createdAt: new Date(),
  };
}

interface BuildPropsOverrides {
  project?: ReturnType<typeof makeProject>;
  purchaseOrders?: ReturnType<typeof makePO>[];
  documents?: ReturnType<typeof makeDocument>[];
  risks?: ReturnType<typeof makeRisk>[];
}

function buildProps(overrides: BuildPropsOverrides = {}) {
  return {
    organizationId: 'org-1',
    userId: 'user-1',
    project: overrides.project ?? makeProject(),
    purchaseOrders: overrides.purchaseOrders ?? [],
    documents: overrides.documents ?? [],
    lineItems: [],
    activities: [],
    risks: overrides.risks ?? [],
  };
}

// ---------------------------------------------------------------------------
// Tests - Health Badge
// ---------------------------------------------------------------------------

describe('ProjectWorkspace - Health Badge', () => {
  it('shows "Critical Risks" badge when critical risks exist on active project', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'critical', status: 'open' })],
        })}
      />
    );
    expect(screen.getByText('Critical Risks')).toBeInTheDocument();
  });

  it('shows "In Progress" badge when no critical risks and not all POs delivered', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [makePO({ status: 'open' })],
        })}
      />
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows "On Track" badge when no critical risks and all POs delivered', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [makePO({ status: 'delivered' })],
        })}
      />
    );
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('shows "On Track" badge when no POs exist (vacuously all delivered)', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [],
        })}
      />
    );
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('appears when project is completed (StatusBadge also shows "Closed Out")', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'completed' }),
        })}
      />
    );
    const matches = screen.getAllByText('Closed Out');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('treats high-severity risk as critical for badge purposes', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'high', status: 'open' })],
        })}
      />
    );
    expect(screen.getByText('Critical Risks')).toBeInTheDocument();
  });

  it('does not show "Critical Risks" when mitigated/closed risks exist', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'critical', status: 'closed' })],
          purchaseOrders: [makePO({ status: 'delivered' })],
        })}
      />
    );
    expect(screen.queryByText('Critical Risks')).not.toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests - Close-out Gating
// ---------------------------------------------------------------------------

describe('ProjectWorkspace - Close-out Gating', () => {
  it('disables the close-out submit button when critical risks are open', async () => {
    const user = userEvent.setup();
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'critical', status: 'open' })],
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /close-out project/i }));
    const submitBtn = await screen.findByRole('button', { name: /critical risks blocking/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables the close-out submit button when no critical risks exist', async () => {
    const user = userEvent.setup();
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /close-out project/i }));
    const submitBtn = await screen.findByRole('button', { name: /submit close-out/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows critical-risk warning block inside dialog when critical risks are open', async () => {
    const user = userEvent.setup();
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'critical', status: 'open' })],
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /close-out project/i }));
    expect(await screen.findByText(/critical risks must be resolved/i)).toBeInTheDocument();
  });

  it('shows a disabled "Project Closed" button for completed projects', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({
            status: 'completed',
            closeOutDate: new Date(),
            closeOutNotes: 'All done',
          }),
        })}
      />
    );
    expect(screen.getByText(/project closed/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests - Close-out Readiness Checklist
// ---------------------------------------------------------------------------

describe('ProjectWorkspace - Close-out Readiness Checklist', () => {
  it('shows checklist items in the close-out dialog', async () => {
    const user = userEvent.setup();
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active', signedContractUrl: null }),
          risks: [makeRisk({ severity: 'low', status: 'open' })],
          purchaseOrders: [makePO({ status: 'open' })],
          documents: [],
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /close-out project/i }));

    expect(await screen.findByText(/all purchase orders delivered/i)).toBeInTheDocument();
    expect(screen.getByText(/all project risks closed/i)).toBeInTheDocument();
    expect(screen.getByText('Signed Contract / SLA Document Uploaded')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests - Next Best Action
// ---------------------------------------------------------------------------

describe('ProjectWorkspace - Next Best Action', () => {
  it('shows mitigating risks action when critical risks exist', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [makeRisk({ severity: 'critical', status: 'open' })],
        })}
      />
    );
    expect(screen.getByText(/mitigate 1 critical project risk/i)).toBeInTheDocument();
  });

  it('shows follow-up action when POs are open/sent and no critical risks', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [makePO({ status: 'sent' })],
        })}
      />
    );
    expect(screen.getByText(/follow up on pending deliveries/i)).toBeInTheDocument();
  });

  it('shows complete action when POs are partially delivered', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [makePO({ status: 'partially_delivered' })],
        })}
      />
    );
    expect(screen.getByText(/complete outstanding quantities/i)).toBeInTheDocument();
  });

  it('shows close-out recommendation when all POs delivered and no critical risks', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'active' }),
          risks: [],
          purchaseOrders: [makePO({ status: 'delivered' })],
          documents: [makeDocument('signed_contract.pdf')],
        })}
      />
    );
    expect(screen.getByText(/all deliveries are complete/i)).toBeInTheDocument();
  });

  it('does not render next best action when project is not active', () => {
    render(
      <ProjectWorkspace
        {...buildProps({
          project: makeProject({ status: 'completed' }),
          risks: [makeRisk({ severity: 'critical', status: 'open' })],
        })}
      />
    );
    expect(screen.queryByText(/next best action/i)).not.toBeInTheDocument();
  });
});
