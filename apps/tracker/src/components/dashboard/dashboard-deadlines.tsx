import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { UpcomingDeadlinesList } from '@/components/dashboard/upcoming-deadlines-list';
import { getUpcomingDeadlines } from '@/server/tenders';

interface DashboardDeadlinesProps {
  organizationId: string;
}

export async function DashboardDeadlines({
  organizationId,
}: DashboardDeadlinesProps) {
  const { deadlines } = await getUpcomingDeadlines(organizationId, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>Tenders due in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <UpcomingDeadlinesList deadlines={deadlines} />
      </CardContent>
    </Card>
  );
}
