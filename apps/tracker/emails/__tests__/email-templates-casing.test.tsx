import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TenderDeadlineReminder from "../tender-deadline-reminder";
import TenderFollowUpReminder from "../tender-follow-up-reminder";
import ProjectMilestoneReminder from "../project-milestone-reminder";
import PoDeliveryReminder from "../po-delivery-reminder";

describe("Email notification templates uppercase casing", () => {
  describe("TenderDeadlineReminder", () => {
    it("renders client name, tender number, and tender description in ALL CAPS", async () => {
      const html = renderToStaticMarkup(
        <TenderDeadlineReminder
          recipientName="John Doe"
          tenderNumber="tnd-2026-001"
          clientName="eskom holdings soc ltd"
          tenderDescription="supply and delivery of transformers"
          deadlineLabel="Submission"
          deadlineDate="28 August 2026"
          stageLabel="Due in 7 days"
          tenderLink="https://tendertrack360.co.za/tenders/123"
        />
      );

      expect(html).toContain("TND-2026-001");
      expect(html).not.toContain("tnd-2026-001");

      expect(html).toContain("ESKOM HOLDINGS SOC LTD");
      expect(html).not.toContain("eskom holdings soc ltd");

      expect(html).toContain("SUPPLY AND DELIVERY OF TRANSFORMERS");
      expect(html).not.toContain("supply and delivery of transformers");

      // Verify description appears along with tender number
      expect(html).toContain("TND-2026-001 - SUPPLY AND DELIVERY OF TRANSFORMERS");
    });

    it("renders tender number alone when tender description is not provided", async () => {
      const html = renderToStaticMarkup(
        <TenderDeadlineReminder
          recipientName="John Doe"
          tenderNumber="tnd-2026-001"
          clientName="eskom"
          deadlineLabel="Submission"
          deadlineDate="28 August 2026"
          stageLabel="Due in 7 days"
          tenderLink="https://tendertrack360.co.za/tenders/123"
        />
      );

      expect(html).toContain("TND-2026-001");
      expect(html).not.toContain("TND-2026-001 -");
    });
  });

  describe("TenderFollowUpReminder", () => {
    it("renders client name, tender number, and tender description in ALL CAPS", async () => {
      const html = renderToStaticMarkup(
        <TenderFollowUpReminder
          recipientName="John Doe"
          tenderNumber="tnd-2026-002"
          clientName="city of cape town"
          tenderDescription="consulting engineering services"
          followUpDate="30 August 2026"
          stageLabel="Due tomorrow"
          tenderLink="https://tendertrack360.co.za/tenders/456"
        />
      );

      expect(html).toContain("TND-2026-002");
      expect(html).not.toContain("tnd-2026-002");

      expect(html).toContain("CITY OF CAPE TOWN");
      expect(html).not.toContain("city of cape town");

      expect(html).toContain("CONSULTING ENGINEERING SERVICES");
      expect(html).not.toContain("consulting engineering services");

      // Verify description appears along with tender number
      expect(html).toContain("TND-2026-002 - CONSULTING ENGINEERING SERVICES");
    });
  });

  describe("ProjectMilestoneReminder", () => {
    it("renders client name, project number, and project description in ALL CAPS", async () => {
      const html = renderToStaticMarkup(
        <ProjectMilestoneReminder
          recipientName="Jane Smith"
          projectNumber="prj-2026-099"
          clientName="transnet freight rail"
          projectDescription="rail signaling upgrade package a"
          milestoneLabel="Contract End"
          milestoneDate="15 September 2026"
          stageLabel="Due in 7 days"
          projectLink="https://tendertrack360.co.za/projects/789"
        />
      );

      expect(html).toContain("PRJ-2026-099");
      expect(html).not.toContain("prj-2026-099");

      expect(html).toContain("TRANSNET FREIGHT RAIL");
      expect(html).not.toContain("transnet freight rail");

      expect(html).toContain("RAIL SIGNALING UPGRADE PACKAGE A");
      expect(html).not.toContain("rail signaling upgrade package a");

      // Verify description appears along with project number
      expect(html).toContain("PRJ-2026-099 - RAIL SIGNALING UPGRADE PACKAGE A");
    });
  });

  describe("PoDeliveryReminder", () => {
    it("renders PO number, supplier name, and PO description in ALL CAPS", async () => {
      const html = renderToStaticMarkup(
        <PoDeliveryReminder
          recipientName="Jane Smith"
          poNumber="po-2026-555"
          supplierName="steel and tube suppliers"
          poDescription="structural steel beams and fasteners"
          expectedDeliveryDate="10 October 2026"
          stageLabel="Due tomorrow"
          poLink="https://tendertrack360.co.za/projects/purchase-orders/555"
        />
      );

      expect(html).toContain("PO-2026-555");
      expect(html).not.toContain("po-2026-555");

      expect(html).toContain("STEEL AND TUBE SUPPLIERS");
      expect(html).not.toContain("steel and tube suppliers");

      expect(html).toContain("STRUCTURAL STEEL BEAMS AND FASTENERS");
      expect(html).not.toContain("structural steel beams and fasteners");

      // Verify description appears along with PO number
      expect(html).toContain("PO-2026-555 - STRUCTURAL STEEL BEAMS AND FASTENERS");
    });
  });
});
