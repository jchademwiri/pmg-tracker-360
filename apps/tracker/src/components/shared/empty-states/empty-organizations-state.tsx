'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyOrganizationsStateProps {
  onCreateOrganization?: () => void;
  className?: string;
}

export function EmptyOrganizationsState({
  onCreateOrganization,
  className,
}: EmptyOrganizationsStateProps) {
  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          {/* Icon with gradient background */}
          <div className="relative mb-6">
            <div className="size-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Building2 className="size-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-3 text-primary" />
            </div>
          </div>

          {/* Main heading */}
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Welcome to Organizations
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
            Organizations help you collaborate with your team, manage projects,
            and keep everything organized in one place. Create your first
            organization to get started.
          </p>

          {/* Benefits list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full max-w-md">
            <div className="flex items-center gap-3 text-sm">
              <div className="size-8 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="size-4 text-green-600" />
              </div>
              <span className="text-muted-foreground">Team collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="size-4 text-blue-600" />
              </div>
              <span className="text-muted-foreground">Project management</span>
            </div>
          </div>

          {/* Call to action */}
          <Button
            onClick={onCreateOrganization}
            size="lg"
            className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="size-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
            <span className="relative">Create Your First Organization</span>
          </Button>

          {/* Secondary text */}
          <p className="text-xs text-muted-foreground mt-4">
            It only takes a few seconds to set up
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
