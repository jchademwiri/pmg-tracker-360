'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do the briefing and closing date reminders work?',
      a: 'When you log a tender, you can set mandatory briefing session dates and closing cutoff dates. Tender Track 360 automatically triggers email alerts and dashboard urgency sirens at 72 hours, 24 hours, and 4 hours before cutoff so you never miss a submission.',
    },
    {
      q: 'What is the tender validity expiry reminder and how does it help?',
      a: 'Most South African government and private tenders have a 90-day or 120-day validity period. If an evaluation committee has not published an award notice and the validity date is nearing expiry, Tender Track 360 alerts you to follow up proactively with the procurement office.',
    },
    {
      q: 'How does managing Purchase Orders (POs) on awarded tenders work?',
      a: 'When your tender is awarded, convert it into an active project in one click. You can log supplier and client POs, track itemized delivery line items, monitor delivery receipts, and forecast 30/60/90-day cashflow.',
    },
    {
      q: 'Can I download presentation-ready reports in Excel and PDF?',
      a: 'Yes. Generate real-time Tender Register exports and pipeline summaries in formatted Excel (.xlsx) workbooks or executive PDF reports ready for boardrooms, directors, and client presentations.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-24 border-t border-border/40 bg-background scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty">
            Everything you need to know about tracking tenders, validity periods, and Purchase Orders.
          </p>
        </div>

        {/* 4 Accessible Accordion Items */}
        <div className="space-y-3 text-left">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3 animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Need assistance with your bidding workflow?{' '}
          <Link href="/contact" className="text-primary font-bold hover:underline">
            Contact our South African support desk &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
