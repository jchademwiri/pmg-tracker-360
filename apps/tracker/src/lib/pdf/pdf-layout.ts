import "server-only";

import { jsPDF } from "jspdf";
import { StorageService } from "@/lib/storage";

export const PAGE = { width: 210, height: 297, margin: 14, bottom: 280 };

export function splitText(
  doc: jsPDF,
  text: string | undefined | null,
  width: number,
) {
  return doc.splitTextToSize(text || "", width) as string[];
}

export function ensurePage(doc: jsPDF, y: number, needed = 16) {
  if (y + needed <= PAGE.bottom) return y;
  doc.addPage();
  return PAGE.margin;
}

const LOGO_FETCH_TIMEOUT_MS = 5000;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB safety cap

function getAllowedLogoHost(): string | null {
  try {
    const endpoint =
      process.env.S3_API ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : null);
    return endpoint ? new URL(endpoint).hostname : null;
  } catch {
    return null;
  }
}

function isAllowedLogoUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  const allowedHost = getAllowedLogoHost();
  if (!allowedHost) return false;
  return (
    url.hostname === allowedHost || url.hostname.endsWith(`.${allowedHost}`)
  );
}

/**
 * `organization.logo` is either a stored object key (from the upload flow —
 * resolve via a signed URL scoped to our own bucket) or, for legacy/manually
 * entered values, an arbitrary URL. Since organization admins fully control
 * this field, never fetch it directly: resolve keys through
 * StorageService.getSignedUrl (never a raw attacker-supplied host) and
 * reject anything that doesn't resolve to our configured storage host.
 */
async function resolveLogoUrl(logo: string | null): Promise<string | null> {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  const signedUrl = await StorageService.getSignedUrl(logo);
  return signedUrl.startsWith("http") ? signedUrl : null;
}

export async function fetchLogoBase64(
  logo: string | null,
): Promise<string | null> {
  const logoUrl = await resolveLogoUrl(logo);
  if (!logoUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(logoUrl);
  } catch {
    return null;
  }

  // SSRF guard: organization logos are attacker-controlled input (any org
  // owner/admin can set one), so only ever fetch from our own storage host
  // over HTTPS, and never follow a redirect to an unvalidated host.
  if (!isAllowedLogoUrl(parsed)) return null;

  try {
    const response = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
      redirect: "manual",
    });
    if (response.status !== 200 || !response.body) return null;

    const chunks: Uint8Array[] = [];
    let total = 0;
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      total += chunk.length;
      if (total > MAX_LOGO_BYTES) return null;
      chunks.push(chunk);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.concat(chunks);
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    // Logo fetch is best-effort; fall back to text header if it fails,
    // times out, or exceeds the size cap.
    return null;
  }
}

/**
 * Organization contact details (phone/address/website) are stored in
 * `organization.metadata` as a JSON blob (see general-tab.tsx), either
 * already-parsed or as a JSON string depending on the caller.
 */
export function parseOrganizationMetadata(
  metadata: Record<string, unknown> | string | null | undefined,
): { phone?: string; address?: string; website?: string } {
  if (!metadata) return {};
  const parsed =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata);
          } catch {
            return {};
          }
        })()
      : metadata;
  return {
    phone: typeof parsed?.phone === "string" ? parsed.phone : undefined,
    address: typeof parsed?.address === "string" ? parsed.address : undefined,
    website: typeof parsed?.website === "string" ? parsed.website : undefined,
  };
}

export type OrgBranding = {
  name: string;
  logoDataUri: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
};

/**
 * Truncates `text` with a trailing ellipsis so it fits within `maxWidth`
 * (mm) at the doc's currently-set font/size. No-op if it already fits.
 */
function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  const ellipsis = "…";
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (doc.getTextWidth(text.slice(0, mid) + ellipsis) <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return text.slice(0, low) + ellipsis;
}

