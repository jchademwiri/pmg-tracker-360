#!/usr/bin/env bun
/**
 * generate-index.ts
 *
 * Scans a results directory for completed findings.md files and generates
 * a consolidated INDEX.md with summary scores, issue counts, and links.
 *
 * Usage:
 *   bun run scripts/generate-index.ts [results-dir]
 *
 * Defaults to: docs/audit/app-improvements/results
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join, basename } from "path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FindingMetadata {
  prompt: string;
  date: string;
  auditor: string;
  scope: string;
  dependsOn: string;
}

interface ScoreEntry {
  area: string;
  score: number;
  trend: string;
}

interface IssueCount {
  id: string;
  issue: string;
  location: string;
  impact: string;
  effort: string;
}

interface ParsedFinding {
  filePath: string;
  directory: string;
  metadata: FindingMetadata | null;
  overallScore: number | null;
  summary: string;
  scores: ScoreEntry[];
  criticalIssues: IssueCount[];
  majorIssues: IssueCount[];
  minorIssues: IssueCount[];
  quickWins: number;
  shortTerm: number;
  mediumTerm: number;
}

// Expected prompts that should produce findings
const EXPECTED_PROMPTS = [
  "01-codebase-audit",
  "02-dashboard-audit",
  "03-tender-management",
  "04-project-management",
  "05-workflow",
  "06-mobile-ux",
  "07-premium-ui",
  "08-navigation",
  "09-forms-data-capture",
  "10-deliverables-roadmap",
];

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

function extractMetadata(content: string): FindingMetadata | null {
  const promptMatch = content.match(
    /\*\*Prompt\*\*\s*\|\s*\[?([^\]\n|]+)/i
  );
  const dateMatch = content.match(/\*\*Date\*\*\s*\|\s*\[?([^\]\n|]+)/i);
  const auditorMatch = content.match(
    /\*\*Auditor\*\*\s*\|\s*\[?([^\]\n|]+)/i
  );
  const scopeMatch = content.match(/\*\*Scope\*\*\s*\|\s*\[?([^\]\n|]+)/i);
  const dependsMatch = content.match(
    /\*\*Depends On\*\*\s*\|\s*\[?([^\]\n|]+)/i
  );

  if (!promptMatch && !dateMatch) return null;

  return {
    prompt: promptMatch?.[1]?.trim() || "Unknown",
    date: dateMatch?.[1]?.trim() || "Unknown",
    auditor: auditorMatch?.[1]?.trim() || "Unknown",
    scope: scopeMatch?.[1]?.trim() || "No scope defined",
    dependsOn: dependsMatch?.[1]?.trim() || "None",
  };
}

function extractOverallScore(content: string): number | null {
  const match = content.match(/Overall Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return match ? parseFloat(match[1]) : null;
}

function extractScores(content: string): ScoreEntry[] {
  const scores: ScoreEntry[] = [];
  // Find the scores table by searching for the header directly
  const headerIdx = content.indexOf("| Area | Score | Trend |");
  if (headerIdx === -1) return scores;

  // Extract lines from header onwards until next section separator
  const afterHeader = content.substring(headerIdx);
  const endIdx =
    afterHeader.indexOf("\n---") !== -1
      ? afterHeader.indexOf("\n---")
      : afterHeader.indexOf("\n## ");
  const tableBlock = endIdx !== -1 ? afterHeader.substring(0, endIdx) : afterHeader;

  const rows = tableBlock.split("\n").filter((line) =>
    line.match(/^\|\s*.+\|\s*\d+\/10/)
  );

  for (const row of rows) {
    const parts = row
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      const scoreMatch = parts[1].match(/(\d+(?:\.\d+)?)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      scores.push({
        area: parts[0],
        score,
        trend: parts[2],
      });
    }
  }
  return scores;
}

function extractSummary(content: string): string {
  const match = content.match(
    /## Executive Summary\s*\n\n([\s\S]*?)(?=\n---|\n\*\*Overall)/
  );
  return match ? match[1].trim().split("\n")[0] : "";
}

/** Extract a section between a ### heading and the next ### or ## heading */
function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`###\\s+${escapeRegex(heading)}[\\s]*\\n`, "i");
  const match = content.match(regex);
  if (!match) return "";

  const startIdx = match.index! + match[0].length;
  // Find next heading (### or ##)
  const rest = content.substring(startIdx);
  const nextHeading = rest.search(/\n#{2,3}\s/);
  return nextHeading !== -1 ? rest.substring(0, nextHeading) : rest;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countIssues(content: string, pattern: string): IssueCount[] {
  const issues: IssueCount[] = [];
  const section = extractSection(content, pattern);
  if (!section) return issues;

  const rows = section.split("\n").filter((line) =>
    line.match(/^\|\s*[CMcm]\d+\s*\|/)
  );
  for (const row of rows) {
    const parts = row
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 5) {
      issues.push({
        id: parts[0],
        issue: parts[1],
        location: parts[2],
        impact: parts[3],
        effort: parts[4],
      });
    }
  }
  return issues;
}

