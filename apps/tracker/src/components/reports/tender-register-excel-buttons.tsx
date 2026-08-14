'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type ClientOption = { id: string; name: string };

async function downloadExcel(url: string, fallbackFilename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Excel export failed');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  const match = disposition?.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || fallbackFilename;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function TenderRegisterExcelButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Preparing Excel tender register...');
    try {
      await downloadExcel('/api/reports/tenders/register/xlsx', `tender-register-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel tender register downloaded', { id: toastId });
    } catch (error) {
      console.error('Tender register Excel export failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export Excel report.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button type="button" className="w-full" onClick={handleExport} disabled={isExporting}>
      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isExporting ? 'Preparing...' : 'Download Excel Workbook'}
    </Button>
  );
}

export function ClientTenderExcelButton({ clients }: { clients: ClientOption[] }) {
  const [clientId, setClientId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!clientId) {
      toast.error('Select a client first.');
      return;
    }

    const client = clients.find((item) => item.id === clientId);
    setIsExporting(true);
    const toastId = toast.loading(`Preparing ${client?.name || 'client'} report...`);
    try {
      await downloadExcel(`/api/reports/tenders/register/xlsx?clientId=${encodeURIComponent(clientId)}`, `${client?.name || 'client'}-tenders.xlsx`);
      toast.success(`${client?.name || 'Client'} report downloaded`, { id: toastId });
    } catch (error) {
      console.error('Client tender Excel export failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export client report.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <select
        value={clientId}
        onChange={(event) => setClientId(event.target.value)}
        disabled={isExporting || clients.length === 0}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Select client for tender report"
      >
        <option value="">Select client...</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <Button type="button" className="w-full" onClick={handleExport} disabled={isExporting || clients.length === 0}>
        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {isExporting ? 'Preparing...' : 'Download Client Report'}
      </Button>
    </div>
  );
}
