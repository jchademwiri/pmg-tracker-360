'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NoOrganizationStateProps {
  className?: string;
  title?: string;
  description?: string;
}

export function NoOrganizationState({
  className = '',
  title = 'No Organization Selected',
  description = 'You need to select an organization or create a new one to view and manage operational data like tenders, projects, and purchase orders.',
}: NoOrganizationStateProps) {
  return (
    <div className={`w-full max-w-lg mx-auto py-12 px-4 ${className}`}>
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Building2 className="size-8 text-muted-foreground" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {title}
          </h2>

          <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button asChild className="flex-1 cursor-pointer">
              <Link href="/organization/select">
                Select Organization
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 cursor-pointer">
              <Link href="/organization/create">
                <Plus className="size-4 mr-2" />
                Create Organization
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
