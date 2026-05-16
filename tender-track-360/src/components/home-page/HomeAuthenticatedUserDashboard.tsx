import { HomeAuthenticatedUserDashboardProps } from '@/types/home-page';
import { Button } from '../ui';
import Link from 'next/link';

export function HomeAuthenticatedUserDashboard({
  user,
  recentActivity,
}: HomeAuthenticatedUserDashboardProps) {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              Welcome back, {user.name}!
            </h2>
            <p className="text-muted-foreground">
              Here&#x27;s what&#x27;s happening with {user.organizationName}
              &#x27;s tenders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-chart-4/10 p-6 rounded-lg border border-chart-4/20">
              <div className="text-3xl font-bold text-chart-4 mb-2">
                {recentActivity.upcomingDeadlines}
              </div>
              <div className="text-sm font-medium text-card-foreground">
                Upcoming Deadlines
              </div>
              <div className="text-xs text-muted-foreground">Next 7 days</div>
            </div>
            <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">
                {recentActivity.submitedThisMonth}
              </div>
              <div className="text-sm font-medium text-card-foreground">
                Current Submitions
              </div>
              <div className="text-xs text-muted-foreground">
                Total Submitions For This Year
              </div>
            </div>

            <div className="bg-chart-2/10 p-6 rounded-lg border border-chart-2/20">
              <div className="text-3xl font-bold text-chart-2 mb-2">
                {recentActivity.activeProjects.length}
              </div>
              <div className="text-sm font-medium text-card-foreground">
                Current Projects
              </div>
              <div className="text-xs text-muted-foreground">Last 24 hours</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
            <Button variant={'outline'}>
              <Link href="/dashboard/tenders/overview">View Tenders</Link>
            </Button>
            <Button variant={'outline'}>
              <Link href="/dashboard/projects/overview">
                View Purchase Orders
              </Link>
            </Button>
          </div>

          {recentActivity.upcomingDeadlines > 0 && (
            <div className="mt-6 p-4 bg-chart-4/10 border border-chart-4/20 rounded-lg">
              <div className="flex items-center">
                <span className="text-chart-4 text-xl mr-2">⚠️</span>
                <div>
                  <div className="font-semibold text-chart-4">
                    Urgent: Upcoming Deadlines
                  </div>
                  <div className="text-sm text-muted-foreground">
                    You have {recentActivity.upcomingDeadlines} tender
                    {recentActivity.upcomingDeadlines > 1 ? 's' : ''} with
                    deadlines in the next 7 days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
