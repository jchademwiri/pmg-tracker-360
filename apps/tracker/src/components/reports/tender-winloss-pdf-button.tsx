'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function TenderWinLossPdfButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      const response = await fetch('/api/reports/tenders/win-loss/pdf');
      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tender-Win-Loss-Summary-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Defer revoking: some browsers haven't started reading the blob yet
      // and will cancel the download if the URL is revoked synchronously.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success('PDF downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Win/loss PDF export failed:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button type="button" className="w-full" onClick={handleExport} disabled={isExporting}>
      {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isExporting ? 'Generating...' : 'Download PDF'}
    </Button>
  );
}
