import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import type { DataTableColumn, PdfTheme } from "../../types/index.js";
import { EmptyState } from "../display/EmptyState.js";

export interface DataTableProps<T> {
  theme: PdfTheme;
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  striped?: boolean;
  bordered?: boolean;
  dense?: boolean;
  footerRow?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function DataTable<T>({
  theme,
  columns,
  data,
  emptyMessage = "No items to display.",
  striped = true,
  bordered = true,
  dense = false,
  footerRow,
  style,
  className,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return <EmptyState theme={theme} title="No Data" description={emptyMessage} />;
  }

  const paddingY = dense ? "6px" : "8px";
  const paddingX = dense ? "8px" : "10px";
  const fontSize = dense ? "10px" : "11px";

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize,
    lineHeight: "14px",
    fontFamily: theme.fontFamily,
    boxSizing: "border-box",
    ...style,
  };

  const thStyle = (col: DataTableColumn<T>): CSSProperties => ({
    backgroundColor: theme.colors.tableHeaderBg,
    color: theme.name === "admin" ? "#FFFFFF" : theme.colors.foreground,
    paddingTop: paddingY,
    paddingBottom: paddingY,
    paddingLeft: paddingX,
    paddingRight: paddingX,
    textAlign: col.align ?? "left",
    fontWeight: 700,
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    width: col.width,
    borderBottom: `2px solid ${theme.colors.border}`,
    borderTop: bordered ? `1px solid ${theme.colors.border}` : undefined,
  });

  const tdStyle = (col: DataTableColumn<T>, rowIndex: number): CSSProperties => {
    const isEven = rowIndex % 2 === 0;
    const bg = striped
      ? isEven
        ? theme.colors.tableRowEven
        : theme.colors.tableRowOdd
      : theme.colors.tableRowEven;

    return {
      backgroundColor: bg,
      color: theme.colors.foreground,
      paddingTop: paddingY,
      paddingBottom: paddingY,
      paddingLeft: paddingX,
      paddingRight: paddingX,
      textAlign: col.align ?? "left",
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      verticalAlign: "middle",
      wordBreak: "break-word",
    };
  };

  return (
    <div style={{ width: "100%", overflow: "hidden" }} className={clsx("pdf-table-container", className)}>
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
            <tr key={rowIndex} style={{ pageBreakInside: "avoid" }}>
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