/** Draws the shared header chrome and returns the y-coordinate where body content should start. */
export function drawStandardHeader(
  doc: jsPDF,
  opts: {
    org: OrgBranding;
    titleLabel: string;
    primaryLine: string;
    secondaryLine?: string;
  },
) {
  const { org, titleLabel, primaryLine, secondaryLine } = opts;

  doc.setFillColor(79, 70, 229); // indigo-600, matches app accent
  doc.rect(0, 0, PAGE.width, 3, "F");

  if (org.logoDataUri) {
    try {
      doc.addImage(org.logoDataUri, PAGE.margin, 10, 20, 20, undefined, "FAST");
    } catch {
      // Corrupt/unsupported image format — fall back to text below.
    }
  }

  const textX = org.logoDataUri ? PAGE.margin + 26 : PAGE.margin;
  const rightX = PAGE.width - PAGE.margin;

  // Measure the right-hand title block first so the left-hand org identity
  // block can be constrained to never run into it, regardless of how long
  // the organization name or title text is.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleWidth = doc.getTextWidth(titleLabel);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const primaryWidth = doc.getTextWidth(primaryLine);
  let secondaryWidth = 0;
  if (secondaryLine) {
    doc.setFontSize(8);
    secondaryWidth = doc.getTextWidth(secondaryLine);
  }
  const rightBlockWidth = Math.max(titleWidth, primaryWidth, secondaryWidth);
  const gap = 8;
  const leftMaxWidth = rightX - rightBlockWidth - gap - textX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text(fitText(doc, org.name, leftMaxWidth), textX, 18);

  const detailLines = [org.phone, org.address, org.website].filter(
    (line): line is string => Boolean(line),
  );
  if (detailLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    detailLines
      .slice(0, 3)
      .forEach((line, index) =>
        doc.text(fitText(doc, line, leftMaxWidth), textX, 24 + index * 4.5),
      );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(63, 63, 70);
  doc.text(titleLabel, rightX, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(39, 39, 42);
  doc.text(primaryLine, rightX, 23, { align: "right" });

  if (secondaryLine) {
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(secondaryLine, rightX, 28, { align: "right" });
  }

  doc.setDrawColor(229, 231, 235);
  doc.line(PAGE.margin, 40, PAGE.width - PAGE.margin, 40);

  return 52;
}

export function drawStandardFooter(doc: jsPDF, orgName: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(PAGE.margin, 282, PAGE.width - PAGE.margin, 282);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(
      orgName ? `Tender Tracker 360 - ${orgName}` : "Tender Tracker 360",
      PAGE.margin,
      288,
    );
    doc.text(`Page ${i} of ${pageCount}`, PAGE.width - PAGE.margin, 288, {
      align: "right",
    });
  }
}

export type TableColumn = {
  key: string;
  label: string;
  widthMm: number;
  x: number;
  align?: "left" | "right";
  wrap?: boolean;
  bold?: boolean;
};

function drawTableHeaderRow(doc: jsPDF, y: number, columns: TableColumn[]) {
  doc.setFillColor(249, 250, 251);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  for (const col of columns) {
    doc.text(
      col.label,
      col.x,
      y + 6,
      col.align === "right" ? { align: "right" } : undefined,
    );
  }
  return y + 12;
}

/**
 * Generic table renderer with pagination: re-draws the header row whenever
 * a row forces a page break, mirroring po-pdf.ts's original line-items
 * table behavior.
 */
export function drawTable(
  doc: jsPDF,
  opts: {
    startY: number;
    columns: TableColumn[];
    rows: Record<string, string>[];
    emptyMessage?: string;
  },
) {
  const { columns, rows, emptyMessage } = opts;
  let y = drawTableHeaderRow(doc, opts.startY, columns);

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(emptyMessage || "No records.", PAGE.margin + 2, y + 4);
    return y + 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const row of rows) {
    const wrappedCells = columns.map((col) =>
      col.wrap
        ? splitText(doc, row[col.key], col.widthMm)
        : [row[col.key] ?? ""],
    );
    const rowHeight = Math.max(
      10,
      Math.max(...wrappedCells.map((lines) => lines.length)) * 4 + 4,
    );

    const pageBefore = doc.getNumberOfPages();
    y = ensurePage(doc, y, rowHeight);
    if (doc.getNumberOfPages() !== pageBefore) {
      y = drawTableHeaderRow(doc, y, columns);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    columns.forEach((col, i) => {
      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", col.bold ? "bold" : "normal");
      doc.text(
        wrappedCells[i]!,
        col.x,
        y + 4,
        col.align === "right" ? { align: "right" } : undefined,
      );
    });
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(244, 244, 245);
    doc.line(
      PAGE.margin,
      y + rowHeight,
      PAGE.width - PAGE.margin,
      y + rowHeight,
    );
    y += rowHeight;
  }

  return y + 6;
}
