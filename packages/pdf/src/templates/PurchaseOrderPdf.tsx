import type { PurchaseOrderLineItem, PurchaseOrderPdfModel } from "../types/documents";
import type { BadgeVariant } from "../types/index";
import { trackerTheme } from "../themes/tracker";
import { TransactionalLayout } from "../layouts/TransactionalLayout";
import { KeyValueCard } from "../components/display/KeyValueGrid";
import { DataTable } from "../components/table/DataTable";
import { Badge } from "../components/primitives/Badge";
import { formatDateSa, formatZar } from "../formatters/index";

function getPoBadgeVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === "approved" || s === "fulfilled" || s === "completed") return "success";
  if (s === "issued" || s === "sent" || s === "active") return "primary";
  if (s === "pending" || s === "under_review") return "warning";
  if (s === "cancelled" || s === "rejected") return "destructive";
  return "secondary";
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function PurchaseOrderPdf({ data }: { data: PurchaseOrderPdfModel }) {
  const statusVariant = getPoBadgeVariant(data.status);
  const statusText = formatStatusLabel(data.status);

  const leftCard = (
    <KeyValueCard
      theme={trackerTheme}
      title="Supplier Information"
      columns={1}
      items={[
        { label: "Supplier Name", value: data.supplierName || "Not specified" },
        ...(data.deliveryAddress
          ? [{ label: "Delivery Address", value: data.deliveryAddress }]
          : []),
      ]}
    />
  );

  const rightCard = (
    <KeyValueCard
      theme={trackerTheme}
      title="Order Reference"
      columns={1}
      items={[
        { label: "PO Date", value: formatDateSa(data.poDate) },
        { label: "Expected Delivery", value: formatDateSa(data.expectedDeliveryDate) },
        ...(data.project
          ? [
              {
                label: "Project Reference",
                value: `${data.project.projectNumber}${
                  data.project.description ? ` - ${data.project.description}` : ""
                }`,
              },
            ]
          : []),
      ]}
    />
  );

  const columns = [
    {
      id: "itemNumber",
      header: "Item #",
      width: "12%",
      accessorKey: "itemNumber" as const,
    },
    {
      id: "description",
      header: "Description",
      width: "46%",
      render: (item: PurchaseOrderLineItem) => (
        <div>
          <div style={{ fontWeight: 600, color: trackerTheme.colors.foreground }}>
            {item.description}
          </div>
          {item.sapReference && (
            <div style={{ fontSize: "9px", color: trackerTheme.colors.mutedForeground }}>
              SAP Ref: {item.sapReference}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "unit",
      header: "Unit",
      width: "10%",
      accessorKey: "unit" as const,
    },
    {
      id: "quantity",
      header: "Qty",
      width: "10%",
      align: "right" as const,
      render: (item: PurchaseOrderLineItem) => item.quantity.toString(),
    },
    {
      id: "unitPrice",
      header: "Unit Price",
      width: "11%",
      align: "right" as const,
      render: (item: PurchaseOrderLineItem) => formatZar(item.unitPrice),
    },
    {
      id: "subtotal",
      header: "Subtotal",
      width: "11%",
      align: "right" as const,
      render: (item: PurchaseOrderLineItem) => (
        <span style={{ fontWeight: 700, color: trackerTheme.colors.foreground }}>
          {formatZar(item.subtotal)}
        </span>
      ),
    },
  ];

  return (
    <TransactionalLayout
      theme={trackerTheme}
      branding={data.branding}
      title="PURCHASE ORDER"
      documentNumber={data.poNumber}
      statusBadge={<Badge variant={statusVariant}>{statusText}</Badge>}
      leftCard={leftCard}
      rightCard={rightCard}
      totals={{
        subtotal: data.totals.subtotal,
        vatRatePercent: 15,
        vatAmount: data.totals.vat,
        total: data.totals.total,
      }}
      notes={data.description || data.notes}
      terms={
        data.terms ||
        "Payment is strictly subject to the agreed terms from receipt of valid tax invoice and confirmed delivery of goods/services. All delivery notes must reference this Purchase Order number."
      }
      confidential={data.confidential}
      generatedAt={data.generatedAt}
    >
      <DataTable
        theme={trackerTheme}
        columns={columns}
        data={data.lineItems}
        emptyMessage="No line items recorded for this purchase order."
      />
    </TransactionalLayout>
  );
}
