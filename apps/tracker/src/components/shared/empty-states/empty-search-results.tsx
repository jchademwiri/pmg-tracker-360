'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptySearchResultsProps {
  searchTerm: string;
  onClearSearch?: () => void;
  onCreateOrganization?: () => void;
  className?: string;
}

export function EmptySearchResults({
  searchTerm,
  onClearSearch,
  onCreateOrganization,
  className,
}: EmptySearchResultsProps) {
  return (
    <div className={cn('w-full max-w-lg mx-auto', className)}>
      <Card className="border-muted bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {/* Search icon */}
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="size-8 text-muted-foreground" />
          </div>

          {/* Main heading */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No organizations found
          </h3>

          {/* Description with search term */}
          <p className="text-muted-foreground mb-6 max-w-sm">
            We couldn&#x27;t find any organizations matching{' '}
            <span className="font-medium text-foreground">
              "{searchTerm}"
            </span>
            . Try adjusting your search or create a new organization.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {onClearSearch && (
              <Button
                onClick={onClearSearch}
                variant="outline"
                size="sm"
                className="flex-1 group"
              >
                <RotateCcw className="size-4 mr-2 transition-transform duration-200 group-hover:rotate-180" />
                Clear search
              </Button>
            )}

            {onCreateOrganization && (
              <Button
                onClick={onCreateOrganization}
                size="sm"
                className="flex-1 group"
              >
                <Building2 className="size-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                Create new
              </Button>
            )}
          </div>

          {/* Suggestions */}
          <div className="mt-6 text-xs text-muted-foreground">
            <p className="mb-1">Try searching for:</p>
            <div className="flex flex-wrap gap-1 justify-center">
              <span className="px-2 py-1 bg-muted rounded text-xs">
                organization name
              </span>
              <span className="px-2 py-1 bg-muted rounded text-xs">
                team name
              </span>
              <span className="px-2 py-1 bg-muted rounded text-xs">
                project name
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
