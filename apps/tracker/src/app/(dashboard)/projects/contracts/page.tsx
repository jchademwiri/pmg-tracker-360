import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground">
          Manage all project contracts and track their status and terms.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Contracts Yet
          </h3>
          <p className="text-gray-500 text-center">
            Contract management functionality will be available once
            implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
