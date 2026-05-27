import { getRecentActivities } from '@/server/activity';
import { RecentActivitySection } from './recent-activity-section';

interface RecentActivityWrapperProps {
  limit?: number;
  className?: string;
}

export async function RecentActivityWrapper({
  limit = 5,
  className,
}: RecentActivityWrapperProps) {
  try {
    const { activities } = await getRecentActivities(limit);

    return (
      <RecentActivitySection
        activities={activities}
        className={className}
        showViewAll={activities.length >= limit}
      />
    );
  } catch (error) {
    console.error('Error loading recent activities:', error);

    // Return empty state on error
    return <RecentActivitySection activities={[]} className={className} />;
  }
}
