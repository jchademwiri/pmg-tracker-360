import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';
import { Badge } from '@pmg/ui/components/ui/badge';

interface Deadline {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  status: string;
  daysUntilDeadline: number | null;
  client: { name: string } | null;
}

function urgencyVariant(days: number | null): 'destructive' | 'default' | 'secondary' {
  if (days === null) return 'secondary';
  if (days <= 3) return 'destructive';
  if (days <= 7) return 'default';
  return 'secondary';
}

export function DashboardDeadlines({ deadlines }: { deadlines: Deadline[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines in the next 30 days.</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/tenders/${d.id}`} className="font-medium text-sm hover:underline truncate block">
                    {d.tenderNumber}
                  </Link>
                  {d.client && <p className="text-xs text-muted-foreground truncate">{d.client.name}</p>}
                  {d.submissionDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.submissionDate).toLocaleDateString('en-ZA')}
                    </p>
                  )}
                </div>
                <Badge variant={urgencyVariant(d.daysUntilDeadline)}>
                  {d.daysUntilDeadline !== null ? `${d.daysUntilDeadline}d` : 'No date'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
