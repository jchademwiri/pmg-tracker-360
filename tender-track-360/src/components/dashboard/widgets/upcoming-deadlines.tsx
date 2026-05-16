import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'

interface Deadline {
  id: string
  tenderNumber: string
  description: string
  submissionDate: Date
  status: string
  value: string
  client: {
    name: string
  }
  daysUntilDeadline: number | null
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[]
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const getUrgencyBadge = (daysUntilDeadline: number | null) => {
    if (daysUntilDeadline === null) return { variant: 'secondary' as const, text: 'No deadline' }

    if (daysUntilDeadline <= 3) {
      return { variant: 'destructive' as const, text: 'Urgent' }
    } else if (daysUntilDeadline <= 7) {
      return { variant: 'default' as const, text: 'Soon' }
    } else {
      return { variant: 'secondary' as const, text: 'Upcoming' }
    }
  }

  if (deadlines.length === 0) {
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
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No upcoming deadlines
          </div>
        </CardContent>
      </Card>
    )
  }

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
        <div className="space-y-3">
          {deadlines.map((deadline) => {
            const urgency = getUrgencyBadge(deadline.daysUntilDeadline)
            return (
              <div key={deadline.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={urgency.variant} className="text-xs">
                      {urgency.text}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {deadline.tenderNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {deadline.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.client.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Due: {format(deadline.submissionDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-medium">
                    {deadline.value ? `$${deadline.value}` : 'N/A'}
                  </div>
                  {deadline.daysUntilDeadline !== null && (
                    <div className="text-xs text-muted-foreground">
                      {deadline.daysUntilDeadline} days
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}