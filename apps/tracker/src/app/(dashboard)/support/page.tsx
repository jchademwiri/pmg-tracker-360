import { Suspense } from 'react';
import { Metadata } from 'next';
import SupportClient from './SupportClient';

export const metadata: Metadata = {
  title: 'Support & In-App Help Desk | Tender Track 360',
  description: 'Manage support tickets, track inquiry progress, and chat directly with Tender Track 360 team.',
};

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-5.5rem)] flex items-center justify-center text-muted-foreground text-sm">Loading Support Desk...</div>}>
      <SupportClient />
    </Suspense>
  );
}
