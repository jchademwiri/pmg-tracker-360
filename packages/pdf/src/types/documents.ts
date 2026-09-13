import type { PdfBranding } from "./index";

export interface PurchaseOrderLineItem {
  itemNumber: string;
  sapReference?: string | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrderPdfModel {
  branding: PdfBranding;
  poNumber: string;
  status: string;
  description?: string | null;
  supplierName?: string | null;
  deliveryAddress?: string | null;
  poDate?: Date | string | null;
  expectedDeliveryDate?: Date | string | null;
  project?: {
    projectNumber: string;
    description?: string | null;
  } | null;
  lineItems: PurchaseOrderLineItem[];
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
  notes?: string | null;
  terms?: string | null;
  generatedAt?: Date;
  confidential?: boolean;
}

export interface TenderDetailPdfModel {
  branding: PdfBranding;
  tenderNumber: string;
  status: string;
  priority?: string | null;
  clientName: string;
  clientContact?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  description?: string | null;
  submissionDate?: Date | string | null;
  evaluationDate?: Date | string | null;
  briefingDate?: Date | string | null;
  briefingLocation?: string | null;
  validityExpiryDate?: Date | string | null;
  estimatedValue?: number | null;
  awardValue?: number | null;
  lossReason?: string | null;
  lossDetails?: string | null;
  generatedAt?: Date;
  confidential?: boolean;
}

export interface TenderWinLossPdfModel {
  branding: PdfBranding;
  periodLabel?: string;
  totalSubmissions: number;
  awardedCount: number;
  lostCount: number;
  winRate: number;
  awardedValueTotal?: number;
  lostValueTotal?: number;
  awardedTenders: Array<{
    tenderNumber: string;
    client: string;
    description: string;
    awardValue?: number;
    awardDate?: Date | string | null;
  }>;
  lostTenders: Array<{
    tenderNumber: string;
    client: string;
    description: string;
    estimatedValue?: number;
    lossReason?: string | null;
  }>;
  lossReasonsSummary: Array<{
    reason: string;
    count: number;
    value?: number;
    percentage: number;
  }>;
  generatedAt?: Date;
  confidential?: boolean;
}

export interface TenderRegisterRowModel {
  tenderNumber: string;
  client: string;
  description: string;
  status: string;
  priority?: string | null;
  submissionDate?: Date | string | null;
  briefingDate?: Date | string | null;
  validityDate?: Date | string | null;
  estimatedValue?: number | null;
  awardValue?: number | null;
  contactPerson?: string | null;
}

export interface TenderRegisterPdfModel {
  branding: PdfBranding;
  variant: "portfolio" | "client";
  clientName?: string | null;
  clientDetails?: {
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  filterPills?: Array<{ label: string; value: string }>;
  kpiCards?: Array<{
    label: string;
    value: string | number;
    variant?: "default" | "primary" | "success" | "warning";
  }>;
  rows: TenderRegisterRowModel[];
  generatedAt?: Date;
  confidential?: boolean;
}

export interface AdminReportMetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

export interface AdminReportSectionModel {
  id: string;
  title: string;
  description?: string;
  metrics?: AdminReportMetricItem[];
  table?: {
    columns: Array<{ id: string; header: string; width?: string; align?: "left" | "center" | "right" }>;
    rows: Array<Record<string, unknown>>;
  };
  callouts?: string[];
}

export interface AdminReportPdfModel {
  branding: PdfBranding;
  kind: "platform-executive" | "storage-audit" | "security-audit";
  title: string;
  subtitle?: string;
  periodLabel?: string;
  systemStatus?: string;
  kpiCards: AdminReportMetricItem[];
  sections: AdminReportSectionModel[];
  generatedAt?: Date;
  confidential?: boolean;
}

export interface TenderFollowUpRowModel {
  tenderNumber: string;
  client: string;
  description: string;
  closingDate?: Date | string | null;
  validityExpiryDate?: Date | string | null;
  validityDaysRemaining?: number | null;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: string;
  estimatedValue?: number | string | null;
}

export interface TenderFollowUpPdfModel {
  branding?: PdfBranding;
  filterPills?: Array<{ label: string; value: string }>;
  kpiCards?: Array<{
    label: string;
    value: string | number;
    variant?: "default" | "primary" | "success" | "warning" | "destructive";
  }>;
  rows: TenderFollowUpRowModel[];
  generatedAt?: Date;
  confidential?: boolean;
}
