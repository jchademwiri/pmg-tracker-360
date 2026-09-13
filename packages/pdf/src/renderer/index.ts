import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { ReactNode } from "react";
import * as takumi from "takumi-pdf/no-init";
import type {
  NodeInput,
  PageMargin,
  PageSize,
  PdfMetadata,
  RenderOptions,
} from "takumi-pdf/no-init";
import type { PdfOrientation, PdfRenderResult } from "../types/index.js";

let isWasmInitialized = false;

function ensureWasmInitialized(): void {
  if (isWasmInitialized) return;

  try {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve("takumi-pdf/takumi_pdf_wasm_bg.wasm");
    const wasmBytes = readFileSync(wasmPath);
    takumi.initSync({ module: wasmBytes });
    isWasmInitialized = true;
  } catch (error) {
    throw new Error(
      `Failed to initialize Takumi PDF WebAssembly module: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface RenderPdfOptions {
  size?: PageSize;
  orientation?: PdfOrientation;
  margin?: PageMargin;
  header?: NodeInput;
  footer?: NodeInput;
  metadata?: PdfMetadata;
  backgroundColor?: string;
}

export async function renderToPdf(
  element: ReactNode | string,
  options: RenderPdfOptions = {}
): Promise<PdfRenderResult> {
  ensureWasmInitialized();

  const startTime = Date.now();
  const isLandscape = options.orientation === "landscape";

  const renderOpts: RenderOptions = {
    size: options.size ?? "a4",
    landscape: isLandscape,
    margin: options.margin,
    header: options.header,
    footer: options.footer,
    metadata: options.metadata,
    backgroundColor: options.backgroundColor ?? "#FFFFFF",
  };

  const bytes = await takumi.render(element, renderOpts);
  const durationMs = Date.now() - startTime;

  return {
    bytes,
    durationMs,
  };
}

export { takumi };
