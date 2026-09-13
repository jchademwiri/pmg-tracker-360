import type { AdminReportPdfModel } from "../types/documents";
import type { DataTableColumn, KpiCardItem } from "../types/index";
import { adminTheme } from "../themes/admin";
import {
  AnalyticalLayout,
  type AnalyticalSection,
} from "../layouts/AnalyticalLayout";
import { KpiCards } from "../components/display/KpiCards";
import { DataTable } from "../components/table/DataTable";
import { Badge } from "../components/primitives/Badge";
import { Text } from "../components/primitives/Text";

function getStatusBadgeVariant(
  status?: string,
): "success" | "warning" | "destructive" | "primary" | "secondary" {
  if (!status) return "secondary";
  const s = status.toLowerCase();
  if (
    s.includes("healthy") ||
    s.includes("normal") ||
    s.includes("active") ||
    s.includes("optimal") ||
    s.includes("secure")
  ) {
    return "success";
  }
  if (
    s.includes("warn") ||
    s.includes("elevated") ||
    s.includes("suspicious")
  ) {
    return "warning";
  }
  if (
    s.includes("crit") ||
    s.includes("alert") ||
    s.includes("error") ||
    s.includes("fail")
  ) {
    return "destructive";
  }
  return "primary";
}

export function AdminReportPdf({ data }: { data: AdminReportPdfModel }) {
  const statusBadge = data.systemStatus ? (
    <Badge variant={getStatusBadgeVariant(data.systemStatus)}>
      {data.systemStatus.toUpperCase()}
    </Badge>
  ) : undefined;

  const kpis: KpiCardItem[] = data.kpiCards.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    subtext: kpi.subtext,
    variant: kpi.variant,
  }));

  const sections: AnalyticalSection[] = data.sections.map((sec, idx) => {
    const columns: DataTableColumn<Record<string, unknown>>[] = (
      sec.table?.columns ?? []
    ).map((col) => ({
      id: col.id,
      header: col.header,
      width: col.width,
      align: col.align,
      accessorKey: col.id,
      render: (row: Record<string, unknown>) => {
        const val = row[col.id];
        if (col.id === "severity" && typeof val === "string") {
          const isCritical = val.toLowerCase() === "critical";
          const isWarning = val.toLowerCase() === "warning";
          return (
            <span
              style={{
                fontWeight: 700,
                color: isCritical
                  ? adminTheme.colors.destructive
                  : isWarning
                    ? adminTheme.colors.warning
                    : adminTheme.colors.foreground,
              }}
            >
              {val.toUpperCase()}
            </span>
          );
        }
        if (col.id === "status" && typeof val === "string") {
          const isArchived = val.toLowerCase() === "archived";
          return (
            <span
              style={{
                fontWeight: 600,
                color: isArchived
                  ? adminTheme.colors.destructive
                  : adminTheme.colors.success,
              }}
            >
              {val}
            </span>
          );
        }
        return val !== undefined && val !== null ? String(val) : "—";
      },
    }));

    return {
      id: sec.id,
      title: sec.title,
      description: sec.description,
      pageBreakBefore: idx > 0,
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sec.metrics && sec.metrics.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <KpiCards
                theme={adminTheme}
                items={sec.metrics}
                columns={
                  sec.metrics.length > 3 ? 4 : (sec.metrics.length as 2 | 3)
                }
              />
            </div>
          )}

          {sec.callouts && sec.callouts.length > 0 && (
            <div
              style={{
                backgroundColor: adminTheme.colors.muted,
                borderLeft: "3px solid " + adminTheme.colors.accent,
                padding: "8px 12px",
                borderRadius: "3px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {sec.callouts.map((callout, cIdx) => (
                <Text
                  key={cIdx}
                  variant="xs"
                  style={{ color: adminTheme.colors.foreground }}
                >
                  • {callout}
                </Text>
              ))}
            </div>
          )}

          {sec.table && (
            <DataTable
              theme={adminTheme}
              columns={columns}
              data={sec.table.rows}
              emptyMessage="No data recorded for this section."
            />
          )}
        </div>
      ),
    };
  });

  return (
    <AnalyticalLayout
      theme={adminTheme}
      branding={data.branding}
      title={data.title}
      subtitle={data.subtitle}
      periodLabel={data.periodLabel}
      statusBadge={statusBadge}
      kpiCards={kpis}
      sections={sections}
      confidential={data.confidential ?? true}
      generatedAt={data.generatedAt}
    />
  );
}
