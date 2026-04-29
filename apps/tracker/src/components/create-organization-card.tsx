'use client';

import { Card, CardContent } from '@pmg/ui/components/ui/card';
import { Button } from '@pmg/ui/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateOrganizationCardProps {
  onClick?: () => void;
  className?: string;
}

export function CreateOrganizationCard({
  onClick,
  className,
}: CreateOrganizationCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
    }
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 bg-muted/20 hover:bg-muted/40',
        'before:absolute before:inset-0 before:bg-linear-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="size-6 text-primary transition-transform duration-300" />
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            variant="outline"
            size="sm"
            className="mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 hover:scale-105"
          >
            <Plus className="size-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
            Create Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
