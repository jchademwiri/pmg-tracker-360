'use client';

// Document management — file upload/storage planned for a later phase
export function DocumentManager({ entityId, entityType }: { entityId: string; entityType: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      <p className="text-sm">Document management coming soon.</p>
      <p className="text-xs mt-1">File storage will be enabled in a future update.</p>
    </div>
  );
}
