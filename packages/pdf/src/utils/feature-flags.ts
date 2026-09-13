import type { PdfDocumentKind } from "../types/index";

const VALID_DOCUMENT_KINDS: ReadonlySet<string> = new Set<PdfDocumentKind>([
  "purchase-order",
  "tender-detail",
  "tender-win-loss",
  "tender-register",
  "tender-follow-up",
  "platform-executive",
  "storage-audit",
  "security-audit",
]);

const warnedUnknownKinds = new Set<string>();

export function parsePdfcnAllowlist(
  rawEnv: string | undefined = process.env.PDFCN_DOCUMENTS,
): Set<PdfDocumentKind> {
  if (!rawEnv || typeof rawEnv !== "string") {
    return new Set<PdfDocumentKind>();
  }

  const trimmed = rawEnv.trim();
  if (!trimmed) {
    return new Set<PdfDocumentKind>();
  }

  const enabled = new Set<PdfDocumentKind>();
  const tokens = trimmed.split(",").map((t) => t.trim().toLowerCase());

  if (tokens.includes("all")) {
    for (const kind of VALID_DOCUMENT_KINDS) {
      enabled.add(kind as PdfDocumentKind);
    }
    return enabled;
  }

  for (const token of tokens) {
    if (!token) continue;

    if (VALID_DOCUMENT_KINDS.has(token)) {
      enabled.add(token as PdfDocumentKind);
    } else if (!warnedUnknownKinds.has(token)) {
      warnedUnknownKinds.add(token);
      console.warn(
        `[PDFCN] Unknown document kind "${token}" in PDFCN_DOCUMENTS allowlist. Valid values: ${Array.from(VALID_DOCUMENT_KINDS).join(", ")}`,
      );
    }
  }

  return enabled;
}

export function isPdfcnEnabled(
  kind: PdfDocumentKind,
  rawEnv?: string,
): boolean {
  const allowlist = parsePdfcnAllowlist(rawEnv);
  return allowlist.has(kind);
}
