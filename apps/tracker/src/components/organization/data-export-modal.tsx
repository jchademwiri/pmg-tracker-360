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
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Database,
  Download,
  FileText,
  FolderKanban,
  ListChecks,
  Loader2,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportFormat = 'json' | 'csv';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onExport: (format: ExportFormat) => Promise<void>;
}

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: LucideIcon;
}

const formatOptions: FormatOption[] = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Machine-readable — best for backups',
    icon: FileText,
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet-compatible — opens in Excel',
    icon: Database,
  },
];

interface CategoryOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const categoryOptions: CategoryOption[] = [
  {
    id: 'members',
    label: 'Members and roles',
    description: 'Team members and their permissions',
    icon: Users,
  },
  {
    id: 'tenders',
    label: 'Tenders and submissions',
    description: 'Bids, linked clients and submission history',
    icon: FileText,
  },
  {
    id: 'contracts',
    label: 'Contracts and agreements',
    description: 'Signed agreements and associated documents',
    icon: ScrollText,
  },
  {
    id: 'projects',
    label: 'Projects and purchase orders',
    description: 'Project budgets and supplier orders',
    icon: FolderKanban,
  },
];

const ALL_CATEGORY_IDS = categoryOptions.map((c) => c.id);

export function DataExportModal({
  isOpen,
  onClose,
  organizationName,
  onExport,
}: DataExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [selected, setSelected] = useState<Record<string, boolean>>({
    members: true,
    tenders: true,
    contracts: true,
    projects: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const selectedCount = categoryOptions.filter((c) => selected[c.id]).length;
  const allSelected = selectedCount === categoryOptions.length;
  const nothingSelected = selectedCount === 0;

  const activeFormat =
    formatOptions.find((o) => o.value === format) ?? formatOptions[0];

  const toggleCategory = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const setAllCategories = (value: boolean) =>
    setSelected(Object.fromEntries(ALL_CATEGORY_IDS.map((id) => [id, value])));

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Download className="h-4 w-4" />
            </span>
            Export Organization Data
          </DialogTitle>
          <DialogDescription>
            Export data for <strong>{organizationName}</strong>. Choose the
            format and data to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="export-format" className="w-full h-auto py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <activeFormat.icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-sm font-medium">
                      {activeFormat.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {activeFormat.description}
                    </span>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2.5 py-0.5">
                      <option.icon className="h-4 w-4" />
                      <div className="flex flex-col items-start">
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
            <p className="text-xs text-muted-foreground">
              {format === 'json'
                ? 'JSON includes your full organization backup.'
                : 'CSV exports your organization details for spreadsheets.'}
            </p>
          </div>

          {/* Data to Include */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                Data to Include
              </Label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selectedCount} of {categoryOptions.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setAllCategories(!allSelected)}
                  className="text-xs font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
                >
                  {allSelected ? 'Clear' : 'Select all'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {categoryOptions.map((category) => {
                const isChecked = selected[category.id];
                return (
                  <label
                    key={category.id}
                    onClick={(event) => {
                      // Let the checkbox handle its own click — only row clicks toggle
                      if ((event.target as HTMLElement).closest('button')) {
                        return;
                      }
                      toggleCategory(category.id);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer select-none transition-colors',
                      isChecked
                        ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
                        isChecked
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <category.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">
                        {category.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    </span>
                    <Checkbox
                      id={`export-category-${category.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span
            className={cn(
              'text-xs text-muted-foreground',
              nothingSelected && 'text-destructive font-medium'
            )}
          >
            {nothingSelected
              ? 'Select at least one category to export.'
              : 'A download will start after export.'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || nothingSelected}
              className="cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