function countRecommendations(content: string, heading: string): number {
  const section = extractSection(content, heading);
  if (!section) return 0;
  return (section.match(/^\d+\.\s+\*\*/gm) || []).length;
}

// ─── Directory Scanner ──────────────────────────────────────────────────────

async function findFindingsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name === "findings.md") {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const resultsDir = process.argv[2] || "docs/audit/app-improvements/results";

  console.log(`🔍 Scanning for findings.md files in: ${resultsDir}\n`);

  let files: string[];
  try {
    files = await findFindingsFiles(resultsDir);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      console.error(`❌ Directory not found: ${resultsDir}`);
    } else {
      console.error(`❌ Error reading directory: ${err?.message || err}`);
    }
    console.log(
      "\nUsage: bun run scripts/generate-index.ts [results-directory]"
    );
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("⚠️  No findings.md files found. Run the audit first.");
    process.exit(0);
  }

  console.log(`📄 Found ${files.length} findings file(s)\n`);

  // Parse all findings
  const findings: ParsedFinding[] = [];
  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const dir = basename(join(file, ".."));
    findings.push({
      filePath: file,
      directory: dir,
      metadata: extractMetadata(content),
      overallScore: extractOverallScore(content),
      summary: extractSummary(content),
      scores: extractScores(content),
      criticalIssues: countIssues(content, "Critical Issues"),
      majorIssues: countIssues(content, "Major Issues"),
      minorIssues: countIssues(content, "Minor Issues"),
      quickWins: countRecommendations(content, "Quick Wins"),
      shortTerm: countRecommendations(content, "Short-Term"),
      mediumTerm: countRecommendations(content, "Medium-Term"),
    });
  }

  // Detect which expected prompts are missing
  const completedDirs = new Set(findings.map((f) => f.directory));
  const missingPrompts = EXPECTED_PROMPTS.filter(
    (p) => !completedDirs.has(p) && !completedDirs.has(p.replace(/^\d+-/, ""))
  );

  // ─── Generate INDEX.md ──────────────────────────────────────────────────

  const lines: string[] = [];
  const now = new Date().toISOString().split("T")[0];

  lines.push("# Audit Findings Index");
  lines.push("");
  lines.push(
    `> Auto-generated on ${now} from ${findings.length} completed audit(s).`
  );
  lines.push("");

  // ── Missing Audits Alert ──────────────────────────────────────────────
  if (missingPrompts.length > 0) {
    lines.push("⚠️ **Missing Audits**");
    lines.push("");
    lines.push(
      "The following prompts have not been completed yet:"
    );
    for (const p of missingPrompts) {
      lines.push(`- [ ] ${p}`);
    }
    lines.push("");
  }

  // ── Overall Summary ────────────────────────────────────────────────────
  lines.push("## Overall Summary");
  lines.push("");

  const scoredFindings = findings.filter((f) => f.overallScore !== null);
  const avgScore =
    scoredFindings.length > 0
      ? (
          scoredFindings.reduce((sum, f) => sum + (f.overallScore || 0), 0) /
          scoredFindings.length
        ).toFixed(1)
      : "N/A";

  const totalCritical = findings.reduce(
    (sum, f) => sum + f.criticalIssues.length,
    0
  );
  const totalMajor = findings.reduce(
    (sum, f) => sum + f.majorIssues.length,
    0
  );
  const totalMinor = findings.reduce(
    (sum, f) => sum + f.minorIssues.length,
    0
  );
  const totalQuickWins = findings.reduce((sum, f) => sum + f.quickWins, 0);
  const totalShortTerm = findings.reduce((sum, f) => sum + f.shortTerm, 0);
  const totalMediumTerm = findings.reduce((sum, f) => sum + f.mediumTerm, 0);

  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Audits Completed** | ${findings.length} / ${EXPECTED_PROMPTS.length} |`);
  lines.push(`| **Average Score** | ${avgScore}/10 |`);
  lines.push(`| **Critical Issues** | ${totalCritical} |`);
  lines.push(`| **Major Issues** | ${totalMajor} |`);
  lines.push(`| **Minor Issues** | ${totalMinor} |`);
  lines.push(`| **Quick Wins** | ${totalQuickWins} |`);
  lines.push(`| **Short-Term Items** | ${totalShortTerm} |`);
  lines.push(`| **Medium-Term Items** | ${totalMediumTerm} |`);
  lines.push("");

  // ── Scores Overview ────────────────────────────────────────────────────
  if (scoredFindings.length > 0) {
    lines.push("## Scores by Area");
    lines.push("");
    lines.push("| Audit | Overall | Areas |");
    lines.push("|-------|---------|-------|");
    for (const f of scoredFindings) {
      const areaStr = f.scores
        .map((s) => `${s.area}: ${s.score}/10 ${s.trend}`)
        .join(", ");
      lines.push(
        `| [${f.metadata?.prompt || f.directory}](./${f.directory}/findings.md) | **${f.overallScore}/10** | ${areaStr || "—"} |`
      );
    }
    lines.push("");
  }

  // ── Issues Overview ────────────────────────────────────────────────────
  lines.push("## Issues by Audit");
  lines.push("");
  lines.push("| Audit | Critical | Major | Minor | Total |");
  lines.push("|-------|----------|-------|-------|-------|");
  for (const f of findings) {
    const c = f.criticalIssues.length;
    const m = f.majorIssues.length;
    const n = f.minorIssues.length;
    const total = c + m + n;
    lines.push(
      `| [${f.metadata?.prompt || f.directory}](./${f.directory}/findings.md) | ${c} | ${m} | ${n} | ${total} |`
    );
  }
  lines.push("");

  // ── Recommendations Overview ───────────────────────────────────────────
  lines.push("## Recommendations Overview");
  lines.push("");
  lines.push("| Audit | Quick Wins | Short-Term | Medium-Term | Total |");
  lines.push("|-------|------------|------------|-------------|-------|");
  for (const f of findings) {
    const total = f.quickWins + f.shortTerm + f.mediumTerm;
    lines.push(
      `| [${f.metadata?.prompt || f.directory}](./${f.directory}/findings.md) | ${f.quickWins} | ${f.shortTerm} | ${f.mediumTerm} | ${total} |`
    );
  }
  lines.push("");

  // ── Individual Findings ────────────────────────────────────────────────
  lines.push("## Individual Findings");
  lines.push("");
  for (const f of findings) {
    const meta = f.metadata;
    lines.push(`### ${meta?.prompt || f.directory}`);
    lines.push("");
    lines.push(
      `- **File:** [\`${f.directory}/findings.md\`](./${f.directory}/findings.md)`
    );
    lines.push(`- **Date:** ${meta?.date || "Unknown"}`);
    lines.push(`- **Auditor:** ${meta?.auditor || "Unknown"}`);
    lines.push(`- **Scope:** ${meta?.scope || "N/A"}`);
    lines.push(`- **Depends On:** ${meta?.dependsOn || "None"}`);
    if (f.overallScore !== null) {
      lines.push(`- **Overall Score:** ${f.overallScore}/10`);
    }
    if (f.summary) {
      lines.push(`- **Summary:** ${f.summary}`);
    }
    lines.push("");
  }

  // ── Critical Issues Detail ─────────────────────────────────────────────
  if (totalCritical > 0) {
    lines.push("## All Critical Issues");
    lines.push("");
    lines.push("| # | Audit | Issue | Location | Impact | Effort |");
    lines.push("|---|-------|-------|----------|--------|--------|");
    for (const f of findings) {
      for (const issue of f.criticalIssues) {
        lines.push(
          `| ${issue.id} | ${f.metadata?.prompt || f.directory} | ${issue.issue} | ${issue.location} | ${issue.impact} | ${issue.effort} |`
        );
      }
    }
    lines.push("");
  }

  // ── Quick Wins Detail ──────────────────────────────────────────────────
  lines.push("## Quick Wins (All Audits)");
  lines.push("");
  lines.push("> High-impact, low-effort items — prioritise these first.");
  lines.push("");
  for (const f of findings) {
    if (f.quickWins > 0) {
      lines.push(`**${f.metadata?.prompt || f.directory}:**`);
      lines.push(
        `- [${f.quickWins} quick win(s)](./${f.directory}/findings.md#quick-wins-1-2-days)`
      );
      lines.push("");
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push(
    "*This index is auto-generated. Run `bun run scripts/generate-index.ts` to refresh.*"
  );

  // ── Write Output ─────────────────────────────────────────────────────────
  const outputPath = join(resultsDir, "INDEX.md");
  await writeFile(outputPath, lines.join("\n"), "utf-8");

  console.log(`✅ Generated INDEX.md at: ${outputPath}`);
  console.log(`   → ${findings.length} audits indexed`);
  console.log(
    `   → ${totalCritical} critical / ${totalMajor} major / ${totalMinor} minor issues`
  );
  console.log(`   → ${totalQuickWins} quick wins identified`);
  if (missingPrompts.length > 0) {
    console.log(`   ⚠️  ${missingPrompts.length} audits still pending`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
