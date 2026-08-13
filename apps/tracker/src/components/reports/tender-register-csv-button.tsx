'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function TenderRegisterCsvButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Preparing CSV...');
    try {
      const response = await fetch('/api/reports/tenders/register/csv');
      if (!response.ok) throw new Error('CSV export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tender-register-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Defer revoking: some browsers haven't started reading the blob yet
      // and will cancel the download if the URL is revoked synchronously.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success('CSV downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Tender register CSV export failed:', error);
      toast.error('Failed to export CSV. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? 'Preparing...' : 'Download CSV'}
    </Button>
  );
}
