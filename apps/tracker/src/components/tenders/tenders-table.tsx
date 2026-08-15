'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardList,
} from '@/components/ui/mobile-card';
import {
  Building2,
  Calendar,
  Phone,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Hourglass,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/lib/format';
import { DataTableShell } from '@/components/shared/tables/data-table-shell';

export interface Tender {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  evaluationDate?: Date | null;
  validityDays?: number | null;
  validityDate?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  } | null;
}

interface TendersTableProps {
  tenders: Tender[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewTender?: (tenderId: string) => void;
  onEditTender?: (tenderId: string) => void;
  onDeleteTender?: (tenderId: string) => void;
  onRowClick?: (tenderId: string) => void;
  className?: string;
}

function resolveValidityExpiry(tender: Tender): {
  expiryDate: Date | null;
  isExpired: boolean;
  daysDiff: number | null;
} {
  let expiryDate: Date | null = null;

  if (tender.validityDate) {
    expiryDate = new Date(tender.validityDate);
  } else if (tender.submissionDate && tender.validityDays) {
    const d = new Date(tender.submissionDate);
    d.setDate(d.getDate() + tender.validityDays);
    expiryDate = d;
  } else if (tender.evaluationDate) {
    expiryDate = new Date(tender.evaluationDate);
  }

  if (!expiryDate) {
    return { expiryDate: null, isExpired: false, daysDiff: null };
  }

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysDiff < 0 && tender.status !== 'awarded' && tender.status !== 'lost';

  return { expiryDate, isExpired, daysDiff };
}

function getDaysUntilDeadline(submissionDate: Date | null): number | null {
  if (!submissionDate) return null;
  const now = new Date();
  const sub = new Date(submissionDate);
  const diffTime = sub.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ContactDetailsCell({ tender }: { tender: Tender }) {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  const contactName = tender.contactName || tender.client?.contactName;
  const contactEmail = tender.contactEmail || tender.client?.contactEmail;
  const contactPhone = tender.contactPhone || tender.client?.contactPhone;

  const handleCopy = (e: React.MouseEvent, text: string, type: 'phone' | 'email') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    toast.success(`Copied ${type}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!contactPhone && !contactEmail && !contactName) {
    return (
      <div className="text-xs text-muted-foreground/60 italic">
        No contact logged
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-xs text-left" onClick={(e) => e.stopPropagation()}>
      {contactName && (
        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
          <span className="truncate">{contactName}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {contactPhone && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`tel:${contactPhone}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-emerald-400 font-medium transition-colors"
              title={`Call ${contactPhone}`}
            >
              <Phone className="h-3 w-3 text-emerald-400" aria-hidden="true" />
              <span>{contactPhone}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopy(e, contactPhone, 'phone')}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Phone Number"
            >
              {copiedField === 'phone' ? (
                <Check className="h-2.5 w-2.5 text-emerald-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        )}

        {contactEmail && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`mailto:${contactEmail}?subject=Follow-up%20re%20Tender%20${encodeURIComponent(tender.tenderNumber)}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-sky-400 font-medium transition-colors truncate max-w-[170px]"
              title={`Email ${contactEmail}`}
            >
              <Mail className="h-3 w-3 text-sky-400" aria-hidden="true" />
              <span className="truncate">{contactEmail}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopy(e, contactEmail, 'email')}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Email Address"
            >
              {copiedField === 'email' ? (
                <Check className="h-2.5 w-2.5 text-sky-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ValidityDeadlineCell({ tender }: { tender: Tender }) {
  const { expiryDate, isExpired, daysDiff } = resolveValidityExpiry(tender);
  const daysLeftToSubmit = getDaysUntilDeadline(tender.submissionDate);

  // If Validity is EXPIRED (High Urgency)
  if (isExpired && expiryDate) {
    const daysAgo = Math.abs(daysDiff ?? 0);
    return (
      <div className="flex flex-col gap-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm animate-pulse w-fit">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span>Expired {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
        </div>
        <div className="text-[11px] text-muted-foreground pl-1">
          Lapsed: <strong className="text-foreground">{formatDate(expiryDate)}</strong>
        </div>
      </div>
    );
  }

  // If Validity is Expiring Soon (Within 14 Days)
  if (expiryDate && daysDiff !== null && daysDiff >= 0 && daysDiff <= 14) {
    return (
      <div className="flex flex-col gap-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm w-fit">
          <Hourglass className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Expires in {daysDiff} {daysDiff === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="text-[11px] text-muted-foreground pl-1">
          Valid to: <strong className="text-foreground">{formatDate(expiryDate)}</strong>
        </div>
      </div>
    );
  }

  // Standard Validity & Closing Info
  if (expiryDate) {
    return (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Valid until {formatDate(expiryDate)}</span>
        </div>
        {tender.submissionDate && (
          <div className="text-muted-foreground text-[11px] pl-5">
            Submitted: {formatDate(tender.submissionDate)}
          </div>
        )}
      </div>
    );
  }

  // Open Tender closing countdown
  if (tender.submissionDate) {
    return (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{formatDate(tender.submissionDate)}</span>
        </div>
        {daysLeftToSubmit !== null && (
          <div className="text-[11px] pl-5">
            {daysLeftToSubmit < 0 ? (
              <span className="text-rose-400 font-bold">{Math.abs(daysLeftToSubmit)}d overdue</span>
            ) : daysLeftToSubmit === 0 ? (
              <span className="text-amber-400 font-bold">Closing Today (11:00 AM)</span>
            ) : (
              <span className={daysLeftToSubmit <= 3 ? 'text-amber-400 font-bold' : 'text-muted-foreground'}>
                {daysLeftToSubmit} days left
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">—</span>;
}

function DescriptionCell({ description }: { description: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!description) {
    return <span className="italic text-muted-foreground/50 normal-case text-xs">No description provided</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success('Description copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-start gap-1.5 pr-2">
      <p
        className="text-xs text-muted-foreground line-clamp-3 leading-relaxed capitalize break-words flex-1"
        title={description}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 opacity-80 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0 cursor-pointer"
        title="Copy full description"
        aria-label="Copy description"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export function TendersTable({
  tenders,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  className = '',
}: TendersTableProps) {
  return (
    <DataTableShell
      title="Tenders"
      entityLabel="tenders"
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      dataLength={tenders.length}
      emptyState={{
        type: 'empty',
        icon: 'file',
        title: 'No tenders found',
        description: 'No tender records match this filter.',
        actionLabel: 'Add Tender',
        actionHref: '/tenders/create',
      }}
      className={className}
      mobileContent={
        <MobileCardList>
          {tenders.map((tender) => (
            <MobileCard key={tender.id} onClick={() => onRowClick?.(tender.id)}>
              <MobileCardHeader
                identifier={tender.tenderNumber.toUpperCase()}
                status={tender.status}
              />
              <MobileCardBody>
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                  {tender.client?.name ? tender.client.name.toUpperCase() : 'UNKNOWN CLIENT'}
                </h3>

                {/* Description (Multi-line up to 3 lines, Capitalized words, with Quick Copy) */}
                <div className="pt-1">
                  <DescriptionCell description={tender.description} />
                </div>

                {/* Value */}
                {tender.value && (
                  <div className="text-xs font-mono font-semibold text-foreground pt-1">
                    Estimated: {formatCurrency(tender.value)}
                  </div>
                )}

                {/* Mobile Contact Quick Row */}
                <div className="pt-1">
                  <ContactDetailsCell tender={tender} />
                </div>

                {/* Validity Status */}
                <div className="pt-2">
                  <ValidityDeadlineCell tender={tender} />
                </div>
              </MobileCardBody>
            </MobileCard>
          ))}
        </MobileCardList>
      }
    >
      {/* Desktop table with 5 clean, focused columns (No Actions Column, Sticky Header) */}
      <Table className="w-full table-fixed" containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-20 bg-primary shadow-xs">
          <TableRow className="hover:bg-transparent border-b border-primary">
            <TableHead className="w-[15%] sticky top-0 z-20 bg-primary font-semibold text-xs uppercase tracking-wider text-primary-foreground">Tender & Client</TableHead>
            <TableHead className="w-[37%] sticky top-0 z-20 bg-primary font-semibold text-xs uppercase tracking-wider text-primary-foreground">Description</TableHead>
            <TableHead className="w-[18%] sticky top-0 z-20 bg-primary font-semibold text-xs uppercase tracking-wider text-primary-foreground">Contact Details</TableHead>
            <TableHead className="w-[15%] sticky top-0 z-20 bg-primary font-semibold text-xs uppercase tracking-wider text-primary-foreground">Status & Value</TableHead>
            <TableHead className="w-[15%] sticky top-0 z-20 bg-primary font-semibold text-xs uppercase tracking-wider text-primary-foreground">Deadline & Validity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow
              key={tender.id}
              className={`transition-colors duration-150 border-b border-border/40 ${
                onRowClick ? 'cursor-pointer hover:bg-accent/40' : ''
              }`}
              onClick={() => onRowClick?.(tender.id)}
            >
              {/* 1. Tender & Client (15% Width, ALL CAPS) */}
              <TableCell className="py-3.5 whitespace-normal">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div
                      className="font-bold text-foreground text-xs uppercase truncate tracking-tight"
                      title={tender.client?.name ? tender.client.name.toUpperCase() : 'UNKNOWN CLIENT'}
                    >
                      {tender.client?.name ? tender.client.name.toUpperCase() : 'UNKNOWN CLIENT'}
                    </div>
                    <Link
                      href={`/tenders/${tender.id}`}
                      className="text-xs font-mono font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors uppercase truncate"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {tender.tenderNumber.toUpperCase()}
                    </Link>
                  </div>
                </div>
              </TableCell>

              {/* 2. Description (37% Width, Multi-line up to 3 lines, Capitalized words, Quick Copy Button) */}
              <TableCell className="py-3.5 whitespace-normal break-words">
                <DescriptionCell description={tender.description} />
              </TableCell>

              {/* 3. Contact Details (18% Width) */}
              <TableCell className="py-3.5 whitespace-normal">
                <ContactDetailsCell tender={tender} />
              </TableCell>

              {/* 4. Status & Value (15% Width) */}
              <TableCell className="py-3.5 whitespace-normal">
                <div className="flex flex-col gap-1 text-left">
                  <StatusBadge domain="tender" status={tender.status} />
                  {tender.value ? (
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {formatCurrency(tender.value)}
                    </span>
                  ) : null}
                </div>
              </TableCell>

              {/* 5. Validity & Deadlines (15% Width) */}
              <TableCell className="py-3.5 whitespace-normal">
                <ValidityDeadlineCell tender={tender} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}
