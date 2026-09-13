import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { DataTableColumn, PdfTheme } from "../../types/index";
import { EmptyState } from "../display/EmptyState";

export interface DataTableProps<T> {
  theme: PdfTheme;
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  striped?: boolean;
  bordered?: boolean;
  dense?: boolean;
  orientation?: "portrait" | "landscape";
  footerRow?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

function resolveColWidth<T>(
  col: DataTableColumn<T>,
  columns: DataTableColumn<T>[],
  isLandscape: boolean
): string | undefined {
  if (!col.width) return undefined;

  if (col.width.endsWith("%")) {
    const pct = parseFloat(col.width);
    if (isNaN(pct)) return undefined;

    // Find the largest percentage column to let it flexibly absorb remaining width
    let maxPct = 0;
    for (const c of columns) {
      if (c.width?.endsWith("%")) {
        const val = parseFloat(c.width);
        if (val > maxPct) maxPct = val;
      }
    }

    // Leave the widest column undefined so it fills table width
    if (pct === maxPct && pct >= 25) {
      return undefined;
    }

    const baseWidth = isLandscape ? 770 : 520;
    return `${Math.round((baseWidth * pct) / 100)}px`;
  }

  return col.width;
}

export function DataTable<T>({
  theme,
  columns,
  data,
  emptyMessage = "No items to display.",
  striped = true,
  bordered = true,
  dense = false,
  orientation,
  footerRow,
  style,
  className,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return <EmptyState theme={theme} title="No Data" description={emptyMessage} />;
  }

  const isLandscape = orientation === "landscape" || (!orientation && columns.length >= 5);
  const paddingY = dense ? "6px" : "8px";
  const paddingX = dense ? "8px" : "10px";
  const fontSize = dense ? "9.5px" : "10.5px";

  const tableStyle: CSSProperties = {
    width: "100%",
    borderSpacing: "0",
    borderCollapse: "separate",
    fontSize,
    lineHeight: "14px",
    fontFamily: theme.fontFamily,
    boxSizing: "border-box",
    ...style,
  };

  const thStyle = (col: DataTableColumn<T>): CSSProperties => {
    const computedWidth = resolveColWidth(col, columns, isLandscape);
    return {
      backgroundColor: theme.colors.tableHeaderBg,
      color: "#FFFFFF",
      paddingTop: paddingY,
      paddingBottom: paddingY,
      paddingLeft: paddingX,
      paddingRight: paddingX,
      textAlign: col.align ?? "left",
      fontWeight: 700,
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      width: computedWidth,
      borderBottom: `1px solid ${theme.colors.border}`,
      boxSizing: "border-box",
    };
  };

  const tdStyle = (col: DataTableColumn<T>, rowIndex: number): CSSProperties => {
    const isEven = rowIndex % 2 === 0;
    const bg = striped
      ? isEven
        ? theme.colors.tableRowEven
        : theme.colors.tableRowOdd
      : theme.colors.tableRowEven;
    const computedWidth = resolveColWidth(col, columns, isLandscape);

    return {
      backgroundColor: bg,
      color: theme.colors.foreground,
      paddingTop: paddingY,
      paddingBottom: paddingY,
      paddingLeft: paddingX,
      paddingRight: paddingX,
      textAlign: col.align ?? "left",
      borderBottom: `1px solid ${theme.colors.border}`,
      verticalAlign: "middle",
      wordBreak: "break-word",
      width: computedWidth,
      boxSizing: "border-box",
    };
  };

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        ...(bordered ? { border: `1px solid ${theme.colors.border}`, borderRadius: "4px" } : {}),
      }}
      className={clsx("pdf-table-container", className)}
    >
      <table style={tableStyle} className="pdf-data-table">
        {/* Repeating header on page break */}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} style={thStyle(col)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
              {columns.map((col) => {
                const cellContent = col.render
                  ? col.render(row, rowIndex)
                  : col.accessorKey
                    ? (row[col.accessorKey] as unknown as ReactNode)
                    : null;

                return (
                  <td key={col.id} style={tdStyle(col, rowIndex)}>
                    {cellContent ?? "-"}
                  </td>
                );
              })}
            </tr>
          ))}

          {footerRow}
        </tbody>
      </table>
    </div>
  );
}
