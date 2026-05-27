import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Users, Mail } from 'lucide-react';

export interface NoResultsProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'search' | 'users' | 'mail';
  className?: string;
}

const ICONS = {
  search: Search,
  users: Users,
  mail: Mail,
};

export function NoResults({
  title = 'No results found',
  message,
  actionLabel,
  onAction,
  icon = 'search',
  className = '',
}: NoResultsProps) {
  const IconComponent = ICONS[icon];

  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <IconComponent className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
