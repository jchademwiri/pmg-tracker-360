import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const dynamic = 'force-dynamic';

// Auth stub — layout is open until Phase 4 wires in real session checks
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
