import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, FileWarning, Truck, Briefcase, ChevronRight, FileText, Calendar } from 'lucide-react';
import { getOperationalRisks } from '@/server/dashboard';

interface OperationalRisksProps {
  organizationId: string;
}

export async function OperationalRisks({ organizationId }: OperationalRisksProps) {
  const result = await getOperationalRisks(organizationId);
  const risks = result.risks;

  const totalRisks =
    risks.overdueDeliveries.count +
    risks.awardedAwaitingConversion.count +
    risks.expiringValidity.count +
    risks.missingDocuments.count +
    (risks.awaitingPOs?.count || 0) +
    (risks.delayedProjects?.count || 0);

  if (totalRisks === 0) {
    return null; // Don't show the risk panel if there are no operational risks
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatCurrency = (val: string | null) => {
    if (!val) return 'R0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return 'R0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(num);
  };

  return (
    <Card className="border-red-500/15 dark:border-red-500/10 bg-red-500/[0.01] backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center text-red-700 dark:text-red-400 gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse text-red-600 dark:text-red-500" />
              Operational Risks & Bottlenecks
            </CardTitle>
            <CardDescription className="mt-1">
              Active bottlenecks requiring immediate management intervention
            </CardDescription>
          </div>
          <Badge variant="destructive" className="bg-red-600/10 text-red-700 dark:text-red-400 hover:bg-red-600/15 border-none">
            {totalRisks} Issue{totalRisks !== 1 ? 's' : ''} Identified
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Overdue Deliveries */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Deliveries</span>
                <Truck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.overdueDeliveries.count}</span>
                <span className="text-xs text-muted-foreground">PO{risks.overdueDeliveries.count !== 1 ? 's' : ''} delayed</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {risks.overdueDeliveries.count === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">All PO deliveries are on track.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.overdueDeliveries.items.map((po) => (
                    <Link
                      key={po.id}
                      href={`/projects/purchase-orders/${po.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">{po.poNumber}</span>
                        <span className="text-[10px] font-medium text-foreground">{formatCurrency(po.totalAmount)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{po.supplierName || 'No Supplier'}</span>
                      <span className="text-[9px] text-red-500 mt-1">Due: {formatDate(po.expectedDeliveryDate)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Won Work Backlog */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unconverted Won Work</span>
                <Briefcase className="h-4 w-4 text-violet-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.awardedAwaitingConversion.count}</span>
                <span className="text-xs text-muted-foreground">Tender{risks.awardedAwaitingConversion.count !== 1 ? 's' : ''} won</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {risks.awardedAwaitingConversion.count === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No backlog. All won bids converted.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.awardedAwaitingConversion.items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tenders/${t.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-violet-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-violet-700 uppercase">{t.tenderNumber}</span>
                        {t.value && <span className="text-[10px] font-medium text-foreground">{formatCurrency(t.value)}</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{t.clientName}</span>
                      <span className="text-[9px] text-violet-500 font-medium mt-1 group-hover:underline inline-flex items-center gap-0.5">
                        Setup Project <ChevronRight className="h-2 w-2" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Expiring Validity */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validity Expirations</span>
                <Clock className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.expiringValidity.count}</span>
                <span className="text-xs text-muted-foreground">Due in 14d</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {risks.expiringValidity.count === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No validity expirations approaching.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.expiringValidity.items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tenders/${t.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-rose-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-700 uppercase">{t.tenderNumber}</span>
                        {t.value && <span className="text-[10px] font-medium text-foreground">{formatCurrency(t.value)}</span>}
                      </div>
                      <span className="text-[9px] text-red-500 mt-1">Expires: {formatDate(t.evaluationDate)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Missing Documents */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Documents</span>
                <FileWarning className="h-4 w-4 text-pink-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.missingDocuments.count}</span>
                <span className="text-xs text-muted-foreground">Active tender{risks.missingDocuments.count !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {risks.missingDocuments.count === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">All active tenders have documentation.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.missingDocuments.items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tenders/${t.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-pink-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-pink-700 uppercase">{t.tenderNumber}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{t.description || 'No description'}</span>
                      <span className="text-[9px] text-pink-500 mt-1">Requires upload</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Awaiting PO Setup */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Awaiting PO Setup</span>
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.awaitingPOs?.count || 0}</span>
                <span className="text-xs text-muted-foreground">Active project{risks.awaitingPOs?.count !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {(!risks.awaitingPOs || risks.awaitingPOs.count === 0) ? (
                <p className="text-xs text-muted-foreground mt-2">All active projects have POs configured.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.awaitingPOs.items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">{p.projectNumber}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{p.clientName}</span>
                      <span className="text-[9px] text-zinc-500 mt-1">Created: {formatDate(p.createdAt)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Delayed Projects */}
          <Card className="bg-background/40 hover:bg-accent/40 border-border/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delayed Projects</span>
                <Calendar className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{risks.delayedProjects?.count || 0}</span>
                <span className="text-xs text-muted-foreground">Past end date</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-grow">
              {(!risks.delayedProjects || risks.delayedProjects.count === 0) ? (
                <p className="text-xs text-muted-foreground mt-2">No projects have exceeded their timeline.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {risks.delayedProjects.items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group flex flex-col p-2 rounded border border-border/30 bg-background/30 hover:border-red-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-500 uppercase">{p.projectNumber}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{p.clientName}</span>
                      <span className="text-[9px] text-red-400 mt-1">Ended: {formatDate(p.contractEndDate)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
