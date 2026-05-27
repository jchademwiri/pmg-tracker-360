// TypeScript interfaces for the home page components

export interface UserContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
    organizationName: string;
    role: string;
  };
}

export interface DashboardSummary {
  activeTenders: number;
  upcomingDeadlines: {
    count: number;
    nextDeadline?: Date;
  };
  recentDocuments: Array<{
    id: string;
    name: string;
    uploadedAt: Date;
  }>;
  notifications: Array<{
    id: string;
    type: 'deadline' | 'update' | 'alert';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

export interface HeroSectionProps {
  isAuthenticated: boolean;
  userName?: string;
}

export interface HomeAuthenticatedUserDashboardProps {
  user: {
    name: string;
    organizationName: string;
  };
  recentActivity: {
    submitedThisMonth: number;
    upcomingDeadlines: number;
    activeProjects: string[];
  };
}

export interface FeaturesSectionProps {
  features: Feature[];
}

export interface TestimonialsSectionProps {
  testimonials: Array<{
    id: string;
    name: string;
    organization: string;
    role: string;
    content: string;
    avatar?: string;
  }>;
}
