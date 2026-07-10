import Link from 'next/link';
import {
  ClipboardList,
  Building2,
  Clock,
  LayoutDashboard,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeaturesSectionProps } from '@/types/home-page';

const featureIcons = {
  clipboard: ClipboardList,
  building: Building2,
  clock: Clock,
  dashboard: LayoutDashboard,
  users: Users,
  trending: TrendingUp,
};

const defaultFeatures = [
  {
    id: '1',
    title: 'Tender Lifecycle Management',
    description: 'Track from discovery to award with full pipeline visibility.',
    icon: 'clipboard' as const,
    benefits: ['Complete pipeline visibility', 'Automated process tracking'],
    href: '/register',
  },
  {
    id: '2',
    title: 'Project & PO Management',
    description: 'Manage projects, purchase orders, and contracts seamlessly.',
    icon: 'building' as const,
    benefits: ['Purchase Order tracking', 'Contract management'],
    href: '/register',
  },
  {
    id: '3',
    title: 'Deadline Tracking',
    description: 'Automated notifications and reminders so you never miss a closing date.',
    icon: 'clock' as const,
    benefits: ['Never miss deadlines', 'Automated alerts'],
    href: '/register',
  },
  {
    id: '4',
    title: 'Status Dashboard',
    description: 'Visual overview of all tender activities with real-time metrics.',
    icon: 'dashboard' as const,
    benefits: ['Real-time insights', 'Visual reporting'],
    href: '/register',
  },
  {
    id: '5',
    title: 'Team Collaboration',
    description: 'Role-based access and workflow management for your entire team.',
    icon: 'users' as const,
    benefits: ['Secure collaboration', 'Role-based access'],
    href: '/register',
  },
  {
    id: '6',
    title: 'Analytics & Insights',
    description: 'Performance tracking and success metrics to drive better decisions.',
    icon: 'trending' as const,
    benefits: ['Performance metrics', 'Win rate analytics'],
    href: '/register',
  },
];

export function FeaturesSection({
  features = [],
}: Partial<FeaturesSectionProps> = {}) {
  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Tender Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline your tender process and increase
            your success rate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayFeatures.map((feature) => {
            const IconComponent = featureIcons[feature.icon as keyof typeof featureIcons] || featureIcons.clipboard;
            const href = (feature as any).href || '/register';

            return (
              <div
                key={feature.id}
                className="group p-6 border border-border rounded-lg hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-card flex flex-col"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary/15 transition-colors">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 grow">
                  {feature.description}
                </p>
                <ul className="text-sm text-muted-foreground mb-4">
                  {feature.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-primary mr-2">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" className="self-start group/btn" asChild>
                  <Link href={href}>
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
