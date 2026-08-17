"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { HOMEPAGE_FAQS } from "@/data/faqs";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-24 border-t border-border/40 bg-background scroll-mt-20"
    >
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
            Everything you need to know about tracking tenders, validity
            periods, and Purchase Orders.
          </p>
        </div>

        {/* Accessible Accordion Items */}
        <div className="space-y-3 text-left">
          {HOMEPAGE_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-btn-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden transition-all duration-200"
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3 animate-in fade-in-50 duration-150"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Need assistance with your bidding workflow?{" "}
          <Link
            href="/contact"
            className="text-primary font-bold hover:underline"
          >
            Contact our South African support desk &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
