'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Database } from 'lucide-react';

type ExportFormat = 'json' | 'csv';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onExport: (format: ExportFormat) => Promise<void>;
}

export function DataExportModal({
  isOpen,
  onClose,
  organizationName,
  onExport,
}: DataExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeMembers, setIncludeMembers] = useState(true);
  const [includeTenders, setIncludeTenders] = useState(true);
  const [includeContracts, setIncludeContracts] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON',
      icon: FileText,
      description: 'Machine-readable format',
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: Database,
      description: 'Spreadsheet compatible',
    },
  ] as const;

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await onExport(format);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Organization Data
          </DialogTitle>
          <DialogDescription>
            Export data for <strong>{organizationName}</strong>. Choose the
            format and data to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Data to Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="members"
                  checked={includeMembers}
                  onCheckedChange={(checked) =>
                    setIncludeMembers(checked === true)
                  }
                />
                <Label htmlFor="members" className="text-sm font-normal">
                  Members and roles
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tenders"
                  checked={includeTenders}
                  onCheckedChange={(checked) =>
                    setIncludeTenders(checked === true)
                  }
                />
                <Label htmlFor="tenders" className="text-sm font-normal">
                  Tenders and submissions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contracts"
                  checked={includeContracts}
                  onCheckedChange={(checked) =>
                    setIncludeContracts(checked === true)
                  }
                />
                <Label htmlFor="contracts" className="text-sm font-normal">
                  Contracts and agreements
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="projects"
                  checked={includeProjects}
                  onCheckedChange={(checked) =>
                    setIncludeProjects(checked === true)
                  }
                />
                <Label htmlFor="projects" className="text-sm font-normal">
                  Projects and purchase orders
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
