'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type ClientOption = { id: string; name: string };

async function downloadReport(url: string, fallbackFilename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Report export failed');
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

export function TenderRegisterButtons() {
  const [format, setFormat] = useState<'xlsx' | 'pdf' | null>(null);

  const handleExport = async (requestedFormat: 'xlsx' | 'pdf') => {
    setFormat(requestedFormat);
    const label = requestedFormat === 'pdf' ? 'PDF' : 'Excel';
    const toastId = toast.loading(`Preparing ${label} tender register...`);
    try {
      await downloadReport(
        `/api/reports/tenders/register/${requestedFormat}`,
        `tender-register-${new Date().toISOString().slice(0, 10)}.${requestedFormat}`
      );
      toast.success(`${label} tender register downloaded`, { id: toastId });
    } catch (error) {
      console.error(`Tender register ${label} export failed:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to export ${label} report.`, { id: toastId });
    } finally {
      setFormat(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" onClick={() => handleExport('xlsx')} disabled={format !== null}>
        {format === 'xlsx' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {format === 'xlsx' ? 'Preparing...' : 'Excel'}
      </Button>
      <Button type="button" variant="outline" onClick={() => handleExport('pdf')} disabled={format !== null}>
        {format === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        {format === 'pdf' ? 'Preparing...' : 'PDF'}
      </Button>
    </div>
  );
}

export function ClientTenderReportButtons({ clients }: { clients: ClientOption[] }) {
  const [clientId, setClientId] = useState('');
  const [format, setFormat] = useState<'xlsx' | 'pdf' | null>(null);

  const handleExport = async (requestedFormat: 'xlsx' | 'pdf') => {
    if (!clientId) {
      toast.error('Select a client first.');
      return;
    }
    const client = clients.find((item) => item.id === clientId);
    setFormat(requestedFormat);
    const label = requestedFormat === 'pdf' ? 'PDF' : 'Excel';
    const toastId = toast.loading(`Preparing ${client?.name || 'client'} ${label} report...`);
    try {
      await downloadReport(
        `/api/reports/tenders/register/${requestedFormat}?clientId=${encodeURIComponent(clientId)}`,
        `${client?.name || 'client'}-tenders.${requestedFormat}`
      );
      toast.success(`${client?.name || 'Client'} ${label} report downloaded`, { id: toastId });
    } catch (error) {
      console.error(`Client tender ${label} export failed:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to export client ${label} report.`, { id: toastId });
    } finally {
      setFormat(null);
    }
  };

  return (
    <div className="space-y-3">
      <select
        value={clientId}
        onChange={(event) => setClientId(event.target.value)}
        disabled={format !== null || clients.length === 0}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Select client for tender report"
      >
        <option value="">Select client...</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={() => handleExport('xlsx')} disabled={format !== null || clients.length === 0}>
          {format === 'xlsx' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {format === 'xlsx' ? 'Preparing...' : 'Excel'}
        </Button>
        <Button type="button" variant="outline" onClick={() => handleExport('pdf')} disabled={format !== null || clients.length === 0}>
          {format === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          {format === 'pdf' ? 'Preparing...' : 'PDF'}
        </Button>
      </div>
    </div>
  );
}
