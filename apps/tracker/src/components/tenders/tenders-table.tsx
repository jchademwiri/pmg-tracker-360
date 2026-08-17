"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from "@/components/ui/mobile-card";
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
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatDate,
  formatCurrency,
  formatClientName,
  toTitleCase,
  formatPhoneNumber,
} from "@/lib/format";
import { DataTableShell } from "@/components/shared/tables/data-table-shell";

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
  const isExpired =
    daysDiff < 0 && tender.status !== "awarded" && tender.status !== "lost";

  return { expiryDate, isExpired, daysDiff };
}

function getDaysUntilDeadline(submissionDate: Date | null): number | null {
  if (!submissionDate) return null;
  const now = new Date();
  const diffTime = new Date(submissionDate).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ContactDetailsCell({ tender }: { tender: Tender }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const contactName = tender.contactName || tender.client?.contactName;
  const rawPhone = tender.contactPhone || tender.client?.contactPhone;
  const rawEmail = tender.contactEmail || tender.client?.contactEmail;

  const displayPhone = rawPhone ? formatPhoneNumber(rawPhone) : null;
  const displayEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
  const displayName = contactName ? toTitleCase(contactName) : null;

  const handleCopyContact = (
    e: React.MouseEvent,
    text: string,
    type: "phone" | "email",
  ) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    toast.success(`Copied ${type}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!displayPhone && !displayEmail && !displayName) {
    return (
      <div className="text-xs text-muted-foreground/60 italic">
        No contact logged
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1 text-xs text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {displayName && (
        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
          <span className="truncate">{displayName}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {displayPhone && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`tel:${displayPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-emerald-400 font-medium transition-colors"
              title={`Call ${displayPhone}`}
            >
              <Phone
                className="h-3 w-3 text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>{displayPhone}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopyContact(e, displayPhone, "phone")}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Phone Number"
            >
              {copiedField === "phone" ? (
                <Check className="h-2.5 w-2.5 text-emerald-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        )}

        {displayEmail && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`mailto:${displayEmail}?subject=Follow-up%20re%20Tender%20${encodeURIComponent(tender.tenderNumber)}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-sky-400 font-medium transition-colors truncate max-w-[170px]"
              title={`Email ${displayEmail}`}
            >
              <Mail
                className="h-3 w-3 text-sky-400 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{displayEmail}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopyContact(e, displayEmail, "email")}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Email Address"
            >
              {copiedField === "email" ? (
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

function DescriptionCell({ description }: { description: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!description) {
    return (
      <span className="italic text-muted-foreground/50 normal-case text-xs">
        No description provided
      </span>
    );
  }

  const handleCopyDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success("Description copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-start gap-1.5 pr-2">
      <p
        className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-words flex-1"
        title={description}
      >
        {toTitleCase(description)}
      </p>
      <button
        type="button"
        onClick={handleCopyDescription}
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

function StatusValueCell({ tender }: { tender: Tender }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <StatusBadge domain="tender" status={tender.status} />
      {tender.value && Number(tender.value) > 0 ? (
        <span className="font-mono font-bold text-xs tabular-nums text-emerald-400 dark:text-emerald-300">
          {formatCurrency(Number(tender.value))}
        </span>
      ) : null}
    </div>
  );
}

const OPEN_PRE_SUBMISSION_STATUSES = new Set([
  "open",
  "draft",
  "new",
  "review",
  "approved_to_prepare",
  "preparation",
  "pricing",
  "ready",
]);

function ValidityDeadlineCell({ tender }: { tender: Tender }) {
  const isOpenPreSubmission =
    OPEN_PRE_SUBMISSION_STATUSES.has(tender.status) ||
    ![
      "submitted",
      "evaluation",
      "closed",
      "awarded",
      "lost",
      "cancelled",
    ].includes(tender.status);

  const daysLeftToSubmit = getDaysUntilDeadline(tender.submissionDate);

  // 1. If Tender is OPEN / PRE-SUBMISSION -> Show Closing Date prominently
  if (isOpenPreSubmission) {
    if (!tender.submissionDate) {
      return (
        <span className="text-muted-foreground text-xs italic">
          No closing date
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1 text-left">
        <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>
            Closes:{" "}
            <strong className="text-foreground">
              {formatDate(tender.submissionDate)}
            </strong>
          </span>
        </div>
        <div>
          {daysLeftToSubmit !== null &&
            (daysLeftToSubmit < 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                {Math.abs(daysLeftToSubmit)}d overdue
              </span>
            ) : daysLeftToSubmit === 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                <Hourglass className="h-3 w-3 text-amber-400" />
                Closing Today (11:00 AM)
              </span>
            ) : daysLeftToSubmit <= 3 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Hourglass className="h-3 w-3 text-amber-400" />
                {daysLeftToSubmit} days left
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium pl-5">
                {daysLeftToSubmit} days left
              </span>
            ))}
        </div>
      </div>
    );
  }

  // 2. For Submitted / Under Evaluation Tenders -> Check Validity Expiry
  const { expiryDate, isExpired, daysDiff } = resolveValidityExpiry(tender);

  // If Validity is EXPIRED (High Urgency Alert)
  if (isExpired && expiryDate) {
    const daysAgo = Math.abs(daysDiff ?? 0);
    return (
      <div className="flex flex-col gap-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-xs animate-pulse w-fit">
          <AlertTriangle
            className="h-3.5 w-3.5 text-rose-400 shrink-0"
            aria-hidden="true"
          />
          <span>
            Expired {daysAgo} {daysAgo === 1 ? "day" : "days"} ago
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground pl-1">
          Lapsed:{" "}
          <strong className="text-foreground">{formatDate(expiryDate)}</strong>
        </div>
        {tender.submissionDate && (
          <div className="text-[11px] text-muted-foreground pl-1">
            Submitted:{" "}
            <strong className="text-foreground/90 font-medium">
              {formatDate(tender.submissionDate)}
            </strong>
          </div>
        )}
      </div>
    );
  }

  // If Validity is Expiring Soon (Within 14 Days)
  if (expiryDate && daysDiff !== null && daysDiff >= 0 && daysDiff <= 14) {
    return (
      <div className="flex flex-col gap-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-xs w-fit">
          <Hourglass
            className="h-3.5 w-3.5 text-amber-400 shrink-0"
            aria-hidden="true"
          />
          <span>
            Expires in {daysDiff} {daysDiff === 1 ? "day" : "days"}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground pl-1">
          Valid to:{" "}
          <strong className="text-foreground">{formatDate(expiryDate)}</strong>
        </div>
        {tender.submissionDate && (
          <div className="text-[11px] text-muted-foreground pl-1">
            Submitted:{" "}
            <strong className="text-foreground/90 font-medium">
              {formatDate(tender.submissionDate)}
            </strong>
          </div>
        )}
      </div>
    );
  }

  // Standard Validity & Submitted Date Info
  if (expiryDate) {
    return (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            Valid until{" "}
            <strong className="text-foreground">
              {formatDate(expiryDate)}
            </strong>
          </span>
        </div>
        {tender.submissionDate && (
          <div className="text-muted-foreground text-[11px] pl-5">
            Submitted:{" "}
            <strong className="text-foreground/90 font-medium">
              {formatDate(tender.submissionDate)}
            </strong>
          </div>
        )}
      </div>
    );
  }

  // Fallback if only submissionDate exists (post-submission)
  if (tender.submissionDate) {
    return (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            Submitted:{" "}
            <strong className="text-foreground">
              {formatDate(tender.submissionDate)}
            </strong>
          </span>
        </div>
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">—</span>;
}

export function TendersTable({
  tenders,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  className = "",
}: TendersTableProps) {
  return (
    <DataTableShell
      entityLabel="tenders"
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      dataLength={tenders.length}
      emptyState={{
        type: "empty",
        icon: "file",
        title: "No tenders found",
        description: "No tender records match this filter.",
        actionLabel: "Add Tender",
        actionHref: "/tenders/create",
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
                <h3 className="font-semibold text-foreground text-sm tracking-wide line-clamp-2 break-words">
                  {formatClientName(tender.client?.name) || "Unknown Client"}
                </h3>

                {tender.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                    {toTitleCase(tender.description)}
                  </p>
                )}

                {/* Mobile Contact Quick Row */}
                <div className="pt-1">
                  <ContactDetailsCell tender={tender} />
                </div>

                <MobileCardGrid>
                  {tender.value && Number(tender.value) > 0 && (
                    <MobileCardField label="Value">
                      {formatCurrency(Number(tender.value))}
                    </MobileCardField>
                  )}
                  <MobileCardField
                    label="Validity Status"
                    className="col-span-2"
                  >
                    <ValidityDeadlineCell tender={tender} />
                  </MobileCardField>
                </MobileCardGrid>
              </MobileCardBody>
            </MobileCard>
          ))}
        </MobileCardList>
      }
    >
      {/* Desktop table with 5 balanced columns */}
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%]">Tender & Client</TableHead>
            <TableHead className="w-[34%]">Description</TableHead>
            <TableHead className="w-[18%]">Contact Details</TableHead>
            <TableHead className="w-[15%]">Status & Value</TableHead>
            <TableHead className="w-[15%]">Deadline & Validity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow
              key={tender.id}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick?.(tender.id)}
            >
              {/* 1. Tender & Client */}
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div
                      className="font-bold text-foreground text-xs line-clamp-2 break-words leading-tight tracking-tight"
                      title={
                        tender.client?.name
                          ? formatClientName(tender.client.name)
                          : "Unknown Client"
                      }
                    >
                      {tender.client?.name
                        ? formatClientName(tender.client.name)
                        : "Unknown Client"}
                    </div>
                    <Link
                      href={`/tenders/${tender.id}`}
                      className="text-xs font-mono font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors line-clamp-2 break-all leading-tight w-fit"
                      onClick={(event) => event.stopPropagation()}
                      title={tender.tenderNumber.toUpperCase()}
                    >
                      {tender.tenderNumber.toUpperCase()}
                    </Link>
                  </div>
                </div>
              </TableCell>

              {/* 2. Description (with Copy button) */}
              <TableCell>
                <DescriptionCell description={tender.description} />
              </TableCell>

              {/* 3. Contact Details (Phone / Email) */}
              <TableCell>
                <ContactDetailsCell tender={tender} />
              </TableCell>

              {/* 4. Status & Value */}
              <TableCell>
                <StatusValueCell tender={tender} />
              </TableCell>

              {/* 5. Deadline & Validity */}
              <TableCell>
                <ValidityDeadlineCell tender={tender} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}
