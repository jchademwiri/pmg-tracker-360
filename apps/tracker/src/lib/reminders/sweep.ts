import { db } from "@pmg/db";
import {
  tender,
  tenderExtension,
  tenderFollowUp,
  project,
  purchaseOrder,
  client,
  reminderLog,
} from "@pmg/db/schema";
import { and, eq, isNull, notInArray, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/server/notifications";
import { getReminderRecipients, type ReminderRecipient } from "./recipients";
import { getReminderPreferences } from "./preferences";
import { sendReminderEmail } from "./email";
import {
  REMINDER_STAGE_OFFSETS,
  REMINDER_STAGES,
  REMINDER_PREFERENCE_GATE,
  stageLabel,
  type ReminderStageValue,
  type ReminderTypeValue,
} from "./config";
import { nowInSAST, toSASTDateString, parseDateToUTC } from "@/lib/timezone";
import { env } from "@/env";
import TenderDeadlineReminder from "@/emails/tender-deadline-reminder";
import TenderFollowUpReminder from "@/emails/tender-follow-up-reminder";
import ProjectMilestoneReminder from "@/emails/project-milestone-reminder";
import PoDeliveryReminder from "@/emails/po-delivery-reminder";

const TENDER_TERMINAL_STATUSES = [
  "closed",
  "awarded",
  "lost",
  "cancelled",
] as const;
const PROJECT_TERMINAL_STATUSES = ["completed", "cancelled"] as const;
const PO_TERMINAL_STATUSES = [
  "delivered",
  "completed",
  "cancelled",
] as const;

const APP_BASE_URL = env.NEXT_PUBLIC_URL || "http://localhost:3000";

const DATE_FORMAT = new Intl.DateTimeFormat("en-ZA", {
  timeZone: "Africa/Johannesburg",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

/** Number of SAST calendar days between `fieldDate` and "now" (positive = future). */
function sastDayDiff(fieldDate: Date, now: Date): number {
  const fieldDay = parseDateToUTC(toSASTDateString(fieldDate))!;
  const nowDay = parseDateToUTC(toSASTDateString(now))!;
  return Math.round(
    (fieldDay.getTime() - nowDay.getTime()) / (24 * 60 * 60 * 1000),
  );
}

/** Which stage (if any) a given date currently falls into, relative to now. */
function matchStage(fieldDate: Date, now: Date): ReminderStageValue | null {
  const diff = sastDayDiff(fieldDate, now);
  if (diff < 0) return "overdue";
  for (const stage of REMINDER_STAGES) {
    if (stage === "overdue") continue;
    if (REMINDER_STAGE_OFFSETS[stage] === diff) return stage;
  }
  return null;
}

interface Candidate {
  entityType: ReminderTypeValue;
  entityId: string;
  organizationId: string;
  targetDate: Date;
  stage: ReminderStageValue;
  render: (
    recipientName: string,
  ) => { subject: string; react: ReturnType<typeof TenderDeadlineReminder> };
}

const recipientCache = new Map<string, ReminderRecipient[]>();
async function recipientsForOrg(organizationId: string) {
  const cached = recipientCache.get(organizationId);
  if (cached) return cached;
  const recipients = await getReminderRecipients(organizationId);
  recipientCache.set(organizationId, recipients);
  return recipients;
}

async function collectTenderCandidates(now: Date): Promise<Candidate[]> {
  const candidates: Candidate[] = [];

  const tenders = await db
    .select({
      id: tender.id,
      organizationId: tender.organizationId,
      tenderNumber: tender.tenderNumber,
      status: tender.status,
      submissionDate: tender.submissionDate,
      evaluationDate: tender.evaluationDate,
      briefingDate: tender.briefingDate,
      clientName: client.name,
    })
    .from(tender)
    .innerJoin(client, eq(tender.clientId, client.id))
    .where(
      and(
        isNull(tender.deletedAt),
        notInArray(tender.status, [...TENDER_TERMINAL_STATUSES]),
      ),
    );

  if (tenders.length === 0) return candidates;

  // Active (non-deleted) extensions, most recent first, to find each
  // tender's effective evaluation date.
  const extensions = await db
    .select({
      tenderId: tenderExtension.tenderId,
      newEvaluationDate: tenderExtension.newEvaluationDate,
    })
    .from(tenderExtension)
    .where(isNull(tenderExtension.deletedAt))
    .orderBy(desc(tenderExtension.extensionDate));

  const latestExtensionByTender = new Map<string, Date>();
  for (const ext of extensions) {
    if (!latestExtensionByTender.has(ext.tenderId)) {
      latestExtensionByTender.set(ext.tenderId, ext.newEvaluationDate);
    }
  }

  for (const t of tenders) {
    const tenderLink = `${APP_BASE_URL}/tenders/${t.id}`;

    if (t.submissionDate && t.status !== "submitted") {
      const stage = matchStage(t.submissionDate, now);
      if (stage) {
        candidates.push({
          entityType: "tender_submission",
          entityId: t.id,
          organizationId: t.organizationId,
          targetDate: t.submissionDate,
          stage,
          render: (recipientName) => ({
            subject: `${stageLabel(stage)}: Submission deadline for tender ${t.tenderNumber}`,
            react: TenderDeadlineReminder({
              recipientName,
              tenderNumber: t.tenderNumber,
              clientName: t.clientName,
              deadlineLabel: "Submission",
              deadlineDate: formatDate(t.submissionDate!),
              stageLabel: stageLabel(stage),
              tenderLink,
            }),
          }),
        });
      }
    }

    const effectiveEvaluationDate =
      latestExtensionByTender.get(t.id) ?? t.evaluationDate;
    if (effectiveEvaluationDate) {
      const stage = matchStage(effectiveEvaluationDate, now);
      if (stage) {
        candidates.push({
          entityType: "tender_evaluation",
          entityId: t.id,
          organizationId: t.organizationId,
          targetDate: effectiveEvaluationDate,
          stage,
          render: (recipientName) => ({
            subject: `${stageLabel(stage)}: Evaluation deadline for tender ${t.tenderNumber}`,
            react: TenderDeadlineReminder({
              recipientName,
              tenderNumber: t.tenderNumber,
              clientName: t.clientName,
              deadlineLabel: "Evaluation",
              deadlineDate: formatDate(effectiveEvaluationDate),
              stageLabel: stageLabel(stage),
              tenderLink,
            }),
          }),
        });
      }
    }

    if (t.briefingDate) {
      const stage = matchStage(t.briefingDate, now);
      if (stage) {
        candidates.push({
          entityType: "tender_briefing",
          entityId: t.id,
          organizationId: t.organizationId,
          targetDate: t.briefingDate,
          stage,
          render: (recipientName) => ({
            subject: `${stageLabel(stage)}: Briefing for tender ${t.tenderNumber}`,
            react: TenderDeadlineReminder({
              recipientName,
              tenderNumber: t.tenderNumber,
              clientName: t.clientName,
              deadlineLabel: "Briefing",
              deadlineDate: formatDate(t.briefingDate!),
              stageLabel: stageLabel(stage),
              tenderLink,
            }),
          }),
        });
      }
    }
  }

  const activeTenderById = new Map(tenders.map((t) => [t.id, t]));

  const followUps = await db
    .select({
      id: tenderFollowUp.id,
      tenderId: tenderFollowUp.tenderId,
      organizationId: tenderFollowUp.organizationId,
      nextFollowUpDate: tenderFollowUp.nextFollowUpDate,
      notes: tenderFollowUp.notes,
      outcome: tenderFollowUp.outcome,
    })
    .from(tenderFollowUp);

  for (const f of followUps) {
    if (!f.nextFollowUpDate) continue;
    if (f.outcome && f.outcome.trim() !== "") continue; // already actioned
    const parentTender = activeTenderById.get(f.tenderId);
    if (!parentTender) continue; // tender deleted or in a terminal status

    const stage = matchStage(f.nextFollowUpDate, now);
    if (!stage) continue;

    const tenderLink = `${APP_BASE_URL}/tenders/${f.tenderId}`;
    candidates.push({
      entityType: "tender_follow_up",
      entityId: f.id,
      organizationId: f.organizationId,
      targetDate: f.nextFollowUpDate,
      stage,
      render: (recipientName) => ({
        subject: `${stageLabel(stage)}: Follow-up for tender ${parentTender.tenderNumber}`,
        react: TenderFollowUpReminder({
          recipientName,
          tenderNumber: parentTender.tenderNumber,
          clientName: parentTender.clientName,
          followUpDate: formatDate(f.nextFollowUpDate!),
          stageLabel: stageLabel(stage),
          notes: f.notes ?? undefined,
          tenderLink,
        }),
      }),
    });
  }

  return candidates;
}

async function collectProjectCandidates(now: Date): Promise<Candidate[]> {
  const candidates: Candidate[] = [];

  const projects = await db
    .select({
      id: project.id,
      organizationId: project.organizationId,
      projectNumber: project.projectNumber,
      status: project.status,
      contractEndDate: project.contractEndDate,
      closeOutDate: project.closeOutDate,
      clientName: client.name,
    })
    .from(project)
    .leftJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        isNull(project.deletedAt),
        notInArray(project.status, [...PROJECT_TERMINAL_STATUSES]),
      ),
    );

  for (const p of projects) {
    const projectLink = `${APP_BASE_URL}/projects/${p.id}`;
    const clientName = p.clientName ?? "—";

    if (p.contractEndDate) {
      const stage = matchStage(p.contractEndDate, now);
      if (stage) {
        candidates.push({
          entityType: "project_contract_end",
          entityId: p.id,
          organizationId: p.organizationId,
          targetDate: p.contractEndDate,
          stage,
          render: (recipientName) => ({
            subject: `${stageLabel(stage)}: Contract end for project ${p.projectNumber}`,
            react: ProjectMilestoneReminder({
              recipientName,
              projectNumber: p.projectNumber,
              clientName,
              milestoneLabel: "Contract End",
              milestoneDate: formatDate(p.contractEndDate!),
              stageLabel: stageLabel(stage),
              projectLink,
            }),
          }),
        });
      }
    }

    if (p.closeOutDate) {
      const stage = matchStage(p.closeOutDate, now);
      if (stage) {
        candidates.push({
          entityType: "project_close_out",
          entityId: p.id,
          organizationId: p.organizationId,
          targetDate: p.closeOutDate,
          stage,
          render: (recipientName) => ({
            subject: `${stageLabel(stage)}: Close-out for project ${p.projectNumber}`,
            react: ProjectMilestoneReminder({
              recipientName,
              projectNumber: p.projectNumber,
              clientName,
              milestoneLabel: "Close-Out",
              milestoneDate: formatDate(p.closeOutDate!),
              stageLabel: stageLabel(stage),
              projectLink,
            }),
          }),
        });
      }
    }
  }

  return candidates;
}

async function collectPurchaseOrderCandidates(now: Date): Promise<Candidate[]> {
  const candidates: Candidate[] = [];

  const orders = await db
    .select({
      id: purchaseOrder.id,
      organizationId: purchaseOrder.organizationId,
      poNumber: purchaseOrder.poNumber,
      supplierName: purchaseOrder.supplierName,
      status: purchaseOrder.status,
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
    })
    .from(purchaseOrder)
    .where(
      and(
        isNull(purchaseOrder.deletedAt),
        notInArray(purchaseOrder.status, [...PO_TERMINAL_STATUSES]),
      ),
    );

  for (const po of orders) {
    if (!po.expectedDeliveryDate) continue;
    const stage = matchStage(po.expectedDeliveryDate, now);
    if (!stage) continue;

    const poLink = `${APP_BASE_URL}/projects/purchase-orders/${po.id}`;
    candidates.push({
      entityType: "po_expected_delivery",
      entityId: po.id,
      organizationId: po.organizationId,
      targetDate: po.expectedDeliveryDate,
      stage,
      render: (recipientName) => ({
        subject: `${stageLabel(stage)}: Expected delivery for PO ${po.poNumber}`,
        react: PoDeliveryReminder({
          recipientName,
          poNumber: po.poNumber,
          supplierName: po.supplierName ?? "",
          expectedDeliveryDate: formatDate(po.expectedDeliveryDate!),
          stageLabel: stageLabel(stage),
          poLink,
        }),
      }),
    });
  }

  return candidates;
}

async function alreadySent(candidate: Candidate): Promise<boolean> {
  const [existing] = await db
    .select({ id: reminderLog.id })
    .from(reminderLog)
    .where(
      and(
        eq(reminderLog.entityType, candidate.entityType),
        eq(reminderLog.entityId, candidate.entityId),
        eq(reminderLog.stage, candidate.stage),
        eq(reminderLog.targetDate, candidate.targetDate),
      ),
    )
    .limit(1);
  return !!existing;
}

export async function runReminderSweep(): Promise<{
  success: boolean;
  message: string;
  sent: number;
}> {
  const now = nowInSAST();
  const errors: string[] = [];
  let sent = 0;

  const candidates = [
    ...(await collectTenderCandidates(now)),
    ...(await collectProjectCandidates(now)),
    ...(await collectPurchaseOrderCandidates(now)),
  ];

  for (const candidate of candidates) {
    try {
      if (await alreadySent(candidate)) continue;

      const recipients = await recipientsForOrg(candidate.organizationId);
      const preferenceKey = REMINDER_PREFERENCE_GATE[candidate.entityType];

      let recipientCount = 0;
      for (const recipient of recipients) {
        const prefs = await getReminderPreferences(recipient.userId);
        if (!prefs[preferenceKey]) continue;

        const { subject, react } = candidate.render(recipient.name);

        if (prefs.emailNotifications) {
          await sendReminderEmail({ to: recipient.email, subject, react });
        }

        await createNotification({
          userId: recipient.userId,
          organizationId: candidate.organizationId,
          title: subject,
          message: subject,
          type: candidate.stage === "overdue" ? "warning" : "info",
        });

        recipientCount++;
      }

      await db.insert(reminderLog).values({
        id: nanoid(),
        organizationId: candidate.organizationId,
        entityType: candidate.entityType,
        entityId: candidate.entityId,
        stage: candidate.stage,
        targetDate: candidate.targetDate,
        recipientCount,
      });

      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `Reminder sweep failed for ${candidate.entityType}:${candidate.entityId}:${candidate.stage}`,
        err,
      );
      errors.push(`${candidate.entityType}:${candidate.entityId}: ${message}`);
    }
  }

  const message =
    errors.length === 0
      ? `Sent ${sent} reminders across ${candidates.length} candidate items`
      : `Sent ${sent}/${candidates.length} reminders, ${errors.length} failed: ${errors.join("; ")}`;

  return { success: errors.length === 0, message, sent };
}
