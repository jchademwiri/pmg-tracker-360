export interface FaqItem {
  q: string;
  a: string;
}

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    q: "How do the briefing and closing date reminders work?",
    a: "When you log a tender, you can set mandatory briefing session dates and closing cutoff dates. Tender Track 360 automatically triggers email alerts and dashboard urgency sirens at 72 hours, 24 hours, and 4 hours before cutoff so you never miss a submission.",
  },
  {
    q: "What is the tender validity expiry reminder and how does it help?",
    a: "Most South African government and private tenders have a 90-day or 120-day validity period. If an evaluation committee has not published an award notice and the validity date is nearing expiry, Tender Track 360 alerts you to follow up proactively with the procurement office.",
  },
  {
    q: "How does managing Purchase Orders (POs) on awarded tenders work?",
    a: "When your tender is awarded, convert it into an active project in one click. You can log supplier and client POs, track itemized delivery line items, monitor delivery receipts, and forecast 30/60/90-day cashflow.",
  },
  {
    q: "Can I download presentation-ready reports in Excel and PDF?",
    a: "Yes. Generate real-time Tender Register exports and pipeline summaries in formatted Excel (.xlsx) workbooks or executive PDF reports ready for boardrooms, directors, and client presentations.",
  },
];
