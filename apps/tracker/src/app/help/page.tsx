import type { Metadata } from 'next';
import { Header } from '@/components/home-page/Header';
import { FooterSection } from '@/components/home-page/FooterSection';
import { Button } from '@/components/ui';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Settings,
  ShieldAlert,
  FolderLock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center & Support | Tender Track 360',
  description:
    'Browse our comprehensive guide, FAQs, and technical articles to master your tender management pipeline, compliance documentation, and project workflows.',
};

export default function HelpPage() {
  const categories = [
    {
      icon: BookOpen,
      title: 'Getting Started',
      description:
        'Set up your organization, invite core team members, and navigate your dashboard.',
      articles: '5 articles',
    },
    {
      icon: Settings,
      title: 'Tender Operations',
      description:
        'Add bidding numbers, resolve closing date statuses, and mark tenders as submitted.',
      articles: '8 articles',
    },
    {
      icon: FolderLock,
      title: 'Projects & POs',
      description:
        'Learn how won tenders automatically initialize projects and track purchase orders.',
      articles: '6 articles',
    },
    {
      icon: ShieldAlert,
      title: 'Compliance & Security',
      description:
        'Manage CSD documents, secure user role permissions, and track system audit logs.',
      articles: '4 articles',
    },
  ];

  const faqs = [
    {
      q: 'How does Tender Track 360 handle closing date statuses?',
      a: 'The system automates status transitions based on the submission date. Tenders remain "open" while the closing date is in the future. The day after the closing date, the status dynamically resolves to "closed" (unless locked by manual status overrides like evaluation or awarded).',
    },
    {
      q: 'What happens when I mark a tender as Appointed / Awarded?',
      a: 'Marking a tender as awarded triggers the automatic instantiation of a corresponding Project record in the database. The system copies the client metadata, description, and tender number into the new project, and instantly redirects you to the project edit screen so you can specify durations and start dates.',
    },
    {
      q: 'Can members and managers delete existing tenders?',
      a: 'Yes, but only under safe operational conditions. Managers and members can only delete tenders in "open" or legacy "draft" states. Once a tender is locked in "evaluation", "closed", "awarded", or "lost" status, only the organization Owner or Admin can delete the record.',
    },
    {
      q: 'How are my CSD and B-BBEE compliance files secured?',
      a: 'Tender Track 360 supports standard document storage securely isolated per tenant. Access control permissions protect compliance folders, and security logs capture every file read or update action, providing high compliance auditing.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <Header />

      <main className="relative isolate pt-24">
        {/* Banner Search Section */}
        <section className="bg-linear-to-b from-muted/50 via-muted/20 to-background border-b border-border/40 py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              How can we help you?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Search our help center articles, find quick solutions, or browse categories below.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tutorials, compliance rules, role profiles..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="container mx-auto px-4 py-20 max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-6 rounded-2xl border bg-card/40 backdrop-blur-xs hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{cat.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block mt-4 text-xs font-semibold text-primary">
                    {cat.articles}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="bg-muted/10 border-t border-border/30 py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 mb-10 justify-center">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border bg-card/60 space-y-2 shadow-xs hover:border-border/80 transition-colors"
                >
                  <h3 className="font-semibold text-foreground text-base">
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="container mx-auto px-4 py-20 text-center space-y-6 max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight">
            Still need assistance?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our South African customer support and sales teams are available Monday
            to Friday, 8:00 AM - 5:00 PM (SAST) to assist you.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/contact">
                Contact Support
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
